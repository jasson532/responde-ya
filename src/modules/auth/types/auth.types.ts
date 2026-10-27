import { UserRole, type AuditedEntity } from 'modules/shared/types/common.types';

/**
 * Usuario autenticado, que en esta app es siempre un administrador: el rol
 * `user` no se autentica. NUNCA contiene credenciales.
 */
export interface AuthUser extends AuditedEntity {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Sesion de administrador. Los visitantes anonimos no tienen sesion. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** Epoch ms de expiracion. */
  expiresAt: number;
}

/**
 * Contrato de autenticacion de administradores. La UI depende de esta interfaz,
 * no de la implementacion. Cambiar de demo local a un IdP real = nuevo adaptador.
 */
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
}
