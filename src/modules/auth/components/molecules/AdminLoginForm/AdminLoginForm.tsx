import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import type { LoginCredentials } from 'modules/auth/types/auth.types';
import './AdminLoginForm.scss';

export interface AdminLoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isSubmitting?: boolean;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validate = ({ email, password }: LoginCredentials): FieldErrors => {
  const errors: FieldErrors = {};

  if (!email.trim()) errors.email = 'Escribe tu correo.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Ese correo no parece valido.';

  if (!password) errors.password = 'Escribe tu contrasena.';

  return errors;
};

/**
 * Credenciales de administrador. Presentacional: no conoce Redux, valida
 * formato y delega el envio. Solo el rol admin se autentica en esta app.
 */
const AdminLoginForm = ({ onSubmit, isSubmitting = false }: AdminLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const credentials = { email, password };
    const nextErrors = validate(credentials);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) onSubmit(credentials);
  };

  return (
    <form
      className="admin-login-form"
      onSubmit={handleSubmit}
      noValidate
      data-testid="AdminLoginForm"
    >
      <FormField label="Correo electronico" error={errors.email} required>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="admin@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoFocus
        />
      </FormField>

      <FormField label="Contrasena" error={errors.password} required>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Tu contrasena"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        iconStart={<LogIn />}
      >
        Entrar como administrador
      </Button>
    </form>
  );
};

export default AdminLoginForm;
