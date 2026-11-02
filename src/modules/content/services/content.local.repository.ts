import localStore from 'modules/shared/services/storage/localStore';
import logger from 'modules/shared/services/logger/logger';
import {
  CONTENT_MODULES_STORAGE_KEY,
  CONTENT_SEED_META_STORAGE_KEY,
} from 'modules/shared/constants/storageKeys';
import { createId, nowIso, slugify } from 'modules/shared/utils/id';
import { notFound, validationError } from 'modules/shared/utils/errors';
import {
  ModuleStatus,
  type ContentModule,
  type ContentModuleDraft,
  type ContentRepository,
  type LessonDraft,
  type ModuleFilters,
} from 'modules/content/types/content.types';
import { RETIRED_SEED_IDS, SEED_MODULES, SEED_VERSION } from './content.seed';

/**
 * Adaptador de persistencia local (localStorage). Permite operar sin backend:
 * demo offline y desarrollo. Mismo contrato que el adaptador HTTP.
 */

interface SeedMeta {
  version: number;
  /**
   * Huella del contenido de la semilla. Es lo que DECIDE si hay que migrar.
   *
   * Antes la decisión dependía de `SEED_VERSION`, un número que se subía a
   * mano, y eso fallaba de dos formas: olvidarse de subirlo dejaba a la gente
   * con contenido viejo en silencio, y subirlo en una edición distinta a la del
   * contenido persistía una combinación incoherente. Derivar la huella del
   * contenido hace imposible que no coincidan.
   */
  signature: string;
  /** Ids que instaló la semilla, para distinguirlos de los creados por un admin. */
  seedIds: string[];
}

/**
 * Huella FNV-1a del contenido de la semilla.
 *
 * No necesita ser criptográfica: solo tiene que cambiar cuando cambie el
 * contenido. Se calcula una vez al arrancar sobre unos 25 kB de JSON.
 */
const computeSeedSignature = (): string => {
  const payload = JSON.stringify({ modules: SEED_MODULES, retired: RETIRED_SEED_IDS });

  let hash = 0x811c9dc5;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  // >>> 0 lo fuerza a entero sin signo de 32 bits.
  return `v${SEED_VERSION}-${(hash >>> 0).toString(36)}`;
};

const currentSeedMeta = (): SeedMeta => ({
  version: SEED_VERSION,
  signature: computeSeedSignature(),
  seedIds: SEED_MODULES.map((module) => module.id),
});

const installSeed = (): ContentModule[] => {
  const fresh = structuredClone(SEED_MODULES);
  localStore.write(CONTENT_MODULES_STORAGE_KEY, fresh);
  localStore.write(CONTENT_SEED_META_STORAGE_KEY, currentSeedMeta());
  return fresh;
};

/**
 * Pone al día el contenido semilla sin tocar lo que creó un administrador.
 *
 * - Los módulos que vienen de la semilla se reemplazan por la versión nueva:
 *   son contenido nuestro y la fuente de verdad es el código.
 * - Los módulos de una semilla anterior que ya no existen se retiran.
 * - Todo lo demás (creado por un admin) se conserva y se reordena al final.
 */
const migrateSeed = (stored: ContentModule[]): ContentModule[] => {
  const previous = localStore.read<SeedMeta | null>(CONTENT_SEED_META_STORAGE_KEY, null);

  // Un módulo es "de la semilla" si está en la semilla actual, si lo declaró la
  // instalación anterior, o si figura entre los retirados. Lo último cubre a
  // quienes instalaron la v1, que no guardaba metadatos.
  const seedOwnedIds = new Set<string>([
    ...SEED_MODULES.map((module) => module.id),
    ...(previous?.seedIds ?? []),
    ...RETIRED_SEED_IDS,
  ]);

  const authored = stored.filter((module) => !seedOwnedIds.has(module.id));

  const merged = [
    ...structuredClone(SEED_MODULES),
    ...authored.map((module, index) => ({
      ...module,
      order: SEED_MODULES.length + index + 1,
    })),
  ];

  localStore.write(CONTENT_MODULES_STORAGE_KEY, merged);
  localStore.write(CONTENT_SEED_META_STORAGE_KEY, currentSeedMeta());

  logger.info('Contenido semilla actualizado', {
    de: previous?.signature ?? 'sin huella',
    a: computeSeedSignature(),
    conservados: authored.length,
  });

  return merged;
};

const readAll = (): ContentModule[] => {
  const stored = localStore.read<ContentModule[] | null>(CONTENT_MODULES_STORAGE_KEY, null);

  if (stored === null) return installSeed();

  const meta = localStore.read<SeedMeta | null>(CONTENT_SEED_META_STORAGE_KEY, null);

  // Basta comparar la huella: cambia con cualquier edición de la semilla,
  // incluido retocar el texto de un módulo que ya existía.
  if (meta?.signature !== computeSeedSignature()) return migrateSeed(stored);

  return stored;
};

const writeAll = (modules: ContentModule[]): ContentModule[] => {
  localStore.write(CONTENT_MODULES_STORAGE_KEY, modules);
  return modules;
};

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/**
 * Lo que puede ver quien no es admin: todo menos los borradores.
 *
 * Un módulo «próximamente» SÍ sale en el catálogo —anunciarlo es su único
 * propósito—, pero la tarjeta no se puede abrir. Quien decide eso es la UI, no
 * este filtro.
 */
const isPubliclyVisible = (module: ContentModule): boolean =>
  module.status !== ModuleStatus.Draft;

const matchesFilters = (module: ContentModule, filters?: ModuleFilters): boolean => {
  if (!filters) return isPubliclyVisible(module);

  if (!filters.includeDrafts && !isPubliclyVisible(module)) return false;

  if (filters.severity && module.severity !== filters.severity) return false;

  const query = filters.query?.trim().toLowerCase();
  if (!query) return true;

  const haystack = [module.title, module.summary, ...module.tags]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
};

const findModuleOrThrow = (modules: ContentModule[], moduleId: string): ContentModule => {
  const found = modules.find((module) => module.id === moduleId);
  if (!found) throw notFound('Ese módulo no existe o fue eliminado.');
  return found;
};

const assertTitle = (title?: string) => {
  if (title !== undefined && title.trim().length < 3) {
    throw validationError('El título debe tener al menos 3 caracteres.');
  }
};

export const contentLocalRepository: ContentRepository = {
  async listModules(filters?: ModuleFilters): Promise<ContentModule[]> {
    return readAll()
      .filter((module) => matchesFilters(module, filters))
      .sort(byOrder);
  },

  async getModuleById(moduleId: string): Promise<ContentModule> {
    const module = findModuleOrThrow(readAll(), moduleId);
    return { ...module, lessons: [...module.lessons].sort(byOrder) };
  },

  async createModule(draft: ContentModuleDraft, authorId: string): Promise<ContentModule> {
    assertTitle(draft.title);

    const modules = readAll();
    const timestamp = nowIso();

    const created: ContentModule = {
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      title: draft.title.trim(),
      slug: slugify(draft.title),
      summary: draft.summary.trim(),
      severity: draft.severity,
      status: draft.status,
      iconName: draft.iconName,
      tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      estimatedMinutes: draft.estimatedMinutes,
      order: modules.length + 1,
      lessons: [],
      authorId,
    };

    writeAll([...modules, created]);
    return created;
  },

  async updateModule(
    moduleId: string,
    draft: Partial<ContentModuleDraft>,
  ): Promise<ContentModule> {
    assertTitle(draft.title);

    const modules = readAll();
    findModuleOrThrow(modules, moduleId);

    let updated!: ContentModule;

    const next = modules.map((module) => {
      if (module.id !== moduleId) return module;

      updated = {
        ...module,
        ...draft,
        ...(draft.title ? { title: draft.title.trim(), slug: slugify(draft.title) } : {}),
        ...(draft.tags ? { tags: draft.tags.map((t) => t.trim()).filter(Boolean) } : {}),
        updatedAt: nowIso(),
      };

      return updated;
    });

    writeAll(next);
    return updated;
  },

  async deleteModule(moduleId: string): Promise<void> {
    const modules = readAll();
    findModuleOrThrow(modules, moduleId);

    const remaining = modules
      .filter((module) => module.id !== moduleId)
      .map((module, index) => ({ ...module, order: index + 1 }));

    writeAll(remaining);
  },

  async reorderModules(orderedIds: string[]): Promise<ContentModule[]> {
    const modules = readAll();

    const reordered = modules.map((module) => {
      const position = orderedIds.indexOf(module.id);
      return position === -1 ? module : { ...module, order: position + 1 };
    });

    return writeAll(reordered).sort(byOrder);
  },

  async createLesson(moduleId: string, draft: LessonDraft): Promise<ContentModule> {
    assertTitle(draft.title);

    const modules = readAll();
    const module = findModuleOrThrow(modules, moduleId);
    const timestamp = nowIso();

    const updated: ContentModule = {
      ...module,
      updatedAt: timestamp,
      lessons: [
        ...module.lessons,
        {
          id: createId(),
          createdAt: timestamp,
          updatedAt: timestamp,
          title: draft.title.trim(),
          summary: draft.summary.trim(),
          order: module.lessons.length + 1,
          blocks: draft.blocks,
        },
      ],
    };

    writeAll(modules.map((item) => (item.id === moduleId ? updated : item)));
    return updated;
  },

  async updateLesson(
    moduleId: string,
    lessonId: string,
    draft: Partial<LessonDraft>,
  ): Promise<ContentModule> {
    assertTitle(draft.title);

    const modules = readAll();
    const module = findModuleOrThrow(modules, moduleId);

    if (!module.lessons.some((lesson) => lesson.id === lessonId)) {
      throw notFound('Ese paso no existe en el módulo.');
    }

    const updated: ContentModule = {
      ...module,
      updatedAt: nowIso(),
      lessons: module.lessons.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              ...draft,
              ...(draft.title ? { title: draft.title.trim() } : {}),
              updatedAt: nowIso(),
            }
          : lesson,
      ),
    };

    writeAll(modules.map((item) => (item.id === moduleId ? updated : item)));
    return updated;
  },

  async deleteLesson(moduleId: string, lessonId: string): Promise<ContentModule> {
    const modules = readAll();
    const module = findModuleOrThrow(modules, moduleId);

    const updated: ContentModule = {
      ...module,
      updatedAt: nowIso(),
      lessons: module.lessons
        .filter((lesson) => lesson.id !== lessonId)
        .map((lesson, index) => ({ ...lesson, order: index + 1 })),
    };

    writeAll(modules.map((item) => (item.id === moduleId ? updated : item)));
    return updated;
  },
};

/** Restaura el contenido semilla y descarta lo creado por un admin. */
export const resetLocalContent = (): void => {
  installSeed();
};
