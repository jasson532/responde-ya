export const ERROR_MESSAGES = {
  NETWORK: 'No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.',
  UNAUTHORIZED: 'Tu sesión expiró. Inicia sesión otra vez.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'No encontramos lo que buscabas.',
  VALIDATION: 'Revisa los datos ingresados.',
  GENERIC: 'Ocurrió un error inesperado. Intenta de nuevo.',
} as const;

export const ERROR_CODES = {
  NETWORK: 'ERR_NETWORK',
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  NOT_FOUND: 'ERR_NOT_FOUND',
  VALIDATION: 'ERR_VALIDATION',
  GENERIC: 'ERR_GENERIC',
} as const;
