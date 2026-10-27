import appConfig from 'modules/shared/services/config/appConfig';
import type {
  ContentModule,
  ContentModuleDraft,
  ContentRepository,
  LessonDraft,
  ModuleFilters,
} from 'modules/content/types/content.types';
import { contentHttpRepository } from './content.http.repository';
import { contentLocalRepository } from './content.local.repository';

/**
 * Punto unico de acceso al contenido. Selecciona el adaptador segun
 * configuracion (Strategy). Cambiar de localStorage a API no toca ni thunks
 * ni componentes.
 */
const repository: ContentRepository =
  appConfig.persistenceDriver === 'http' ? contentHttpRepository : contentLocalRepository;

export const listModules = (filters?: ModuleFilters): Promise<ContentModule[]> =>
  repository.listModules(filters);

export const getModuleById = (moduleId: string): Promise<ContentModule> =>
  repository.getModuleById(moduleId);

export const createModule = (
  draft: ContentModuleDraft,
  authorId: string,
): Promise<ContentModule> => repository.createModule(draft, authorId);

export const updateModule = (
  moduleId: string,
  draft: Partial<ContentModuleDraft>,
): Promise<ContentModule> => repository.updateModule(moduleId, draft);

export const deleteModule = (moduleId: string): Promise<void> =>
  repository.deleteModule(moduleId);

export const reorderModules = (orderedIds: string[]): Promise<ContentModule[]> =>
  repository.reorderModules(orderedIds);

export const createLesson = (moduleId: string, draft: LessonDraft): Promise<ContentModule> =>
  repository.createLesson(moduleId, draft);

export const updateLesson = (
  moduleId: string,
  lessonId: string,
  draft: Partial<LessonDraft>,
): Promise<ContentModule> => repository.updateLesson(moduleId, lessonId, draft);

export const deleteLesson = (moduleId: string, lessonId: string): Promise<ContentModule> =>
  repository.deleteLesson(moduleId, lessonId);
