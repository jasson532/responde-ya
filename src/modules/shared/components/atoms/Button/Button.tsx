import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
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
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
    </button>
  );
};

export default Button;
