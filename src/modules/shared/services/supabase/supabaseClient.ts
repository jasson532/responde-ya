import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import appConfig from 'modules/shared/services/config/appConfig';

/**
 * Cliente de Supabase, creado la primera vez que alguien lo pide.
 *
 * PEREZOSO A PROPÓSITO. Los demás proyectos del workspace crean el cliente al
 * importar el módulo y lanzan si faltan las variables de entorno. Aquí eso
 * tumbaría la aplicación entera incluso con `VITE_PERSISTENCE_DRIVER=local`,
 * que es el modo que permite trabajar sin red y sin credenciales.
 *
 * Así, quien no use el driver `supabase` nunca toca esta función y la app
 * arranca sin un `.env` configurado.
 */
let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean =>
  appConfig.supabaseUrl.length > 0 && appConfig.supabaseAnonKey.length > 0;

export const getSupabaseClient = (): SupabaseClient => {
  if (client !== null) return client;

  if (!isSupabaseConfigured()) {
    throw new Error(
      'Faltan las variables de Supabase. Copia .env.example a .env y rellena ' +
        'VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, o deja ' +
        'VITE_PERSISTENCE_DRIVER=local para trabajar sin backend.',
    );
  }

  client = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    auth: {
      /**
       * La sesión se guarda y se renueva sola: el administrador no debería
       * tener que volver a identificarse cada vez que recarga el editor.
       */
      persistSession: true,
      autoRefreshToken: true,
      // El contenido no llega por enlaces de correo con el token en el hash,
      // así que no hace falta que el cliente lo busque en cada carga.
      detectSessionInUrl: false,
    },
  });

  return client;
};
