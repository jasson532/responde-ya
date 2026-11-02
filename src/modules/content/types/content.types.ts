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

/**
 * Visibilidad del módulo. Es un solo eje a propósito: un módulo está oculto,
 * abierto o anunciado, nunca dos cosas a la vez. Un booleano `comingSoon` al
 * lado de `status` serían dos campos describiendo el mismo hecho, y acabarían
 * desincronizados.
 */
export enum ModuleStatus {
  /** Solo lo ve el administrador. */
  Draft = 'draft',
  /** Visible y se puede abrir. */
  Published = 'published',
  /** Visible en el catálogo pero sin abrir: se anuncia, no se consulta. */
  ComingSoon = 'comingSoon',
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
  /** Cifras grandes: lo que hay que recordar de un vistazo. */
  Stats = 'stats',
  /** Metronomo visual para marcar el ritmo de las compresiones. */
  Metronome = 'metronome',
  /** Dos columnas enfrentadas: lo que si y lo que nunca. */
  DoDont = 'doDont',
  /** Fichas con icono, titular y detalle: señales que reconocer o indicaciones. */
  KeyPoints = 'keyPoints',
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

export interface StatItem {
  id: string;
  /** La cifra, grande. Ej. «100-120», «5 cm». */
  value: string;
  /** Que mide, pequeno. Ej. «por minuto». */
  label: string;
}

/**
 * Cifras clave en grande. Sustituye a los parrafos del tipo «comprime entre 100
 * y 120 veces por minuto hundiendo el pecho unos 5 cm»: el dato se busca con la
 * vista, no se lee.
 */
export interface StatsBlock extends BlockBase {
  kind: ContentBlockKind.Stats;
  title?: string;
  stats: StatItem[];
}

/**
 * Metronomo visual. Un circulo que late al ritmo indicado para comprimir a la
 * vez. Ninguna descripcion escrita del ritmo sirve de esto.
 */
export interface MetronomeBlock extends BlockBase {
  kind: ContentBlockKind.Metronome;
  /** Pulsaciones por minuto. Para RCP de adulto, entre 100 y 120. */
  beatsPerMinute: number;
  title?: string;
  /** Pie breve. Ej. «Comprime en cada pulso». */
  hint?: string;
  /**
   * Cada cuantos segundos avisar de relevar a quien comprime.
   * Las guias recomiendan unos 120 s: pasado ese tiempo la calidad cae por
   * fatiga sin que la persona lo note. Omitirlo desactiva el aviso.
   */
  relaySeconds?: number;
}

export interface DoDontItem {
  id: string;
  text: string;
}

/**
 * Lo que si y lo que nunca, enfrentados. Condensa varias advertencias sueltas
 * en una sola lectura comparativa.
 */
export interface DoDontBlock extends BlockBase {
  kind: ContentBlockKind.DoDont;
  doTitle?: string;
  dontTitle?: string;
  doItems: DoDontItem[];
  dontItems: DoDontItem[];
}

/**
 * Intención de una ficha. Decide el icono y el color, nada más.
 *
 * No se llama por el color (`red`, `blue`) a propósito: el día que cambie la
 * paleta, un valor llamado `red` guardado en el navegador de alguien seguiría
 * diciendo «rojo» cuando ya no lo sea.
 */
export enum KeyPointTone {
  /** Señal de alarma. Lo que indica que hay una emergencia. */
  Alert = 'alert',
  /** Algo que hay que comprobar o que puede confundir. */
  Question = 'question',
  /** Acción correcta, confirmada. */
  Check = 'check',
}

export interface KeyPointItem {
  id: string;
  tone: KeyPointTone;
  /** El titular, en negrita. Ej. «No responde». */
  title: string;
  /** La explicación corta. Ej. «No reacciona al hablarle…». */
  detail: string;
}

/**
 * Fichas con icono, titular y detalle.
 *
 * Es el patrón que el prototipo repite en dos pantallas: las señales del paro
 * («No responde», «No respira normalmente») y las indicaciones al llamar
 * («Comunica la emergencia», «Sigue las indicaciones»). No sirve un
 * `Checklist`, que es marcable, ni `Steps`, que implica un orden obligatorio.
 */
export interface KeyPointsBlock extends BlockBase {
  kind: ContentBlockKind.KeyPoints;
  title?: string;
  points: KeyPointItem[];
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
  | EmergencyCallBlock
  | StatsBlock
  | MetronomeBlock
  | DoDontBlock
  | KeyPointsBlock;

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
