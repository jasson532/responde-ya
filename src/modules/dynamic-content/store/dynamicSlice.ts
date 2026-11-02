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
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import {
  ModuleSeverity,
  type BlockDraft,
  type Category,
  type ContentModule,
  type MediaAsset,
  type ModuleDraft,
  type ModuleFilters,
  type ModuleSummary,
  type Page,
  type PageDraft,
  type ReorderItem,
  type SectionDraft,
} from 'modules/dynamic-content/types/dynamic.types';

export interface DynamicContentState {
  categories: Category[];
  /** Catálogo: módulos SIN su contenido. */
  modules: ModuleSummary[];
  /** El módulo abierto, con todas sus páginas, secciones y bloques. */
  selectedModule: ContentModule | null;
  categoriesStatus: LoadingStatus;
  listStatus: LoadingStatus;
  detailStatus: LoadingStatus;
  /** Estado de las escrituras del administrador, en bloque. */
  mutationStatus: LoadingStatus;
  error: string | null;
  filters: ModuleFilters;
  /** Última imagen subida, para que el editor la inserte en el bloque. */
  lastUpload: MediaAsset | null;
}

const initialState: DynamicContentState = {
  categories: [],
  modules: [],
  selectedModule: null,
  categoriesStatus: LoadingStatus.Idle,
  listStatus: LoadingStatus.Idle,
  detailStatus: LoadingStatus.Idle,
  mutationStatus: LoadingStatus.Idle,
  error: null,
  filters: {},
  lastUpload: null,
};

// ---------------------------------------------------------------------------
// Lectura
// ---------------------------------------------------------------------------

export const fetchCategories = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'dynamic/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await (await getRepository()).listCategories();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'No pudimos cargar las categorías.'));
    }
  },
);

export const fetchDynamicModules = createAsyncThunk<
  ModuleSummary[],
  ModuleFilters | undefined,
  { rejectValue: string }
>('dynamic/fetchModules', async (filters, { rejectWithValue }) => {
  try {
    return await (await getRepository()).listModules(filters);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos cargar los módulos.'));
  }
});

export const fetchDynamicModuleBySlug = createAsyncThunk<
  ContentModule,
  string,
  { rejectValue: string }
>('dynamic/fetchModuleBySlug', async (slug, { rejectWithValue }) => {
  try {
    return await (await getRepository()).getModuleBySlug(slug);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos abrir este módulo.'));
  }
});

export const fetchDynamicModuleById = createAsyncThunk<
  ContentModule,
  string,
  { rejectValue: string }
>('dynamic/fetchModuleById', async (moduleId, { rejectWithValue }) => {
  try {
    return await (await getRepository()).getModuleById(moduleId);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos abrir este módulo.'));
  }
});

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------

/**
 * Fábrica para las mutaciones que devuelven el módulo completo.
 *
 * Son catorce y todas comparten la misma estructura: llamar al repositorio,
 * envolver el fallo en un mensaje legible. Escribirlas a mano serían unas
 * doscientas líneas idénticas salvo por una llamada, y cada una un sitio más
 * donde olvidarse del `try`.
 *
 * El nombre de la acción se mantiene explícito porque es lo que aparece en las
 * herramientas de desarrollo de Redux: un nombre genérico haría ilegible la
 * traza de acciones.
 */
const moduleMutation = <Arg>(
  name: string,
  run: (arg: Arg) => Promise<ContentModule>,
  fallback: string,
) =>
  createAsyncThunk<ContentModule, Arg, { rejectValue: string }>(
    `dynamic/${name}`,
    async (arg, { rejectWithValue }) => {
      try {
        return await run(arg);
      } catch (error) {
        return rejectWithValue(toErrorMessage(error, fallback));
      }
    },
  );

// --- Módulos ---

export const createDynamicModule = createAsyncThunk<
  ContentModule,
  ModuleDraft,
  { rejectValue: string }
>('dynamic/createModule', async (draft, { rejectWithValue }) => {
  try {
    return await (await getRepository()).createModule(draft);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos crear el módulo.'));
  }
});

export const updateDynamicModule = moduleMutation<{
  moduleId: string;
  draft: Partial<ModuleDraft>;
}>(
  'updateModule',
  async ({ moduleId, draft }) => (await getRepository()).updateModule(moduleId, draft),
  'No pudimos guardar los cambios del módulo.',
);

export const deleteDynamicModule = createAsyncThunk<string, string, { rejectValue: string }>(
  'dynamic/deleteModule',
  async (moduleId, { rejectWithValue }) => {
    try {
      await (await getRepository()).deleteModule(moduleId);
      return moduleId;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'No pudimos eliminar el módulo.'));
    }
  },
);

export const reorderDynamicModules = createAsyncThunk<
  ModuleSummary[],
  ReorderItem[],
  { rejectValue: string }
>('dynamic/reorderModules', async (items, { rejectWithValue }) => {
  try {
    return await (await getRepository()).reorderModules(items);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos reordenar los módulos.'));
  }
});

// --- Páginas ---

export const createPage = moduleMutation<{ moduleId: string; draft: PageDraft }>(
  'createPage',
  async ({ moduleId, draft }) => (await getRepository()).createPage(moduleId, draft),
  'No pudimos crear la página.',
);

export const updatePage = moduleMutation<{
  moduleId: string;
  pageId: string;
  draft: Partial<PageDraft>;
}>(
  'updatePage',
  async ({ moduleId, pageId, draft }) => (await getRepository()).updatePage(moduleId, pageId, draft),
  'No pudimos guardar la página.',
);

export const deletePage = moduleMutation<{ moduleId: string; pageId: string }>(
  'deletePage',
  async ({ moduleId, pageId }) => (await getRepository()).deletePage(moduleId, pageId),
  'No pudimos eliminar la página.',
);

export const reorderPages = moduleMutation<{ moduleId: string; items: ReorderItem[] }>(
  'reorderPages',
  async ({ moduleId, items }) => (await getRepository()).reorderPages(moduleId, items),
  'No pudimos reordenar las páginas.',
);

// --- Secciones ---

export const createSection = moduleMutation<{
  moduleId: string;
  pageId: string;
  draft: SectionDraft;
}>(
  'createSection',
  async ({ moduleId, pageId, draft }) => (await getRepository()).createSection(moduleId, pageId, draft),
  'No pudimos crear la sección.',
);

export const updateSection = moduleMutation<{
  moduleId: string;
  sectionId: string;
  draft: Partial<SectionDraft>;
}>(
  'updateSection',
  async ({ moduleId, sectionId, draft }) => (await getRepository()).updateSection(moduleId, sectionId, draft),
  'No pudimos guardar la sección.',
);

export const deleteSection = moduleMutation<{ moduleId: string; sectionId: string }>(
  'deleteSection',
  async ({ moduleId, sectionId }) => (await getRepository()).deleteSection(moduleId, sectionId),
  'No pudimos eliminar la sección.',
);

export const reorderSections = moduleMutation<{ moduleId: string; items: ReorderItem[] }>(
  'reorderSections',
  async ({ moduleId, items }) => (await getRepository()).reorderSections(moduleId, items),
  'No pudimos reordenar las secciones.',
);

// --- Bloques ---

export const createBlock = moduleMutation<{
  moduleId: string;
  sectionId: string;
  draft: BlockDraft;
}>(
  'createBlock',
  async ({ moduleId, sectionId, draft }) => (await getRepository()).createBlock(moduleId, sectionId, draft),
  'No pudimos añadir el bloque.',
);

export const updateBlock = moduleMutation<{
  moduleId: string;
  blockId: string;
  draft: Partial<BlockDraft>;
}>(
  'updateBlock',
  async ({ moduleId, blockId, draft }) => (await getRepository()).updateBlock(moduleId, blockId, draft),
  'No pudimos guardar el bloque.',
);

export const deleteBlock = moduleMutation<{ moduleId: string; blockId: string }>(
  'deleteBlock',
  async ({ moduleId, blockId }) => (await getRepository()).deleteBlock(moduleId, blockId),
  'No pudimos eliminar el bloque.',
);

export const reorderBlocks = moduleMutation<{ moduleId: string; items: ReorderItem[] }>(
  'reorderBlocks',
  async ({ moduleId, items }) => (await getRepository()).reorderBlocks(moduleId, items),
  'No pudimos reordenar los bloques.',
);

// --- Archivos ---

export const uploadMedia = createAsyncThunk<
  MediaAsset,
  { file: File; moduleId: string | null; alt: string },
  { rejectValue: string }
>('dynamic/uploadMedia', async ({ file, moduleId, alt }, { rejectWithValue }) => {
  try {
    return await (await getRepository()).uploadMedia(file, moduleId, alt);
  } catch (error) {
    return rejectWithValue(toErrorMessage(error, 'No pudimos subir la imagen.'));
  }
});

export const deleteMedia = createAsyncThunk<string, string, { rejectValue: string }>(
  'dynamic/deleteMedia',
  async (mediaId, { rejectWithValue }) => {
    try {
      await (await getRepository()).deleteMedia(mediaId);
      return mediaId;
    } catch (error) {
      return rejectWithValue(toErrorMessage(error, 'No pudimos eliminar la imagen.'));
    }
  },
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

/**
 * Todas las mutaciones que devuelven el módulo completo.
 *
 * Se listan para derivar su estado de carga y su resultado en bloque, en vez
 * de repetir tres `addCase` por cada una. El repositorio devuelve el módulo
 * entero precisamente para que el reducer sea este reemplazo y no pueda quedar
 * desincronizado con la base.
 */
const MODULE_MUTATIONS = [
  createDynamicModule,
  updateDynamicModule,
  createPage,
  updatePage,
  deletePage,
  reorderPages,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
] as const;

/** Las que no devuelven el módulo, pero sí cuentan como escritura en curso. */
const OTHER_MUTATIONS = [
  deleteDynamicModule,
  reorderDynamicModules,
  uploadMedia,
  deleteMedia,
] as const;

const dynamicSlice = createSlice({
  name: 'dynamic',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<ModuleFilters>) {
      state.filters = action.payload;
    },
    clearSelectedModule(state) {
      state.selectedModule = null;
      state.detailStatus = LoadingStatus.Idle;
    },
    clearError(state) {
      state.error = null;
    },
    /** El editor lo llama tras insertar la imagen en un bloque. */
    clearLastUpload(state) {
      state.lastUpload = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- categorías ---
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesStatus = LoadingStatus.Pending;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesStatus = LoadingStatus.Succeeded;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesStatus = LoadingStatus.Failed;
        state.error = action.payload ?? 'No pudimos cargar las categorías.';
      })

      // --- catálogo ---
      .addCase(fetchDynamicModules.pending, (state) => {
        state.listStatus = LoadingStatus.Pending;
        state.error = null;
      })
      .addCase(fetchDynamicModules.fulfilled, (state, action) => {
        state.listStatus = LoadingStatus.Succeeded;
        state.modules = action.payload;
      })
      .addCase(fetchDynamicModules.rejected, (state, action) => {
        state.listStatus = LoadingStatus.Failed;
        state.error = action.payload ?? 'No pudimos cargar los módulos.';
      })

      // --- detalle ---
      .addCase(deleteDynamicModule.fulfilled, (state, action) => {
        state.mutationStatus = LoadingStatus.Succeeded;
        state.modules = state.modules.filter((module) => module.id !== action.payload);
        if (state.selectedModule?.id === action.payload) state.selectedModule = null;
      })
      .addCase(reorderDynamicModules.fulfilled, (state, action) => {
        state.mutationStatus = LoadingStatus.Succeeded;
        state.modules = action.payload;
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        state.mutationStatus = LoadingStatus.Succeeded;
        state.lastUpload = action.payload;
      })
      .addCase(deleteMedia.fulfilled, (state) => {
        state.mutationStatus = LoadingStatus.Succeeded;
      })

      // --- lectura del detalle: dos thunks, un solo resultado ---
      .addMatcher(
        isPending(fetchDynamicModuleBySlug, fetchDynamicModuleById),
        (state) => {
          state.detailStatus = LoadingStatus.Pending;
          state.error = null;
        },
      )
      .addMatcher(
        isFulfilled(fetchDynamicModuleBySlug, fetchDynamicModuleById),
        (state, action) => {
          state.detailStatus = LoadingStatus.Succeeded;
          state.selectedModule = action.payload;
        },
      )
      .addMatcher(
        isRejected(fetchDynamicModuleBySlug, fetchDynamicModuleById),
        (state, action) => {
          state.detailStatus = LoadingStatus.Failed;
          state.error = action.payload ?? 'No pudimos abrir este módulo.';
        },
      )

      // --- mutaciones que devuelven el módulo completo ---
      .addMatcher(isFulfilled(...MODULE_MUTATIONS), (state, action) => {
        state.mutationStatus = LoadingStatus.Succeeded;
        state.error = null;
        state.selectedModule = action.payload;

        /**
         * Si el módulo ya estaba en el catálogo, se actualiza su resumen. Sin
         * esto, renombrar un módulo desde el editor deja el título viejo en la
         * lista hasta recargarla.
         */
        const index = state.modules.findIndex((item) => item.id === action.payload.id);
        const { pages: _pages, ...summary } = action.payload;
        if (index === -1) {
          state.modules.push(summary);
        } else {
          state.modules[index] = summary;
        }
      })

      // --- estado de carga común a toda escritura ---
      .addMatcher(isPending(...MODULE_MUTATIONS, ...OTHER_MUTATIONS), (state) => {
        state.mutationStatus = LoadingStatus.Pending;
        state.error = null;
      })
      .addMatcher(isRejected(...MODULE_MUTATIONS, ...OTHER_MUTATIONS), (state, action) => {
        state.mutationStatus = LoadingStatus.Failed;
        state.error =
          (action.payload as string | undefined) ?? 'La operación no se pudo completar.';
      });
  },
});

export const { setFilters, clearSelectedModule, clearError, clearLastUpload } =
  dynamicSlice.actions;

// ---------------------------------------------------------------------------
// Selectores
// ---------------------------------------------------------------------------

const root = (state: RootState) => state.dynamic;

export const selectCategories = (state: RootState): Category[] => root(state).categories;
export const selectDynamicModules = (state: RootState): ModuleSummary[] =>
  root(state).modules;
export const selectSelectedDynamicModule = (state: RootState): ContentModule | null =>
  root(state).selectedModule;
export const selectDynamicListStatus = (state: RootState): LoadingStatus =>
  root(state).listStatus;
export const selectDynamicDetailStatus = (state: RootState): LoadingStatus =>
  root(state).detailStatus;
export const selectDynamicMutationStatus = (state: RootState): LoadingStatus =>
  root(state).mutationStatus;
export const selectDynamicError = (state: RootState): string | null => root(state).error;
export const selectDynamicFilters = (state: RootState): ModuleFilters =>
  root(state).filters;
export const selectLastUpload = (state: RootState): MediaAsset | null =>
  root(state).lastUpload;

/** Módulos más urgentes primero: en una emergencia el orden importa. */
export const selectModulesBySeverity = createSelector([selectDynamicModules], (modules) => {
  const weight: Record<ModuleSeverity, number> = {
    [ModuleSeverity.Critical]: 0,
    [ModuleSeverity.Urgent]: 1,
    [ModuleSeverity.Basic]: 2,
  };

  return [...modules].sort(
    (a, b) => weight[a.severity] - weight[b.severity] || a.position - b.position,
  );
});

/**
 * La portada del módulo abierto.
 *
 * Cae en la primera página si ninguna está marcada como portada: la base de
 * datos garantiza que no haya DOS, no que haya una. Un módulo importado o
 * editado a mano podría quedarse sin ella, y entrar no debería dar una pantalla
 * en blanco.
 */
export const selectHomePage = createSelector(
  [selectSelectedDynamicModule],
  (module): Page | null => {
    if (module === null) return null;
    return module.pages.find((page) => page.isHome) ?? module.pages[0] ?? null;
  },
);

/** Páginas que NO son la portada, en orden. Es lo que lista el índice. */
export const selectInnerPages = createSelector(
  [selectSelectedDynamicModule],
  (module): Page[] =>
    module === null ? [] : module.pages.filter((page) => !page.isHome),
);

export default dynamicSlice.reducer;
