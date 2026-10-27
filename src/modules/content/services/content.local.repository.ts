import localStore from 'modules/shared/services/storage/localStore';
import { CONTENT_MODULES_STORAGE_KEY } from 'modules/shared/constants/storageKeys';
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
import { SEED_MODULES } from './content.seed';

/**
 * Adaptador de persistencia local (localStorage). Permite operar sin backend:
 * demo offline y desarrollo. Mismo contrato que el adaptador HTTP.
 */

const readAll = (): ContentModule[] => {
  const stored = localStore.read<ContentModule[] | null>(CONTENT_MODULES_STORAGE_KEY, null);

  if (stored === null) {
    localStore.write(CONTENT_MODULES_STORAGE_KEY, SEED_MODULES);
    return structuredClone(SEED_MODULES);
  }

  return stored;
};

const writeAll = (modules: ContentModule[]): ContentModule[] => {
  localStore.write(CONTENT_MODULES_STORAGE_KEY, modules);
  return modules;
};

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

const matchesFilters = (module: ContentModule, filters?: ModuleFilters): boolean => {
  if (!filters) return module.status === ModuleStatus.Published;

  if (!filters.includeDrafts && module.status !== ModuleStatus.Published) return false;

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
  if (!found) throw notFound('Ese modulo no existe o fue eliminado.');
  return found;
};

const assertTitle = (title?: string) => {
  if (title !== undefined && title.trim().length < 3) {
    throw validationError('El titulo debe tener al menos 3 caracteres.');
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
      throw notFound('Ese paso no existe en el modulo.');
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

/** Restaura el contenido semilla. Util para la demo. */
export const resetLocalContent = (): void => {
  localStore.write(CONTENT_MODULES_STORAGE_KEY, SEED_MODULES);
};
