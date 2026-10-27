import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ROUTES } from 'modules/shared/constants/routes';

const ModulesCatalogPage = lazy(
  () => import('./pages/ModulesCatalogPage/ModulesCatalogPage'),
);
const ModuleDetailPage = lazy(() => import('./pages/ModuleDetailPage/ModuleDetailPage'));
const AdminModulesPage = lazy(() => import('./pages/AdminModulesPage/AdminModulesPage'));
const AdminModuleFormPage = lazy(
  () => import('./pages/AdminModuleFormPage/AdminModuleFormPage'),
);

/** Rutas de consumo: cualquier usuario autenticado. */
export const contentRoutes = (
  <>
    <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.MODULES} replace />} />
    <Route path={ROUTES.MODULES} element={<ModulesCatalogPage />} />
    <Route path={ROUTES.SEARCH} element={<ModulesCatalogPage />} />
    <Route path={ROUTES.MODULE_DETAIL} element={<ModuleDetailPage />} />
  </>
);

/** Rutas de administracion: se montan tras un guard de rol admin. */
export const contentAdminRoutes = (
  <>
    <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_MODULES} replace />} />
    <Route path={ROUTES.ADMIN_MODULES} element={<AdminModulesPage />} />
    <Route path={ROUTES.ADMIN_MODULE_NEW} element={<AdminModuleFormPage />} />
    <Route path={ROUTES.ADMIN_MODULE_EDIT} element={<AdminModuleFormPage />} />
  </>
);
