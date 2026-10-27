import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import './TopBar.scss';

export interface TopBarProps {
  title: string;
  /** Muestra el botón de volver. */
  showBack?: boolean;
  /** Ruta a la que volver. Sin esto usa el historial del navegador. */
  backTo?: string;
  /** Acción a la derecha (icono, badge). */
  trailing?: ReactNode;
  /** Fija la barra al hacer scroll. */
  sticky?: boolean;
}

/**
 * Barra superior contextual para móvil: volver, título centrado y una acción.
 *
 * Prefiere `navigate(-1)` sobre una ruta fija cuando no se pasa `backTo`: así
 * «volver» lleva de verdad a donde estaba la persona y no a un sitio supuesto.
 */
const TopBar = ({
  title,
  showBack = false,
  backTo,
  trailing,
  sticky = true,
}: TopBarProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <header
      className={`top-bar ${sticky ? 'top-bar--sticky' : ''}`.trim()}
      data-testid="TopBar"
    >
      <div className="top-bar__inner">
        {showBack ? (
          <button
            type="button"
            className="top-bar__back"
            onClick={handleBack}
            aria-label="Volver"
          >
            <ArrowLeft aria-hidden="true" />
          </button>
        ) : (
          <span className="top-bar__spacer" />
        )}

        {/* No es un encabezado: duplicaría el h1 de la página. Es una
            etiqueta de orientación, así que va como texto plano. */}
        <p className="top-bar__title">{title}</p>

        <span className="top-bar__trailing">{trailing}</span>
      </div>
    </header>
  );
};

export default TopBar;
