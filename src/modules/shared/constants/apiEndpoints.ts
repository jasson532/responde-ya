/**
 * Endpoints del backend. Se usan solo cuando el adaptador de persistencia
 * activo es el HTTP (ver modules/shared/services/persistence).
 */
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_SESSION: '/auth/session',
  MODULES: '/modules',
  MODULE_BY_ID: (id: string) => `/modules/${id}`,
  LESSONS: (moduleId: string) => `/modules/${moduleId}/lessons`,
  LESSON_BY_ID: (moduleId: string, lessonId: string) =>
    `/modules/${moduleId}/lessons/${lessonId}`,
} as const;
