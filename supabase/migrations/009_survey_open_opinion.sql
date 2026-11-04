-- ===========================================================================
-- RespondeYa · 009 · Opinión abierta en la encuesta
-- ===========================================================================
-- Además de puntuar de 1 a 5, quien contesta puede escribir un texto libre.
--
-- DÓNDE SE GUARDA
-- En `survey_answers`, la MISMA tabla que las puntuaciones, con una clave de
-- pregunta reservada (`__opinion__`) y el texto en una columna nueva.
--
-- La alternativa era una tabla `survey_opinions` aparte. Se descarta porque la
-- opinión es parte del mismo envío: comparte `submission_id` con las cinco
-- puntuaciones que la acompañan, y separarla obligaría a cruzar dos tablas
-- para responder «qué contestó quien escribió esto». Con una fila más en la
-- misma tabla, el envío es una sola consulta.
--
-- El precio es que `value` deja de ser obligatorio. Se compensa con una
-- restricción que exige exactamente UNO de los dos: una puntuación sin texto o
-- un texto sin puntuación. Así la tabla no admite filas a medias ni filas que
-- sean las dos cosas, que es justo lo que podría falsear las medias.
--
-- EL ENUNCIADO DE LA OPINIÓN ES DEL GRUPO
-- Igual que las preguntas desde la 008: el texto que invita a opinar vive en
-- `survey_groups`, no en el bloque, para que las tres páginas donde esté puesta
-- la encuesta pregunten lo mismo.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- El grupo decide si pide opinión y con qué texto
-- ---------------------------------------------------------------------------
-- `default true`: los grupos que ya existen pasan a pedirla sin tener que
-- editarlos uno a uno. Se puede apagar por grupo desde el editor.
-- ---------------------------------------------------------------------------
alter table survey_groups
  add column if not exists opinion_enabled boolean not null default true;

alter table survey_groups
  add column if not exists opinion_label text not null
  default '¿Quieres contarnos algo más?';

-- ---------------------------------------------------------------------------
-- La respuesta puede ser un texto
-- ---------------------------------------------------------------------------
alter table survey_answers
  add column if not exists text_value text;

-- `value` pasa a ser opcional: la fila de la opinión no puntúa nada. El
-- `check (value between 1 and 5)` de la 007 se queda y sigue valiendo: con
-- `value` nulo la comprobación no falla.
alter table survey_answers
  alter column value drop not null;

do $$
begin
  -- Exactamente uno de los dos. `<>` sobre dos booleanos es un «o uno o el
  -- otro, pero no ambos»: bloquea tanto la fila vacía como la que trae
  -- puntuación Y texto.
  if not exists (
    select 1 from pg_constraint where conname = 'survey_answers_value_xor_text'
  ) then
    alter table survey_answers
      add constraint survey_answers_value_xor_text
      check ((value is null) <> (text_value is null));
  end if;

  -- Un tope por el lado de la base, no solo del formulario: la escritura es
  -- pública y la clave del navegador permite insertar con un script.
  if not exists (
    select 1 from pg_constraint where conname = 'survey_answers_text_length'
  ) then
    alter table survey_answers
      add constraint survey_answers_text_length
      check (text_value is null or char_length(text_value) between 1 and 2000);
  end if;
end $$;

-- ===========================================================================
-- La agregación numérica ignora las opiniones
-- ===========================================================================
-- Sin el `where`, la fila de la opinión entraría como una pregunta más, con su
-- clave reservada por enunciado y cero votos en los cinco valores: una fila
-- fantasma en las barras y en la tabla.
--
-- El resto de la función no cambia respecto a la 007.
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
      (array_agg(a.question_text order by a.created_at desc))[1],
      a.value,
      count(*)
    from survey_answers a
    where a.group_id = p_group_id
      and a.value is not null
    group by a.question_id, a.value;
end;
$$;

-- ===========================================================================
-- Las opiniones, una a una
-- ===========================================================================
-- Estas NO se agregan: el texto de cada persona es el dato. Se devuelven en
-- crudo, lo más reciente primero.
--
-- Va por función y no leyendo la tabla por la misma razón que `survey_summary`:
-- el `is_admin()` queda en un solo sitio y el día que las estadísticas se
-- hagan públicas se decide aquí, sin tocar la política que protege las
-- respuestas una a una.
--
-- `submission_id` viaja para poder cruzar una opinión con las puntuaciones de
-- su mismo envío. No identifica a nadie entre visitas.
-- ===========================================================================
create or replace function survey_opinions(p_group_id uuid)
returns table (
  id            uuid,
  opinion_text  text,
  submission_id uuid,
  created_at    timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Solo el administrador puede ver las opiniones';
  end if;

  return query
    select a.id, a.text_value, a.submission_id, a.created_at
    from survey_answers a
    where a.group_id = p_group_id
      and a.text_value is not null
    order by a.created_at desc;
end;
$$;

-- ===========================================================================
-- Comprobación
-- ===========================================================================
-- 1) Las dos columnas nuevas del grupo, con su valor en los grupos que ya hay.
select
  title,
  jsonb_array_length(questions) as preguntas,
  opinion_enabled               as pide_opinion,
  opinion_label                 as texto_opinion
from survey_groups
order by created_at;

-- 2) Las dos restricciones nuevas y la función nueva.
select conname as objeto, 'restriccion' as tipo
from pg_constraint
where conname in ('survey_answers_value_xor_text', 'survey_answers_text_length')
union all
select routine_name, 'funcion'
from information_schema.routines
where routine_schema = 'public' and routine_name in ('survey_summary', 'survey_opinions')
order by tipo, objeto;
