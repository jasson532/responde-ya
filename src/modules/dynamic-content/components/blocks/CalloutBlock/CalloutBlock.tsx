import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, OctagonAlert, Lightbulb } from 'lucide-react';
import { BlockTone, type CalloutData } from 'modules/dynamic-content/types/blocks.types';
import './CalloutBlock.scss';

const ICON_BY_TONE: Record<BlockTone, ReactNode> = {
  [BlockTone.Neutral]: <Lightbulb />,
  [BlockTone.Info]: <Info />,
  [BlockTone.Success]: <CircleCheck />,
  [BlockTone.Warning]: <CircleAlert />,
  [BlockTone.Danger]: <OctagonAlert />,
};

/**
 * Aviso destacado. Generaliza el antiguo bloque de advertencia, que solo tenía
 * dos grados y rotulaba el texto por su cuenta («Nunca hagas esto:»).
 *
 * Va en un `<aside role="note">`: es contenido tangencial al flujo principal, y
 * el rol permite a un lector de pantalla anunciarlo como nota en lugar de leerlo
 * como si fuera otro párrafo más.
 */
const CalloutBlock = ({ tone, title, text }: CalloutData) => (
  <aside className={`callout callout--${tone}`} role="note" data-testid="CalloutBlock">
    <span className="callout__icon" aria-hidden="true">
      {ICON_BY_TONE[tone]}
    </span>

    <div className="callout__body">
      {title && <p className="callout__title">{title}</p>}
      <p className="callout__text">{text}</p>
    </div>
  </aside>
);

export default CalloutBlock;
