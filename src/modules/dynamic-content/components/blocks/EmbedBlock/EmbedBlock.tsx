import { toEmbedUrl } from 'modules/dynamic-content/services/embed';
import type { EmbedData } from 'modules/dynamic-content/types/blocks.types';
import './EmbedBlock.scss';

/**
 * Vídeo: incrustado de un proveedor o archivo propio.
 *
 * Con proveedor usa `youtube-nocookie.com`, que no deja rastreadores antes de
 * que alguien pulse reproducir. En una aplicación de salud, la lista de lo que
 * consultas no debería salir de tu navegador por mirar una pantalla.
 *
 * Con archivo propio usa el `<video>` nativo, sin librería: los controles, el
 * teclado y la pantalla completa ya los trae el navegador.
 */
const EmbedBlock = ({
  source = 'provider',
  url,
  title,
  width,
  height,
  posterUrl,
}: EmbedData) => {
  /**
   * La proporción se toma del vídeo si se conoce, y si no, 16:9. Reservar el
   * hueco antes de cargar evita que el contenido de debajo salte.
   */
  const ratio = width && height ? `${width} / ${height}` : '16 / 9';

  if (source === 'file') {
    return (
      <figure className="embed-block" data-testid="EmbedBlock">
        <div className="embed-block__frame" style={{ aspectRatio: ratio }}>
          <video
            src={url}
            poster={posterUrl}
            controls
            // `metadata` descarga solo la cabecera: el archivo completo se
            // baja al pulsar reproducir. Sin esto, cada visita a la página se
            // traería el vídeo entero aunque nadie lo viera.
            preload="metadata"
            playsInline
          >
            {/* Mensaje para navegadores sin soporte del formato: al menos
                queda un enlace para descargarlo. */}
            <a href={url}>{title}</a>
          </video>
        </div>
        <figcaption className="embed-block__caption">{title}</figcaption>
      </figure>
    );
  }

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
      <div className="embed-block__frame" style={{ aspectRatio: ratio }}>
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
