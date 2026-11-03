import type { ReactNode } from 'react';
import {
  Activity,
  ChartColumn,
  ChevronsDownUp,
  CircleHelp,
  Clapperboard,
  Columns2,
  Heading,
  Image as ImageIcon,
  Images,
  Link2,
  ListChecks,
  ListOrdered,
  MessageSquareWarning,
  Minus,
  PhoneCall,
  SquareCheck,
  Table2,
  Type,
} from 'lucide-react';
import { EMERGENCY_PHONE } from 'modules/shared/constants/emergency';
import {
  BlockKind,
  BlockTone,
  type BlockDataByKind,
} from 'modules/dynamic-content/types/blocks.types';

/**
 * ===========================================================================
 * BIBLIOTECA DE COMPONENTES
 * ===========================================================================
 * El catálogo que ve el administrador al pulsar «añadir componente».
 *
 * Cada entrada define cómo se presenta en la paleta y con qué valores nace el
 * bloque. Añadir un tipo nuevo a `BlockKind` sin registrarlo aquí rompe la
 * compilación: el `Record` cubre toda la enumeración.
 * ===========================================================================
 */

/** Familias de la paleta. Diecisiete componentes en lista plana no se recorren. */
export enum BlockGroup {
  Text = 'text',
  Media = 'media',
  Highlight = 'highlight',
  Sequence = 'sequence',
  Interactive = 'interactive',
  Navigation = 'navigation',
}

export const GROUP_LABEL: Record<BlockGroup, string> = {
  [BlockGroup.Text]: 'Texto',
  [BlockGroup.Media]: 'Imágenes y vídeo',
  [BlockGroup.Highlight]: 'Destacados',
  [BlockGroup.Sequence]: 'Listas y secuencias',
  [BlockGroup.Interactive]: 'Interactivos',
  [BlockGroup.Navigation]: 'Navegación',
};

/** El orden de la paleta: de lo más usado a lo más específico. */
export const GROUP_ORDER: readonly BlockGroup[] = [
  BlockGroup.Text,
  BlockGroup.Highlight,
  BlockGroup.Media,
  BlockGroup.Sequence,
  BlockGroup.Interactive,
  BlockGroup.Navigation,
];

export interface BlockDefinition<K extends BlockKind = BlockKind> {
  kind: K;
  label: string;
  /** Una línea en la paleta. Dice para qué sirve, no qué es. */
  description: string;
  icon: ReactNode;
  group: BlockGroup;
  /**
   * Con qué valores nace el bloque.
   *
   * Tiene que pasar el validador TAL CUAL: el formulario se abre con estos
   * valores y el administrador puede guardar sin tocar nada. Un `defaultData`
   * inválido daría un error al guardar sin que se entienda por qué.
   */
  defaultData: BlockDataByKind[K];
}

/**
 * Catálogo completo. El tipo `{ [K in BlockKind]: BlockDefinition<K> }` ata
 * cada `defaultData` a la forma que su `kind` promete: no se puede registrar
 * un bloque de cifras con los datos de un párrafo.
 */
export const BLOCK_LIBRARY: { [K in BlockKind]: BlockDefinition<K> } = {
  // --- Texto ---
  [BlockKind.Heading]: {
    kind: BlockKind.Heading,
    label: 'Título',
    description: 'Encabezado para separar partes de la página',
    icon: <Heading />,
    group: BlockGroup.Text,
    defaultData: { text: 'Nuevo título', level: 2 },
  },

  [BlockKind.Text]: {
    kind: BlockKind.Text,
    label: 'Párrafo',
    description: 'Un bloque de texto corrido',
    icon: <Type />,
    group: BlockGroup.Text,
    defaultData: { text: 'Escribe aquí el contenido.' },
  },

  [BlockKind.Divider]: {
    kind: BlockKind.Divider,
    label: 'Separador',
    description: 'Una línea para dar aire entre partes',
    icon: <Minus />,
    group: BlockGroup.Text,
    defaultData: {},
  },

  // --- Destacados ---
  [BlockKind.Callout]: {
    kind: BlockKind.Callout,
    label: 'Aviso',
    description: 'Recuadro con icono para algo que no debe pasarse por alto',
    icon: <MessageSquareWarning />,
    group: BlockGroup.Highlight,
    defaultData: {
      tone: BlockTone.Warning,
      title: 'Ten en cuenta',
      text: 'Escribe aquí el aviso.',
    },
  },

  [BlockKind.KeyPoints]: {
    kind: BlockKind.KeyPoints,
    label: 'Fichas con icono',
    description: 'Señales o indicaciones, cada una con su titular y detalle',
    icon: <ListChecks />,
    group: BlockGroup.Highlight,
    defaultData: {
      title: 'Identifica estas señales',
      points: [
        {
          id: 'kp-1',
          tone: BlockTone.Danger,
          title: 'Primera señal',
          detail: 'Describe qué hay que observar.',
        },
      ],
    },
  },

  [BlockKind.Stats]: {
    kind: BlockKind.Stats,
    label: 'Cifras',
    description: 'Números grandes que se buscan con la vista',
    icon: <ChartColumn />,
    group: BlockGroup.Highlight,
    defaultData: {
      stats: [{ id: 'st-1', value: '100-120', label: 'por minuto' }],
    },
  },

  // --- Imágenes y vídeo ---
  [BlockKind.Image]: {
    kind: BlockKind.Image,
    label: 'Imagen',
    description: 'Una imagen subida desde tu equipo',
    icon: <ImageIcon />,
    group: BlockGroup.Media,
    /**
     * Nace SIN imagen, y el validador exige una URL. Es deliberado: el
     * formulario obliga a subir el archivo antes de poder guardar, porque un
     * bloque de imagen sin imagen no tiene nada que pintar.
     */
    defaultData: {
      media: { mediaId: null, url: '', alt: '' },
    },
  },

  [BlockKind.Gallery]: {
    kind: BlockKind.Gallery,
    label: 'Galería',
    description: 'Varias imágenes en rejilla',
    icon: <Images />,
    group: BlockGroup.Media,
    defaultData: { items: [], columns: 2 },
  },

  [BlockKind.Embed]: {
    kind: BlockKind.Embed,
    label: 'Vídeo',
    description: 'Un vídeo de YouTube o Vimeo por su enlace',
    icon: <Clapperboard />,
    group: BlockGroup.Media,
    defaultData: { url: '', title: 'Vídeo demostrativo' },
  },

  // --- Listas y secuencias ---
  [BlockKind.Steps]: {
    kind: BlockKind.Steps,
    label: 'Pasos numerados',
    description: 'Una secuencia que se sigue en orden',
    icon: <ListOrdered />,
    group: BlockGroup.Sequence,
    defaultData: {
      steps: [
        { id: 'stp-1', title: 'Primer paso', description: 'Describe qué hacer.' },
      ],
    },
  },

  [BlockKind.Checklist]: {
    kind: BlockKind.Checklist,
    label: 'Lista para marcar',
    description: 'Puntos que la persona va marcando mientras actúa',
    icon: <SquareCheck />,
    group: BlockGroup.Sequence,
    defaultData: {
      items: [{ id: 'chk-1', text: 'Primer punto' }],
    },
  },

  [BlockKind.DoDont]: {
    kind: BlockKind.DoDont,
    label: 'Sí y no',
    description: 'Dos columnas enfrentadas: lo correcto y lo que nunca',
    icon: <Columns2 />,
    group: BlockGroup.Sequence,
    defaultData: {
      doTitle: 'Hazlo así',
      dontTitle: 'Nunca',
      doItems: [{ id: 'do-1', text: 'Lo que sí' }],
      dontItems: [{ id: 'dont-1', text: 'Lo que no' }],
    },
  },

  [BlockKind.Accordion]: {
    kind: BlockKind.Accordion,
    label: 'Preguntas',
    description: 'Preguntas que se despliegan al tocarlas',
    icon: <ChevronsDownUp />,
    group: BlockGroup.Sequence,
    defaultData: {
      items: [
        { id: 'acc-1', question: '¿Primera pregunta?', answer: 'La respuesta.' },
      ],
    },
  },

  [BlockKind.Table]: {
    kind: BlockKind.Table,
    label: 'Tabla',
    description: 'Datos en filas y columnas',
    icon: <Table2 />,
    group: BlockGroup.Sequence,
    defaultData: {
      headers: ['Situación', 'Qué hacer'],
      rows: [['', '']],
    },
  },

  // --- Interactivos ---
  [BlockKind.Quiz]: {
    kind: BlockKind.Quiz,
    label: 'Pregunta de práctica',
    description: 'Una pregunta con opciones y explicación',
    icon: <CircleHelp />,
    group: BlockGroup.Interactive,
    defaultData: {
      question: '¿Qué harías en esta situación?',
      options: [
        { id: 'opt-1', text: 'Primera opción', isCorrect: true },
        { id: 'opt-2', text: 'Segunda opción', isCorrect: false },
      ],
      explanation: 'Explica por qué.',
    },
  },

  [BlockKind.EmergencyCall]: {
    kind: BlockKind.EmergencyCall,
    label: 'Llamar a emergencias',
    description: 'Botón que marca el número desde el móvil',
    icon: <PhoneCall />,
    group: BlockGroup.Interactive,
    defaultData: {
      phoneNumber: EMERGENCY_PHONE.number,
      label: 'Pide ayuda',
    },
  },

  [BlockKind.Metronome]: {
    kind: BlockKind.Metronome,
    label: 'Metrónomo',
    description: 'Marca un ritmo con sonido y pulso visual',
    icon: <Activity />,
    group: BlockGroup.Interactive,
    defaultData: {
      beatsPerMinute: 110,
      relaySeconds: 120,
      title: 'Comprime en cada pulso',
    },
  },

  /**
   * Las dos de encuesta nacen SIN grupo: `groupId` vacío.
   *
   * No se puede inventar aquí, porque un grupo es una fila de la base de datos
   * y el valor por defecto no puede crearla. El validador rechaza el bloque sin
   * grupo, así que el formulario obliga a elegir o crear uno antes de guardar.
   */
  [BlockKind.Survey]: {
    kind: BlockKind.Survey,
    label: 'Encuesta 1 a 5',
    description: 'Preguntas que se contestan en una escala de acuerdo',
    icon: <ListOrdered />,
    group: BlockGroup.Interactive,
    defaultData: {
      groupId: '',
      title: '¿Qué te ha parecido?',
      lowLabel: 'Muy en desacuerdo',
      highLabel: 'De acuerdo',
      questions: [{ id: 'q-1', text: '' }],
    },
  },

  [BlockKind.SurveyStats]: {
    kind: BlockKind.SurveyStats,
    label: 'Resultados de encuesta',
    description: 'Gráficos de las respuestas. Solo los ves tú',
    icon: <ChartColumn />,
    group: BlockGroup.Interactive,
    defaultData: {
      groupId: '',
      chart: 'both',
    },
  },

  // --- Navegación ---
  [BlockKind.PageLinks]: {
    kind: BlockKind.PageLinks,
    label: 'Índice de páginas',
    description: 'Fichas que llevan a otras páginas de este módulo',
    icon: <Link2 />,
    group: BlockGroup.Navigation,
    /**
     * Nace en automático y sin fichas: así funciona desde el primer momento,
     * listando las páginas que haya, y no obliga a mantener una lista a mano.
     */
    defaultData: {
      title: 'Aprende paso a paso',
      variant: 'numbered',
      source: 'auto',
      items: [],
    },
  },
};

/** Las definiciones de un grupo, para pintar la paleta por familias. */
export const blocksInGroup = (group: BlockGroup): BlockDefinition[] =>
  Object.values(BLOCK_LIBRARY).filter((definition) => definition.group === group);

/**
 * Nombre legible de un tipo. Lo usa la lista de bloques del editor para decir
 * «Párrafo» en vez de `text`.
 */
export const blockLabel = (kind: string): string =>
  (BLOCK_LIBRARY as Record<string, BlockDefinition | undefined>)[kind]?.label ??
  'Componente desconocido';

export const blockIcon = (kind: string): ReactNode =>
  (BLOCK_LIBRARY as Record<string, BlockDefinition | undefined>)[kind]?.icon ?? null;
