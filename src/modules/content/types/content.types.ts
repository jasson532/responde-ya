import type { AuditedEntity } from 'modules/shared/types/common.types';

/**
 * NOTA DE NAMING
 * "Módulo" es ambiguo en este proyecto: existe el módulo de codigo
 * (`src/modules/*`) y el módulo de contenido que crea el administrador.
 * La entidad de negocio se llama SIEMPRE `ContentModule` en codigo y
 * se muestra como "módulo" en la interfaz.
 */

/** Que tan urgente es la situacion. Define el color y el orden de prioridad. */
export enum ModuleSeverity {
  /** Riesgo vital: cada segundo cuenta (paro cardiaco, atragantamiento). */
  Critical = 'critical',
  /** Requiere atención rapida pero no es inmediatamente mortal. */
  Urgent = 'urgent',
  /** Primeros auxilios basicos (cortes leves, golpes). */
  Basic = 'basic',
}

export enum ModuleStatus {
  Draft = 'draft',
  Published = 'published',
}

// ---------------------------------------------------------------------------
// Bloques de contenido interactivo
// ---------------------------------------------------------------------------

export enum ContentBlockKind {
  /** Texto explicativo. */
  Paragraph = 'paragraph',
  /** Secuencia de pasos numerados: el corazon de un protocolo. */
  Steps = 'steps',
  /** Advertencia destacada: lo que NUNCA se debe hacer. */
  Warning = 'warning',
  /** Lista verificable que el usuario puede marcar. */
  Checklist = 'checklist',
  /** Imagen o diagrama de apoyo. */
  Image = 'image',
  /** Video demostrativo. */
  Video = 'video',
  /** Pregunta de práctica con retroalimentacion. */
  Quiz = 'quiz',
  /** Boton de llamada directa a emergencias. */
  EmergencyCall = 'emergencyCall',
}

export interface BlockBase {
  id: string;
  order: number;
}

export interface ParagraphBlock extends BlockBase {
  kind: ContentBlockKind.Paragraph;
  text: string;
}

export interface StepItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Duración sugerida del paso, en segundos (ej. 30 compresiones). */
  durationSeconds?: number;
}

export interface StepsBlock extends BlockBase {
  kind: ContentBlockKind.Steps;
  title?: string;
  steps: StepItem[];
}

export interface WarningBlock extends BlockBase {
  kind: ContentBlockKind.Warning;
  text: string;
  /** `true` para errores que pueden agravar a la victima. */
  isCritical: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistBlock extends BlockBase {
  kind: ContentBlockKind.Checklist;
  title?: string;
  items: ChecklistItem[];
}

export interface ImageBlock extends BlockBase {
  kind: ContentBlockKind.Image;
  url: string;
  /** Obligatorio por accesibilidad. */
  alt: string;
  caption?: string;
}

export interface VideoBlock extends BlockBase {
  kind: ContentBlockKind.Video;
  url: string;
  title: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizBlock extends BlockBase {
  kind: ContentBlockKind.Quiz;
  question: string;
  options: QuizOption[];
  /** Se muestra despues de responder, acierte o no. */
  explanation: string;
}

export interface EmergencyCallBlock extends BlockBase {
  kind: ContentBlockKind.EmergencyCall;
  phoneNumber: string;
  label: string;
}

/** Union discriminada por `kind`: el renderer hace exhaustive switch. */
export type ContentBlock =
  | ParagraphBlock
  | StepsBlock
  | WarningBlock
  | ChecklistBlock
  | ImageBlock
  | VideoBlock
  | QuizBlock
  | EmergencyCallBlock;

// ---------------------------------------------------------------------------
// Leccion y módulo
// ---------------------------------------------------------------------------

/** Una leccion es una pantalla de contenido dentro de un módulo. */
export interface Lesson extends AuditedEntity {
  title: string;
  summary: string;
  order: number;
  blocks: ContentBlock[];
}

/** Unidad que crea y administra el rol admin. */
export interface ContentModule extends AuditedEntity {
  title: string;
  slug: string;
  summary: string;
  severity: ModuleSeverity;
  status: ModuleStatus;
  /** Nombre de icono de lucide-react (ej. "HeartPulse"). */
  iconName: string;
  tags: string[];
  estimatedMinutes: number;
  order: number;
  lessons: Lesson[];
  authorId: string;
}

// ---------------------------------------------------------------------------
// Payloads de escritura (solo admin)
// ---------------------------------------------------------------------------

export interface ContentModuleDraft {
  title: string;
  summary: string;
  severity: ModuleSeverity;
  status: ModuleStatus;
  iconName: string;
  tags: string[];
  estimatedMinutes: number;
}

export interface LessonDraft {
  title: string;
  summary: string;
  blocks: ContentBlock[];
}

export interface ModuleFilters {
  query?: string;
  severity?: ModuleSeverity;
  /** Solo admin ve borradores. */
  includeDrafts?: boolean;
}

/**
 * Contrato de persistencia del contenido. La UI y los thunks dependen de esta
 * interfaz; el driver (local o HTTP) se decide en `content.service.ts`.
 */
export interface ContentRepository {
  listModules(filters?: ModuleFilters): Promise<ContentModule[]>;
  getModuleById(moduleId: string): Promise<ContentModule>;
  createModule(draft: ContentModuleDraft, authorId: string): Promise<ContentModule>;
  updateModule(moduleId: string, draft: Partial<ContentModuleDraft>): Promise<ContentModule>;
  deleteModule(moduleId: string): Promise<void>;
  reorderModules(orderedIds: string[]): Promise<ContentModule[]>;

  createLesson(moduleId: string, draft: LessonDraft): Promise<ContentModule>;
  updateLesson(
    moduleId: string,
    lessonId: string,
    draft: Partial<LessonDraft>,
  ): Promise<ContentModule>;
  deleteLesson(moduleId: string, lessonId: string): Promise<ContentModule>;
}
