import type { ButtonHTMLAttributes, ReactNode } from 'react';
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
