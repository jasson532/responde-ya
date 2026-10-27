import { AppError } from 'modules/shared/types/api.types';
import { ERROR_CODES, ERROR_MESSAGES } from 'modules/shared/constants/errorMessages';

/** Convierte cualquier `unknown` capturado en un mensaje presentable. */
export const toErrorMessage = (error: unknown, fallback: string = ERROR_MESSAGES.GENERIC): string => {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return fallback;
};

export const notFound = (message: string = ERROR_MESSAGES.NOT_FOUND): AppError =>
  new AppError({ status: 404, code: ERROR_CODES.NOT_FOUND, message });

export const forbidden = (message: string = ERROR_MESSAGES.FORBIDDEN): AppError =>
  new AppError({ status: 403, code: ERROR_CODES.FORBIDDEN, message });

export const validationError = (
  message: string = ERROR_MESSAGES.VALIDATION,
  details?: unknown,
): AppError => new AppError({ status: 400, code: ERROR_CODES.VALIDATION, message, details });
