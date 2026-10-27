import localStore from 'modules/shared/services/storage/localStore';
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from 'modules/shared/constants/storageKeys';
import { UserRole } from 'modules/shared/types/common.types';
import { AppError } from 'modules/shared/types/api.types';
import { ERROR_CODES } from 'modules/shared/constants/errorMessages';
import { createId, nowIso } from 'modules/shared/utils/id';
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
  LoginCredentials,
} from 'modules/auth/types/auth.types';

/**
 * ============================================================================
 * ADAPTADOR DE DEMO - NO APTO PARA PRODUCCION
 * ============================================================================
 * Valida credenciales en el navegador contra una lista fija. No hay hashing,
 * no hay servidor, el "token" es opaco pero no firmado. Existe para que la app
 * sea demostrable sin backend. Sustituir por un adaptador contra el IdP real
 * (mismo contrato `AuthRepository`) antes de cualquier despliegue.
 * ============================================================================
 */

interface DemoAccount {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: 'admin@respondeya.app',
    password: 'admin123',
    displayName: 'Administrador de contenido',
    role: UserRole.Admin,
  },
  {
    email: 'usuario@respondeya.app',
    password: 'usuario123',
    displayName: 'Persona usuaria',
    role: UserRole.User,
  },
];

const SESSION_DURATION_MS = 1000 * 60 * 60 * 8; // 8 horas

const toAuthUser = (account: DemoAccount): AuthUser => ({
  id: `demo-${account.role}`,
  email: account.email,
  displayName: account.displayName,
  role: account.role,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const invalidCredentials = () =>
  new AppError({
    status: 401,
    code: ERROR_CODES.UNAUTHORIZED,
    message: 'Correo o contrasena incorrectos.',
  });

export const authLocalRepository: AuthRepository = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();

    const account = DEMO_ACCOUNTS.find(
      (candidate) => candidate.email === normalizedEmail && candidate.password === password,
    );

    if (!account) throw invalidCredentials();

    const session: AuthSession = {
      user: toAuthUser(account),
      accessToken: `demo.${createId()}`,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    localStore.write(AUTH_SESSION_STORAGE_KEY, session);
    localStore.write(AUTH_TOKEN_STORAGE_KEY, session.accessToken);

    return session;
  },

  async logout(): Promise<void> {
    localStore.remove(AUTH_SESSION_STORAGE_KEY);
    localStore.remove(AUTH_TOKEN_STORAGE_KEY);
  },

  async restoreSession(): Promise<AuthSession | null> {
    const session = localStore.read<AuthSession | null>(AUTH_SESSION_STORAGE_KEY, null);

    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
      localStore.remove(AUTH_SESSION_STORAGE_KEY);
      localStore.remove(AUTH_TOKEN_STORAGE_KEY);
      return null;
    }

    return session;
  },
};

/** Cuentas de demo expuestas para mostrarlas en la pantalla de login. */
export const DEMO_CREDENTIALS = DEMO_ACCOUNTS.map(({ email, password, role }) => ({
  email,
  password,
  role,
}));
