import type { GalleryData } from 'modules/dynamic-content/types/blocks.types';
import MediaFigure from '../MediaFigure/MediaFigure';
import './GalleryBlock.scss';

/**
 * Varias imágenes en rejilla.
 *
 * Usa `cover` para que todas se recorten al mismo formato: con `contain`, una
 * foto vertical junto a una horizontal dejan huecos y la rejilla se ve
 * desordenada.
 */
const GalleryBlock = ({ items, columns = 2 }: GalleryData) => (
  <ul className={`gallery gallery--cols-${columns}`} data-testid="GalleryBlock">
    {items.map((media, index) => (
      <li key={media.mediaId ?? `${media.url}-${index}`} className="gallery__item">
        <MediaFigure media={media} fit="cover" />
      </li>
    ))}
  </ul>
);

export default GalleryBlock;
