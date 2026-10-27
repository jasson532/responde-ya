import {
  createAsyncThunk,
  createSelector,
  createSlice,
  isFulfilled,
  isPending,
  isRejected,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { toErrorMessage } from 'modules/shared/utils/errors';
import type { RootState } from 'modules/shared/store';
import * as contentService from 'modules/content/services/content.service';
import {
  ModuleSeverity,
  type ContentModule,
  type ContentModuleDraft,
  type LessonDraft,
  type ModuleFilters,
} from 'modules/content/types/content.types';

export interface ContentState {
  modules: ContentModule[];
  selectedModule: ContentModule | null;
  listStatus: LoadingStatus;
  detailStatus: LoadingStatus;
  /** Estado de las mutaciones de admin (crear/editar/eliminar). */
  mutationStatus: LoadingStatus;
  error: string | null;
  filters: ModuleFilters;
}

const initialState: ContentState = {
  modules: [],
  selectedModule: null,
  listStatus: LoadingStatus.Idle,
  detailStatus: LoadingStatus.Idle,
  mutationStatus: LoadingStatus.Idle,
  error: null,
  filters: {},
};

// ---------------------------------------------------------------------------
// Thunks de lectura
// ---------------------------------------------------------------------------

export const fetchModules = createAsyncThunk<
  ContentModule[],
  ModuleFilters | undefined,
  { rejectValue: string }
>('content/fetchModules', async (filters, { rejectWithValue }) => {
  try {
    return await contentService.listModules(filters);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos cargar los modulos.'));
  }
});

export const fetchModuleById = createAsyncThunk<
  ContentModule,
  string,
  { rejectValue: string }
>('content/fetchModuleById', async (moduleId, { rejectWithValue }) => {
  try {
    return await contentService.getModuleById(moduleId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos cargar el modulo.'));
  }
});

// ---------------------------------------------------------------------------
// Thunks de escritura (solo alcanzables desde rutas de admin)
// ---------------------------------------------------------------------------

export const createModule = createAsyncThunk<
  ContentModule,
  ContentModuleDraft,
  { state: RootState; rejectValue: string }
>('content/createModule', async (draft, { getState, rejectWithValue }) => {
  try {
    const authorId = getState().auth.user?.id;
    if (!authorId) return rejectWithValue('Debes iniciar sesion para crear contenido.');
    return await contentService.createModule(draft, authorId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos crear el modulo.'));
  }
});

export const updateModule = createAsyncThunk<
  ContentModule,
  { moduleId: string; draft: Partial<ContentModuleDraft> },
  { rejectValue: string }
>('content/updateModule', async ({ moduleId, draft }, { rejectWithValue }) => {
  try {
    return await contentService.updateModule(moduleId, draft);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos guardar los cambios.'));
  }
});

export const deleteModule = createAsyncThunk<string, string, { rejectValue: string }>(
  'content/deleteModule',
  async (moduleId, { rejectWithValue }) => {
    try {
      await contentService.deleteModule(moduleId);
      return moduleId;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'No pudimos eliminar el modulo.'));
    }
  },
);

export const createLesson = createAsyncThunk<
  ContentModule,
  { moduleId: string; draft: LessonDraft },
  { rejectValue: string }
>('content/createLesson', async ({ moduleId, draft }, { rejectWithValue }) => {
  try {
    return await contentService.createLesson(moduleId, draft);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos crear el paso.'));
  }
});

export const updateLesson = createAsyncThunk<
  ContentModule,
  { moduleId: string; lessonId: string; draft: Partial<LessonDraft> },
  { rejectValue: string }
>('content/updateLesson', async ({ moduleId, lessonId, draft }, { rejectWithValue }) => {
  try {
    return await contentService.updateLesson(moduleId, lessonId, draft);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos guardar el paso.'));
  }
});

export const deleteLesson = createAsyncThunk<
  ContentModule,
  { moduleId: string; lessonId: string },
  { rejectValue: string }
>('content/deleteLesson', async ({ moduleId, lessonId }, { rejectWithValue }) => {
  try {
    return await contentService.deleteLesson(moduleId, lessonId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos eliminar el paso.'));
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const upsertModule = (state: ContentState, module: ContentModule) => {
  const index = state.modules.findIndex((item) => item.id === module.id);
  if (index === -1) {
    state.modules.push(module);
  } else {
    state.modules[index] = module;
  }
  if (state.selectedModule?.id === module.id) {
    state.selectedModule = module;
  }
};

/** Mutaciones de admin. Se listan para derivar su estado de carga en bloque. */
const MUTATION_THUNKS = [
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
] as const;

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ModuleFilters>) {
      state.filters = action.payload;
    },
    clearSelectedModule(state) {
      state.selectedModule = null;
      state.detailStatus = LoadingStatus.Idle;
    },
    clearContentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- lista ---
      .addCase(fetchModules.pending, (state) => {
        state.listStatus = LoadingStatus.Pending;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.listStatus = LoadingStatus.Succeeded;
        state.modules = action.payload;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.listStatus = LoadingStatus.Failed;
        state.error = action.payload ?? 'No pudimos cargar los modulos.';
      })

      // --- detalle ---
      .addCase(fetchModuleById.pending, (state) => {
        state.detailStatus = LoadingStatus.Pending;
        state.error = null;
      })
      .addCase(fetchModuleById.fulfilled, (state, action) => {
        state.detailStatus = LoadingStatus.Succeeded;
        state.selectedModule = action.payload;
      })
      .addCase(fetchModuleById.rejected, (state, action) => {
        state.detailStatus = LoadingStatus.Failed;
        state.error = action.payload ?? 'No pudimos cargar el modulo.';
      })

      // --- eliminar modulo ---
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.mutationStatus = LoadingStatus.Succeeded;
        state.modules = state.modules.filter((module) => module.id !== action.payload);
        if (state.selectedModule?.id === action.payload) state.selectedModule = null;
      })

      // --- mutaciones que devuelven el modulo completo ---
      .addMatcher(
        isFulfilled(createModule, updateModule, createLesson, updateLesson, deleteLesson),
        (state, action) => {
          state.mutationStatus = LoadingStatus.Succeeded;
          state.error = null;
          upsertModule(state, action.payload);
        },
      )

      // --- estado de carga comun a todas las mutaciones ---
      .addMatcher(isPending(...MUTATION_THUNKS), (state) => {
        state.mutationStatus = LoadingStatus.Pending;
        state.error = null;
      })
      .addMatcher(isRejected(...MUTATION_THUNKS), (state, action) => {
        state.mutationStatus = LoadingStatus.Failed;
        state.error =
          (action.payload as string | undefined) ?? 'La operacion no se pudo completar.';
      });
  },
});

export const { setFilters, clearSelectedModule, clearContentError } = contentSlice.actions;

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------

export const selectModules = (state: RootState): ContentModule[] => state.content.modules;
export const selectSelectedModule = (state: RootState): ContentModule | null =>
  state.content.selectedModule;
export const selectListStatus = (state: RootState): LoadingStatus => state.content.listStatus;
export const selectDetailStatus = (state: RootState): LoadingStatus =>
  state.content.detailStatus;
export const selectMutationStatus = (state: RootState): LoadingStatus =>
  state.content.mutationStatus;
export const selectContentError = (state: RootState): string | null => state.content.error;
export const selectContentFilters = (state: RootState): ModuleFilters => state.content.filters;

/** Modulos criticos primero: en una emergencia el orden importa. */
export const selectModulesBySeverity = createSelector([selectModules], (modules) => {
  const weight: Record<ModuleSeverity, number> = {
    [ModuleSeverity.Critical]: 0,
    [ModuleSeverity.Urgent]: 1,
    [ModuleSeverity.Basic]: 2,
  };

  return [...modules].sort(
    (a, b) => weight[a.severity] - weight[b.severity] || a.order - b.order,
  );
});

export default contentSlice.reducer;
