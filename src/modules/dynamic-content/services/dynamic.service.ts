import appConfig from 'modules/shared/services/config/appConfig';
import type { DynamicContentRepository } from 'modules/dynamic-content/types/dynamic.types';

/**
 * ===========================================================================
 * ACCESO AL CONTENIDO DINÁMICO
 * ===========================================================================
 * SOLO HAY DRIVER DE SUPABASE. Replicar aquí el CRUD completo sobre
 * localStorage serían unas cuatrocientas líneas duplicando reglas —posiciones,
 * unicidad de slug, cascadas de borrado— para un modo que nadie necesita ahora
 * que Postgres está en marcha. Dos implementaciones de las mismas reglas acaban
 * desincronizándose. El contrato sigue listo si algún día hace falta.
 * ===========================================================================
 */

/**
 * El repositorio se carga BAJO DEMANDA, no al importar este módulo.
 *
 * Importarlo de forma normal metía `@supabase/supabase-js` en el bundle
 * principal: el store conoce el slice, el slice conocía el repositorio y el
 * repositorio el cliente. Medido, eso añadía unos 62 kB comprimidos a la carga
 * inicial, que pagaba también quien solo abre la aplicación para leer un
 * protocolo y nunca toca el contenido dinámico.
 *
 * Con `import()` dinámico, el cliente de base de datos viaja en su propio
 * fragmento y se descarga la primera vez que alguien pide contenido.
 */
let cached: DynamicContentRepository | null = null;

export const getRepository = async (): Promise<DynamicContentRepository> => {
  if (cached !== null) return cached;

  const { dynamicSupabaseRepository } = await import('./dynamic.supabase.repository');
  cached = dynamicSupabaseRepository;
  return cached;
};

/**
 * Si el contenido dinámico está disponible.
 *
 * La interfaz lo consulta para no ofrecer el editor cuando faltan las
 * credenciales: mejor no mostrar el botón que mostrarlo y fallar al pulsarlo.
 *
 * Es sincrónico a propósito —solo lee configuración— para poder usarse al
 * decidir qué pintar, sin esperar a nada.
 *
 * Comprueba las credenciales leyendo `appConfig` en lugar de preguntarle a
 * `supabaseClient`. Parece un detalle, pero importar cualquier cosa de ese
 * archivo arrastra `@supabase/supabase-js` al bundle principal: una sola línea
 * de import deshacía la carga diferida de abajo.
 */
export const isDynamicContentAvailable = (): boolean =>
  appConfig.persistenceDriver === 'supabase' &&
  appConfig.supabaseUrl.length > 0 &&
  appConfig.supabaseAnonKey.length > 0;
