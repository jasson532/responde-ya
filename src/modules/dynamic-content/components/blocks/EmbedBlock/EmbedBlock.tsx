import type { EmbedData } from 'modules/dynamic-content/types/blocks.types';
import './EmbedBlock.scss';

/**
 * Traduce una URL de YouTube o Vimeo a su dirección de incrustación.
 *
 * Se hace con una lista cerrada de proveedores en lugar de meter la URL tal
 * cual en el `src` de un `<iframe>`. Un iframe de origen arbitrario puede
 * intentar navegar la página que lo contiene, y la URL viene de un campo de
 * texto que rellena una persona.
 *
 * Devuelve `null` si el proveedor no está reconocido, y entonces el bloque
 * pinta un enlace normal.
 */
const toEmbedUrl = (raw: string): string | null => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    // `/watch?v=ID` es la forma larga; `/embed/ID` ya viene lista.
    const id = url.searchParams.get('v') ?? url.pathname.replace('/embed/', '');
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
};

/**
 * Vídeo incrustado.
 *
 * Usa `youtube-nocookie.com`, que no deja rastreadores antes de que alguien
 * pulse reproducir. En una aplicación de salud, la lista de lo que consultas
 * no debería salir de tu navegador por mirar una pantalla.
 */
const EmbedBlock = ({ url, title }: EmbedData) => {
  const embedUrl = toEmbedUrl(url);

  if (embedUrl === null) {
    return (
      <p className="embed-block__fallback" data-testid="EmbedBlock">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {title}
        </a>
      </p>
    );
  }

  return (
    <figure className="embed-block" data-testid="EmbedBlock">
      <div className="embed-block__frame">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          // Sin `allow-top-navigation`: el vídeo no debe poder llevarse la
          // pestaña a otra parte.
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allowFullScreen
        />
      </div>
      <figcaption className="embed-block__caption">{title}</figcaption>
    </figure>
  );
};

export default EmbedBlock;
