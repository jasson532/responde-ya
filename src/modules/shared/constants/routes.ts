export const ROUTES = {
  /** Pantalla de entrada: acceso directo al contenido o identificacion como admin. */
  WELCOME: '/',

  // --- Contenido: PUBLICO, sin autenticacion ---
  MODULES: '/modulos',
  MODULE_DETAIL: '/modulos/:moduleId',
  SEARCH: '/buscar',

  // --- Administracion: requiere rol admin ---
  ADMIN: '/admin',
  ADMIN_MODULES: '/admin/modulos',
  ADMIN_MODULE_NEW: '/admin/modulos/nuevo',
  ADMIN_MODULE_EDIT: '/admin/modulos/:moduleId',

  NOT_FOUND: '*',
} as const;

/** Helpers tipados para rutas con parametros. Nunca concatenar strings a mano. */
export const buildRoute = {
  moduleDetail: (moduleId: string) => `/modulos/${moduleId}`,
  adminModuleEdit: (moduleId: string) => `/admin/modulos/${moduleId}`,
} as const;
