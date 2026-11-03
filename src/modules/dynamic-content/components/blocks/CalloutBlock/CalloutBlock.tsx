import type { CalloutData } from 'modules/dynamic-content/types/blocks.types';
import { TONE_ICON } from 'modules/dynamic-content/constants/toneIcons';
import './CalloutBlock.scss';

/**
 * Aviso destacado. Generaliza el antiguo bloque de advertencia, que solo tenía
 * dos grados y rotulaba el texto por su cuenta («Nunca hagas esto:»).
 *
 * Va en un `<aside role="note">`: es contenido tangencial al flujo principal, y
 * el rol permite a un lector de pantalla anunciarlo como nota en lugar de leerlo
 * como si fuera otro párrafo más.
 */
const CalloutBlock = ({ tone, title, text }: CalloutData) => {
  const hasTitle = title !== undefined && title.trim() !== '';

  return (
    <aside
      className={`callout callout--${tone}${hasTitle ? '' : ' callout--untitled'}`}
      role="note"
      data-testid="CalloutBlock"
    >
      {/* El icono es decorativo: repite lo que ya dicen el tono y el texto, así
          que va oculto para los lectores de pantalla. */}
      <span className="callout__icon" aria-hidden="true">
        {TONE_ICON[tone]}
      </span>

      <div className="callout__body">
        {hasTitle && <p className="callout__title">{title}</p>}
        <p className="callout__text">{text}</p>
      </div>
    </aside>
  );
};

export default CalloutBlock;
