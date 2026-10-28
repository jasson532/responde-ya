import { UserRound } from 'lucide-react';
import { useAppSelector } from 'modules/shared/store/hooks';
import { selectAdminUser } from 'modules/auth/store/authSlice';
import './GreetingHeader.scss';

/** Primer nombre, para tutear sin sonar a formulario. */
const firstNameOf = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? '';

/**
 * Saludo de bienvenida del inicio.
 *
 * Personaliza con el nombre solo cuando existe (admin autenticado). El
 * visitante anónimo es el caso normal y recibe un saludo sin nombre, no un
 * «Hola, invitado» que suena a error.
 */
const GreetingHeader = () => {
  const admin = useAppSelector(selectAdminUser);
  const firstName = admin ? firstNameOf(admin.displayName) : null;

  return (
    <header className="greeting" data-testid="GreetingHeader">
      <span className="greeting__avatar" aria-hidden="true">
        <UserRound />
      </span>

      <div className="greeting__text">
        <h1 className="greeting__hello">{firstName ? `Hola, ${firstName}` : 'Hola'}</h1>
        <p className="greeting__welcome">¡Qué bueno tenerte aquí!</p>
      </div>
    </header>
  );
};

export default GreetingHeader;
