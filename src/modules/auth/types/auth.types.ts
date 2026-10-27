import { UserRole, type AuditedEntity } from 'modules/shared/types/common.types';

/** Usuario autenticado. NUNCA contiene credenciales. */
export interface AuthUser extends AuditedEntity {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** Epoch ms de expiracion. */
  expiresAt: number;
}

/**
 * Contrato de autenticacion. La UI depende de esta interfaz, no de la
 * implementacion. Cambiar de demo local a un IdP real = nuevo adaptador.
 */
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
}
