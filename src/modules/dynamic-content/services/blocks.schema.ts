import logger from 'modules/shared/services/logger/logger';
import {
  BlockKind,
  BlockTone,
  type AccordionData,
  type BlockDataByKind,
  type CalloutData,
  type ChecklistData,
  type ContentBlock,
  type DoDontData,
  type EmbedData,
  type EmergencyCallData,
  type GalleryData,
  type HeadingData,
  type ImageData,
  type KeyPointsData,
  type MediaRef,
  type MetronomeData,
  type PageLinksData,
  type QuizData,
  type StatsData,
  type StepsData,
  type TableData,
  type TextData,
} from 'modules/dynamic-content/types/blocks.types';
import {
  bool,
  httpUrl,
  isObject,
  itemId,
  list,
  num,
  oneOf,
  optNum,
  optOneOf,
  optStr,
  phone,
  str,
  strList,
} from './dynamic.primitives';

/**
 * ===========================================================================
 * VALIDACIÓN DE BLOQUES
 * ===========================================================================
 * Postgres guarda el contenido de cada bloque en una columna `jsonb` y solo
 * garantiza que sea un objeto. La forma la garantiza este archivo.
 *
 * Se valida al ESCRIBIR y al LEER. Validar solo al escribir deja desprotegido
 * todo lo que ya está guardado: un cambio de forma en un tipo de bloque, una
 * fila editada a mano en el panel de Supabase o un dato de una versión
 * anterior entrarían sin pasar por aquí.
 *
 * Un bloque que no valida se descarta y se registra. Nunca se lanza: la
 * pantalla tiene que seguir mostrando los bloques que sí están bien.
 * ===========================================================================
 */

const TONES = Object.values(BlockTone);

// ---------------------------------------------------------------------------
// Piezas compartidas
// ---------------------------------------------------------------------------

/**
 * Referencia a un archivo de Storage.
 *
 * La URL es obligatoria porque es lo único imprescindible para pintar. El
 * `mediaId` puede faltar —una imagen cargada antes de que existiera la tabla
 * `media`, o una URL externa— y entonces se queda en `null`: eso solo impide
 * la limpieza de huérfanos, no la visualización.
 */
const parseMediaRef = (value: unknown): MediaRef | null => {
  if (!isObject(value)) return null;

  const url = httpUrl(value.url);
  if (url === null) return null;

  return {
    mediaId: str(value.mediaId, 80) ?? null,
    url,
    // El texto alternativo puede estar vacío: una imagen decorativa lleva
    // `alt=""` a propósito. Lo que no puede es faltar el atributo.
    alt: typeof value.alt === 'string' ? value.alt.trim() : '',
    width: optNum(value.width, 1, 20000) ?? undefined,
    height: optNum(value.height, 1, 20000) ?? undefined,
    placeholder: optStr(value.placeholder, 4000) ?? undefined,
  };
};

// ---------------------------------------------------------------------------
// Un guarda por tipo de bloque
// ---------------------------------------------------------------------------

const parseHeading = (d: Record<string, unknown>): HeadingData | null => {
  const text = str(d.text, 200);
  if (text === null) return null;

  return {
    text,
    level: oneOf(String(d.level), ['2', '3']) === '3' ? 3 : 2,
    align: optOneOf(d.align, ['start', 'center'] as const) ?? undefined,
  };
};

const parseText = (d: Record<string, unknown>): TextData | null => {
  const text = str(d.text, 5000);
  if (text === null) return null;

  return {
    text,
    align: optOneOf(d.align, ['start', 'center'] as const) ?? undefined,
    isLead: bool(d.isLead, false),
  };
};

const parseDivider = (): Record<string, never> => ({});

const parseImage = (d: Record<string, unknown>): ImageData | null => {
  const media = parseMediaRef(d.media);
  if (media === null) return null;

  return {
    media,
    caption: optStr(d.caption, 300) ?? undefined,
    fit: optOneOf(d.fit, ['contain', 'cover'] as const) ?? undefined,
    // Tope de 4000: por encima de eso no es un tamaño de visualización sino un
    // error de tecleo, y un valor absurdo descuadraría la página entera.
    displayWidth: optNum(d.displayWidth, 16, 4000) ?? undefined,
    displayHeight: optNum(d.displayHeight, 16, 4000) ?? undefined,
  };
};

const parseGallery = (d: Record<string, unknown>): GalleryData | null => {
  const items = list(d.items, parseMediaRef, 24);
  if (items.length === 0) return null;

  return {
    items,
    columns: d.columns === 3 ? 3 : 2,
  };
};

const parseEmbed = (d: Record<string, unknown>): EmbedData | null => {
  const url = httpUrl(d.url);
  const title = str(d.title, 200);
  if (url === null || title === null) return null;

  return {
    url,
    title,
    // `provider` por defecto: es lo que había antes de poder subir archivos,
    // así que los bloques ya guardados siguen interpretándose igual.
    source: optOneOf(d.source, ['provider', 'file'] as const) ?? 'provider',
    mediaId: str(d.mediaId, 80) ?? null,
    width: optNum(d.width, 16, 8000) ?? undefined,
    height: optNum(d.height, 16, 8000) ?? undefined,
    posterUrl: httpUrl(d.posterUrl) ?? undefined,
  };
};

const parseCallout = (d: Record<string, unknown>): CalloutData | null => {
  const text = str(d.text, 2000);
  if (text === null) return null;

  return {
    text,
    // Un tono desconocido cae en `neutral` en lugar de invalidar el aviso: el
    // texto de una advertencia importa más que su color.
    tone: oneOf(d.tone, TONES) ?? BlockTone.Neutral,
    title: optStr(d.title, 200) ?? undefined,
  };
};

const parseKeyPoints = (d: Record<string, unknown>): KeyPointsData | null => {
  const points = list(
    d.points,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const title = str(raw.title, 200);
      if (title === null) return null;

      return {
        id: itemId(raw.id, index, 'kp'),
        title,
        detail: str(raw.detail, 600) ?? '',
        tone: oneOf(raw.tone, TONES) ?? BlockTone.Neutral,
      };
    },
    20,
  );

  return points.length === 0 ? null : { points, title: optStr(d.title, 200) ?? undefined };
};

const parseStats = (d: Record<string, unknown>): StatsData | null => {
  const stats = list(
    d.stats,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const value = str(raw.value, 40);
      if (value === null) return null;

      return {
        id: itemId(raw.id, index, 'st'),
        value,
        label: str(raw.label, 120) ?? '',
      };
    },
    6,
  );

  return stats.length === 0 ? null : { stats, title: optStr(d.title, 200) ?? undefined };
};

const parseSteps = (d: Record<string, unknown>): StepsData | null => {
  const steps = list(
    d.steps,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const title = str(raw.title, 200);
      if (title === null) return null;

      return {
        id: itemId(raw.id, index, 'stp'),
        title,
        description: str(raw.description, 1000) ?? '',
        media: parseMediaRef(raw.media) ?? undefined,
        durationSeconds: optNum(raw.durationSeconds, 1, 3600) ?? undefined,
      };
    },
    30,
  );

  return steps.length === 0 ? null : { steps, title: optStr(d.title, 200) ?? undefined };
};

const parseChecklist = (d: Record<string, unknown>): ChecklistData | null => {
  const items = list(
    d.items,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const text = str(raw.text, 300);
      return text === null ? null : { id: itemId(raw.id, index, 'chk'), text };
    },
    30,
  );

  return items.length === 0 ? null : { items, title: optStr(d.title, 200) ?? undefined };
};

const parseDoDont = (d: Record<string, unknown>): DoDontData | null => {
  const parseSide = (value: unknown, prefix: string) =>
    list(
      value,
      (raw, index) => {
        if (!isObject(raw)) return null;
        const text = str(raw.text, 300);
        return text === null ? null : { id: itemId(raw.id, index, prefix), text };
      },
      15,
    );

  const doItems = parseSide(d.doItems, 'do');
  const dontItems = parseSide(d.dontItems, 'dont');

  // Basta con que una columna tenga contenido: a veces solo hay prohibiciones.
  if (doItems.length === 0 && dontItems.length === 0) return null;

  return {
    doItems,
    dontItems,
    doTitle: optStr(d.doTitle, 120) ?? undefined,
    dontTitle: optStr(d.dontTitle, 120) ?? undefined,
  };
};

const parseAccordion = (d: Record<string, unknown>): AccordionData | null => {
  const items = list(
    d.items,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const question = str(raw.question, 300);
      if (question === null) return null;

      return {
        id: itemId(raw.id, index, 'acc'),
        question,
        answer: str(raw.answer, 3000) ?? '',
      };
    },
    30,
  );

  return items.length === 0 ? null : { items, title: optStr(d.title, 200) ?? undefined };
};

const parseTable = (d: Record<string, unknown>): TableData | null => {
  const headers = strList(d.headers, 8);
  if (headers.length === 0) return null;

  /**
   * Cada fila se ajusta al número de cabeceras: se rellenan las celdas que
   * falten y se recortan las que sobren. Una tabla con filas de distinta
   * longitud rompe la rejilla al pintarla, y descartar la fila entera perdería
   * datos que el administrador escribió.
   */
  const rows = list(
    d.rows,
    (raw) => {
      if (!Array.isArray(raw)) return null;
      const cells = headers.map((_, index) =>
        typeof raw[index] === 'string' ? (raw[index] as string).trim() : '',
      );
      return cells.some((cell) => cell.length > 0) ? cells : null;
    },
    60,
  );

  return rows.length === 0 ? null : { headers, rows, title: optStr(d.title, 200) ?? undefined };
};

const parseQuiz = (d: Record<string, unknown>): QuizData | null => {
  const question = str(d.question, 500);
  if (question === null) return null;

  const options = list(
    d.options,
    (raw, index) => {
      if (!isObject(raw)) return null;
      const text = str(raw.text, 300);
      return text === null
        ? null
        : { id: itemId(raw.id, index, 'opt'), text, isCorrect: bool(raw.isCorrect, false) };
    },
    8,
  );

  // Dos opciones como mínimo y al menos una correcta: sin eso no hay pregunta
  // que responder, solo una lista.
  if (options.length < 2 || !options.some((option) => option.isCorrect)) return null;

  return { question, options, explanation: str(d.explanation, 2000) ?? '' };
};

const parseEmergencyCall = (d: Record<string, unknown>): EmergencyCallData | null => {
  const phoneNumber = phone(d.phoneNumber);
  if (phoneNumber === null) return null;

  return { phoneNumber, label: str(d.label, 120) ?? 'Pide ayuda' };
};

const parseMetronome = (d: Record<string, unknown>): MetronomeData | null => {
  // Fuera de 30-220 no es un ritmo que un cuerpo humano pueda seguir, y un
  // valor absurdo haría sonar el audio a una frecuencia inútil.
  const beatsPerMinute = num(d.beatsPerMinute, 30, 220);
  if (beatsPerMinute === null) return null;

  return {
    beatsPerMinute,
    title: optStr(d.title, 200) ?? undefined,
    hint: optStr(d.hint, 300) ?? undefined,
    relaySeconds: optNum(d.relaySeconds, 10, 600) ?? undefined,
  };
};

const parsePageLinks = (d: Record<string, unknown>): PageLinksData | null => {
  const items = list(
    d.items,
    (raw, index) => {
      if (!isObject(raw)) return null;
      // El `pageId` es lo único imprescindible: sin él la ficha no lleva a
      // ninguna parte. El resto se toma de la página referenciada.
      const pageId = str(raw.pageId, 80);
      if (pageId === null) return null;

      return {
        id: itemId(raw.id, index, 'lnk'),
        pageId,
        label: optStr(raw.label, 200) ?? undefined,
        description: optStr(raw.description, 300) ?? undefined,
        iconName: optStr(raw.iconName, 80) ?? undefined,
      };
    },
    30,
  );

  const source = optOneOf(d.source, ['auto', 'manual'] as const) ?? 'auto';

  /**
   * En modo automático la lista vacía es válida: las fichas las resuelve el
   * renderizador con las páginas del módulo. En manual hace falta al menos
   * una, porque si no el bloque no apunta a ninguna parte.
   */
  if (source === 'manual' && items.length === 0) return null;

  return {
    items,
    source,
    title: optStr(d.title, 200) ?? undefined,
    variant: optOneOf(d.variant, ['numbered', 'plain'] as const) ?? undefined,
  };
};

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

/**
 * Un guarda por tipo. El `Record` sobre `BlockKind` obliga a registrar el
 * guarda de cada tipo nuevo: olvidarlo rompe la compilación.
 */
type Guard<K extends BlockKind> = (
  data: Record<string, unknown>,
) => BlockDataByKind[K] | null;

const GUARDS: { [K in BlockKind]: Guard<K> } = {
  [BlockKind.Heading]: parseHeading,
  [BlockKind.Text]: parseText,
  [BlockKind.Divider]: parseDivider,
  [BlockKind.Image]: parseImage,
  [BlockKind.Gallery]: parseGallery,
  [BlockKind.Embed]: parseEmbed,
  [BlockKind.Callout]: parseCallout,
  [BlockKind.KeyPoints]: parseKeyPoints,
  [BlockKind.Stats]: parseStats,
  [BlockKind.Steps]: parseSteps,
  [BlockKind.Checklist]: parseChecklist,
  [BlockKind.DoDont]: parseDoDont,
  [BlockKind.Accordion]: parseAccordion,
  [BlockKind.Table]: parseTable,
  [BlockKind.Quiz]: parseQuiz,
  [BlockKind.EmergencyCall]: parseEmergencyCall,
  [BlockKind.Metronome]: parseMetronome,
  [BlockKind.PageLinks]: parsePageLinks,
};

const KINDS = Object.values(BlockKind);

/** Fila cruda de la tabla `blocks`, antes de validarse. */
export interface RawBlockRow {
  id: string;
  section_id: string;
  kind: string;
  position: number;
  data: unknown;
}

/**
 * Valida una fila y la convierte en un bloque tipado, o devuelve `null`.
 *
 * El `as` del retorno es inevitable: TypeScript no puede seguir la relación
 * entre el `kind` comprobado en tiempo de ejecución y la rama de la unión que
 * le corresponde. El registro `GUARDS` es lo que garantiza que el emparejamiento
 * sea correcto, y está comprobado en compilación.
 */
export const parseBlockRow = (row: RawBlockRow): ContentBlock | null => {
  const kind = oneOf(row.kind, KINDS);

  if (kind === null) {
    logger.warn('Bloque con tipo desconocido, se omite', { id: row.id, kind: row.kind });
    return null;
  }

  if (!isObject(row.data)) {
    logger.warn('Bloque cuyo contenido no es un objeto, se omite', { id: row.id, kind });
    return null;
  }

  const data = (GUARDS[kind] as Guard<BlockKind>)(row.data);

  if (data === null) {
    logger.warn('Bloque con contenido inválido, se omite', { id: row.id, kind });
    return null;
  }

  return {
    id: row.id,
    sectionId: row.section_id,
    position: row.position,
    kind,
    data,
  } as ContentBlock;
};

/** Valida una lista de filas y descarta las que no pasen. */
export const parseBlockRows = (rows: RawBlockRow[]): ContentBlock[] =>
  rows
    .map(parseBlockRow)
    .filter((block): block is ContentBlock => block !== null)
    .sort((a, b) => a.position - b.position);

/**
 * Valida el contenido que el editor quiere guardar.
 *
 * Devuelve el objeto saneado —sin campos de más, con los textos recortados— o
 * `null` si no cumple. El repositorio no debe escribir nada que esto rechace:
 * es la única barrera antes de Postgres, que solo comprueba que sea un objeto.
 */
export const sanitizeBlockData = (
  kind: string,
  data: Record<string, unknown>,
): Record<string, unknown> | null => {
  const validKind = oneOf(kind, KINDS);
  if (validKind === null) return null;

  const parsed = (GUARDS[validKind] as Guard<BlockKind>)(data);
  return parsed === null ? null : (parsed as unknown as Record<string, unknown>);
};
