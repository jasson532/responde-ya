-- ===========================================================================
-- RespondeYa · 003 · Módulo de demostración
-- ===========================================================================
-- Reproduce el módulo de RCP del prototipo usando el contenido dinámico, para
-- comprobar el renderizador con datos reales y servir de ejemplo de cómo se
-- estructura un módulo.
--
-- Se escribe en un bloque `DO` con variables en lugar de CTEs encadenadas
-- porque los bloques de índice necesitan los UUID de las páginas DENTRO de su
-- `jsonb`: con CTEs habría que resolver esa dependencia circular a mano.
--
-- Idempotente: si el módulo ya existe, no hace nada.
-- ===========================================================================

do $$
declare
  v_cat_id    uuid;
  v_module_id uuid;
  v_home_id   uuid;
  v_p1_id     uuid;
  v_p2_id     uuid;
  v_p3_id     uuid;
  v_sec_id    uuid;
begin
  if exists (select 1 from modules where slug = 'rcp-solo-con-las-manos') then
    raise notice 'El módulo de demostración ya existe; no se hace nada.';
    return;
  end if;

  select id into v_cat_id from categories where slug = 'urgencias';

  -- ----------------------------------------------------------------- módulo
  insert into modules (
    slug, title, summary, icon_name, category_id,
    severity, status, tags, estimated_minutes, position
  ) values (
    'rcp-solo-con-las-manos',
    'RCP solo con las manos',
    'Si un adolescente o adulto se desploma de repente y no responde: llama y comprime. Sin dar respiraciones, sin formación previa.',
    'cpr',
    v_cat_id,
    'critical',
    'published',
    array['rcp','reanimación','paro cardiaco','no respira','inconsciente','compresiones'],
    3,
    1
  ) returning id into v_module_id;

  -- ----------------------------------------------------------------- páginas
  -- Se crean antes que los bloques porque el índice de la portada necesita
  -- sus identificadores.
  insert into pages (module_id, slug, title, subtitle, is_home, position)
  values (v_module_id, 'inicio', 'RCP solo con las manos', null, true, 0)
  returning id into v_home_id;

  insert into pages (module_id, slug, title, subtitle, is_home, position)
  values (v_module_id, 'reconoce-el-paro', 'Reconoce el paro cardíaco',
          'Identifica los signos', false, 1)
  returning id into v_p1_id;

  insert into pages (module_id, slug, title, subtitle, is_home, position)
  values (v_module_id, 'activa-emergencias', 'Activa emergencias',
          'Pide ayuda oportunamente', false, 2)
  returning id into v_p2_id;

  insert into pages (module_id, slug, title, subtitle, is_home, position)
  values (v_module_id, 'inicia-compresiones', 'Inicia compresiones',
          'Recomendaciones básicas', false, 3)
  returning id into v_p3_id;

  -- ======================================================= PORTADA
  insert into sections (page_id, title, variant, position)
  values (v_home_id, null, 'plain', 0)
  returning id into v_sec_id;

  insert into blocks (section_id, kind, position, data) values
    (v_sec_id, 'text', 0, jsonb_build_object(
      'text', 'Aprende a reconocer un paro cardíaco y a actuar en los primeros minutos, que son los que deciden.',
      'isLead', true
    )),
    -- Las fichas del índice apuntan por `pageId`, nunca por ruta: así
    -- renombrar una página no rompe el enlace.
    (v_sec_id, 'pageLinks', 1, jsonb_build_object(
      'title', 'Aprende paso a paso',
      'variant', 'numbered',
      'items', jsonb_build_array(
        jsonb_build_object('id','lnk-1','pageId', v_p1_id::text),
        jsonb_build_object('id','lnk-2','pageId', v_p2_id::text),
        jsonb_build_object('id','lnk-3','pageId', v_p3_id::text)
      )
    )),
    (v_sec_id, 'callout', 2, jsonb_build_object(
      'tone','warning',
      'title','Esto no sustituye un curso',
      'text','El contenido es material de apoyo. Ante una emergencia real, llama primero a la línea de emergencias de tu país.'
    ));

  -- ======================================= 01 · RECONOCE EL PARO
  insert into sections (page_id, title, variant, position)
  values (v_p1_id, null, 'plain', 0)
  returning id into v_sec_id;

  insert into blocks (section_id, kind, position, data) values
    (v_sec_id, 'keyPoints', 0, jsonb_build_object(
      'title','Identifica estas señales',
      'points', jsonb_build_array(
        jsonb_build_object(
          'id','kp-1','tone','danger','title','No responde',
          'detail','No reacciona al hablarle o tocar sus hombros.'
        ),
        jsonb_build_object(
          'id','kp-2','tone','info','title','No respira normalmente',
          'detail','Puede presentar jadeos agónicos.'
        )
      )
    )),
    (v_sec_id, 'emergencyCall', 1, jsonb_build_object(
      'phoneNumber','123','label','Pide ayuda'
    ));

  -- ======================================= 02 · ACTIVA EMERGENCIAS
  insert into sections (page_id, title, variant, position)
  values (v_p2_id, null, 'plain', 0)
  returning id into v_sec_id;

  insert into blocks (section_id, kind, position, data) values
    (v_sec_id, 'emergencyCall', 0, jsonb_build_object(
      'phoneNumber','123','label','En Colombia'
    )),
    (v_sec_id, 'keyPoints', 1, jsonb_build_object(
      'points', jsonb_build_array(
        jsonb_build_object(
          'id','kp-3','tone','success','title','Comunica la emergencia',
          'detail','Indica dónde estás y qué ocurre.'
        ),
        jsonb_build_object(
          'id','kp-4','tone','success','title','Sigue las indicaciones',
          'detail','Pon el teléfono en altavoz.'
        )
      )
    ));

  -- ======================================= 03 · INICIA COMPRESIONES
  insert into sections (page_id, title, variant, position)
  values (v_p3_id, null, 'plain', 0)
  returning id into v_sec_id;

  insert into blocks (section_id, kind, position, data) values
    (v_sec_id, 'stats', 0, jsonb_build_object(
      'title','Manos en el centro del pecho',
      'stats', jsonb_build_array(
        jsonb_build_object('id','st-1','value','100-120','label','compresiones por minuto'),
        jsonb_build_object('id','st-2','value','5-6 cm','label','profundidad en adultos')
      )
    )),
    (v_sec_id, 'text', 1, jsonb_build_object(
      'text','Permite que el pecho vuelva a su posición entre compresiones.'
    )),
    (v_sec_id, 'metronome', 2, jsonb_build_object(
      'beatsPerMinute', 110,
      'relaySeconds', 120,
      'title','Comprime en cada pulso',
      'hint','Fuerte, rápido y deja que el pecho suba.'
    )),
    (v_sec_id, 'divider', 3, '{}'::jsonb);

  -- Segunda sección de la misma página, en tarjeta, para comprobar que las
  -- variantes de sección se distinguen.
  insert into sections (page_id, title, variant, position)
  values (v_p3_id, 'Dudas frecuentes', 'card', 1)
  returning id into v_sec_id;

  insert into blocks (section_id, kind, position, data) values
    (v_sec_id, 'accordion', 0, jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object(
          'id','acc-1',
          'question','¿Y si oigo un crujido?',
          'answer','Puede ocurrir y no debe detenerte. Una costilla se recupera; un paro cardíaco sin compresiones, no.'
        ),
        jsonb_build_object(
          'id','acc-2',
          'question','¿Tengo que dar respiraciones?',
          'answer','En un adulto que se desploma de golpe, no. Comprimir sin parar es lo que mantiene la sangre circulando.'
        )
      )
    )),
    (v_sec_id, 'table', 1, jsonb_build_object(
      'title','Cuándo solo con las manos NO basta',
      'headers', jsonb_build_array('Situación','Qué hacer'),
      'rows', jsonb_build_array(
        jsonb_build_array('Bebés y niños','Compresiones y respiraciones'),
        jsonb_build_array('Ahogamiento','Compresiones y respiraciones'),
        jsonb_build_array('Sobredosis','Compresiones y respiraciones')
      )
    )),
    (v_sec_id, 'doDont', 2, jsonb_build_object(
      'doTitle','Hazlo así',
      'dontTitle','Nunca',
      'doItems', jsonb_build_array(
        jsonb_build_object('id','d-1','text','Brazos rectos, hombros sobre las manos'),
        jsonb_build_object('id','d-2','text','Superficie firme, no un colchón')
      ),
      'dontItems', jsonb_build_array(
        jsonb_build_object('id','n-1','text','Apoyarte entre compresiones'),
        jsonb_build_object('id','n-2','text','Parar a buscar el pulso')
      )
    ));

  raise notice 'Módulo de demostración creado: /c/rcp-solo-con-las-manos';
end $$;
