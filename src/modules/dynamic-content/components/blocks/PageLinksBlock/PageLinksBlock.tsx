import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { buildRoute } from 'modules/shared/constants/routes';
import HealthIcon, {
  type HealthIconName,
} from 'modules/shared/components/atoms/HealthIcon/HealthIcon';
import type {
  PageLinkItemData,
  PageLinksData,
} from 'modules/dynamic-content/types/blocks.types';
import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import './PageLinksBlock.scss';

export interface PageLinksBlockProps extends PageLinksData {
  /** Slug del módulo. Hace falta para construir la ruta de cada página. */
  moduleSlug: string;
  /** Las páginas del módulo, para resolver cada `pageId`. */
  pages: Page[];
}

/**
 * El índice: fichas que llevan a otras páginas del módulo.
 *
 * Cada ficha guarda un `pageId` y NUNCA una ruta. La ruta se construye aquí con
 * el slug actual de la página, así que renombrarla no rompe el índice. Si la
 * ruta estuviera guardada, el enlace quedaría apuntando a una dirección que ya
 * no existe y nadie se enteraría hasta pulsarlo.
 *
 * Una ficha cuya página ya no existe se omite: el administrador pudo borrar la
 * página y dejar la ficha huérfana. Mostrarla llevaría a un 404.
 */
const PageLinksBlock = ({
  title,
  variant = 'numbered',
  source = 'auto',
  items,
  moduleSlug,
  pages,
}: PageLinksBlockProps) => {
  const pagesById = new Map(pages.map((page) => [page.id, page]));

  /**
   * En automático las fichas se derivan de las páginas del módulo, excluida la
   * portada: el índice vive EN la portada, y una ficha que lleva a la pantalla
   * donde ya estás no sirve de nada.
   */
  const resolved: { item: PageLinkItemData; page: Page }[] =
    source === 'auto'
      ? [...pages]
          .filter((page) => !page.isHome)
          .sort((a, b) => a.position - b.position)
          // Sin `label` ni `description`: el componente cae en el título y el
          // subtítulo de la página, que es lo que se quiere en automático.
          .map((page) => ({ item: { id: page.id, pageId: page.id }, page }))
      : items
          .map((item) => ({ item, page: pagesById.get(item.pageId) }))
          .filter((entry): entry is { item: PageLinkItemData; page: Page } =>
            entry.page !== undefined,
          );

  /**
   * Sin páginas a las que enlazar no se pinta nada, ni un hueco ni un título.
   * Pasa en un módulo recién creado, que nace con el índice puesto pero
   * todavía sin más páginas.
   */
  if (resolved.length === 0) return null;

  return (
    <nav className="page-links" aria-label={title ?? 'Contenido del módulo'}>
      {title && <h3 className="page-links__title">{title}</h3>}

      <ol className="page-links__list" data-testid="PageLinksBlock">
        {resolved.map(({ item, page }, index) => (
          <li key={item.id}>
            <Link
              className="page-links__link"
              to={buildRoute.dynPage(moduleSlug, page.slug)}
            >
              {/* El número va `aria-hidden`: la posición ya la anuncia el
                  lector de pantalla al recorrer una lista ordenada. */}
              {variant === 'numbered' ? (
                <span className="page-links__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              ) : (
                /**
                 * Sin icono se pinta la pastilla vacía con un punto, no nada.
                 * El índice automático nunca trae icono —sus fichas se derivan
                 * de las páginas y solo llevan el identificador—, y omitir la
                 * pastilla dejaba ese texto desalineado respecto al de las
                 * fichas que sí lo tienen.
                 */
                <span
                  className={`page-links__icon${item.iconName ? '' : ' page-links__icon--empty'}`}
                  aria-hidden="true"
                >
                  {item.iconName && <HealthIcon name={item.iconName as HealthIconName} />}
                </span>
              )}

              <span className="page-links__body">
                {/* La etiqueta propia de la ficha gana al título de la página:
                    permite que el índice diga algo más corto que el encabezado
                    de la pantalla de destino. */}
                <span className="page-links__label">{item.label ?? page.title}</span>

                {(item.description ?? page.subtitle) && (
                  <span className="page-links__description">
                    {item.description ?? page.subtitle}
                  </span>
                )}
              </span>

              <span className="page-links__chevron" aria-hidden="true">
                <ChevronRight />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default PageLinksBlock;
