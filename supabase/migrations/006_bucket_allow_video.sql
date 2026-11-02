-- ===========================================================================
-- RespondeYa · 006 · El bucket acepta vídeo
-- ===========================================================================
-- El bucket `module-media` se creó para imágenes. Para que acepte también los
-- vídeos que sube el editor hay que ajustar dos cosas:
--
-- 1. El tope por archivo. Un vídeo de unos segundos ya pasa de 5 MB.
-- 2. La lista de tipos permitidos.
--
-- SOBRE LA LISTA DE TIPOS
-- Si `allowed_mime_types` está en NULL, el bucket acepta CUALQUIER archivo.
-- Dejarlo así sería más cómodo y bastante peor: el formulario filtra en el
-- navegador, pero esa comprobación se salta con una petición directa, y
-- entonces el bucket aceptaría ejecutables o PDF. Enumerar los tipos lo cierra
-- en el servidor, que es donde cuenta.
-- ===========================================================================

update storage.buckets
set
  -- 50 MB. Es también el tope por archivo que Supabase aplica por defecto, así
  -- que subir de aquí no serviría de nada sin cambiar el plan.
  file_size_limit = 52428800,

  allowed_mime_types = array[
    -- Imágenes. `avif` y `webp` son los que produce el redimensionado.
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    -- Vídeo. `quicktime` es el `.mov` que graban los iPhone, y llega tal cual
    -- porque el vídeo no se recomprime en el navegador.
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ]
where id = 'module-media';

-- Comprobación: debe devolver una fila con el tope y los nueve tipos.
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'module-media';
