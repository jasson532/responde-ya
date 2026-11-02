import type { MediaRef } from 'modules/dynamic-content/types/blocks.types';
import './MediaFigure.scss';

export interface MediaFigureProps {
  media: MediaRef;
  caption?: string;
  fit?: 'contain' | 'cover';
  /** `true` solo para la primera imagen visible de la pantalla. */
  priority?: boolean;
}

/**
 * Una imagen con su pie.
 *
 * Fija `width` y `height` con las dimensiones reales del archivo: sin ellas el
 * navegador no sabe cuánto espacio reservar y el texto de debajo salta cuando
 * la imagen acaba de cargar.
 *
 * El `placeholder` es una miniatura de 20 px en base64 que se pinta de fondo
 * ampliada y borrosa. Ocupa el hueco con algo parecido a la imagen final en
 * lugar de con un rectángulo gris.
 */
const MediaFigure = ({ media, caption, fit = 'contain', priority = false }: MediaFigureProps) => (
  <figure className="media-figure" data-testid="MediaFigure">
    <img
      className={`media-figure__img media-figure__img--${fit}`}
      src={media.url}
      alt={media.alt}
      width={media.width}
      height={media.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      style={
        media.placeholder
          ? { backgroundImage: `url(${media.placeholder})` }
          : undefined
      }
    />

    {caption && <figcaption className="media-figure__caption">{caption}</figcaption>}
  </figure>
);

export default MediaFigure;
