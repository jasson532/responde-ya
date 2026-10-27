import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldUser, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import appConfig from 'modules/shared/services/config/appConfig';
import Button from 'modules/shared/components/atoms/Button/Button';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearAuthError,
  loginAdmin,
  selectAdminUser,
  selectAuthError,
  selectAuthStatus,
  selectIsAdmin,
} from 'modules/auth/store/authSlice';
import AdminLoginForm from 'modules/auth/components/molecules/AdminLoginForm/AdminLoginForm';
import { DEMO_CREDENTIALS } from 'modules/auth/services/auth.local.repository';
import type { LoginCredentials } from 'modules/auth/types/auth.types';
import './WelcomePage.scss';

interface LocationState {
  from?: { pathname: string };
}

/**
 * Pantalla de entrada. Dos caminos:
 *
 * 1. "Ingresar" — acceso inmediato al contenido, sin credenciales. Es el camino
 *    del 99% de las visitas, así que es la acción primaria y la mas grande.
 * 2. "Soy administrador" — despliega el formulario bajo demanda. Se oculta por
 *    defecto para no sugerirle a nadie que necesita una cuenta.
 */
const WelcomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = useAppSelector(selectIsAdmin);
  const admin = useAppSelector(selectAdminUser);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const formRegionId = useId();

  /** Ruta de admin desde la que el guard redirigio, si aplica. */
  const intendedAdminPath = (location.state as LocationState | null)?.from?.pathname;

  // Si el guard nos trajo aquí, el formulario arranca abierto: el visitante ya
  // manifesto su intencion de entrar a administración.
  const [isFormOpen, setIsFormOpen] = useState(Boolean(intendedAdminPath));

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const handleAdminLogin = async (credentials: LoginCredentials) => {
    const result = await dispatch(loginAdmin(credentials));

    if (result.meta.requestStatus === 'fulfilled') {
      navigate(intendedAdminPath ?? ROUTES.ADMIN_MODULES, { replace: true });
    }
  };

  const handleToggleForm = () => {
    // El dispatch va fuera del updater: una funcion de actualizacion de estado
    // debe ser pura. React la invoca dos veces en StrictMode y el efecto se
    // duplicaria.
    if (isFormOpen) dispatch(clearAuthError());
    setIsFormOpen((open) => !open);
  };

  return (
    <section className="welcome-page" data-testid="WelcomePage">
      <header className="welcome-page__header">
        <h2 className="welcome-page__title">Ingresa y consulta</h2>
        <p className="welcome-page__subtitle">
          No necesitas cuenta ni contraseña. Entra y busca lo que esta pasando.
        </p>
      </header>

      <LinkButton
        to={ROUTES.MODULES}
        variant="emergency"
        size="lg"
        fullWidth
        iconEnd={<ArrowRight />}
      >
        Ingresar
      </LinkButton>

      <div className="welcome-page__divider" role="separator">
        <span>o</span>
      </div>

      {isAdmin ? (
        <div className="welcome-page__admin-active">
          <p className="welcome-page__admin-active-text">
            Ya tienes sesión como <strong>{admin?.displayName}</strong>.
          </p>
          <LinkButton to={ROUTES.ADMIN_MODULES} variant="secondary" size="md" fullWidth>
            Ir a administrar contenido
          </LinkButton>
        </div>
      ) : (
        <>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={handleToggleForm}
            iconStart={isFormOpen ? <X /> : <ShieldUser />}
            aria-expanded={isFormOpen}
            aria-controls={formRegionId}
          >
            {isFormOpen ? 'Cancelar' : 'Soy administrador'}
          </Button>

          <div id={formRegionId} hidden={!isFormOpen} className="welcome-page__admin-panel">
            {isFormOpen && (
              <>
                {intendedAdminPath && !error && (
                  <AlertMessage tone="info">
                    Identifícate como administrador para entrar a esa sección.
                  </AlertMessage>
                )}

                {error && <AlertMessage tone="error">{error}</AlertMessage>}

                <AdminLoginForm
                  onSubmit={handleAdminLogin}
                  isSubmitting={status === LoadingStatus.Pending}
                />

                {appConfig.persistenceDriver === 'local' && (
                  <aside className="welcome-page__demo">
                    <p className="welcome-page__demo-title">Cuenta de demostracion</p>
                    <ul className="welcome-page__demo-list">
                      {DEMO_CREDENTIALS.map((account) => (
                        <li key={account.email}>
                          {account.email} / {account.password}
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default WelcomePage;
