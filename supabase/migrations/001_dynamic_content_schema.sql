-- ===========================================================================
-- RespondeYa · 001 · Esquema de contenido dinámico
-- ===========================================================================
-- Jerarquía: categoría → módulo → página → sección → bloque.
--
-- Decisión de fondo: la jerarquía es relacional (claves, orden, cascadas) y el
-- CONTENIDO de cada bloque va en una columna `jsonb` discriminada por `kind`.
--
-- La alternativa era una tabla por tipo de bloque: con los ~21 tipos previstos
-- y sus tablas de ítems salían unas 35 tablas, leer una página eran 35 joins y
-- cada bloque nuevo exigía una migración. El precio de `jsonb` es que Postgres
-- no valida la forma de `data`; eso lo cubren los validadores de la aplicación,
-- que corren tanto al escribir como al leer.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utilidad: mantener `updated_at` sin que la aplicación tenga que acordarse.
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administradores.
--
-- Supabase Auth gestiona las credenciales; esta tabla solo dice QUIÉN de esos
-- usuarios puede escribir. Se puebla a mano: no hay registro público.
--   insert into admins (user_id) values ('<uuid del usuario>');
-- ---------------------------------------------------------------------------
create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

/**
 * `security definer` para que la función pueda leer `admins` aunque la política
 * de esa misma tabla no deje al usuario ver las filas de los demás. `stable`
 * permite a Postgres evaluarla una vez por consulta en lugar de por fila.
 */
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Categorías. Agrupan módulos y las gestiona el administrador.
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null check (char_length(name) between 2 and 60),
  icon_name  text not null default 'emergency-post',
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Módulos. La unidad que el administrador crea con un botón.
-- ---------------------------------------------------------------------------
create table if not exists modules (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null check (char_length(title) between 3 and 120),
  summary           text not null default '',
  icon_name         text not null default 'emergency-post',
  category_id       uuid references categories(id) on delete set null,

  -- Gravedad: pinta el color de la tarjeta en el catálogo y su etiqueta.
  -- Es del MÓDULO. El tono de cada bloque es independiente y vive en su `data`.
  severity          text not null default 'basic'
                    check (severity in ('critical', 'urgent', 'basic')),

  -- draft: solo el admin · published: visible y abrible · coming_soon: visible
  -- en gris y sin abrir.
  status            text not null default 'draft'
                    check (status in ('draft', 'published', 'coming_soon')),

  tags              text[] not null default '{}',
  estimated_minutes int  not null default 3 check (estimated_minutes between 1 and 180),
  position          int  not null default 0,

  -- Versión del esquema de los bloques de este módulo. Sin esto, un cambio de
  -- forma en un tipo de bloque obliga a adivinar qué documentos ya migraron.
  schema_version    int  not null default 1,

  author_id         uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Páginas. La portada del módulo es una página más, con `is_home`.
-- ---------------------------------------------------------------------------
create table if not exists pages (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references modules(id) on delete cascade,
  slug       text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title      text not null check (char_length(title) between 1 and 120),
  subtitle   text,
  is_home    boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

-- Una sola portada por módulo, garantizado por la base de datos. Dos portadas
-- harían ambiguo qué pintar al entrar al módulo, y en la aplicación esa regla
-- se olvida en cuanto hay dos caminos para crear páginas.
create unique index if not exists pages_one_home_per_module
  on pages (module_id) where is_home;

-- ---------------------------------------------------------------------------
-- Secciones. Agrupación visual dentro de una página.
-- ---------------------------------------------------------------------------
create table if not exists sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references pages(id) on delete cascade,
  title      text,
  variant    text not null default 'plain'
             check (variant in ('plain', 'card', 'tinted')),
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bloques. `kind` discrimina el tipo; `data` lleva sus campos propios.
-- ---------------------------------------------------------------------------
create table if not exists blocks (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  kind       text not null check (char_length(kind) between 2 and 40),
  position   int not null default 0,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Lo único que la base puede exigir sin conocer cada tipo: que `data` sea un
  -- objeto y no un número, una cadena o null.
  constraint blocks_data_is_object check (jsonb_typeof(data) = 'object')
);

-- ---------------------------------------------------------------------------
-- Archivos subidos. Apuntan a Supabase Storage.
--
-- Existe para saber qué archivos están EN USO. Los bloques guardan la URL
-- pública para pintar sin consulta extra, y además el `media_id`: sin esa
-- referencia, borrar un bloque deja el archivo en el bucket para siempre.
-- ---------------------------------------------------------------------------
create table if not exists media (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null default 'module-media',
  path        text not null,
  public_url  text not null,
  mime_type   text not null,
  bytes       int  not null check (bytes > 0),
  width       int,
  height      int,
  alt         text not null default '',
  module_id   uuid references modules(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (bucket, path)
);

-- ---------------------------------------------------------------------------
-- Índices de lectura.
-- Todas las consultas de la aplicación piden hijos ordenados por `position`,
-- así que el índice compuesto cubre el filtro y el orden de una vez.
-- ---------------------------------------------------------------------------
create index if not exists blocks_section_position   on blocks   (section_id, position);
create index if not exists sections_page_position    on sections (page_id, position);
create index if not exists pages_module_position     on pages    (module_id, position);
create index if not exists modules_status_position   on modules  (status, position);
create index if not exists modules_category          on modules  (category_id);
create index if not exists media_module              on media    (module_id);

-- ---------------------------------------------------------------------------
-- Triggers de `updated_at`.
-- ---------------------------------------------------------------------------
-- `create trigger` no admite `if not exists`, asi que se borra antes. Sin esto,
-- volver a ejecutar la migracion aborta aqui con un error de objeto duplicado.
drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();

drop trigger if exists modules_set_updated_at on modules;
create trigger modules_set_updated_at before update on modules
  for each row execute function set_updated_at();

drop trigger if exists pages_set_updated_at on pages;
create trigger pages_set_updated_at before update on pages
  for each row execute function set_updated_at();

drop trigger if exists sections_set_updated_at on sections;
create trigger sections_set_updated_at before update on sections
  for each row execute function set_updated_at();

drop trigger if exists blocks_set_updated_at on blocks;
create trigger blocks_set_updated_at before update on blocks
  for each row execute function set_updated_at();

-- ===========================================================================
-- Seguridad a nivel de fila
-- ===========================================================================
-- Hasta ahora la autorización vivía solo en la interfaz: `AdminRoute` impedía
-- llegar a la pantalla, no ejecutar la escritura. Con estas políticas la regla
-- pasa a la base de datos, que es el único sitio donde no se puede esquivar.
-- ===========================================================================

alter table admins     enable row level security;
alter table categories enable row level security;
alter table modules    enable row level security;
alter table pages      enable row level security;
alter table sections   enable row level security;
alter table blocks     enable row level security;
alter table media      enable row level security;

-- --- Lectura pública: todo menos los borradores ----------------------------
-- Los hijos heredan la visibilidad de su módulo. Las subconsultas suben la
-- jerarquía hasta `modules`; con catálogos de decenas de módulos el coste es
-- irrelevante. Si algún día pesa, la salida es desnormalizar `module_id` en
-- `sections` y `blocks` mediante trigger, no hacerlo ahora sin medir.

-- Igual que con los triggers: `create policy` tampoco admite `if not exists`.
drop policy if exists modules_public_read on modules;
create policy modules_public_read on modules for select
  using (status in ('published', 'coming_soon') or is_admin());

drop policy if exists pages_public_read on pages;
create policy pages_public_read on pages for select
  using (exists (
    select 1 from modules m
    where m.id = pages.module_id
      and (m.status in ('published', 'coming_soon') or is_admin())
  ));

drop policy if exists sections_public_read on sections;
create policy sections_public_read on sections for select
  using (exists (
    select 1
    from pages p
    join modules m on m.id = p.module_id
    where p.id = sections.page_id
      and (m.status in ('published', 'coming_soon') or is_admin())
  ));

drop policy if exists blocks_public_read on blocks;
create policy blocks_public_read on blocks for select
  using (exists (
    select 1
    from sections s
    join pages p   on p.id = s.page_id
    join modules m on m.id = p.module_id
    where s.id = blocks.section_id
      and (m.status in ('published', 'coming_soon') or is_admin())
  ));

drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories for select using (true);

drop policy if exists media_public_read on media;
create policy media_public_read on media for select using (true);

-- --- Escritura: solo administradores ---------------------------------------
-- `using` controla qué filas se pueden tocar y `with check` qué filas pueden
-- quedar tras la operación. Hacen falta las dos: sin `with check`, un no-admin
-- podría insertar.

drop policy if exists modules_admin_write on modules;
create policy modules_admin_write on modules for all
  using (is_admin()) with check (is_admin());

drop policy if exists pages_admin_write on pages;
create policy pages_admin_write on pages for all
  using (is_admin()) with check (is_admin());

drop policy if exists sections_admin_write on sections;
create policy sections_admin_write on sections for all
  using (is_admin()) with check (is_admin());

drop policy if exists blocks_admin_write on blocks;
create policy blocks_admin_write on blocks for all
  using (is_admin()) with check (is_admin());

drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories for all
  using (is_admin()) with check (is_admin());

drop policy if exists media_admin_write on media;
create policy media_admin_write on media for all
  using (is_admin()) with check (is_admin());

-- Cada admin se ve a sí mismo. La tabla se gestiona desde el panel de Supabase.
drop policy if exists admins_self_read on admins;
create policy admins_self_read on admins for select
  using (user_id = auth.uid());

-- ===========================================================================
-- Storage
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('module-media', 'module-media', true)
on conflict (id) do nothing;

drop policy if exists module_media_read on storage.objects;
create policy module_media_read on storage.objects for select
  using (bucket_id = 'module-media');

drop policy if exists module_media_insert on storage.objects;
create policy module_media_insert on storage.objects for insert
  with check (bucket_id = 'module-media' and is_admin());

drop policy if exists module_media_update on storage.objects;
create policy module_media_update on storage.objects for update
  using (bucket_id = 'module-media' and is_admin());

drop policy if exists module_media_delete on storage.objects;
create policy module_media_delete on storage.objects for delete
  using (bucket_id = 'module-media' and is_admin());
