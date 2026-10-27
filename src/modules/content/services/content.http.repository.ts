import httpClient from 'modules/shared/services/http/httpClient';
import { API_ENDPOINTS } from 'modules/shared/constants/apiEndpoints';
import type {
  ContentModule,
  ContentModuleDraft,
  ContentRepository,
  LessonDraft,
  ModuleFilters,
} from 'modules/content/types/content.types';

/**
 * Adaptador HTTP. Se activa con VITE_PERSISTENCE_DRIVER=http.
 * Los endpoints estan declarados en `shared/constants/apiEndpoints.ts`.
 */
export const contentHttpRepository: ContentRepository = {
  async listModules(filters?: ModuleFilters): Promise<ContentModule[]> {
    const { data } = await httpClient.get<ContentModule[]>(API_ENDPOINTS.MODULES, {
      params: filters,
    });
    return data;
  },

  async getModuleById(moduleId: string): Promise<ContentModule> {
    const { data } = await httpClient.get<ContentModule>(API_ENDPOINTS.MODULE_BY_ID(moduleId));
    return data;
  },

  async createModule(draft: ContentModuleDraft, authorId: string): Promise<ContentModule> {
    const { data } = await httpClient.post<ContentModule>(API_ENDPOINTS.MODULES, {
      ...draft,
      authorId,
    });
    return data;
  },

  async updateModule(
    moduleId: string,
    draft: Partial<ContentModuleDraft>,
  ): Promise<ContentModule> {
    const { data } = await httpClient.put<ContentModule>(
      API_ENDPOINTS.MODULE_BY_ID(moduleId),
      draft,
    );
    return data;
  },

  async deleteModule(moduleId: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.MODULE_BY_ID(moduleId));
  },

  async reorderModules(orderedIds: string[]): Promise<ContentModule[]> {
    const { data } = await httpClient.patch<ContentModule[]>(API_ENDPOINTS.MODULES, {
      orderedIds,
    });
    return data;
  },

  async createLesson(moduleId: string, draft: LessonDraft): Promise<ContentModule> {
    const { data } = await httpClient.post<ContentModule>(
      API_ENDPOINTS.LESSONS(moduleId),
      draft,
    );
    return data;
  },

  async updateLesson(
    moduleId: string,
    lessonId: string,
    draft: Partial<LessonDraft>,
  ): Promise<ContentModule> {
    const { data } = await httpClient.put<ContentModule>(
      API_ENDPOINTS.LESSON_BY_ID(moduleId, lessonId),
      draft,
    );
    return data;
  },

  async deleteLesson(moduleId: string, lessonId: string): Promise<ContentModule> {
    const { data } = await httpClient.delete<ContentModule>(
      API_ENDPOINTS.LESSON_BY_ID(moduleId, lessonId),
    );
    return data;
  },
};
