import { HEALTH_ICON_NODES, type HealthIconName } from './healthIconNodes';

export type { HealthIconName };

export interface HealthIconProps {
  name: HealthIconName;
}

/**
 * Icono del dominio sanitario, del set Health Icons (CC0).
 *
 * Decorativo: no lleva `aria-label` ni `title` a propósito. Siempre va junto a
 * un texto que dice lo mismo (el título del módulo), así que anunciarlo lo
 * repetiría en el lector de pantalla.
 *
 * El tamaño y el color los pone el contenedor: los trazos usan `currentColor`
 * y el `<svg>` no fija dimensiones.
 */
const HealthIcon = ({ name }: HealthIconProps) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    data-testid="HealthIcon"
    data-icon={name}
  >
    {HEALTH_ICON_NODES[name]}
  </svg>
);

export default HealthIcon;
