/**
 * Rutas de la aplicación.
 *
 * Los PATHS van sin tildes y en ASCII a propósito. Una URL con acentos se
 * percent-encodea al compartirla (`/m%C3%B3dulos`), queda ilegible en un
 * mensaje y es una fuente de errores de codificación. Los textos de interfaz
 * sí llevan tilde; las URL no.
 */
export const ROUTES = {
  /** Pantalla de entrada: acceso directo al contenido o identificación como admin. */
  WELCOME: '/',

  // --- Contenido: PÚBLICO, sin autenticación ---
  MODULES: '/modulos',
  MODULE_DETAIL: '/modulos/:moduleId',
  SEARCH: '/buscar',

  // --- Administración: requiere rol admin ---
  ADMIN: '/admin',
  ADMIN_MODULES: '/admin/modulos',
  ADMIN_MODULE_NEW: '/admin/modulos/nuevo',
  ADMIN_MODULE_EDIT: '/admin/modulos/:moduleId',

  NOT_FOUND: '*',
} as const;

/** Helpers tipados para rutas con parámetros. Nunca concatenar strings a mano. */
export const buildRoute = {
  moduleDetail: (moduleId: string) => `/modulos/${moduleId}`,
  adminModuleEdit: (moduleId: string) => `/admin/modulos/${moduleId}`,
} as const;
