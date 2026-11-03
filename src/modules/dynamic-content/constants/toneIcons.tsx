import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, Lightbulb, OctagonAlert } from 'lucide-react';
import { BlockTone } from 'modules/dynamic-content/types/blocks.types';

/**
 * ===========================================================================
 * ICONO POR TONO
 * ===========================================================================
 * Un solo mapa para todos los bloques que pintan un tono. La regla es que el
 * mismo tono se dibuje igual en toda la aplicación: si el aviso de peligro
 * lleva un octágono y la ficha de peligro un triángulo, el lector tiene que
 * aprender dos vocabularios para la misma idea.
 *
 * Vive aquí y NO en los datos del bloque: qué dibujo representa «peligro» es
 * una decisión de presentación, y guardarla en Postgres obligaría a migrar
 * todas las filas para cambiar un icono.
 * ===========================================================================
 */
export const TONE_ICON: Record<BlockTone, ReactNode> = {
  [BlockTone.Neutral]: <Lightbulb />,
  [BlockTone.Info]: <Info />,
  [BlockTone.Success]: <CircleCheck />,
  [BlockTone.Warning]: <CircleAlert />,
  [BlockTone.Danger]: <OctagonAlert />,
};
