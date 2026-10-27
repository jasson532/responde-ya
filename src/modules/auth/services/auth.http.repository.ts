import httpClient from 'modules/shared/services/http/httpClient';
import localStore from 'modules/shared/services/storage/localStore';
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from 'modules/shared/constants/storageKeys';
import { API_ENDPOINTS } from 'modules/shared/constants/apiEndpoints';
import type {
  AuthRepository,
  AuthSession,
  LoginCredentials,
} from 'modules/auth/types/auth.types';

/**
 * Adaptador HTTP. Se activa con VITE_PERSISTENCE_DRIVER=http.
 * Espera que el backend devuelva el shape `AuthSession`.
 */
export const authHttpRepository: AuthRepository = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { data } = await httpClient.post<AuthSession>(API_ENDPOINTS.AUTH_LOGIN, credentials);
    localStore.write(AUTH_TOKEN_STORAGE_KEY, data.accessToken);
    localStore.write(AUTH_SESSION_STORAGE_KEY, data);
    return data;
  },

  async logout(): Promise<void> {
    localStore.remove(AUTH_TOKEN_STORAGE_KEY);
    localStore.remove(AUTH_SESSION_STORAGE_KEY);
  },

  async restoreSession(): Promise<AuthSession | null> {
    const token = localStore.read<string | null>(AUTH_TOKEN_STORAGE_KEY, null);
    if (!token) return null;

    const { data } = await httpClient.get<AuthSession>(API_ENDPOINTS.AUTH_SESSION);
    localStore.write(AUTH_SESSION_STORAGE_KEY, data);
    return data;
  },
};
