import type { CSSProperties } from 'react';
import type { MediaRef } from 'modules/dynamic-content/types/blocks.types';
import './MediaFigure.scss';

export interface MediaFigureProps {
  media: MediaRef;
  caption?: string;
  fit?: 'contain' | 'cover';
  /** `true` solo para la primera imagen visible de la pantalla. */
  priority?: boolean;
  /** Tamaño de visualización en píxeles. Sin valores, ocupa el ancho disponible. */
  displayWidth?: number;
  displayHeight?: number;
}

/**
 * Una imagen con su pie.
 *
 * Los atributos `width` y `height` llevan las dimensiones REALES del archivo,
 * no las de visualización: son lo que el navegador usa para deducir la
 * proporción y reservar el hueco antes de descargarla. Sin ellos el texto de
 * debajo salta cuando la imagen acaba de cargar.
 *
 * El `placeholder` es una miniatura de 20 px en base64 que se pinta de fondo
 * ampliada y borrosa, para ocupar ese hueco con algo parecido a la imagen
 * final en lugar de con un rectángulo gris.
 */
const MediaFigure = ({
  media,
  caption,
  fit = 'contain',
  priority = false,
  displayWidth,
  displayHeight,
}: MediaFigureProps) => {
  const hasCustomSize = displayWidth !== undefined || displayHeight !== undefined;

  /**
   * El tamaño pedido se aplica como estilo, no como atributo, para que
   * `max-width: 100%` de la hoja pueda frenarlo en pantallas estrechas. Si
   * fuera un atributo, un ancho de 800 px desbordaría en un móvil de 360.
   *
   * Dar solo uno de los dos deja el otro en `auto`, que es lo que mantiene la
   * proporción original.
   */
  const sizeStyle: CSSProperties = hasCustomSize
    ? {
        width: displayWidth !== undefined ? `${displayWidth}px` : 'auto',
        height: displayHeight !== undefined ? `${displayHeight}px` : 'auto',
      }
    : {};

  return (
    <figure
      className={`media-figure ${hasCustomSize ? 'media-figure--sized' : ''}`.trim()}
      data-testid="MediaFigure"
    >
      <img
        className={`media-figure__img media-figure__img--${fit}`}
        src={media.url}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        style={{
          ...sizeStyle,
          ...(media.placeholder ? { backgroundImage: `url(${media.placeholder})` } : {}),
        }}
      />

      {caption && <figcaption className="media-figure__caption">{caption}</figcaption>}
    </figure>
  );
};

export default MediaFigure;
