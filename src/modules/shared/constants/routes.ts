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

  /**
   * Qué es la aplicación y para quién. Se llama `/about` y no `/acerca-de`
   * porque así lo pidió el usuario; es la única ruta en inglés del mapa.
   */
  ABOUT: '/about',

  // --- Contenido dinámico: PÚBLICO ---
  /**
   * Prefijo propio mientras conviven los dos sistemas de contenido.
   *
   * No puede ser `/modulos`, que ya resuelve contra el módulo antiguo por id.
   * Cuando el contenido de RCP se migre y `content` se jubile, estas rutas
   * pasan a `/modulos` y este prefijo desaparece.
   */
  DYN_MODULE: '/c/:moduleSlug',
  DYN_PAGE: '/c/:moduleSlug/:pageSlug',

  // --- Contenido: PÚBLICO, sin autenticación ---
  MODULES: '/modulos',
  /** Índice del módulo: la lista de pasos. */
  MODULE_DETAIL: '/modulos/:moduleId',
  /**
   * Un paso concreto. Es una ruta propia y no estado interno del índice para
   * que el enlace se pueda compartir y el botón «atrás» del navegador vuelva
   * al índice en vez de salir del módulo.
   */
  LESSON_DETAIL: '/modulos/:moduleId/:lessonId',
  SEARCH: '/buscar',

  // --- Administración: requiere rol admin ---
  ADMIN: '/admin',
  ADMIN_MODULES: '/admin/modulos',
  ADMIN_MODULE_NEW: '/admin/modulos/nuevo',
  ADMIN_MODULE_EDIT: '/admin/modulos/:moduleId',

  // --- Administración del contenido dinámico ---
  // Usan el ID y no el slug, al contrario que las rutas públicas: un slug
  // cambia cuando el administrador renombra algo, y el editor no debería
  // quedarse con la URL rota justo después de guardar.
  ADMIN_DYN: '/admin/c',
  ADMIN_DYN_MODULE: '/admin/c/:moduleId',
  ADMIN_DYN_PAGE: '/admin/c/:moduleId/p/:pageId',

  NOT_FOUND: '*',
} as const;

/** Helpers tipados para rutas con parámetros. Nunca concatenar strings a mano. */
export const buildRoute = {
  moduleDetail: (moduleId: string) => `/modulos/${moduleId}`,
  lessonDetail: (moduleId: string, lessonId: string) => `/modulos/${moduleId}/${lessonId}`,
  adminModuleEdit: (moduleId: string) => `/admin/modulos/${moduleId}`,

  // --- Contenido dinámico ---
  // Se construyen con SLUGS, no con ids: la URL la va a ver y compartir gente.
  dynModule: (moduleSlug: string) => `/c/${moduleSlug}`,
  dynPage: (moduleSlug: string, pageSlug: string) => `/c/${moduleSlug}/${pageSlug}`,

  // --- Administración del contenido dinámico: por ID ---
  adminDynModule: (moduleId: string) => `/admin/c/${moduleId}`,
  adminDynPage: (moduleId: string, pageId: string) => `/admin/c/${moduleId}/p/${pageId}`,
} as const;
