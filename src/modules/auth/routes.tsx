import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from 'modules/shared/constants/routes';

const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));

export const authRoutes = <Route path={ROUTES.LOGIN} element={<LoginPage />} />;
