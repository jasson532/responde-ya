import {
  ContentBlockKind,
  ModuleSeverity,
  ModuleStatus,
  type ContentModule,
} from 'modules/content/types/content.types';

/**
 * ============================================================================
 * CONTENIDO SEMILLA - PROVISIONAL, PENDIENTE DE VALIDACION CLINICA
 * ============================================================================
 * Estos modulos existen UNICAMENTE para que la aplicacion sea demostrable y
 * para ejercitar el renderizador de bloques. El texto resume guias de primeros
 * auxilios de difusion general y NO ha sido revisado por personal de salud.
 *
 * ANTES DE CUALQUIER USO REAL: reemplazar integramente este archivo con el
 * contenido oficial validado por la fuente de la organizacion y citar dicha
 * fuente en cada modulo.
 * ============================================================================
 */

const SEED_AUTHOR_ID = 'demo-admin';
const SEED_DATE = '2026-01-01T00:00:00.000Z';

const audit = (id: string) => ({
  id,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
});

export const SEED_MODULES: ContentModule[] = [
  {
    ...audit('mod-rcp-adulto'),
    title: 'Reanimacion cardiopulmonar en adultos',
    slug: 'rcp-adulto',
    summary:
      'Que hacer cuando una persona adulta no responde y no respira con normalidad.',
    severity: ModuleSeverity.Critical,
    status: ModuleStatus.Published,
    iconName: 'HeartPulse',
    tags: ['rcp', 'paro cardiaco', 'no respira', 'inconsciente'],
    estimatedMinutes: 4,
    order: 1,
    authorId: SEED_AUTHOR_ID,
    lessons: [
      {
        ...audit('les-rcp-actuar'),
        title: 'Actua ahora',
        summary: 'Secuencia inmediata antes de que llegue la ayuda.',
        order: 1,
        blocks: [
          {
            id: 'blk-rcp-call',
            order: 1,
            kind: ContentBlockKind.EmergencyCall,
            phoneNumber: '123',
            label: 'Llama a emergencias antes de empezar',
          },
          {
            id: 'blk-rcp-steps',
            order: 2,
            kind: ContentBlockKind.Steps,
            title: 'Secuencia de reanimacion',
            steps: [
              {
                id: 'stp-rcp-1',
                title: 'Comprueba si responde',
                description:
                  'Llamala en voz alta y sacude sus hombros con suavidad. Si no reacciona, pide ayuda a quien tengas cerca.',
              },
              {
                id: 'stp-rcp-2',
                title: 'Revisa la respiracion',
                description:
                  'Observa el pecho durante 10 segundos. Si no respira o solo da boqueadas, inicia compresiones.',
                durationSeconds: 10,
              },
              {
                id: 'stp-rcp-3',
                title: 'Comprime el centro del pecho',
                description:
                  'Coloca una mano sobre otra en el centro del pecho, con los brazos rectos. Comprime fuerte y rapido: unas 100 a 120 veces por minuto, dejando que el pecho vuelva a subir entre compresiones.',
              },
              {
                id: 'stp-rcp-4',
                title: 'No te detengas',
                description:
                  'Continua hasta que llegue el personal de emergencias, haya un desfibrilador disponible o la persona vuelva a respirar.',
              },
            ],
          },
          {
            id: 'blk-rcp-warning',
            order: 3,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'No interrumpas las compresiones para buscar el pulso. Las pausas largas reducen las probabilidades de supervivencia.',
          },
          {
            id: 'blk-rcp-quiz',
            order: 4,
            kind: ContentBlockKind.Quiz,
            question: 'A que ritmo aproximado se deben hacer las compresiones?',
            options: [
              { id: 'opt-rcp-a', text: 'Entre 40 y 60 por minuto', isCorrect: false },
              { id: 'opt-rcp-b', text: 'Entre 100 y 120 por minuto', isCorrect: true },
              { id: 'opt-rcp-c', text: 'Lo mas rapido que se pueda', isCorrect: false },
            ],
            explanation:
              'El ritmo recomendado esta entre 100 y 120 compresiones por minuto. Mas lento no mueve suficiente sangre; mas rapido impide que el pecho se expanda.',
          },
        ],
      },
    ],
  },
  {
    ...audit('mod-atragantamiento'),
    title: 'Atragantamiento',
    slug: 'atragantamiento',
    summary: 'Como ayudar a alguien que no puede respirar porque algo obstruye su via aerea.',
    severity: ModuleSeverity.Critical,
    status: ModuleStatus.Published,
    iconName: 'Wind',
    tags: ['atragantamiento', 'obstruccion', 'heimlich', 'se ahoga'],
    estimatedMinutes: 3,
    order: 2,
    authorId: SEED_AUTHOR_ID,
    lessons: [
      {
        ...audit('les-atrag-actuar'),
        title: 'Identifica y actua',
        summary: 'Distingue una obstruccion leve de una completa.',
        order: 1,
        blocks: [
          {
            id: 'blk-atrag-intro',
            order: 1,
            kind: ContentBlockKind.Paragraph,
            text: 'Si la persona tose con fuerza y puede hablar, la obstruccion es parcial: animala a seguir tosiendo. Si no puede hablar, toser ni respirar, actua de inmediato.',
          },
          {
            id: 'blk-atrag-steps',
            order: 2,
            kind: ContentBlockKind.Steps,
            title: 'Obstruccion completa en un adulto consciente',
            steps: [
              {
                id: 'stp-atrag-1',
                title: 'Avisa y posicionate',
                description:
                  'Pide que llamen a emergencias. Colocate detras de la persona y sostenla por el torso.',
              },
              {
                id: 'stp-atrag-2',
                title: 'Cinco golpes entre los omoplatos',
                description:
                  'Inclinala hacia adelante y da hasta cinco golpes firmes con el talon de la mano entre los omoplatos.',
              },
              {
                id: 'stp-atrag-3',
                title: 'Cinco compresiones abdominales',
                description:
                  'Rodea su abdomen por encima del ombligo y comprime hacia adentro y hacia arriba hasta cinco veces.',
              },
              {
                id: 'stp-atrag-4',
                title: 'Alterna hasta liberar',
                description:
                  'Repite la secuencia de golpes y compresiones. Si pierde el conocimiento, inicia reanimacion cardiopulmonar.',
              },
            ],
          },
          {
            id: 'blk-atrag-warning',
            order: 3,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'No intentes sacar el objeto con los dedos a ciegas: puedes empujarlo mas adentro.',
          },
        ],
      },
    ],
  },
  {
    ...audit('mod-hemorragia'),
    title: 'Hemorragia externa',
    slug: 'hemorragia-externa',
    summary: 'Como controlar un sangrado abundante mientras llega la ayuda.',
    severity: ModuleSeverity.Urgent,
    status: ModuleStatus.Published,
    iconName: 'Droplet',
    tags: ['sangrado', 'herida', 'hemorragia', 'corte'],
    estimatedMinutes: 3,
    order: 3,
    authorId: SEED_AUTHOR_ID,
    lessons: [
      {
        ...audit('les-hemo-controlar'),
        title: 'Controla el sangrado',
        summary: 'Presion directa y continua es la medida principal.',
        order: 1,
        blocks: [
          {
            id: 'blk-hemo-checklist',
            order: 1,
            kind: ContentBlockKind.Checklist,
            title: 'Antes de tocar la herida',
            items: [
              { id: 'chk-hemo-1', text: 'Confirma que el lugar es seguro' },
              { id: 'chk-hemo-2', text: 'Usa guantes o una barrera limpia si tienes' },
              { id: 'chk-hemo-3', text: 'Pide que llamen a emergencias' },
            ],
          },
          {
            id: 'blk-hemo-steps',
            order: 2,
            kind: ContentBlockKind.Steps,
            steps: [
              {
                id: 'stp-hemo-1',
                title: 'Aplica presion directa',
                description:
                  'Cubre la herida con una gasa o tela limpia y presiona con firmeza sin levantar la mano.',
              },
              {
                id: 'stp-hemo-2',
                title: 'Mantén la presion',
                description:
                  'Si la tela se empapa, agrega otra capa encima. No retires la primera.',
              },
              {
                id: 'stp-hemo-3',
                title: 'Vigila a la persona',
                description:
                  'Mantenla acostada y abrigada. Observa si palidece, tiembla o se desorienta e informalo al personal de emergencias.',
              },
            ],
          },
          {
            id: 'blk-hemo-warning',
            order: 3,
            kind: ContentBlockKind.Warning,
            isCritical: false,
            text: 'No apliques torniquete salvo que el sangrado sea masivo en una extremidad y la presion directa no funcione. Anota la hora si lo colocas.',
          },
        ],
      },
    ],
  },
];
