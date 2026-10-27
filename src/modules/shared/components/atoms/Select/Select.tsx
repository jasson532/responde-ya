import { forwardRef, type SelectHTMLAttributes } from 'react';
import './Select.scss';

export interface SelectOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className = '', ...rest }, ref) => (
    <select ref={ref} className={`select ${className}`.trim()} data-testid="Select" {...rest}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
);

Select.displayName = 'Select';

export default Select;
