import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import BlockRenderer, { type BlockContext } from '../BlockRenderer/BlockRenderer';
import './PageRenderer.scss';

export interface PageRendererProps {
  page: Page;
  context: BlockContext;
}

/**
 * Pinta una página completa: sus secciones en orden, y dentro los bloques.
 *
 * Las secciones vacías se omiten. Una sección sin bloques es un contenedor que
 * el administrador creó y todavía no ha rellenado; mostrarla como una tarjeta
 * en blanco le haría pensar que algo falló al cargar.
 */
const PageRenderer = ({ page, context }: PageRendererProps) => {
  const sections = page.sections.filter((section) => section.blocks.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="page-renderer" data-testid="PageRenderer">
      {sections.map((section) => (
        <section
          key={section.id}
          className={`page-section page-section--${section.variant}`}
          // El título de la sección da nombre accesible a su región. Sin título
          // no se anuncia como región: sería una más sin forma de distinguirla.
          aria-labelledby={section.title ? `section-${section.id}` : undefined}
        >
          {section.title && (
            <h2 className="page-section__title" id={`section-${section.id}`}>
              {section.title}
            </h2>
          )}

          <BlockRenderer blocks={section.blocks} context={context} />
        </section>
      ))}
    </div>
  );
};

export default PageRenderer;
