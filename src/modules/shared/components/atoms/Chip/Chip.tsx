import type { ReactNode } from 'react';
import './Chip.scss';

export interface ChipProps {
  children: ReactNode;
  isActive?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  count?: number;
}

/**
 * Filtro en forma de pastilla. Usa `aria-pressed` en vez de `role="tab"`:
 * no cambia de panel, solo refina la lista que ya esta en pantalla.
 */
const Chip = ({ children, isActive = false, onClick, icon, count }: ChipProps) => (
  <button
    type="button"
    className={`chip ${isActive ? 'is-active' : ''}`.trim()}
    aria-pressed={isActive}
    onClick={onClick}
    data-testid="Chip"
  >
    {icon && (
      <span className="chip__icon" aria-hidden="true">
        {icon}
      </span>
    )}
    <span className="chip__label">{children}</span>
    {count !== undefined && <span className="chip__count">{count}</span>}
  </button>
);

export default Chip;
