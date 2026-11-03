import type { PostgrestError } from '@supabase/supabase-js';
import { getSupabaseClient } from 'modules/shared/services/supabase/supabaseClient';
import { slugify } from 'modules/shared/utils/id';
import { forbidden, notFound, validationError } from 'modules/shared/utils/errors';
import logger from 'modules/shared/services/logger/logger';
import {
  SectionVariant,
  type BlockDraft,
  type Category,
  type ContentModule,
  type DynamicContentRepository,
  type MediaAsset,
  type ModuleDraft,
  type ModuleFilters,
  type ModuleSummary,
  type PageDraft,
  type ReorderItem,
  type SectionDraft,
  type SurveyGroup,
  type SurveyQuestionSummary,
  type SurveySubmission,
  type SurveySummary,
} from 'modules/dynamic-content/types/dynamic.types';
import { sanitizeBlockData } from './blocks.schema';
import {
  MODULE_SUMMARY_SELECT,
  MODULE_WITH_CONTENT_SELECT,
  mapCategory,
  mapMedia,
  mapModule,
  mapModuleSummary,
  statusToDb,
  type CategoryRow,
  type MediaRow,
  type ModuleRow,
} from './dynamic.mappers';
import {
  buildStoragePath,
  isVideoFile,
  prepareImage,
  prepareVideo,
} from './media.prepare';
import { collectMediaIds, removedMediaIds } from './media.refs';

const BUCKET = 'module-media';

/**
 * ===========================================================================
 * REPOSITORIO SOBRE POSTGRES
 * ===========================================================================
 * Implementa el contrato contra Supabase. Nadie fuera de este archivo debería
 * importar el cliente de Supabase: así cambiar de backend es cambiar de
 * adaptador, no reescribir la aplicación.
 * ===========================================================================
 */

/**
 * Traduce los errores de Postgres a los de la aplicación.
 *
 * El caso importante es el `42501`: RLS ha rechazado la operación. Sin esta
 * traducción, al administrador le aparecería «new row violates row-level
 * security policy» en pantalla, que no le dice qué hacer.
 */
const toAppError = (error: PostgrestError, context: string): Error => {
  logger.error(`Supabase: ${context}`, { code: error.code, message: error.message });

  switch (error.code) {
    case '42501':
      return forbidden(
        'No tienes permiso para esta operación. Identifícate como administrador.',
      );
    case '23505':
    case '23514':
      return validationError('Los datos no cumplen las reglas del contenido.');
    case '23503':
      return validationError('Falta un elemento relacionado o ya fue eliminado.');
    case 'PGRST116':
      return notFound('Ese contenido no existe o fue eliminado.');
    default:
      return new Error(error.message);
  }
};

/** Lee el módulo completo. Es lo que devuelven todas las mutaciones. */
const fetchModule = async (moduleId: string): Promise<ContentModule> => {
  const { data, error } = await getSupabaseClient()
    .from('modules')
    .select(MODULE_WITH_CONTENT_SELECT)
    .eq('id', moduleId)
    .single<ModuleRow>();

  if (error) throw toAppError(error, `leer el módulo ${moduleId}`);
  if (!data) throw notFound('Ese módulo no existe o fue eliminado.');

  return mapModule(data);
};

/**
 * Siguiente posición libre entre hermanos.
 *
 * Hay una condición de carrera teórica: dos administradores creando a la vez
 * obtendrían la misma posición. Con un único administrador no puede ocurrir, y
 * la consecuencia sería un empate de orden, no una pérdida de datos. Resolverlo
 * de verdad pediría un `insert ... select max()+1` en SQL.
 */
const nextPosition = async (
  table: 'modules' | 'pages' | 'sections' | 'blocks',
  column: string | null,
  parentId: string | null,
): Promise<number> => {
  let query = getSupabaseClient()
    .from(table)
    .select('position')
    .order('position', { ascending: false })
    .limit(1);

  if (column !== null && parentId !== null) query = query.eq(column, parentId);

  const { data, error } = await query;
  if (error) throw toAppError(error, `calcular la posición en ${table}`);

  const highest = data?.[0]?.position;
  return typeof highest === 'number' ? highest + 1 : 0;
};

/**
 * Deja el `slug` libre dentro de su ámbito.
 *
 * Postgres rechazaría el duplicado con un error que el administrador no sabe
 * interpretar. Añadir un sufijo es menos sorprendente que pedirle que cambie
 * el título porque ya existe «Señales de alarma» en otro sitio.
 */
const ensureUniqueSlug = async (
  table: 'modules' | 'pages',
  base: string,
  scope: { column: string; value: string } | null,
  excludeId: string | null,
): Promise<string> => {
  const root = slugify(base) || 'sin-titulo';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;

    let query = getSupabaseClient().from(table).select('id').eq('slug', candidate);
    if (scope !== null) query = query.eq(scope.column, scope.value);
    if (excludeId !== null) query = query.neq('id', excludeId);

    const { data, error } = await query.limit(1);
    if (error) throw toAppError(error, `comprobar el slug en ${table}`);
    if ((data?.length ?? 0) === 0) return candidate;
  }

  // Cincuenta títulos iguales en el mismo ámbito es un error de uso, no un
  // caso que haya que seguir resolviendo con sufijos.
  throw validationError('Hay demasiados elementos con ese nombre. Usa otro título.');
};

/** Aplica un reordenamiento. Sin transacción: ver la nota al final del archivo. */
const applyReorder = async (
  table: 'modules' | 'pages' | 'sections' | 'blocks',
  items: ReorderItem[],
): Promise<void> => {
  const client = getSupabaseClient();

  const results = await Promise.all(
    items.map((item) =>
      client.from(table).update({ position: item.position }).eq('id', item.id),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw toAppError(failed.error, `reordenar ${table}`);
};

// ===========================================================================
// LIMPIEZA DEL BUCKET
// ===========================================================================
// El almacenamiento es el recurso más escaso del proyecto, así que todo borrado
// de contenido arrastra sus archivos.
//
// Tiene que hacerse desde aquí, por la API de Storage. Un trigger en Postgres
// parecería más seguro —imposible olvidarse— pero borrar filas de
// `storage.objects` con SQL solo quita los metadatos: los bytes se quedan en el
// almacén, ya sin forma de listarlos ni de borrarlos, consumiendo cuota para
// siempre. Supabase lo documenta y lo desaconseja explícitamente.
// ===========================================================================

type Client = ReturnType<typeof getSupabaseClient>;

/**
 * Borra archivos del bucket y sus registros.
 *
 * No lanza NUNCA. Es una limpieza, no una operación que el administrador haya
 * pedido: si falla, el peor caso es un archivo de más ocupando sitio, y eso no
 * justifica abortar el borrado del contenido ni mostrar un error en pantalla.
 *
 * Cuando el borrado del bucket falla, la fila de `media` SE CONSERVA a
 * propósito. Su `path` es lo único que permite reintentarlo: sin ella el
 * archivo queda inalcanzable. Como la fila mantiene su `module_id`, el borrado
 * del módulo acabará recogiéndolo.
 */
const purgeMedia = async (client: Client, mediaIds: string[]): Promise<void> => {
  if (mediaIds.length === 0) return;

  const { data, error } = await client
    .from('media')
    .select('id, bucket, path')
    .in('id', mediaIds);

  if (error) {
    logger.warn('No pudimos localizar los archivos a borrar', {
      count: mediaIds.length,
    });
    return;
  }

  const rows = (data ?? []) as { id: string; bucket: string; path: string }[];
  if (rows.length === 0) return;

  /**
   * Se agrupa por bucket porque cada fila guarda el suyo. Hoy todas apuntan a
   * `module-media`, pero `remove` trabaja sobre un bucket concreto: dar por
   * supuesto cuál es convertiría el día que haya dos en un borrado silencioso
   * del archivo equivocado.
   */
  const byBucket = new Map<string, { ids: string[]; paths: string[] }>();

  rows.forEach((row) => {
    const group = byBucket.get(row.bucket) ?? { ids: [], paths: [] };
    group.ids.push(row.id);
    group.paths.push(row.path);
    byBucket.set(row.bucket, group);
  });

  await Promise.all(
    [...byBucket].map(async ([bucket, group]) => {
      // Una sola llamada por bucket: `remove` acepta una lista de rutas.
      const { error: storageError } = await client.storage.from(bucket).remove(group.paths);

      if (storageError) {
        logger.warn('Quedaron archivos sin borrar en el bucket', {
          bucket,
          count: group.paths.length,
          message: storageError.message,
        });
        return;
      }

      const { error: rowError } = await client.from('media').delete().in('id', group.ids);
      if (rowError) {
        logger.warn('Archivos borrados pero sus registros siguen en la tabla', {
          count: group.ids.length,
        });
      }
    }),
  );
};

/** Archivos referenciados por los bloques de una sección. */
const mediaOfSection = async (client: Client, sectionId: string): Promise<string[]> => {
  const { data, error } = await client.from('blocks').select('data').eq('section_id', sectionId);

  if (error) {
    logger.warn('No pudimos leer los bloques de la sección para limpiar', { sectionId });
    return [];
  }

  return collectMediaIds(data ?? []);
};

/** Archivos referenciados por los bloques de todas las secciones de una página. */
const mediaOfPage = async (client: Client, pageId: string): Promise<string[]> => {
  /**
   * `sections!inner(page_id)` filtra por la página subiendo un nivel. Es la
   * única forma de pedir los bloques de una página en una sola consulta: no
   * guardan `page_id`, solo `section_id`.
   */
  const { data, error } = await client
    .from('blocks')
    .select('data, sections!inner(page_id)')
    .eq('sections.page_id', pageId);

  if (error) {
    logger.warn('No pudimos leer los bloques de la página para limpiar', { pageId });
    return [];
  }

  return collectMediaIds(data ?? []);
};

/**
 * Crea la portada de un módulo nuevo.
 *
 * Sin ella, entrar al módulo recién creado daría una pantalla vacía y habría
 * que adivinar que lo primero es crear una página marcada como inicio.
 *
 * Nace SIN índice a propósito: un módulo de una sola página no necesita una
 * lista de enlaces a ninguna parte. El índice lo monta `ensureHomeIndex` en
 * cuanto aparece la primera página de contenido.
 */
const createHomePage = async (
  client: ReturnType<typeof getSupabaseClient>,
  moduleId: string,
  title: string,
): Promise<void> => {
  const { error } = await client.from('pages').insert({
    module_id: moduleId,
    slug: 'inicio',
    title,
    is_home: true,
    position: 0,
  });

  if (error) throw toAppError(error, 'crear la portada');
};

/**
 * Monta el índice en la portada cuando aparece la primera página de contenido.
 *
 * Es el momento en que empieza a hacer falta: antes no hay nada que listar, y
 * después el índice automático ya recoge las nuevas por su cuenta.
 *
 * Solo actúa en esa primera página, no en cada una. Si se hiciera siempre que
 * no exista un índice, borrarlo a propósito no serviría de nada: volvería a
 * aparecer al crear la página siguiente.
 */
const ensureHomeIndex = async (
  client: ReturnType<typeof getSupabaseClient>,
  moduleId: string,
): Promise<void> => {
  const { data: home, error: homeError } = await client
    .from('pages')
    .select('id')
    .eq('module_id', moduleId)
    .eq('is_home', true)
    .maybeSingle<{ id: string }>();

  // Un módulo sin portada no es un error aquí: puede haberla borrado alguien
  // desde la base. Simplemente no hay dónde poner el índice.
  if (homeError || !home) return;

  const { data: existing } = await client
    .from('blocks')
    .select('id, sections!inner(page_id)')
    .eq('kind', 'pageLinks')
    .eq('sections.page_id', home.id)
    .limit(1);

  if ((existing?.length ?? 0) > 0) return;

  /**
   * Se reutiliza la primera sección de la portada si ya existe. Crear una
   * nueva la pondría por encima de lo que el administrador ya hubiera escrito
   * y le cambiaría el orden sin avisar.
   */
  const { data: sections } = await client
    .from('sections')
    .select('id')
    .eq('page_id', home.id)
    .order('position')
    .limit(1);

  let sectionId = sections?.[0]?.id as string | undefined;

  if (sectionId === undefined) {
    const { data: created, error: sectionError } = await client
      .from('sections')
      .insert({ page_id: home.id, variant: 'plain', position: 0 })
      .select('id')
      .single<{ id: string }>();

    if (sectionError) throw toAppError(sectionError, 'crear la sección del índice');
    sectionId = created.id;
  }

  const { error: blockError } = await client.from('blocks').insert({
    section_id: sectionId,
    kind: 'pageLinks',
    // Al final de la sección, detrás de lo que ya hubiera.
    position: await nextPosition('blocks', 'section_id', sectionId),
    data: {
      title: 'Aprende paso a paso',
      variant: 'numbered',
      source: 'auto',
      items: [],
    },
  });

  if (blockError) throw toAppError(blockError, 'crear el índice de la portada');
};

export const dynamicSupabaseRepository: DynamicContentRepository = {
  // =========================================================================
  // Categorías
  // =========================================================================
  async listCategories(): Promise<Category[]> {
    const { data, error } = await getSupabaseClient()
      .from('categories')
      .select('*')
      .order('position');

    if (error) throw toAppError(error, 'listar categorías');
    return (data as CategoryRow[]).map(mapCategory);
  },

  // =========================================================================
  // Catálogo
  // =========================================================================
  async listModules(filters?: ModuleFilters): Promise<ModuleSummary[]> {
    let query = getSupabaseClient().from('modules').select(MODULE_SUMMARY_SELECT);

    /**
     * Los borradores se excluyen aquí Y en la política RLS. La política es la
     * que manda; este filtro evita el viaje inútil y hace explícita la regla
     * para quien lea el código.
     */
    if (!filters?.includeDrafts) {
      query = query.in('status', ['published', 'coming_soon']);
    }

    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.severity) query = query.eq('severity', filters.severity);

    const term = filters?.query?.trim();
    if (term) {
      /**
       * Se busca sobre `search_text`, la columna generada que concatena
       * título, resumen y etiquetas (migración 004). Las etiquetas importan:
       * la gente escribe «se ahoga», no «atragantamiento».
       *
       * Se quitan los caracteres que PostgREST usa como sintaxis de filtro.
       * Sin eso, una coma en la búsqueda partiría la condición en dos y un
       * paréntesis la rompería.
       */
      const escaped = term.replace(/[%,().*]/g, ' ').trim().toLowerCase();
      if (escaped.length > 0) {
        query = query.ilike('search_text', `%${escaped}%`);
      }
    }

    const { data, error } = await query.order('position');
    if (error) throw toAppError(error, 'listar módulos');

    return (data as ModuleRow[]).map(mapModuleSummary);
  },

  async getModuleBySlug(slug: string): Promise<ContentModule> {
    const { data, error } = await getSupabaseClient()
      .from('modules')
      .select(MODULE_WITH_CONTENT_SELECT)
      .eq('slug', slug)
      .single<ModuleRow>();

    if (error) throw toAppError(error, `leer el módulo ${slug}`);
    if (!data) throw notFound('Ese módulo no existe o fue eliminado.');

    return mapModule(data);
  },

  getModuleById(moduleId: string): Promise<ContentModule> {
    return fetchModule(moduleId);
  },

  // =========================================================================
  // Módulos
  // =========================================================================
  async createModule(draft: ModuleDraft): Promise<ContentModule> {
    const client = getSupabaseClient();
    const slug = await ensureUniqueSlug('modules', draft.slug ?? draft.title, null, null);

    const { data, error } = await client
      .from('modules')
      .insert({
        slug,
        title: draft.title.trim(),
        summary: draft.summary?.trim() ?? '',
        icon_name: draft.iconName,
        category_id: draft.categoryId ?? null,
        severity: draft.severity,
        status: statusToDb(draft.status),
        tags: draft.tags ?? [],
        estimated_minutes: draft.estimatedMinutes ?? 3,
        position: await nextPosition('modules', null, null),
        // `author_id` lo rellena el cliente con la sesión activa. Si no hay
        // sesión, la política RLS habrá rechazado la inserción antes.
        author_id: (await client.auth.getUser()).data.user?.id ?? null,
      })
      .select('id')
      .single<{ id: string }>();

    if (error) throw toAppError(error, 'crear el módulo');

    await createHomePage(client, data.id, draft.title);

    return fetchModule(data.id);
  },

  async updateModule(moduleId: string, draft: Partial<ModuleDraft>): Promise<ContentModule> {
    const patch: Record<string, unknown> = {};

    if (draft.title !== undefined) patch.title = draft.title.trim();
    if (draft.summary !== undefined) patch.summary = draft.summary.trim();
    if (draft.iconName !== undefined) patch.icon_name = draft.iconName;
    if (draft.categoryId !== undefined) patch.category_id = draft.categoryId;
    if (draft.severity !== undefined) patch.severity = draft.severity;
    if (draft.status !== undefined) patch.status = statusToDb(draft.status);
    if (draft.tags !== undefined) patch.tags = draft.tags;
    if (draft.estimatedMinutes !== undefined) patch.estimated_minutes = draft.estimatedMinutes;

    /**
     * El slug solo cambia si se pide explícitamente, NUNCA al renombrar el
     * título. Un slug es una URL que puede estar compartida o guardada en un
     * marcador; cambiarlo sin querer rompe esos enlaces en silencio.
     */
    if (draft.slug !== undefined) {
      patch.slug = await ensureUniqueSlug('modules', draft.slug, null, moduleId);
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await getSupabaseClient()
        .from('modules')
        .update(patch)
        .eq('id', moduleId);

      if (error) throw toAppError(error, 'actualizar el módulo');
    }

    return fetchModule(moduleId);
  },

  async deleteModule(moduleId: string): Promise<void> {
    const client = getSupabaseClient();

    /**
     * Los archivos van antes que la fila. Si se borra el módulo primero y la
     * limpieza del bucket falla, los archivos quedan huérfanos sin forma de
     * localizarlos: la tabla `media` que los relacionaba ya no existe.
     */
    const { data: assets } = await client
      .from('media')
      .select('path')
      .eq('module_id', moduleId);

    const paths = (assets ?? []).map((asset) => (asset as { path: string }).path);
    if (paths.length > 0) {
      const { error: storageError } = await client.storage.from(BUCKET).remove(paths);
      // Un fallo al limpiar no debe impedir el borrado: deja basura, no datos
      // inconsistentes. Se registra para poder limpiarla después.
      if (storageError) {
        logger.warn('No se pudieron borrar archivos del módulo', {
          moduleId,
          count: paths.length,
        });
      }
    }

    // Las páginas, secciones y bloques se van con el `on delete cascade`.
    const { error } = await client.from('modules').delete().eq('id', moduleId);
    if (error) throw toAppError(error, 'eliminar el módulo');
  },

  async reorderModules(items: ReorderItem[]): Promise<ModuleSummary[]> {
    await applyReorder('modules', items);
    return this.listModules({ includeDrafts: true });
  },

  // =========================================================================
  // Páginas
  // =========================================================================
  async createPage(moduleId: string, draft: PageDraft): Promise<ContentModule> {
    const client = getSupabaseClient();
    const isHome = draft.isHome ?? false;

    const slug = await ensureUniqueSlug(
      'pages',
      draft.slug ?? draft.title,
      { column: 'module_id', value: moduleId },
      null,
    );

    /**
     * Se cuentan las páginas de contenido ANTES de insertar. Si no hay
     * ninguna, la que se está creando es la primera y es cuando toca montar el
     * índice en la portada.
     */
    const { count: existingPages } = await client
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', moduleId)
      .eq('is_home', false);

    const { error } = await client.from('pages').insert({
      module_id: moduleId,
      slug,
      title: draft.title.trim(),
      subtitle: draft.subtitle?.trim() ?? null,
      is_home: isHome,
      position: await nextPosition('pages', 'module_id', moduleId),
    });

    if (error) throw toAppError(error, 'crear la página');

    if (!isHome && (existingPages ?? 0) === 0) {
      await ensureHomeIndex(client, moduleId);
    }

    return fetchModule(moduleId);
  },

  async updatePage(
    moduleId: string,
    pageId: string,
    draft: Partial<PageDraft>,
  ): Promise<ContentModule> {
    const patch: Record<string, unknown> = {};

    if (draft.title !== undefined) patch.title = draft.title.trim();
    if (draft.subtitle !== undefined) patch.subtitle = draft.subtitle?.trim() ?? null;
    if (draft.isHome !== undefined) patch.is_home = draft.isHome;
    if (draft.slug !== undefined) {
      patch.slug = await ensureUniqueSlug(
        'pages',
        draft.slug,
        { column: 'module_id', value: moduleId },
        pageId,
      );
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await getSupabaseClient().from('pages').update(patch).eq('id', pageId);
      if (error) throw toAppError(error, 'actualizar la página');
    }

    return fetchModule(moduleId);
  },

  async deletePage(moduleId: string, pageId: string): Promise<ContentModule> {
    const client = getSupabaseClient();

    /**
     * Los archivos se anotan ANTES de borrar: con la página fuera, sus
     * secciones y bloques se van con la cascada y ya no hay dónde leer qué
     * imágenes usaban.
     */
    const assets = await mediaOfPage(client, pageId);

    const { error } = await client.from('pages').delete().eq('id', pageId);
    if (error) throw toAppError(error, 'eliminar la página');

    /**
     * La limpieza va DESPUÉS del borrado. Al contrario, un fallo al borrar la
     * página dejaría sus bloques apuntando a archivos que ya no existen: la
     * pantalla pública mostraría huecos. Un archivo de más es un problema de
     * cuota; una página rota lo es de alguien buscando cómo actuar.
     */
    await purgeMedia(client, assets);

    return fetchModule(moduleId);
  },

  async reorderPages(moduleId: string, items: ReorderItem[]): Promise<ContentModule> {
    await applyReorder('pages', items);
    return fetchModule(moduleId);
  },

  // =========================================================================
  // Secciones
  // =========================================================================
  async createSection(
    moduleId: string,
    pageId: string,
    draft: SectionDraft,
  ): Promise<ContentModule> {
    const { error } = await getSupabaseClient()
      .from('sections')
      .insert({
        page_id: pageId,
        title: draft.title?.trim() ?? null,
        variant: draft.variant ?? SectionVariant.Plain,
        position: await nextPosition('sections', 'page_id', pageId),
      });

    if (error) throw toAppError(error, 'crear la sección');
    return fetchModule(moduleId);
  },

  async updateSection(
    moduleId: string,
    sectionId: string,
    draft: Partial<SectionDraft>,
  ): Promise<ContentModule> {
    const patch: Record<string, unknown> = {};
    if (draft.title !== undefined) patch.title = draft.title?.trim() ?? null;
    if (draft.variant !== undefined) patch.variant = draft.variant;

    if (Object.keys(patch).length > 0) {
      const { error } = await getSupabaseClient()
        .from('sections')
        .update(patch)
        .eq('id', sectionId);
      if (error) throw toAppError(error, 'actualizar la sección');
    }

    return fetchModule(moduleId);
  },

  async deleteSection(moduleId: string, sectionId: string): Promise<ContentModule> {
    const client = getSupabaseClient();
    const assets = await mediaOfSection(client, sectionId);

    const { error } = await client.from('sections').delete().eq('id', sectionId);
    if (error) throw toAppError(error, 'eliminar la sección');

    await purgeMedia(client, assets);

    return fetchModule(moduleId);
  },

  async reorderSections(moduleId: string, items: ReorderItem[]): Promise<ContentModule> {
    await applyReorder('sections', items);
    return fetchModule(moduleId);
  },

  // =========================================================================
  // Bloques
  // =========================================================================
  async createBlock(
    moduleId: string,
    sectionId: string,
    draft: BlockDraft,
  ): Promise<ContentModule> {
    /**
     * El contenido pasa por el validador ANTES de escribirse. Postgres solo
     * comprueba que `data` sea un objeto, así que esta es la única barrera:
     * sin ella entraría un bloque que la pantalla no sabe pintar.
     */
    const data = sanitizeBlockData(draft.kind, draft.data);
    if (data === null) {
      throw validationError('Ese bloque está incompleto. Revisa sus campos.');
    }

    const { error } = await getSupabaseClient()
      .from('blocks')
      .insert({
        section_id: sectionId,
        kind: draft.kind,
        data,
        position: await nextPosition('blocks', 'section_id', sectionId),
      });

    if (error) throw toAppError(error, 'crear el bloque');
    return fetchModule(moduleId);
  },

  async updateBlock(
    moduleId: string,
    blockId: string,
    draft: Partial<BlockDraft>,
  ): Promise<ContentModule> {
    const client = getSupabaseClient();

    /**
     * Para validar hay que conocer el tipo, y una edición puede traer solo los
     * datos. Se lee el `kind` guardado en lugar de confiar en que el editor lo
     * mande: así un `data` de un tipo nunca se guarda bajo otro.
     */
    const { data: current, error: readError } = await client
      .from('blocks')
      .select('kind, data')
      .eq('id', blockId)
      .single<{ kind: string; data: Record<string, unknown> }>();

    if (readError) throw toAppError(readError, 'leer el bloque');

    const kind = draft.kind ?? current.kind;
    const patch: Record<string, unknown> = {};

    if (draft.kind !== undefined) patch.kind = draft.kind;

    if (draft.data !== undefined) {
      const data = sanitizeBlockData(kind, draft.data);
      if (data === null) {
        throw validationError('Ese bloque está incompleto. Revisa sus campos.');
      }
      patch.data = data;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await client.from('blocks').update(patch).eq('id', blockId);
      if (error) throw toAppError(error, 'actualizar el bloque');

      /**
       * Lo que ya no se usa se va del bucket. Es el caso que más sitio gasta:
       * cambiar la imagen de un bloque cinco veces dejaba cinco archivos, y
       * solo el último se veía en algún sitio.
       *
       * Se compara contra `patch.data`, que es el contenido SANEADO —el que de
       * verdad se ha guardado—, no contra el borrador que llegó del editor.
       */
      if (patch.data !== undefined) {
        await purgeMedia(client, removedMediaIds(current.data, patch.data));
      }
    }

    return fetchModule(moduleId);
  },

  async deleteBlock(moduleId: string, blockId: string): Promise<ContentModule> {
    const client = getSupabaseClient();

    // Hay que leer su contenido antes: al borrar el bloque desaparece la única
    // pista de qué archivos usaba.
    const { data: current } = await client
      .from('blocks')
      .select('data')
      .eq('id', blockId)
      .maybeSingle<{ data: Record<string, unknown> }>();

    const { error } = await client.from('blocks').delete().eq('id', blockId);
    if (error) throw toAppError(error, 'eliminar el bloque');

    await purgeMedia(client, collectMediaIds(current?.data));

    return fetchModule(moduleId);
  },

  async reorderBlocks(moduleId: string, items: ReorderItem[]): Promise<ContentModule> {
    await applyReorder('blocks', items);
    return fetchModule(moduleId);
  },

  // =========================================================================
  // Archivos
  // =========================================================================
  async uploadMedia(
    file: File,
    moduleId: string | null,
    alt: string,
  ): Promise<MediaAsset> {
    const client = getSupabaseClient();

    /**
     * Las imágenes se reducen y recomprimen antes de salir del navegador; los
     * vídeos solo se comprueban y se miden. Recomprimir vídeo en el cliente
     * exigiría WebCodecs o un ffmpeg en WASM, que son megabytes de código y
     * minutos de proceso.
     */
    const prepared = isVideoFile(file)
      ? await prepareVideo(file)
      : await prepareImage(file);

    const path = buildStoragePath(moduleId, prepared.file);

    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(path, prepared.file, {
        contentType: prepared.file.type,
        // El nombre lleva un UUID, así que no puede haber colisión. Rechazar
        // la sobrescritura convierte un error de lógica en un fallo visible.
        upsert: false,
        // Un año: el nombre es único, así que el archivo nunca cambia.
        cacheControl: '31536000',
      });

    if (uploadError) {
      logger.error('Fallo al subir a Storage', { path, message: uploadError.message });
      throw new Error('No pudimos subir la imagen. Intenta de nuevo.');
    }

    const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(path);

    const { data, error } = await client
      .from('media')
      .insert({
        bucket: BUCKET,
        path,
        public_url: urlData.publicUrl,
        mime_type: prepared.file.type,
        bytes: prepared.file.size,
        width: prepared.width,
        height: prepared.height,
        alt,
        module_id: moduleId,
        uploaded_by: (await client.auth.getUser()).data.user?.id ?? null,
      })
      .select('*')
      .single<MediaRow>();

    /**
     * Si el registro falla, el archivo ya está en el bucket. Se borra para no
     * dejar un huérfano que nadie puede relacionar con nada.
     */
    if (error) {
      await client.storage.from(BUCKET).remove([path]);
      throw toAppError(error, 'registrar la imagen');
    }

    return mapMedia(data);
  },

  // =========================================================================
  // Encuestas
  // =========================================================================
  async listSurveyGroups(): Promise<SurveyGroup[]> {
    const { data, error } = await getSupabaseClient()
      .from('survey_groups')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (error) throw toAppError(error, 'listar los grupos de preguntas');

    return (data as { id: string; title: string; created_at: string }[]).map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    }));
  },

  async createSurveyGroup(title: string): Promise<SurveyGroup> {
    const { data, error } = await getSupabaseClient()
      .from('survey_groups')
      .insert({ title: title.trim() })
      .select('id, title, created_at')
      .single<{ id: string; title: string; created_at: string }>();

    if (error) throw toAppError(error, 'crear el grupo de preguntas');

    return { id: data.id, title: data.title, createdAt: data.created_at };
  },

  /**
   * Envía las respuestas de un visitante.
   *
   * Es la única escritura de la aplicación que NO exige ser administrador: la
   * política de la tabla deja insertar a cualquiera, porque quien lee el
   * contenido es anónimo. Leer esas respuestas sigue siendo cosa del admin.
   *
   * Las respuestas de un envío comparten `submission_id`, generado aquí. No
   * identifica a nadie entre visitas; sirve para poder contar envíos, que no es
   * lo mismo que respuestas: quien contesta 3 de 5 preguntas suma 3 respuestas
   * y 1 envío.
   */
  async submitSurveyAnswers(submission: SurveySubmission): Promise<void> {
    if (submission.answers.length === 0) {
      throw validationError('No hay respuestas que enviar.');
    }

    const submissionId = crypto.randomUUID();

    const { error } = await getSupabaseClient()
      .from('survey_answers')
      .insert(
        submission.answers.map((answer) => ({
          group_id: submission.groupId,
          question_id: answer.questionId,
          question_text: answer.questionText,
          value: answer.value,
          submission_id: submissionId,
        })),
      );

    if (error) throw toAppError(error, 'enviar las respuestas');
  },

  /**
   * Recuento por pregunta y valor.
   *
   * Agrega en Postgres con `survey_summary`, no en el navegador: con unos
   * cientos de envíos, traerse las filas una a una para contarlas aquí sería
   * descargar un montón de datos para calcular treinta números.
   */
  async getSurveySummary(groupId: string): Promise<SurveySummary> {
    const client = getSupabaseClient();

    const [summary, submissions] = await Promise.all([
      client.rpc('survey_summary', { p_group_id: groupId }),
      client.rpc('survey_submissions', { p_group_id: groupId }),
    ]);

    if (summary.error) throw toAppError(summary.error, 'leer las estadísticas');
    if (submissions.error) throw toAppError(submissions.error, 'contar los envíos');

    type Row = {
      question_id: string;
      question_text: string;
      value: number;
      votes: number;
    };

    /**
     * La función devuelve una fila por pregunta Y valor, así que una pregunta
     * aparece hasta cinco veces. Aquí se pliega a una entrada por pregunta con
     * sus cinco recuentos.
     *
     * Se conserva el orden de llegada para que dos cargas seguidas no muestren
     * las preguntas en distinto orden.
     */
    const byQuestion = new Map<string, SurveyQuestionSummary>();

    ((summary.data ?? []) as Row[]).forEach((row) => {
      const current = byQuestion.get(row.question_id) ?? {
        questionId: row.question_id,
        questionText: row.question_text,
        votes: [0, 0, 0, 0, 0] as [number, number, number, number, number],
        total: 0,
        average: null,
      };

      // `value` viene de una columna con `check (value between 1 and 5)`, así
      // que el índice siempre cae dentro; la guarda es por si alguien tocó la
      // tabla a mano.
      if (row.value >= 1 && row.value <= 5) {
        current.votes[row.value - 1] = Number(row.votes);
      }

      byQuestion.set(row.question_id, current);
    });

    const questions = [...byQuestion.values()].map((question) => {
      const total = question.votes.reduce((sum, votes) => sum + votes, 0);
      const weighted = question.votes.reduce(
        (sum, votes, index) => sum + votes * (index + 1),
        0,
      );

      return {
        ...question,
        total,
        average: total === 0 ? null : weighted / total,
      };
    });

    return {
      groupId,
      submissions: Number(submissions.data ?? 0),
      questions,
    };
  },

  /**
   * Descarta archivos que nadie va a usar.
   *
   * Lo llama el formulario al cerrarse: una subida ocurre en el momento de
   * elegir el archivo, antes de guardar, así que cancelar el formulario —o
   * cambiar de imagen dos veces— deja subidas que ningún bloque referencia.
   * Sin esta llamada ese archivo no aparecería en ninguna parte y seguiría
   * ocupando sitio.
   */
  async discardMedia(mediaIds: string[]): Promise<void> {
    await purgeMedia(getSupabaseClient(), mediaIds);
  },
};

/**
 * ===========================================================================
 * LIMITACIÓN CONOCIDA: NO HAY TRANSACCIONES
 * ===========================================================================
 * PostgREST expone operaciones sueltas, no transacciones de varias sentencias.
 * Dos sitios lo notan:
 *
 * - `reorderX` lanza una actualización por elemento. Si falla a mitad, unos
 *   quedan con la posición nueva y otros con la vieja. La consecuencia es un
 *   orden raro que se arregla reordenando otra vez, no una pérdida de datos.
 *
 * - `createModule` inserta el módulo y luego su portada. Si lo segundo falla,
 *   queda un módulo sin páginas; el editor lo muestra vacío y se le puede
 *   añadir una página a mano.
 *
 * La solución sería mover cada operación a una función de Postgres y llamarla
 * con `rpc`, que sí es atómica. No lo hago ahora porque son dos funciones SQL
 * más que mantener para cubrir un fallo cuyo peor caso es cosmético, con un
 * único administrador usando el editor.
 * ===========================================================================
 */

/**
 * ===========================================================================
 * PENDIENTE: BARRIDO DE ARCHIVOS HUÉRFANOS
 * ===========================================================================
 * Todo borrado de contenido arrastra sus archivos, y el formulario descarta las
 * subidas que no llegó a usar. Quedan dos huecos por los que un archivo puede
 * sobrevivir sin que nadie lo referencie:
 *
 * 1. Cerrar la pestaña con el formulario abierto después de subir. El diálogo
 *    no llega a desmontarse, así que nunca avisa de que esa subida sobraba.
 * 2. Un fallo de red en `storage.remove`. La fila de `media` se conserva a
 *    propósito para poder reintentarlo, pero nadie lo reintenta todavía.
 *
 * El primero es el que de verdad pasa: subir una imagen, dudar, y cerrar.
 *
 * CÓMO RESOLVERLO
 * Un botón de limpieza en el panel de administración. La parte que cuesta
 * pensar es saber qué archivos están en uso, y Postgres puede calcularlo sin
 * conocer la forma de cada tipo de bloque:
 *
 *   create or replace view media_en_uso as
 *   select distinct (ref #>> '{}')::uuid as media_id
 *   from blocks b,
 *        lateral jsonb_path_query(b.data, '$.**.mediaId') ref
 *   where jsonb_typeof(ref) = 'string';
 *
 * `$.**.mediaId` es el equivalente en SQL del recorrido de `media.refs.ts`:
 * busca la clave a cualquier profundidad, así que cubre imagen, galería, vídeo
 * y las imágenes dentro de un paso sin enumerarlos.
 *
 * Con eso, los huérfanos son `select * from media where id not in (select
 * media_id from media_en_uso)`, y el botón los pasa por `purgeMedia`, que ya
 * borra del bucket y de la tabla en el orden correcto.
 *
 * NO basta con comparar el bucket contra la tabla `media`: un archivo cuya
 * fila existe pero que ningún bloque referencia es precisamente el caso 1, y
 * esa comparación no lo vería.
 *
 * Y el borrado tiene que seguir saliendo de aquí, por la API de Storage. La
 * tentación es resolverlo entero en SQL con un `delete from storage.objects`:
 * eso quita los metadatos y deja los bytes en el almacén, ya sin forma de
 * listarlos ni de borrarlos, ocupando cuota para siempre.
 * ===========================================================================
 */
