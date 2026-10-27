import { cloneElement, useId, type ReactElement } from 'react';
import './FormField.scss';

/** Props que FormField inyecta en su control hijo. Todas son atributos DOM validos. */
interface InjectedControlProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
}

export interface FormFieldProps {
  label: string;
  /** El control del campo: Input, Textarea, Select o un elemento nativo. */
  children: ReactElement<InjectedControlProps>;
  hint?: string;
  error?: string | null;
  required?: boolean;
}

/**
 * Enlaza etiqueta, pista, error y control via id/aria-describedby.
 * Solo inyecta atributos DOM validos: inyectar props inventadas (`hasError`)
 * provoca warnings de React cuando el hijo es un elemento nativo.
 */
const FormField = ({ label, children, hint, error, required = false }: FormFieldProps) => {
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  const control = cloneElement(children, {
    id: fieldId,
    required,
    ...(error ? { 'aria-invalid': true } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  });

  return (
    <div className="form-field" data-testid="FormField">
      <label className="form-field__label" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="form-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <p className="form-field__hint" id={hintId}>
          {hint}
        </p>
      )}

      {control}

      {error && (
        <p className="form-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
