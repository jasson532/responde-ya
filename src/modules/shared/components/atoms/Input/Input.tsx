import { forwardRef, type InputHTMLAttributes } from 'react';
import './Input.scss';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * El estado de error NO es una prop propia: se expresa con `aria-invalid`,
 * que `FormField` inyecta. Asi el atributo sirve a la vez de contrato de
 * accesibilidad y de gancho de estilo, sin props que acaben en el DOM.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={`input ${className}`.trim()} data-testid="Input" {...rest} />
  ),
);

Input.displayName = 'Input';

export default Input;
