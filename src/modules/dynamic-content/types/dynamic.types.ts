import type { ContentBlock } from './blocks.types';

/**
 * ===========================================================================
 * JERARQUÍA DE CONTENIDO
 * ===========================================================================
 * Categoría → Módulo → Página → Sección → Bloque.
 *
 * Cuatro niveles fijos, sin anidamiento libre. Un editor de bloques anidables
 * da flexibilidad total y, a cambio, permite construir árboles que nadie puede
 * leer ni mantener. Con estos niveles se cubre lo que el administrador
 * necesita: páginas por tema, agrupadas en secciones, con bloques dentro.
 * ===========================================================================
 */

/** Qué tan urgente es el tema. Define el color de la tarjeta en el catálogo. */
export enum ModuleSeverity {
  Critical = 'critical',
  Urgent = 'urgent',
  Basic = 'basic',
}

export enum ModuleStatus {
  /** Solo lo ve el administrador. */
  Draft = 'draft',
  /** Visible y se puede abrir. */
  Published = 'published',
  /** Visible en el catálogo, en gris y sin abrir. */
  ComingSoon = 'comingSoon',
}

/** Fondo de la sección. Agrupa visualmente sin necesidad de un bloque contenedor. */
export enum SectionVariant {
  /** Sin fondo, sobre el lienzo. */
  Plain = 'plain',
  /** Tarjeta blanca con borde. */
  Card = 'card',
  /** Fondo tintado suave. */
  Tinted = 'tinted',
}

export interface Audited {
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  iconName: string;
  position: number;
}

export interface Section extends Audited {
  id: string;
  pageId: string;
  /** Opcional: una sección puede agrupar sin anunciarse. */
  title: string | null;
  variant: SectionVariant;
  position: number;
  blocks: ContentBlock[];
}

export interface Page extends Audited {
  id: string;
  moduleId: string;
  /**
   * Parte final de la URL. Se deriva del título al crear y se puede editar.
   *
   * Es único por módulo, no global: dos módulos pueden tener una página
   * «senales-de-alarma» sin colisionar.
   */
  slug: string;
  title: string;
  subtitle: string | null;
  /**
   * La portada del módulo. Es una página más, para que el administrador la
   * edite con el mismo editor y pueda ponerle lo que quiera.
   *
   * Solo una por módulo; lo garantiza un índice único parcial en Postgres, no
   * una comprobación de la aplicación.
   */
  isHome: boolean;
  position: number;
  sections: Section[];
}

export interface ContentModule extends Audited {
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconName: string;
  categoryId: string | null;
  /** Se rellena cuando la consulta pide la categoría embebida. */
  category?: Category | null;
  severity: ModuleSeverity;
  status: ModuleStatus;
  tags: string[];
  estimatedMinutes: number;
  position: number;
  /**
   * Versión del esquema de los bloques de este módulo.
   *
   * Sin esto, cambiar la forma de un tipo de bloque obliga a adivinar qué
   * documentos ya se migraron. Ya tropezamos con una versión que se subía a
   * mano y se olvidaba; aquí la escribe el repositorio en cada escritura.
   */
  schemaVersion: number;
  authorId: string | null;
  pages: Page[];
}

/**
 * Módulo sin su contenido. Es lo que necesita el catálogo: pedir las páginas,
 * secciones y bloques de treinta módulos para pintar treinta tarjetas sería
 * traerse la base de datos entera.
 */
export type ModuleSummary = Omit<ContentModule, 'pages'>;

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

export interface MediaAsset {
  id: string;
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  moduleId: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Encuestas
// ---------------------------------------------------------------------------

/**
 * Un grupo de preguntas.
 *
 * Es lo que une varias colocaciones del bloque: el mismo grupo en dos páginas
 * suma sus respuestas en un solo sitio, y el bloque de estadísticas ofrece una
 * lista con nombres en vez de identificadores.
 */
export interface SurveyGroup {
  id: string;
  title: string;
  createdAt: string;
}

/** Una respuesta suelta, tal como la manda el navegador. */
export interface SurveyAnswerDraft {
  questionId: string;
  /** Copia del enunciado: el bloque puede reescribirlo después. */
  questionText: string;
  /** De 1 a 5. */
  value: number;
}

export interface SurveySubmission {
  groupId: string;
  answers: SurveyAnswerDraft[];
}

/** Lo que se pinta: cuántos votos tiene cada valor de cada pregunta. */
export interface SurveyQuestionSummary {
  questionId: string;
  questionText: string;
  /** Cinco posiciones, de 1 a 5. */
  votes: [number, number, number, number, number];
  total: number;
  /** Media de los valores. `null` cuando la pregunta no tiene respuestas. */
  average: number | null;
}

export interface SurveySummary {
  groupId: string;
  /** Envíos, no respuestas: quien contesta 3 de 5 preguntas suma 1 envío. */
  submissions: number;
  questions: SurveyQuestionSummary[];
}

// ---------------------------------------------------------------------------
// Payloads de escritura
// ---------------------------------------------------------------------------

export interface ModuleDraft {
  title: string;
  summary?: string;
  iconName: string;
  categoryId?: string | null;
  severity: ModuleSeverity;
  status: ModuleStatus;
  tags?: string[];
  estimatedMinutes?: number;
  /** Si se omite, se deriva del título. */
  slug?: string;
}

export interface PageDraft {
  title: string;
  subtitle?: string | null;
  slug?: string;
  isHome?: boolean;
}

export interface SectionDraft {
  title?: string | null;
  variant?: SectionVariant;
}

/**
 * Un bloque al crearse o editarse.
 *
 * `data` va sin tipar aquí porque el editor construye un objeto genérico y es
 * el validador quien decide si encaja con lo que `kind` promete. Tiparlo como
 * la unión obligaría al editor a producir un bloque válido antes de poder
 * validarlo, que es el orden inverso.
 */
export interface BlockDraft {
  kind: string;
  data: Record<string, unknown>;
}

export interface ModuleFilters {
  query?: string;
  categoryId?: string;
  severity?: ModuleSeverity;
  /** Solo el administrador ve los borradores. */
  includeDrafts?: boolean;
}

/** Nueva posición de un elemento. Lo que emiten los botones de reordenar. */
export interface ReorderItem {
  id: string;
  position: number;
}

// ---------------------------------------------------------------------------
// Contrato de persistencia
// ---------------------------------------------------------------------------

/**
 * Lo que la interfaz puede pedirle al almacén.
 *
 * El driver se elige en `dynamic.service.ts` según configuración: `supabase`
 * contra Postgres, `local` contra localStorage para trabajar sin red. Ni los
 * thunks ni los componentes saben cuál está activo.
 *
 * Las operaciones de bloque y sección devuelven el MÓDULO completo, no solo lo
 * tocado. Es un viaje más de red a cambio de que el estado de Redux no pueda
 * quedar a medias: tras guardar un bloque, lo que hay en memoria es
 * exactamente lo que hay en la base.
 */
export interface DynamicContentRepository {
  // --- Categorías ---
  listCategories(): Promise<Category[]>;

  // --- Catálogo ---
  listModules(filters?: ModuleFilters): Promise<ModuleSummary[]>;
  getModuleBySlug(slug: string): Promise<ContentModule>;
  getModuleById(moduleId: string): Promise<ContentModule>;

  // --- Módulos ---
  createModule(draft: ModuleDraft): Promise<ContentModule>;
  updateModule(moduleId: string, draft: Partial<ModuleDraft>): Promise<ContentModule>;
  deleteModule(moduleId: string): Promise<void>;
  reorderModules(items: ReorderItem[]): Promise<ModuleSummary[]>;

  /**
   * NOTA SOBRE `moduleId` EN LAS MUTACIONES DE HIJOS
   *
   * Todas reciben el `moduleId` además del id del elemento, aunque parezca
   * redundante. Dos razones:
   *
   * 1. Devuelven el módulo completo, y sin este dato habría que resolverlo
   *    subiendo la jerarquía con una consulta extra por cada guardado.
   * 2. El editor siempre lo sabe: está editando un módulo concreto.
   */

  // --- Páginas ---
  createPage(moduleId: string, draft: PageDraft): Promise<ContentModule>;
  updatePage(moduleId: string, pageId: string, draft: Partial<PageDraft>): Promise<ContentModule>;
  deletePage(moduleId: string, pageId: string): Promise<ContentModule>;
  reorderPages(moduleId: string, items: ReorderItem[]): Promise<ContentModule>;

  // --- Secciones ---
  createSection(moduleId: string, pageId: string, draft: SectionDraft): Promise<ContentModule>;
  updateSection(
    moduleId: string,
    sectionId: string,
    draft: Partial<SectionDraft>,
  ): Promise<ContentModule>;
  deleteSection(moduleId: string, sectionId: string): Promise<ContentModule>;
  reorderSections(moduleId: string, items: ReorderItem[]): Promise<ContentModule>;

  // --- Bloques ---
  createBlock(moduleId: string, sectionId: string, draft: BlockDraft): Promise<ContentModule>;
  updateBlock(
    moduleId: string,
    blockId: string,
    draft: Partial<BlockDraft>,
  ): Promise<ContentModule>;
  deleteBlock(moduleId: string, blockId: string): Promise<ContentModule>;
  reorderBlocks(moduleId: string, items: ReorderItem[]): Promise<ContentModule>;

  // --- Encuestas ---
  /** Grupos existentes. Los necesita el formulario para ofrecer una lista. */
  listSurveyGroups(): Promise<SurveyGroup[]>;
  createSurveyGroup(title: string): Promise<SurveyGroup>;

  /**
   * Envía las respuestas de un visitante. Es la ÚNICA escritura que no exige
   * ser administrador: quien lee el contenido es anónimo.
   */
  submitSurveyAnswers(submission: SurveySubmission): Promise<void>;

  /** Recuento por pregunta y valor. Solo responde al administrador. */
  getSurveySummary(groupId: string): Promise<SurveySummary>;

  // --- Archivos ---
  uploadMedia(file: File, moduleId: string | null, alt: string): Promise<MediaAsset>;

  /**
   * Borra archivos del almacenamiento y sus registros.
   *
   * Es una limpieza, no una acción del administrador: no falla hacia fuera.
   * Si el almacenamiento no responde, el archivo se queda y se registra el
   * aviso; abortar por eso dejaría el contenido a medio borrar, que es peor.
   *
   * Los borrados de contenido (módulo, página, sección, bloque) ya arrastran
   * sus archivos por su cuenta. Esto es para los que nunca llegaron a usarse:
   * se sube una imagen y se cancela el formulario.
   */
  discardMedia(mediaIds: string[]): Promise<void>;
}
