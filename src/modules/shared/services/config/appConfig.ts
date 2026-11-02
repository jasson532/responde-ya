type Environment = 'development' | 'staging' | 'production';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Backend de persistencia activo.
 * - `local`:    IndexedDB/localStorage. Funciona sin servidor (modo demo/offline).
 * - `http`:     API REST via httpClient (Axios).
 * - `supabase`: Postgres + Storage en Supabase.
 * El resto de la app no sabe cual esta activo: hablan contra el repositorio.
 */
export type PersistenceDriver = 'local' | 'http' | 'supabase';

export interface AppConfig {
  appName: string;
  environment: Environment;
  apiBaseUrl: string;
  persistenceDriver: PersistenceDriver;
  /** URL del proyecto Supabase. Vacia cuando el driver no es `supabase`. */
  supabaseUrl: string;
  /**
   * Clave publica de Supabase (`sb_publishable_...` o la `anon` clasica).
   *
   * Viaja dentro del bundle, asi que es publica de facto: lo que protege la
   * escritura son las politicas RLS de la base, no el secreto de esta cadena.
   */
  supabaseAnonKey: string;
  logLevel: LogLevel;
  requestTimeoutMs: number;
  storagePrefix: string;
  featureFlags: Readonly<Record<string, boolean>>;
}

const env = import.meta.env;

const createAppConfig = (): AppConfig => ({
  appName: 'RespondeYa',
  environment: (env.VITE_ENV as Environment) ?? 'development',
  apiBaseUrl: env.VITE_API_BASE_URL ?? '',
  persistenceDriver: (env.VITE_PERSISTENCE_DRIVER as PersistenceDriver) ?? 'local',
  supabaseUrl: env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
  logLevel: (env.VITE_LOG_LEVEL as LogLevel) ?? (env.DEV ? 'debug' : 'warn'),
  requestTimeoutMs: Number(env.VITE_REQUEST_TIMEOUT_MS) || 30000,
  storagePrefix: 'responde-ya',
  featureFlags: Object.freeze({
    offlineMode: true,
  }),
});

/** Module-level singleton: las variables de entorno se leen una sola vez. */
const appConfig = createAppConfig();

export default appConfig;
