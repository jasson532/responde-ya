-- ===========================================================================
-- RespondeYa · 004 · Búsqueda de módulos
-- ===========================================================================
-- Hasta ahora buscar hacía `ilike` sobre el título y el resumen. Eso dejaba
-- fuera las ETIQUETAS, que es donde están las palabras con las que la gente
-- busca de verdad: alguien escribe «se ahoga» o «no puede respirar», no
-- «atragantamiento».
--
-- POR QUÉ UN TRIGGER Y NO UNA COLUMNA GENERADA
-- El primer intento usaba `generated always as (...) stored` y Postgres lo
-- rechazó con «generation expression is not immutable». El culpable es
-- `array_to_string`, que está marcada STABLE y no IMMUTABLE: la
-- representación textual de los elementos de un array puede depender de
-- parámetros de sesión. Una columna generada guarda su valor en disco, así que
-- exige que la expresión dé siempre el mismo resultado.
--
-- Un trigger no tiene esa restricción y consigue lo mismo: la columna se
-- mantiene al día sin que la aplicación tenga que acordarse de escribirla.
-- ===========================================================================

-- Trigramas: hacen que un `ilike '%texto%'` pueda usar índice. Sin esto, cada
-- búsqueda recorre la tabla entera.
create extension if not exists pg_trgm;

-- Columna normal, rellenada por el trigger de abajo.
alter table modules add column if not exists search_text text not null default '';

/**
 * Texto de búsqueda de un módulo: título, resumen y etiquetas, en minúsculas.
 *
 * `coalesce` en cada parte evita que un campo nulo anule la concatenación
 * entera y deje la fila sin nada que buscar.
 */
create or replace function modules_build_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(
    coalesce(new.title, '') || ' ' ||
    coalesce(new.summary, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

-- `before insert or update`: tiene que correr ANTES de escribir la fila, que
-- es lo que permite modificar `new` y que el valor acabe en disco.
drop trigger if exists modules_search_text_sync on modules;
create trigger modules_search_text_sync
  before insert or update of title, summary, tags on modules
  for each row execute function modules_build_search_text();

-- Rellena lo que ya existe: el trigger solo actúa sobre escrituras futuras, y
-- sin esto los módulos ya creados quedarían con la cadena vacía y no
-- aparecerían en ninguna búsqueda.
update modules set title = title;

-- Índice GIN con trigramas sobre el texto de búsqueda.
create index if not exists modules_search_trgm
  on modules using gin (search_text gin_trgm_ops);
