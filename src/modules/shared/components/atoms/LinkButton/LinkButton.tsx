import { Link, type LinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { ButtonSize, ButtonVariant } from 'modules/shared/components/atoms/Button/Button';
import 'modules/shared/components/atoms/Button/Button.scss';

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

/**
 * Navegación con apariencia de botón. Existe porque anidar un `Link` dentro de
 * un `button` produce controles interactivos anidados: HTML invalido que rompe
 * la navegación por teclado y confunde a los lectores de pantalla.
 *
 * Regla: si la acción NAVEGA usa LinkButton; si EJECUTA algo usa Button.
 */
const LinkButton = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  iconStart,
  iconEnd,
  children,
  className = '',
  ...rest
}: LinkButtonProps) => {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? 'button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={classes} data-testid="LinkButton" {...rest}>
      {iconStart && (
        <span className="button__icon" aria-hidden="true">
          {iconStart}
        </span>
      )}
      <span className="button__label">{children}</span>
      {iconEnd && (
        <span className="button__icon" aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </Link>
  );
};

export default LinkButton;
