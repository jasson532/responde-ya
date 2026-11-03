import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'modules/shared/store';
import { useAppDispatch } from 'modules/shared/store/hooks';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import ErrorBoundary from 'modules/shared/components/organisms/ErrorBoundary/ErrorBoundary';
import AdminRoute from 'modules/shared/components/organisms/AdminRoute/AdminRoute';
import ScrollToTop from 'modules/shared/components/organisms/ScrollToTop/ScrollToTop';
import AuthLayout from 'modules/shared/components/templates/AuthLayout/AuthLayout';
import AppShell from 'modules/shared/components/templates/AppShell/AppShell';
import NotFoundPage from 'modules/shared/components/pages/NotFoundPage/NotFoundPage';
import AboutPage from 'modules/shared/components/pages/AboutPage/AboutPage';
import { bootstrapSession } from 'modules/auth';
import { authRoutes } from 'modules/auth/routes';
import { contentAdminRoutes, contentRoutes } from 'modules/content/routes';
import {
  dynamicContentAdminRoutes,
  dynamicContentRoutes,
} from 'modules/dynamic-content/routes';

/**
 * Rehidrata una eventual sesión de admin. No bloquea nada: el contenido es
 * público y se renderiza sin esperar este resultado. Solo `AdminRoute` espera.
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
    <ScrollToTop />

    <Suspense fallback={<Spinner size="lg" label="Cargando" />}>
      <Routes>
        {/* Bienvenida y presentación. Comparten el lienzo de marca y NO llevan
            la barra inferior: ambas traen sus propios botones de navegación. */}
        <Route element={<AuthLayout />}>
          {authRoutes}
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
        </Route>

        {/* Contenido: público, sin autenticacion */}
        <Route element={<AppShell />}>
          {contentRoutes}
          {dynamicContentRoutes}
        </Route>

        {/* Administración: requiere rol admin */}
        <Route element={<AdminRoute />}>
          <Route element={<AppShell />}>
            {contentAdminRoutes}
            {dynamicContentAdminRoutes}
          </Route>
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
