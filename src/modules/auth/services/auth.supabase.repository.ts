import { getSupabaseClient } from 'modules/shared/services/supabase/supabaseClient';
import { UserRole } from 'modules/shared/types/common.types';
import { AppError } from 'modules/shared/types/api.types';
import { ERROR_CODES } from 'modules/shared/constants/errorMessages';
import logger from 'modules/shared/services/logger/logger';
import type {
  AuthRepository,
  AuthSession,
  AuthUser,
  LoginCredentials,
} from 'modules/auth/types/auth.types';
import type { Session, User } from '@supabase/supabase-js';

/**
 * ===========================================================================
 * AUTENTICACIÓN REAL CONTRA SUPABASE AUTH
 * ===========================================================================
 * Sustituye al adaptador de demostración, que validaba una lista fija de
 * credenciales en el propio navegador.
 *
 * La diferencia importante no es dónde se comprueba la contraseña: es que
 * ahora la sesión produce un JWT que Postgres lee en cada consulta. Las
 * políticas RLS dependen de `auth.uid()`, así que sin este adaptador el editor
 * no puede escribir nada aunque la interfaz deje pulsar los botones.
 * ===========================================================================
 */

const invalidCredentials = () =>
  new AppError({
    status: 401,
    code: ERROR_CODES.UNAUTHORIZED,
    message: 'Correo o contraseña incorrectos.',
  });

const notAnAdmin = () =>
  new AppError({
    status: 403,
    code: ERROR_CODES.FORBIDDEN,
    message: 'Esa cuenta no tiene permisos de administración.',
  });

/**
 * Comprueba en la base de datos si el usuario autenticado es administrador.
 *
 * Llama a `is_admin()`, que lee la tabla `admins`. No se confía en nada que
 * venga del cliente: estar autenticado y ser administrador son dos cosas
 * distintas, y es la segunda la que abre la escritura.
 */
const checkIsAdmin = async (): Promise<boolean> => {
  const { data, error } = await getSupabaseClient().rpc('is_admin');

  if (error) {
    logger.error('No se pudo verificar el rol de administrador', {
      message: error.message,
    });
    return false;
  }

  return data === true;
};

const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email ?? '',
  /**
   * El nombre sale de los metadatos si están puestos; si no, de la parte local
   * del correo. Mostrar el correo completo en «Ya tienes sesión como…» lo
   * deja a la vista de cualquiera que pase por detrás de la pantalla.
   */
  displayName:
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Administrador',
  // El rol no viene de Supabase: lo determina la tabla `admins`, y este
  // adaptador solo devuelve sesión cuando esa comprobación ha pasado.
  role: UserRole.Admin,
  createdAt: user.created_at,
  updatedAt: user.updated_at ?? user.created_at,
});

const toAuthSession = (session: Session): AuthSession => ({
  user: toAuthUser(session.user),
  accessToken: session.access_token,
  // Supabase da `expires_at` en segundos; el resto de la aplicación trabaja en
  // milisegundos. Sin esta multiplicación, toda sesión parecería caducada.
  expiresAt: (session.expires_at ?? 0) * 1000,
});

export const authSupabaseRepository: AuthRepository = {
  async login({ email, password }: LoginCredentials): Promise<AuthSession> {
    const client = getSupabaseClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    /**
     * El error de Supabase no se reenvía tal cual. Distingue entre «el correo
     * no existe» y «la contraseña es incorrecta», y eso permite a un atacante
     * averiguar qué cuentas hay registradas. El mensaje es el mismo en los dos
     * casos.
     */
    if (error || !data.session) {
      logger.warn('Intento de acceso fallido', { message: error?.message });
      throw invalidCredentials();
    }

    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      /**
       * Cerrar la sesión de Supabase es imprescindible.
       *
       * Sin esto, quien tenga una cuenta válida pero no esté en `admins`
       * quedaría autenticado contra la base de datos mientras la aplicación lo
       * trata como anónimo. Ese estado mixto es confuso y deja un token activo
       * que nadie va a cerrar.
       */
      await client.auth.signOut();
      throw notAnAdmin();
    }

    return toAuthSession(data.session);
  },

  async logout(): Promise<void> {
    await getSupabaseClient().auth.signOut();
  },

  async restoreSession(): Promise<AuthSession | null> {
    const client = getSupabaseClient();

    // El cliente renueva el token por su cuenta; `getSession` devuelve el
    // vigente o `null` si caducó y no se pudo refrescar.
    const { data, error } = await client.auth.getSession();

    if (error || !data.session) return null;

    /**
     * Se vuelve a comprobar el rol en cada restauración, no solo al entrar.
     * Un administrador al que se le retira el acceso en la tabla `admins`
     * seguiría teniendo su JWT guardado y válido durante horas.
     */
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      await client.auth.signOut();
      return null;
    }

    return toAuthSession(data.session);
  },
};
