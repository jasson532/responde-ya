import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from 'modules/shared/constants/routes';

const WelcomePage = lazy(() => import('./pages/WelcomePage/WelcomePage'));

export const authRoutes = <Route path={ROUTES.WELCOME} element={<WelcomePage />} />;
