import { Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'modules/shared/store';
import { useAppDispatch } from 'modules/shared/store/hooks';
import { UserRole } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import ErrorBoundary from 'modules/shared/components/organisms/ErrorBoundary/ErrorBoundary';
import ProtectedRoute from 'modules/shared/components/organisms/ProtectedRoute/ProtectedRoute';
import AuthLayout from 'modules/shared/components/templates/AuthLayout/AuthLayout';
import MainLayout from 'modules/shared/components/templates/MainLayout/MainLayout';
import ForbiddenPage from 'modules/shared/components/pages/ForbiddenPage/ForbiddenPage';
import NotFoundPage from 'modules/shared/components/pages/NotFoundPage/NotFoundPage';
import { bootstrapSession } from 'modules/auth';
import { authRoutes } from 'modules/auth/routes';
import { contentAdminRoutes, contentRoutes } from 'modules/content/routes';

const ADMIN_ONLY = [UserRole.Admin] as const;

/** Rehidrata la sesion guardada antes de que los guards decidan. */
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
        {/* Publicas */}
        <Route element={<AuthLayout />}>{authRoutes}</Route>

        {/* Autenticadas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {contentRoutes}
            <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
          </Route>
        </Route>

        {/* Solo admin: mismo layout, guard adicional por rol */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
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
