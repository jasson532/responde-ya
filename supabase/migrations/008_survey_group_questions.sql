-- ===========================================================================
-- RespondeYa · 008 · Las preguntas pasan a ser del grupo
-- ===========================================================================
-- POR QUÉ
-- En la 007 las preguntas vivían en el `jsonb` del bloque. Eso permitía que dos
-- bloques con el MISMO grupo preguntaran cosas distintas, y las estadísticas,
-- que agregan por grupo, las mezclaban sin avisar. También obligaba a reescribir
-- la lista en cada página donde se colocara la encuesta.
--
-- Ahora el grupo es la unidad completa: título, etiquetas de los extremos y
-- preguntas. El bloque pasa a ser solo una COLOCACIÓN: dice qué grupo mostrar y,
-- si se quiere, un encabezado propio para esa página.
--
-- Las RESPUESTAS no se tocan: siguen guardando su copia del enunciado, que es lo
-- que permite reescribir una pregunta sin falsear las estadísticas anteriores.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Columnas nuevas
-- ---------------------------------------------------------------------------
alter table survey_groups
  add column if not exists questions jsonb not null default '[]'::jsonb;

alter table survey_groups
  add column if not exists low_label text not null default 'Muy en desacuerdo';

alter table survey_groups
  add column if not exists high_label text not null default 'Totalmente de acuerdo';

-- Lo único que la base puede exigir sin conocer la forma de cada pregunta: que
-- sea una lista. Que cada elemento tenga `id` y `text` lo valida la aplicación,
-- igual que con el contenido de los bloques.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'survey_groups_questions_is_array'
  ) then
    alter table survey_groups
      add constraint survey_groups_questions_is_array
      check (jsonb_typeof(questions) = 'array');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Traslado de lo que ya existe
-- ---------------------------------------------------------------------------
-- Los grupos que ya tienen un bloque de encuesta heredan SUS preguntas y
-- etiquetas. Sin esto, las encuestas publicadas se quedarían sin enunciados en
-- cuanto la aplicación empiece a leerlos del grupo.
--
-- Si dos bloques del mismo grupo tenían listas distintas gana el más reciente:
-- no hay forma de fusionarlas sin inventar, y el último es el que alguien editó
-- a propósito.
-- ---------------------------------------------------------------------------
with origen as (
  select distinct on (b.data->>'groupId')
    (b.data->>'groupId')::uuid as group_id,
    coalesce(b.data->'questions', '[]'::jsonb) as questions,
    nullif(b.data->>'lowLabel', '') as low_label,
    nullif(b.data->>'highLabel', '') as high_label
  from blocks b
  where b.kind = 'survey'
    and b.data->>'groupId' is not null
    and b.data->>'groupId' <> ''
    -- Solo los que de verdad traen preguntas: un bloque vacío no debe borrar
    -- las del grupo.
    and jsonb_array_length(coalesce(b.data->'questions', '[]'::jsonb)) > 0
  order by b.data->>'groupId', b.updated_at desc
)
update survey_groups g
set
  questions  = origen.questions,
  low_label  = coalesce(origen.low_label, g.low_label),
  high_label = coalesce(origen.high_label, g.high_label)
from origen
where origen.group_id = g.id
  -- No sobrescribe un grupo que ya tenga preguntas propias: hace la migración
  -- repetible sin deshacer ediciones posteriores.
  and jsonb_array_length(g.questions) = 0;

-- ===========================================================================
-- El grupo pasa a ser legible por cualquiera
-- ===========================================================================
-- Antes solo lo leía el administrador, porque el grupo era un identificador y
-- un nombre. Ahora contiene las preguntas, y quien contesta la encuesta tiene
-- que poder verlas: es el texto que se le muestra en pantalla.
--
-- Lo que NO se abre son las respuestas: su política sigue exigiendo `is_admin()`.
-- Un visitante puede leer qué se pregunta y no qué contestaron los demás.
-- ===========================================================================
drop policy if exists survey_groups_admin_read on survey_groups;

drop policy if exists survey_groups_public_read on survey_groups;
create policy survey_groups_public_read on survey_groups for select
  using (true);

-- La escritura sigue siendo solo del administrador (política de la 007).

-- ===========================================================================
-- Comprobación
-- ===========================================================================
select
  title,
  jsonb_array_length(questions) as preguntas,
  low_label,
  high_label
from survey_groups
order by created_at;
