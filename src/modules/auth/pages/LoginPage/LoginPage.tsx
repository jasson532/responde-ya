import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearAuthError,
  loginUser,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
} from 'modules/auth/store/authSlice';
import LoginForm from 'modules/auth/components/molecules/LoginForm/LoginForm';
import { DEMO_CREDENTIALS } from 'modules/auth/services/auth.local.repository';
import appConfig from 'modules/shared/services/config/appConfig';
import type { LoginCredentials } from 'modules/auth/types/auth.types';
import './LoginPage.scss';

interface LocationState {
  from?: { pathname: string };
}

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? ROUTES.MODULES;

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const handleSubmit = (credentials: LoginCredentials) => {
    void dispatch(loginUser(credentials));
  };

  return (
    <section className="login-page" data-testid="LoginPage">
      <header className="login-page__header">
        <h2 className="login-page__title">Inicia sesion</h2>
        <p className="login-page__subtitle">
          Entra para consultar los modulos de primeros auxilios.
        </p>
      </header>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <LoginForm onSubmit={handleSubmit} isSubmitting={status === LoadingStatus.Pending} />

      {appConfig.persistenceDriver === 'local' && (
        <aside className="login-page__demo">
          <p className="login-page__demo-title">Cuentas de demostracion</p>
          <ul className="login-page__demo-list">
            {DEMO_CREDENTIALS.map((account) => (
              <li key={account.email}>
                <strong>{account.role}</strong> · {account.email} / {account.password}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </section>
  );
};

export default LoginPage;
