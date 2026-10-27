import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'modules/shared/store';
import { useAppDispatch } from 'modules/shared/store/hooks';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import ErrorBoundary from 'modules/shared/components/organisms/ErrorBoundary/ErrorBoundary';
import AdminRoute from 'modules/shared/components/organisms/AdminRoute/AdminRoute';
import AuthLayout from 'modules/shared/components/templates/AuthLayout/AuthLayout';
import MainLayout from 'modules/shared/components/templates/MainLayout/MainLayout';
import NotFoundPage from 'modules/shared/components/pages/NotFoundPage/NotFoundPage';
import { bootstrapSession } from 'modules/auth';
import { authRoutes } from 'modules/auth/routes';
import { contentAdminRoutes, contentRoutes } from 'modules/content/routes';

/**
 * Rehidrata una eventual sesion de admin. No bloquea nada: el contenido es
 * publico y se renderiza sin esperar este resultado. Solo `AdminRoute` espera.
 */
const SessionBootstrapper = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapSession());
  }, [dispatch]);

  return null;
};

const AppRoutes = () => (
  <BrowserRouter>
    <SessionBootstrapper />

    <Suspense fallback={<Spinner size="lg" label="Cargando" />}>
      <Routes>
        {/* Bienvenida: acceso directo al contenido o identificacion como admin */}
        <Route element={<AuthLayout />}>{authRoutes}</Route>

        {/* Contenido: publico, sin autenticacion */}
        <Route element={<MainLayout />}>{contentRoutes}</Route>

        {/* Administracion: requiere rol admin */}
        <Route element={<AdminRoute />}>
          <Route element={<MainLayout />}>{contentAdminRoutes}</Route>
        </Route>

        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

const App = () => (
  <Provider store={store}>
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  </Provider>
);

export default App;
