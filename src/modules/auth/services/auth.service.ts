import appConfig from 'modules/shared/services/config/appConfig';
import type {
  AuthRepository,
  AuthSession,
  LoginCredentials,
} from 'modules/auth/types/auth.types';

/**
 * ===========================================================================
 * SELECTOR DE ADAPTADOR DE AUTENTICACIÓN
 * ===========================================================================
 * Usa Supabase Auth en cuanto hay credenciales configuradas, y cae en el
 * adaptador de demostración si no las hay.
 *
 * La condición NO es el `persistenceDriver`: la autenticación es lo que hace
 * funcionar las políticas RLS del contenido dinámico, y ese contenido siempre
 * habla con Postgres. Atarla al driver dejaría el editor sin poder escribir
 * con el driver en `local`, que es el estado normal mientras convive el
 * contenido antiguo.
 * ===========================================================================
 */
const useSupabase = (): boolean =>
  appConfig.supabaseUrl.length > 0 && appConfig.supabaseAnonKey.length > 0;

/**
 * Los adaptadores se cargan BAJO DEMANDA.
 *
 * El de Supabase importa `@supabase/supabase-js`, y este servicio lo conoce el
 * slice de autenticación, que está en el store. Con un import normal, la
 * librería entera acabaría en el bundle principal y la pagaría también quien
 * solo abre la aplicación a leer un protocolo.
 */
let cached: AuthRepository | null = null;

const getRepository = async (): Promise<AuthRepository> => {
  if (cached !== null) return cached;

  if (useSupabase()) {
    const { authSupabaseRepository } = await import('./auth.supabase.repository');
    cached = authSupabaseRepository;
  } else {
    const { authLocalRepository } = await import('./auth.local.repository');
    cached = authLocalRepository;
  }

  return cached;
};

/**
 * Si hay indicios de una sesión guardada, SIN cargar el cliente de Supabase.
 *
 * `restoreSession` se llama al arrancar la aplicación. Si eso descargara el
 * adaptador siempre, la carga diferida no serviría de nada: el 99% de las
 * visitas son anónimas y no tienen sesión que restaurar.
 *
 * Supabase guarda su sesión en `localStorage` bajo una clave `sb-<ref>-auth-token`.
 * Mirar si existe cuesta una lectura sincrónica y evita descargar 60 kB.
 */
const hasStoredSupabaseSession = (): boolean => {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
    return false;
  } catch {
    // Navegación privada con el almacenamiento bloqueado: sin sesión posible.
    return false;
  }
};

export const login = async (credentials: LoginCredentials): Promise<AuthSession> =>
  (await getRepository()).login(credentials);

export const logout = async (): Promise<void> => (await getRepository()).logout();

export const restoreSession = async (): Promise<AuthSession | null> => {
  // Con Supabase, solo se carga el adaptador si hay algo que restaurar.
  if (useSupabase() && !hasStoredSupabaseSession()) return null;

  return (await getRepository()).restoreSession();
};

/** Si la autenticación es real o de demostración. La interfaz lo usa para avisar. */
export const isRealAuth = (): boolean => useSupabase();
