import { forwardRef, type TextareaHTMLAttributes } from 'react';
import './Textarea.scss';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** El estado de error se expresa con `aria-invalid` (ver Input). */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', rows = 4, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={`textarea ${className}`.trim()}
      data-testid="Textarea"
      {...rest}
    />
  ),
);

Textarea.displayName = 'Textarea';

export default Textarea;
