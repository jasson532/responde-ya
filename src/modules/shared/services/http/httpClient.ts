import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import appConfig from 'modules/shared/services/config/appConfig';
import logger from 'modules/shared/services/logger/logger';
import { AppError } from 'modules/shared/types/api.types';
import { ERROR_CODES, ERROR_MESSAGES } from 'modules/shared/constants/errorMessages';
import { AUTH_TOKEN_STORAGE_KEY } from 'modules/shared/constants/storageKeys';

/** Traduce cualquier AxiosError a un AppError estable para la UI. */
const normalizeError = (error: AxiosError): AppError => {
  if (!error.response) {
    return new AppError({
      status: 0,
      code: ERROR_CODES.NETWORK,
      message: ERROR_MESSAGES.NETWORK,
      details: error.message,
    });
  }

  const { status, data } = error.response;
  const messageByStatus: Record<number, string> = {
    400: ERROR_MESSAGES.VALIDATION,
    401: ERROR_MESSAGES.UNAUTHORIZED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
  };

  const codeByStatus: Record<number, string> = {
    400: ERROR_CODES.VALIDATION,
    401: ERROR_CODES.UNAUTHORIZED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
  };

  return new AppError({
    status,
    code: codeByStatus[status] ?? ERROR_CODES.GENERIC,
    message: messageByStatus[status] ?? ERROR_MESSAGES.GENERIC,
    details: data,
  });
};

const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: appConfig.apiBaseUrl,
    timeout: appConfig.requestTimeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(normalizeError(error)),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const normalized = normalizeError(error);
      logger.error('HTTP request failed', {
        url: error.config?.url,
        status: normalized.status,
        code: normalized.code,
      });

      if (normalized.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }

      return Promise.reject(normalized);
    },
  );

  return client;
};

/** Module-level singleton: una sola instancia con interceptors compartidos. */
const httpClient = createHttpClient();

export default httpClient;
