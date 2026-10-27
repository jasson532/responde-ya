import appConfig from 'modules/shared/services/config/appConfig';
import type {
  AuthRepository,
  AuthSession,
  LoginCredentials,
} from 'modules/auth/types/auth.types';
import { authHttpRepository } from './auth.http.repository';
import { authLocalRepository } from './auth.local.repository';

/**
 * Selector de adaptador (Strategy). El resto de la app llama a este servicio
 * y nunca sabe si detras hay localStorage o un API.
 */
const repository: AuthRepository =
  appConfig.persistenceDriver === 'http' ? authHttpRepository : authLocalRepository;

export const login = (credentials: LoginCredentials): Promise<AuthSession> =>
  repository.login(credentials);

export const logout = (): Promise<void> => repository.logout();

export const restoreSession = (): Promise<AuthSession | null> => repository.restoreSession();
