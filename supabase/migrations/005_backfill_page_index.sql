-- ===========================================================================
-- RespondeYa · 005 · Índice en las portadas que se quedaron sin él
-- ===========================================================================
-- Los módulos creados antes de que el editor montara el índice automático
-- tienen la portada sin ninguna forma de llegar a las demás páginas: se crean
-- páginas y no aparecen en ninguna parte.
--
-- Esta migración les añade el índice automático. Solo toca las portadas que NO
-- tengan ya un bloque `pageLinks`, así que es idempotente y no duplica nada.
--
-- El bloque va en modo `auto`: lista las páginas del módulo por su cuenta, de
-- modo que no hay que configurarlo ni volver a tocarlo al crear más páginas.
-- Si el módulo solo tiene la portada, no pinta nada.
-- ===========================================================================

do $$
declare
  v_page     record;
  v_section  uuid;
  v_position int;
  v_total    int := 0;
begin
  for v_page in
    select p.id, p.title, m.slug as module_slug
    from pages p
    join modules m on m.id = p.module_id
    where p.is_home
      -- Sin ningún índice en toda la página, en cualquiera de sus secciones.
      and not exists (
        select 1
        from sections s
        join blocks b on b.section_id = s.id
        where s.page_id = p.id
          and b.kind = 'pageLinks'
      )
      -- Y con al menos una página más a la que enlazar: un módulo de una sola
      -- página no necesita índice, y añadírselo dejaría un bloque que borrar.
      and exists (
        select 1 from pages otra
        where otra.module_id = p.module_id and not otra.is_home
      )
  loop
    /**
     * Se reutiliza la primera sección de la portada si ya existe, en lugar de
     * crear una nueva. Añadir una sección vacía por encima del contenido que
     * el administrador ya escribió movería el índice al principio y rompería
     * el orden que había pensado.
     */
    select s.id into v_section
    from sections s
    where s.page_id = v_page.id
    order by s.position
    limit 1;

    if v_section is null then
      insert into sections (page_id, variant, position)
      values (v_page.id, 'plain', 0)
      returning id into v_section;

      v_position := 0;
    else
      -- Al final de la sección, detrás de lo que ya hubiera.
      select coalesce(max(b.position) + 1, 0) into v_position
      from blocks b
      where b.section_id = v_section;
    end if;

    insert into blocks (section_id, kind, position, data)
    values (
      v_section,
      'pageLinks',
      v_position,
      jsonb_build_object(
        'title', 'Aprende paso a paso',
        'variant', 'numbered',
        'source', 'auto',
        'items', '[]'::jsonb
      )
    );

    v_total := v_total + 1;
    raise notice 'Índice añadido a la portada de /c/%', v_page.module_slug;
  end loop;

  if v_total = 0 then
    raise notice 'Ninguna portada necesitaba índice.';
  else
    raise notice '% portadas actualizadas.', v_total;
  end if;
end $$;
