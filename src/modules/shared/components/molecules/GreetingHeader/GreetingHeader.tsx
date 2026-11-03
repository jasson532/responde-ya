import { UserRound } from 'lucide-react';
import { useAppSelector } from 'modules/shared/store/hooks';
import { selectAdminUser } from 'modules/auth/store/authSlice';
import BrandWordmark from 'modules/shared/components/atoms/BrandWordmark/BrandWordmark';
import './GreetingHeader.scss';

/** Primer nombre, para tutear sin sonar a formulario. */
const firstNameOf = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? '';

/**
 * Cabecera del inicio: la marca y el saludo.
 *
 * Personaliza con el nombre solo cuando existe (admin autenticado). El
 * visitante anónimo es el caso normal y recibe un saludo sin nombre, no un
 * «Hola, invitado» que suena a error.
 *
 * La marca aparece SOLO en móvil. En escritorio ya está en `AppHeader`, que es
 * la cabecera fija de esa anchura; aquí se repetiría dos veces en la misma
 * pantalla. En móvil `AppHeader` está oculto —manda la barra inferior— y el
 * inicio se quedaba sin ninguna marca y sin camino de vuelta a la portada.
 */
const GreetingHeader = () => {
  const admin = useAppSelector(selectAdminUser);
  const firstName = admin ? firstNameOf(admin.displayName) : null;

  return (
    <div className="home-header" data-testid="GreetingHeader">
      <BrandWordmark className="home-header__brand" />

      <header className="greeting">
        <span className="greeting__avatar" aria-hidden="true">
          <UserRound />
        </span>

        <div className="greeting__text">
          <h1 className="greeting__hello">{firstName ? `Hola, ${firstName}` : 'Hola'}</h1>
          <p className="greeting__welcome">¡Qué bueno tenerte aquí!</p>
        </div>
      </header>
    </div>
  );
};

export default GreetingHeader;
