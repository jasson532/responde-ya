import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from 'modules/shared/constants/routes';

const DynamicCatalogPage = lazy(
  () => import('./pages/DynamicCatalogPage/DynamicCatalogPage'),
);
const DynamicModulePage = lazy(
  () => import('./pages/DynamicModulePage/DynamicModulePage'),
);
const DynamicPage = lazy(() => import('./pages/DynamicPage/DynamicPage'));
const DynamicSearchPage = lazy(
  () => import('./pages/DynamicSearchPage/DynamicSearchPage'),
);

/**
 * Rutas de lectura del contenido dinámico. PÚBLICAS.
 *
 * Sin guard y sin esperar a que se rehidrate ninguna sesión: un enlace
 * compartido debe abrir el contenido al instante. La política RLS ya se encarga
 * de que los borradores no salgan de la base de datos.
 *
 * Perezosas: así el fragmento del cliente de Supabase solo se descarga cuando
 * alguien entra de verdad a una de estas pantallas.
 */
export const dynamicContentRoutes = (
  <>
    {/* El catálogo ocupa `/modulos`, la ruta que la gente ya conoce y que
        apunta la barra de navegación. Antes la servía el módulo `content`
        leyendo de localStorage. */}
    <Route path={ROUTES.MODULES} element={<DynamicCatalogPage />} />
    <Route path={ROUTES.SEARCH} element={<DynamicSearchPage />} />
    <Route path={ROUTES.DYN_MODULE} element={<DynamicModulePage />} />
    <Route path={ROUTES.DYN_PAGE} element={<DynamicPage />} />
  </>
);

const AdminDynamicModulesPage = lazy(
  () => import('./pages/AdminDynamicModulesPage/AdminDynamicModulesPage'),
);
const AdminModuleEditorPage = lazy(
  () => import('./pages/AdminModuleEditorPage/AdminModuleEditorPage'),
);
const AdminPageEditorPage = lazy(
  () => import('./pages/AdminPageEditorPage/AdminPageEditorPage'),
);

/**
 * Rutas del editor. Se montan detrás de `AdminRoute`.
 *
 * Ese guard solo impide llegar a la pantalla. Lo que impide escribir de verdad
 * son las políticas RLS: sin sesión de administrador, Postgres rechaza cada
 * operación aunque la interfaz deje pulsar los botones.
 */
export const dynamicContentAdminRoutes = (
  <>
    <Route path={ROUTES.ADMIN_DYN} element={<AdminDynamicModulesPage />} />
    <Route path={ROUTES.ADMIN_DYN_MODULE} element={<AdminModuleEditorPage />} />
    <Route path={ROUTES.ADMIN_DYN_PAGE} element={<AdminPageEditorPage />} />
  </>
);
