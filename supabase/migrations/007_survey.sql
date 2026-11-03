-- ===========================================================================
-- RespondeYa · 007 · Encuestas de 1 a 5 y sus estadísticas
-- ===========================================================================
-- Dos tablas nuevas y dos funciones de agregación.
--
-- DÓNDE VIVE CADA COSA
-- Las PREGUNTAS no están aquí: son contenido y viven en el `jsonb` del bloque,
-- igual que el texto de un aviso. Aquí viven las RESPUESTAS, que son datos de
-- uso: crecen sin límite y hay que agregarlas con SQL. Es la misma frontera que
-- ya aplica el módulo (jerarquía relacional, contenido documental).
--
-- ESTO ABRE LA PRIMERA ESCRITURA PÚBLICA DE LA APLICACIÓN
-- Hasta ahora toda escritura exigía ser administrador. Quien lee el contenido
-- es anónimo, así que para que pueda contestar hay que dejarle insertar. Lo que
-- NO se abre es la lectura: las respuestas crudas solo las ve el administrador,
-- y los números salen por funciones agregadoras.
--
-- Con la clave pública en el navegador, alguien puede enviar respuestas con un
-- script. No hay forma de evitarlo sin una función de servidor que limite por
-- IP; conviene tenerlo en cuenta antes de leer estos números como una medición.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Grupos de preguntas
-- ---------------------------------------------------------------------------
-- Existe para que varias colocaciones del bloque —en páginas distintas, o
-- incluso en módulos distintos— sumen sus respuestas en el mismo sitio, y para
-- que el bloque de estadísticas ofrezca una lista con nombres en lugar de
-- identificadores.
-- ---------------------------------------------------------------------------
create table if not exists survey_groups (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 2 and 120),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Respuestas
-- ---------------------------------------------------------------------------
create table if not exists survey_answers (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references survey_groups(id) on delete cascade,

  -- Identificador de la pregunta DENTRO del `jsonb` del bloque. No es clave
  -- ajena y no puede serlo: las preguntas no son filas.
  question_id   text not null check (char_length(question_id) between 1 and 80),

  /**
   * Copia del enunciado en el momento de contestar.
   *
   * Parece redundante y es justo lo contrario. El enunciado vive en el bloque y
   * el administrador puede reescribirlo o borrar la pregunta. Sin esta copia,
   * una estadística de respuestas antiguas mostraría «pregunta eliminada» o,
   * peor, el texto NUEVO junto a respuestas que contestaban a otra cosa.
   */
  question_text text not null,

  value         smallint not null check (value between 1 and 5),

  /**
   * Agrupa las respuestas de un mismo envío.
   *
   * Lo genera el navegador al pulsar enviar y no identifica a nadie entre
   * visitas: no es un identificador de persona. Sirve para poder contar
   * cuántos envíos hubo, que no es lo mismo que cuántas respuestas: si alguien
   * contesta 3 de 5 preguntas, son 3 respuestas y 1 envío.
   */
  submission_id uuid not null,

  created_at    timestamptz not null default now()
);

-- Las dos consultas de las estadísticas filtran por grupo.
create index if not exists survey_answers_group    on survey_answers (group_id);
create index if not exists survey_answers_group_q  on survey_answers (group_id, question_id);

-- ===========================================================================
-- Seguridad a nivel de fila
-- ===========================================================================
alter table survey_groups  enable row level security;
alter table survey_answers enable row level security;

-- --- Grupos: los gestiona el administrador --------------------------------
-- No hacen falta permisos de lectura para el visitante: el bloque público
-- lleva el identificador del grupo dentro de su propio contenido, y la
-- comprobación de la clave ajena al insertar una respuesta NO pasa por RLS.
drop policy if exists survey_groups_admin_read on survey_groups;
create policy survey_groups_admin_read on survey_groups for select
  using (is_admin());

drop policy if exists survey_groups_admin_write on survey_groups;
create policy survey_groups_admin_write on survey_groups for all
  using (is_admin()) with check (is_admin());

-- --- Respuestas: cualquiera contesta, solo el admin lee -------------------
drop policy if exists survey_answers_public_insert on survey_answers;
create policy survey_answers_public_insert on survey_answers for insert
  with check (true);

drop policy if exists survey_answers_admin_read on survey_answers;
create policy survey_answers_admin_read on survey_answers for select
  using (is_admin());

-- Sin políticas de update ni delete: una respuesta enviada no se corrige ni se
-- borra desde la aplicación. Borrar el grupo se las lleva por la cascada.

-- ===========================================================================
-- Agregación
-- ===========================================================================
-- Los números salen por estas funciones y no por la tabla. Hoy el bloque de
-- estadísticas es solo para el administrador, así que la política de lectura ya
-- bastaría; las funciones se quedan por dos razones: agregar en Postgres evita
-- traerse miles de filas al navegador, y si algún día las estadísticas se
-- hacen públicas, basta con quitar el `is_admin()` de dentro sin tocar la
-- política que protege las respuestas una a una.
--
-- `security definer` para que la función pueda leer la tabla aunque quien la
-- llame no pueda; el `is_admin()` de dentro es lo que decide. Sin esa
-- comprobación, `security definer` convertiría la función en una puerta
-- abierta a los datos que la política acaba de cerrar.
-- ===========================================================================

create or replace function survey_summary(p_group_id uuid)
returns table (
  question_id   text,
  question_text text,
  value         smallint,
  votes         bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo el administrador puede ver las estadisticas';
  end if;

  return query
    select
      a.question_id,
      -- El enunciado más reciente para esa pregunta: si se reescribió, se
      -- muestra el último y no una fila por cada redacción.
      (array_agg(a.question_text order by a.created_at desc))[1],
      a.value,
      count(*)
    from survey_answers a
    where a.group_id = p_group_id
    group by a.question_id, a.value;
end;
$$;

/**
 * Cuántos envíos hubo. No es el número de respuestas: quien contesta 3 de 5
 * preguntas suma 3 respuestas y 1 envío.
 */
create or replace function survey_submissions(p_group_id uuid)
returns bigint
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  total bigint;
begin
  if not is_admin() then
    raise exception 'Solo el administrador puede ver las estadisticas';
  end if;

  select count(distinct a.submission_id) into total
  from survey_answers a
  where a.group_id = p_group_id;

  return total;
end;
$$;

-- ===========================================================================
-- Comprobación
-- ===========================================================================
-- Debe devolver las dos tablas y las dos funciones.
select table_name as objeto, 'tabla' as tipo
from information_schema.tables
where table_schema = 'public' and table_name in ('survey_groups', 'survey_answers')
union all
select routine_name, 'funcion'
from information_schema.routines
where routine_schema = 'public' and routine_name in ('survey_summary', 'survey_submissions')
order by tipo, objeto;
