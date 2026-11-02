import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ROUTES } from 'modules/shared/constants/routes';

const ModuleDetailPage = lazy(() => import('./pages/ModuleDetailPage/ModuleDetailPage'));
const LessonPage = lazy(() => import('./pages/LessonPage/LessonPage'));

const AdminModulesPage = lazy(() => import('./pages/AdminModulesPage/AdminModulesPage'));
const AdminModuleFormPage = lazy(
  () => import('./pages/AdminModuleFormPage/AdminModuleFormPage'),
);

/**
 * Rutas de lectura del contenido ANTIGUO, el que vive en `localStorage`.
 *
 * El catálogo (`/modulos`) y el buscador (`/buscar`) ya NO están aquí: los
 * sirve `dynamic-content` leyendo de Postgres. Lo que queda solo mantiene
 * alcanzable por enlace directo lo que alguien tenga guardado en su navegador,
 * hasta que este módulo se jubile.
 */
export const contentRoutes = (
  <>
    <Route path={ROUTES.MODULE_DETAIL} element={<ModuleDetailPage />} />
    <Route path={ROUTES.LESSON_DETAIL} element={<LessonPage />} />
  </>
);

/** Rutas de administración del contenido ANTIGUO: detras de `AdminRoute`. */
export const contentAdminRoutes = (
  <>
    {/* `/admin` lleva al editor NUEVO. El contenido antiguo queda accesible
        en `/admin/modulos` hasta que se migre y se jubile. */}
    <Route path={ROUTES.ADMIN} element={<Navigate to={ROUTES.ADMIN_DYN} replace />} />
    <Route path={ROUTES.ADMIN_MODULES} element={<AdminModulesPage />} />
    <Route path={ROUTES.ADMIN_MODULE_NEW} element={<AdminModuleFormPage />} />
    <Route path={ROUTES.ADMIN_MODULE_EDIT} element={<AdminModuleFormPage />} />
  </>
);
