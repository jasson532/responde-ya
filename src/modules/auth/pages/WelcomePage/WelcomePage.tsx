import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import appConfig from 'modules/shared/services/config/appConfig';
import BrandLogo from 'modules/shared/components/atoms/BrandLogo/BrandLogo';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import welcomeArtSrc from 'modules/shared/assets/images/img-welcome.jpg';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearAuthError,
  loginAdmin,
  selectAuthError,
  selectAuthStatus,
} from 'modules/auth/store/authSlice';
import AdminLoginForm from 'modules/auth/components/molecules/AdminLoginForm/AdminLoginForm';
import { DEMO_CREDENTIALS } from 'modules/auth/services/auth.local.repository';
import type { LoginCredentials } from 'modules/auth/types/auth.types';
import './WelcomePage.scss';

interface LocationState {
  from?: { pathname: string };
}

/**
 * Portada. Marca, una ilustración y una sola acción.
 *
 * Nada más, a propósito: lo que antes había aquí —tres tarjetas de lo que
 * ofrece la app, un separador y un botón de administración— obligaba a elegir
 * en la primera pantalla. Quien abre esto quiere entrar.
 *
 * El acceso de administración ya NO se anuncia en la portada, pero sigue
 * existiendo: el formulario aparece solo cuando `AdminRoute` ha redirigido
 * aquí, y eso se detecta por `location.state.from`. Quitar también el
 * formulario habría dejado al admin sin manera de identificarse, porque el
 * guard manda a esta ruta.
 */
const WelcomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  /** Ruta de admin desde la que el guard redirigió, si aplica. */
  const intendedAdminPath = (location.state as LocationState | null)?.from?.pathname;

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const handleAdminLogin = async (credentials: LoginCredentials) => {
    const result = await dispatch(loginAdmin(credentials));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate(intendedAdminPath ?? ROUTES.ADMIN_MODULES, { replace: true });
    }
  };

  return (
    <section className="welcome" data-testid="WelcomePage">
      {/* El logo es el encabezado de la pantalla; su `alt` aporta el nombre. */}
      <h1 className="welcome__logo">
        <BrandLogo size="lg" priority />
      </h1>

      {/* En minúsculas en el código y en mayúsculas por CSS: algunos lectores
          de pantalla leen las mayúsculas reales letra a letra. */}
      <p className="welcome__tagline">
        Educación digital en primer respondiente para la comunidad
      </p>

      {/**
       * La ilustración del diseño, en lugar del icono monocromo que había
       * aquí. Trae su propio fondo azul con la onda, así que NO va dentro de un
       * panel de color: se apoya directamente sobre el lienzo.
       *
       * `width`/`height` son las dimensiones reales del archivo; fijarlas
       * reserva el hueco y evita que el texto de abajo salte al cargar (CLS).
       */}
      <img
        className="welcome__art"
        src={welcomeArtSrc}
        width={1130}
        height={598}
        alt="Una persona realizando compresiones torácicas sobre alguien tendido en el suelo"
        fetchPriority="high"
        decoding="async"
      />

      {/* El signo de cierre en rojo, como en el diseño: recoge el reparto de
          color del logo (navy + rojo) sin repetir el truco de «RespondeYa». */}
      <p className="welcome__greeting">
        ¡Bienvenido a RespondeYa
        <span className="welcome__greeting-mark">!</span>
      </p>

      <div className="welcome__actions">
        <LinkButton to={ROUTES.MODULES} variant="emergency" size="lg" fullWidth>
          <span className="welcome__cta-label">Comenzar</span>
        </LinkButton>

        <LinkButton
          to={ROUTES.ABOUT}
          variant="secondary"
          size="md"
          fullWidth
          iconStart={<BookOpen />}
        >
          Conoce la aplicación
        </LinkButton>
      </div>

      {/* El punto separador va `aria-hidden`: es puntuación decorativa y algunos
          lectores de pantalla lo anuncian como «punto medio» entre las dos
          palabras. */}
      <p className="welcome__terms">
        Gratis
        <span className="welcome__terms-dot" aria-hidden="true">
          ·
        </span>
        Sin registro
      </p>

      {intendedAdminPath && (
        <div className="welcome__admin-panel">
          {error ? (
            <AlertMessage tone="error">{error}</AlertMessage>
          ) : (
            <AlertMessage tone="info">
              Identifícate como administrador para entrar a esa sección.
            </AlertMessage>
          )}

          <AdminLoginForm
            onSubmit={handleAdminLogin}
            isSubmitting={status === LoadingStatus.Pending}
          />

          {appConfig.persistenceDriver === 'local' && (
            <aside className="welcome__demo">
              <p className="welcome__demo-title">Cuenta de demostración</p>
              <ul className="welcome__demo-list">
                {DEMO_CREDENTIALS.map((account) => (
                  <li key={account.email}>
                    {account.email} / {account.password}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      )}
    </section>
  );
};

export default WelcomePage;
