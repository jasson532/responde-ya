import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Pointer } from 'lucide-react';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'emergency';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /**
   * Llama la atención sobre el botón: un aro que late y una mano que flota
   * sobre su borde y lo va tocando.
   *
   * Para el botón que hay que pulsar en esa pantalla, no para todos. Si todos
   * se movieran, moverse dejaría de significar nada.
   *
   * La mano aparece siempre, también si el botón ya trae `iconEnd`. La flecha
   * de «siguiente» dice a DÓNDE lleva y la mano dice QUE hay que pulsarlo: no
   * son lo mismo, y la mano queda por debajo del borde, donde no estorba.
   */
  nudge?: boolean;
  /**
   * Acceso al `<button>` real.
   *
   * `ButtonHTMLAttributes` no lo incluye, así que sin declararlo aquí no se
   * puede pasar. Hace falta para devolver el foco: cuando un botón abre algo y
   * eso se cierra, el foco se queda en el `<body>` y quien navega con teclado
   * vuelve a empezar desde el principio de la página.
   *
   * En React 19 `ref` viaja como una prop más y llega al `<button>` con el
   * resto; no hace falta `forwardRef`.
   */
  ref?: Ref<HTMLButtonElement>;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconStart,
  iconEnd,
  nudge = false,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? 'button--full' : '',
    nudge ? 'button--nudge' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Cargando no se pulsa nada: no hay nada que indicar.
  const showPointer = nudge && !loading;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      data-testid="Button"
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" inline />
      ) : (
        iconStart && (
          <span className="button__icon" aria-hidden="true">
            {iconStart}
          </span>
        )
      )}
      {children && <span className="button__label">{children}</span>}
      {!loading && iconEnd && (
        <span className="button__icon" aria-hidden="true">
          {iconEnd}
        </span>
      )}
      {showPointer && (
        <span className="button__nudge" aria-hidden="true">
          <Pointer />
        </span>
      )}
    </button>
  );
};

export default Button;
