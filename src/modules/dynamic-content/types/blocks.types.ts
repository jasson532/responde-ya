/**
 * ===========================================================================
 * BIBLIOTECA DE BLOQUES
 * ===========================================================================
 * Cada entrada de `BlockKind` es un componente que el administrador puede
 * insertar en una sección. Un bloque nuevo son tres piezas: su tipo aquí, su
 * componente de lectura y su formulario de edición.
 *
 * En la base de datos todos viven en la misma tabla `blocks`, donde `kind`
 * discrimina y `data` lleva los campos propios. Estos tipos describen lo que
 * va dentro de `data`, y son los que validan los guardas de `blocks.schema.ts`.
 *
 * NOTA SOBRE LOS VALORES: son cadenas en `camelCase` y NO se renombran nunca.
 * Están guardados en filas de Postgres; cambiar uno deja ciegos a todos los
 * bloques ya creados.
 * ===========================================================================
 */

export enum BlockKind {
  // --- Texto ---
  /** Encabezado de nivel 2 o 3 dentro de la página. */
  Heading = 'heading',
  /** Párrafo. Admite marcas en línea simples. */
  Text = 'text',
  /** Separador visual. */
  Divider = 'divider',

  // --- Multimedia ---
  /** Una imagen subida a Storage. */
  Image = 'image',
  /** Varias imágenes en rejilla. */
  Gallery = 'gallery',
  /** Vídeo incrustado por URL (YouTube, Vimeo). */
  Embed = 'embed',

  // --- Destacados ---
  /** Aviso con icono y tono. Generaliza el antiguo `Warning`. */
  Callout = 'callout',
  /** Fichas con icono, titular y detalle. */
  KeyPoints = 'keyPoints',
  /** Cifras grandes que se buscan con la vista. */
  Stats = 'stats',

  // --- Secuencias ---
  /** Pasos numerados. */
  Steps = 'steps',
  /** Lista que el usuario marca mientras actúa. */
  Checklist = 'checklist',
  /** Dos columnas enfrentadas: lo que sí y lo que nunca. */
  DoDont = 'doDont',
  /** Preguntas plegables. */
  Accordion = 'accordion',
  /** Datos en filas y columnas. */
  Table = 'table',

  // --- Interactivos ---
  /** Pregunta de práctica con retroalimentación. */
  Quiz = 'quiz',
  /** Enlace `tel:` a emergencias. */
  EmergencyCall = 'emergencyCall',
  /** Metrónomo audible para marcar un ritmo. */
  Metronome = 'metronome',

  // --- Navegación ---
  /**
   * El índice. Fichas que llevan a otras páginas del mismo módulo.
   *
   * Es un bloque y no una entidad aparte a propósito: así el administrador lo
   * coloca donde quiera, pone dos o no pone ninguno.
   */
  PageLinks = 'pageLinks',
}

/**
 * Intención visual compartida por varios bloques.
 *
 * Nombrada por intención y no por color (`danger`, no `red`): el día que
 * cambie la paleta, un valor «red» guardado en Postgres seguiría diciendo rojo
 * cuando ya no lo sea.
 *
 * Es independiente de la gravedad del módulo. Un módulo «básico» puede tener
 * un aviso de peligro, y uno «riesgo vital» una confirmación en verde.
 */
export enum BlockTone {
  Neutral = 'neutral',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Danger = 'danger',
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

export interface HeadingData {
  text: string;
  /** 2 o 3. El `h1` lo pone la página con su título, nunca un bloque. */
  level: 2 | 3;
  align?: 'start' | 'center';
}

export interface TextData {
  text: string;
  align?: 'start' | 'center';
  /** `true` para el párrafo de entrada: algo más grande y en tono apagado. */
  isLead?: boolean;
}

export type DividerData = Record<string, never>;

// ---------------------------------------------------------------------------
// Multimedia
// ---------------------------------------------------------------------------

/**
 * Referencia a un archivo de Storage.
 *
 * Guarda la URL para pintar sin una consulta extra Y el `mediaId` para saber
 * qué archivos siguen en uso. Sin el id, borrar el bloque deja el archivo en
 * el bucket para siempre.
 *
 * `width` y `height` son los del archivo original: fijarlos en el `<img>`
 * reserva el hueco y evita que el texto de abajo salte al cargar.
 */
export interface MediaRef {
  mediaId: string | null;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  /** Miniatura diminuta en base64 para pintar borrosa mientras llega la real. */
  placeholder?: string;
}

export interface ImageData {
  media: MediaRef;
  caption?: string;
  /** `contain` respeta la proporción; `cover` recorta al encuadre. */
  fit?: 'contain' | 'cover';
}

export interface GalleryData {
  items: MediaRef[];
  columns?: 2 | 3;
}

export interface EmbedData {
  /** URL de YouTube o Vimeo. El proveedor se deduce al pintar. */
  url: string;
  title: string;
}

// ---------------------------------------------------------------------------
// Destacados
// ---------------------------------------------------------------------------

export interface CalloutData {
  tone: BlockTone;
  title?: string;
  text: string;
}

export interface KeyPointItemData {
  id: string;
  tone: BlockTone;
  title: string;
  detail: string;
}

export interface KeyPointsData {
  title?: string;
  points: KeyPointItemData[];
}

export interface StatItemData {
  id: string;
  /** La cifra, en grande. Ej. «100-120». */
  value: string;
  /** Qué mide, pequeño. Ej. «compresiones por minuto». */
  label: string;
}

export interface StatsData {
  title?: string;
  stats: StatItemData[];
}

// ---------------------------------------------------------------------------
// Secuencias
// ---------------------------------------------------------------------------

export interface StepItemData {
  id: string;
  title: string;
  description: string;
  media?: MediaRef;
  /** Duración sugerida, en segundos. Ej. observar 10 s si respira. */
  durationSeconds?: number;
}

export interface StepsData {
  title?: string;
  steps: StepItemData[];
}

export interface ChecklistItemData {
  id: string;
  text: string;
}

export interface ChecklistData {
  title?: string;
  items: ChecklistItemData[];
}

export interface DoDontItemData {
  id: string;
  text: string;
}

export interface DoDontData {
  doTitle?: string;
  dontTitle?: string;
  doItems: DoDontItemData[];
  dontItems: DoDontItemData[];
}

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionData {
  title?: string;
  items: AccordionItemData[];
}

export interface TableData {
  title?: string;
  headers: string[];
  /** Cada fila debe tener tantas celdas como `headers`. Lo valida el guarda. */
  rows: string[][];
}

// ---------------------------------------------------------------------------
// Interactivos
// ---------------------------------------------------------------------------

export interface QuizOptionData {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizData {
  question: string;
  options: QuizOptionData[];
  /** Se muestra tras responder, acierte o no. */
  explanation: string;
}

export interface EmergencyCallData {
  phoneNumber: string;
  label: string;
}

export interface MetronomeData {
  beatsPerMinute: number;
  title?: string;
  hint?: string;
  /** Cada cuántos segundos avisar de relevar. Omitirlo desactiva el aviso. */
  relaySeconds?: number;
}

// ---------------------------------------------------------------------------
// Navegación
// ---------------------------------------------------------------------------

/**
 * Una ficha del índice.
 *
 * Apunta por `pageId`, NUNCA por ruta. Guardar la ruta crearía dos fuentes de
 * verdad: al renombrar la página su `slug` cambia y el enlace quedaría roto en
 * silencio. La ruta se deriva al pintar, a partir de los slugs actuales.
 *
 * `icon` y `label` son opcionales: si faltan, se toman el icono y el título de
 * la página referenciada, que es lo que se quiere casi siempre.
 */
export interface PageLinkItemData {
  id: string;
  pageId: string;
  label?: string;
  description?: string;
  iconName?: string;
}

export interface PageLinksData {
  title?: string;
  /** `numbered` pinta 01, 02, 03 como el índice del módulo de RCP. */
  variant?: 'numbered' | 'plain';
  /**
   * De dónde salen las fichas.
   *
   * - `auto`: todas las páginas del módulo menos la portada, en su orden. El
   *   índice se mantiene al día solo: crear una página la añade, borrarla la
   *   quita, reordenarlas las reordena.
   * - `manual`: solo las de `items`, con el texto y el orden que se les dé.
   *
   * El automático existe porque mantener a mano una lista que ya está en la
   * base de datos es trabajo que se olvida: se crea una página y el índice se
   * queda sin ella sin que nadie se dé cuenta.
   */
  source?: 'auto' | 'manual';
  items: PageLinkItemData[];
}

// ---------------------------------------------------------------------------
// Unión discriminada
// ---------------------------------------------------------------------------

/**
 * Campos comunes a todo bloque. `position` ordena entre hermanos de la misma
 * sección y es lo que mueven los botones de subir y bajar del editor.
 */
export interface BlockBase {
  id: string;
  sectionId: string;
  position: number;
}

type Block<K extends BlockKind, D> = BlockBase & { kind: K; data: D };

export type HeadingBlock = Block<BlockKind.Heading, HeadingData>;
export type TextBlock = Block<BlockKind.Text, TextData>;
export type DividerBlock = Block<BlockKind.Divider, DividerData>;
export type ImageBlock = Block<BlockKind.Image, ImageData>;
export type GalleryBlock = Block<BlockKind.Gallery, GalleryData>;
export type EmbedBlock = Block<BlockKind.Embed, EmbedData>;
export type CalloutBlock = Block<BlockKind.Callout, CalloutData>;
export type KeyPointsBlock = Block<BlockKind.KeyPoints, KeyPointsData>;
export type StatsBlock = Block<BlockKind.Stats, StatsData>;
export type StepsBlock = Block<BlockKind.Steps, StepsData>;
export type ChecklistBlock = Block<BlockKind.Checklist, ChecklistData>;
export type DoDontBlock = Block<BlockKind.DoDont, DoDontData>;
export type AccordionBlock = Block<BlockKind.Accordion, AccordionData>;
export type TableBlock = Block<BlockKind.Table, TableData>;
export type QuizBlock = Block<BlockKind.Quiz, QuizData>;
export type EmergencyCallBlock = Block<BlockKind.EmergencyCall, EmergencyCallData>;
export type MetronomeBlock = Block<BlockKind.Metronome, MetronomeData>;
export type PageLinksBlock = Block<BlockKind.PageLinks, PageLinksData>;

/**
 * Unión discriminada por `kind`. El renderizador hace un `switch` exhaustivo
 * sobre ella: añadir un miembro aquí sin manejarlo allí rompe la compilación,
 * no la pantalla de alguien buscando cómo hacer una reanimación.
 */
export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | DividerBlock
  | ImageBlock
  | GalleryBlock
  | EmbedBlock
  | CalloutBlock
  | KeyPointsBlock
  | StatsBlock
  | StepsBlock
  | ChecklistBlock
  | DoDontBlock
  | AccordionBlock
  | TableBlock
  | QuizBlock
  | EmergencyCallBlock
  | MetronomeBlock
  | PageLinksBlock;

/** Mapa de `kind` al tipo de su `data`. Lo usan el registro y los editores. */
export interface BlockDataByKind {
  [BlockKind.Heading]: HeadingData;
  [BlockKind.Text]: TextData;
  [BlockKind.Divider]: DividerData;
  [BlockKind.Image]: ImageData;
  [BlockKind.Gallery]: GalleryData;
  [BlockKind.Embed]: EmbedData;
  [BlockKind.Callout]: CalloutData;
  [BlockKind.KeyPoints]: KeyPointsData;
  [BlockKind.Stats]: StatsData;
  [BlockKind.Steps]: StepsData;
  [BlockKind.Checklist]: ChecklistData;
  [BlockKind.DoDont]: DoDontData;
  [BlockKind.Accordion]: AccordionData;
  [BlockKind.Table]: TableData;
  [BlockKind.Quiz]: QuizData;
  [BlockKind.EmergencyCall]: EmergencyCallData;
  [BlockKind.Metronome]: MetronomeData;
  [BlockKind.PageLinks]: PageLinksData;
}
