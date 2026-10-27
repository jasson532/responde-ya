import './Spinner.scss';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Cuando es inline no ocupa bloque completo (para usarse dentro de botones). */
  inline?: boolean;
  label?: string;
}

const Spinner = ({ size = 'md', inline = false, label = 'Cargando' }: SpinnerProps) => (
  <span
    className={`spinner spinner--${size} ${inline ? 'spinner--inline' : ''}`}
    role="status"
    aria-live="polite"
    data-testid="Spinner"
  >
    <span className="spinner__circle" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
);

export default Spinner;
