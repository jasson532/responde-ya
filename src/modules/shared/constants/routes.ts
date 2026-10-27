export const ROUTES = {
  // Auth (publicas)
  LOGIN: '/login',

  // Consumo de contenido (usuario autenticado)
  HOME: '/',
  MODULES: '/modulos',
  MODULE_DETAIL: '/modulos/:moduleId',
  LESSON_DETAIL: '/modulos/:moduleId/paso/:lessonId',
  SEARCH: '/buscar',

  // Administracion (solo rol admin)
  ADMIN: '/admin',
  ADMIN_MODULES: '/admin/modulos',
  ADMIN_MODULE_NEW: '/admin/modulos/nuevo',
  ADMIN_MODULE_EDIT: '/admin/modulos/:moduleId',
  ADMIN_LESSON_EDIT: '/admin/modulos/:moduleId/paso/:lessonId',

  // Errores
  FORBIDDEN: '/sin-permisos',
  NOT_FOUND: '*',
} as const;

/** Helpers tipados para rutas con parametros. Nunca concatenar strings a mano. */
export const buildRoute = {
  moduleDetail: (moduleId: string) => `/modulos/${moduleId}`,
  lessonDetail: (moduleId: string, lessonId: string) =>
    `/modulos/${moduleId}/paso/${lessonId}`,
  adminModuleEdit: (moduleId: string) => `/admin/modulos/${moduleId}`,
  adminLessonEdit: (moduleId: string, lessonId: string) =>
    `/admin/modulos/${moduleId}/paso/${lessonId}`,
} as const;
