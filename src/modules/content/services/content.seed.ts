import {
  ContentBlockKind,
  ModuleSeverity,
  ModuleStatus,
  type ContentModule,
} from 'modules/content/types/content.types';
import { EMERGENCY_PHONE } from 'modules/shared/constants/emergency';

/**
 * ============================================================================
 * CONTENIDO SEMILLA - PENDIENTE DE VALIDACIÓN CLÍNICA
 * ============================================================================
 * Resume guías públicas de primeros auxilios y NO ha sido revisado por
 * personal de salud. Existe para que la aplicación sea demostrable.
 *
 * Fuentes consultadas para el módulo de RCP solo con las manos:
 *  - American Heart Association, «Hands-Only CPR» (preguntas frecuentes):
 *    https://u1-cd-international.sc.heart.org/-/media/International/Files/Courses/Hands-Only-CPR/HandsOnlyCPRFAQ.pdf
 *  - AHA, Science Advisory sobre RCP solo con compresiones, Circulation 2008:
 *    https://cdn.emergencydispatch.org/iaed/pdf/CIRCULATIONAHA.107.189380.pdf
 *  - AHA, Adult Basic Life Support (guías de RCP y ECC):
 *    https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support
 *  - Cruz Roja, ficha de habilidad «CPR for Adults» (profundidad):
 *    https://www.redcrosslearning.com/course-bin/bls-healthcare-resuscitation/app/content/a/en-US/resources/SS-CPR-for-Adults.pdf
 *
 * Contenido parafraseado, no reproducido, para cumplir las restricciones de
 * licencia de las fuentes.
 *
 * ANTES DE CUALQUIER USO REAL: reemplazar con el contenido oficial validado por
 * la organización y citar esa fuente en cada módulo.
 * ============================================================================
 */

/**
 * Versión de la semilla. SUBIR ESTE NÚMERO cada vez que se añada, elimine o
 * corrija un módulo de aquí.
 *
 * El adaptador local la compara con la versión guardada en el navegador: si no
 * coinciden, reinstala los módulos de la semilla y deja intactos los que haya
 * creado un administrador. Sin esto, quien ya abrió la app se queda con el
 * contenido viejo para siempre.
 */
export const SEED_VERSION = 2;

/**
 * Ids que la semilla publicó alguna vez y ya no incluye.
 *
 * Hace falta porque la versión 1 no guardaba metadatos: sin esta lista, la
 * migración no puede distinguir un módulo retirado de la semilla de uno que
 * creó un administrador, y lo conservaría para siempre.
 *
 * Al retirar un módulo de la semilla, añadir aquí su id.
 */
export const RETIRED_SEED_IDS: readonly string[] = [
  // v1 -> v2: lo sustituye 'mod-rcp-solo-manos', más completo y específico.
  'mod-rcp-adulto',
];

const SEED_AUTHOR_ID = 'demo-admin';
const SEED_DATE = '2026-01-01T00:00:00.000Z';

const audit = (id: string) => ({
  id,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
});

export const SEED_MODULES: ContentModule[] = [
  // =========================================================================
  // RCP solo con las manos
  // =========================================================================
  {
    ...audit('mod-rcp-solo-manos'),
    title: 'RCP solo con las manos',
    slug: 'rcp-solo-con-las-manos',
    summary:
      'Si un adolescente o adulto se desploma de repente y no responde: llama y comprime. Sin dar respiraciones, sin formación previa.',
    severity: ModuleSeverity.Critical,
    status: ModuleStatus.Published,
    iconName: 'HeartPulse',
    tags: [
      'rcp',
      'reanimación',
      'paro cardiaco',
      'no respira',
      'inconsciente',
      'se desmayó',
      'no responde',
      'compresiones',
      'masaje cardiaco',
    ],
    estimatedMinutes: 5,
    order: 1,
    authorId: SEED_AUTHOR_ID,
    lessons: [
      // --- Sección 1: lo que hay que hacer YA ---
      {
        ...audit('les-rcp-actua'),
        title: 'Actúa ahora',
        summary: 'Dos acciones. Nada más. Empieza por la primera.',
        order: 1,
        blocks: [
          {
            id: 'blk-rcp-call',
            order: 1,
            kind: ContentBlockKind.EmergencyCall,
            phoneNumber: EMERGENCY_PHONE.number,
            label: 'Primero esto: pide ayuda',
          },
          {
            id: 'blk-rcp-intro',
            order: 2,
            kind: ContentBlockKind.Paragraph,
            text: 'La RCP solo con las manos es para adolescentes y adultos a quienes ves desplomarse de repente. No necesitas dar respiraciones ni haber hecho un curso. Hacer algo siempre es mejor que no hacer nada: sin compresiones, el corazón detenido no mueve sangre al cerebro.',
          },
          {
            id: 'blk-rcp-steps',
            order: 3,
            kind: ContentBlockKind.Steps,
            title: 'Secuencia completa',
            steps: [
              {
                id: 'stp-rcp-1',
                title: 'Comprueba si responde',
                description:
                  'Llámala en voz alta y sacude sus hombros con firmeza. Si no reacciona ni se mueve, trátala como un paro cardiaco.',
              },
              {
                id: 'stp-rcp-2',
                title: 'Pide ayuda y pon el altavoz',
                description:
                  `Grita pidiendo ayuda a quien tengas cerca. Llama al ${EMERGENCY_PHONE.number} y activa el altavoz: así te guían mientras tienes las dos manos libres. Pide un desfibrilador (DEA) si hay uno en el lugar.`,
              },
              {
                id: 'stp-rcp-3',
                title: 'Mira si respira con normalidad',
                description:
                  'Observa el pecho durante 10 segundos como máximo. Si no se mueve, o si solo da boqueadas ruidosas y aisladas, empieza a comprimir. Esas boqueadas no son respirar.',
                durationSeconds: 10,
              },
              {
                id: 'stp-rcp-4',
                title: 'Comprime el centro del pecho',
                description:
                  'Pon el talón de una mano en el centro del pecho, entre los pezones, y la otra mano encima entrelazando los dedos. Brazos rectos y hombros sobre tus manos. Comprime fuerte y rápido.',
              },
              {
                id: 'stp-rcp-5',
                title: 'No pares hasta que llegue ayuda',
                description:
                  'Continúa sin interrupciones hasta que llegue el personal de emergencias, haya un desfibrilador listo para usar, o la persona se mueva y respire por sí misma.',
              },
            ],
          },
          {
            id: 'blk-rcp-warn-gasp',
            order: 4,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'Si solo da boqueadas, NO está respirando. Es una señal de paro cardiaco y hay que comprimir. Mucha gente se detiene aquí por creer que la persona respira.',
          },
        ],
      },

      // --- Sección 2: técnica ---
      {
        ...audit('les-rcp-tecnica'),
        title: 'Comprime bien',
        summary: 'Fuerte, rápido y dejando que el pecho suba. Los tres a la vez.',
        order: 2,
        blocks: [
          {
            id: 'blk-tec-intro',
            order: 1,
            kind: ContentBlockKind.Paragraph,
            text: 'La calidad de las compresiones decide el resultado. Tres cosas importan al mismo tiempo: la profundidad, el ritmo y dejar que el pecho vuelva a su posición entre una compresión y la siguiente.',
          },
          {
            id: 'blk-tec-check',
            order: 2,
            kind: ContentBlockKind.Checklist,
            title: 'Comprueba tu técnica',
            items: [
              {
                id: 'chk-tec-1',
                text: 'Manos en el centro del pecho, una sobre la otra, dedos entrelazados',
              },
              { id: 'chk-tec-2', text: 'Brazos rectos y hombros justo encima de tus manos' },
              {
                id: 'chk-tec-3',
                text: 'Hundes el pecho al menos 5 cm en un adulto (sin pasar de 6)',
              },
              { id: 'chk-tec-4', text: 'Entre 100 y 120 compresiones por minuto' },
              { id: 'chk-tec-5', text: 'Dejas que el pecho suba del todo cada vez' },
              { id: 'chk-tec-6', text: 'La persona está sobre una superficie firme, no en un colchón blando' },
            ],
          },
          {
            id: 'blk-tec-ritmo',
            order: 3,
            kind: ContentBlockKind.Paragraph,
            text: 'Para mantener el ritmo, piensa en una canción de entre 100 y 120 pulsos por minuto. «Stayin\u2019 Alive» de los Bee Gees es el ejemplo clásico de las campañas de RCP y va a unos 103 pulsos por minuto. Comprime a cada pulso.',
          },
          {
            id: 'blk-tec-warn-recoil',
            order: 4,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'No te apoyes sobre el pecho entre compresiones. Si no se expande del todo, el corazón no se vuelve a llenar y las siguientes compresiones mueven menos sangre.',
          },
          {
            id: 'blk-tec-warn-pulse',
            order: 5,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'No interrumpas para buscar el pulso ni para comprobar si ya respira. Cada pausa larga baja las probabilidades de supervivencia.',
          },
          {
            id: 'blk-tec-warn-ribs',
            order: 6,
            kind: ContentBlockKind.Warning,
            isCritical: false,
            text: 'Puede que oigas crujidos en el pecho. Es frecuente y no es razón para parar: una costilla fisurada se trata después, un paro cardiaco sin compresiones no.',
          },
          {
            id: 'blk-tec-relevo',
            order: 7,
            kind: ContentBlockKind.Paragraph,
            text: 'Comprimir bien cansa en uno o dos minutos y la calidad cae sin que lo notes. Si hay otra persona, túrnense cada dos minutos y hagan el cambio en menos de cinco segundos.',
          },
        ],
      },

      // --- Sección 3: cuándo no aplica ---
      {
        ...audit('les-rcp-excepciones'),
        title: 'Cuándo NO sirve',
        summary: 'Hay casos que necesitan respiraciones, no solo compresiones.',
        order: 3,
        blocks: [
          {
            id: 'blk-exc-intro',
            order: 1,
            kind: ContentBlockKind.Paragraph,
            text: 'La RCP solo con las manos está pensada para el paro cardiaco súbito de un adolescente o adulto. Cuando la causa es la falta de oxígeno, el aire de las respiraciones sí hace falta y la RCP convencional es mejor.',
          },
          {
            id: 'blk-exc-warn',
            order: 2,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'En bebés y niños, en ahogamiento por inmersión, en sobredosis, o cuando la persona colapsó por un problema para respirar: hace falta RCP con respiraciones. Llama a emergencias y deja que te guíen por teléfono.',
          },
          {
            id: 'blk-exc-paragraph-2',
            order: 3,
            kind: ContentBlockKind.Paragraph,
            text: 'Si no sabes hacer respiraciones o no quieres hacerlas, comprime igual. Compresiones sin respiraciones es muchísimo mejor que quedarse mirando.',
          },
          {
            id: 'blk-exc-check',
            order: 4,
            kind: ContentBlockKind.Checklist,
            title: 'Señales de que es paro cardiaco súbito',
            items: [
              { id: 'chk-exc-1', text: 'Se desplomó de golpe, delante de ti' },
              { id: 'chk-exc-2', text: 'No responde cuando la llamas ni cuando la sacudes' },
              { id: 'chk-exc-3', text: 'No respira, o solo da boqueadas aisladas' },
            ],
          },
        ],
      },

      // --- Sección 4: práctica ---
      {
        ...audit('les-rcp-práctica'),
        title: 'Compruébalo',
        summary: 'Dos preguntas para fijar lo esencial antes de necesitarlo.',
        order: 4,
        blocks: [
          {
            id: 'blk-quiz-ritmo',
            order: 1,
            kind: ContentBlockKind.Quiz,
            question: '¿A qué ritmo hay que comprimir?',
            options: [
              { id: 'opt-ritmo-a', text: 'Entre 40 y 60 por minuto', isCorrect: false },
              { id: 'opt-ritmo-b', text: 'Entre 100 y 120 por minuto', isCorrect: true },
              { id: 'opt-ritmo-c', text: 'Lo más rápido que puedas', isCorrect: false },
            ],
            explanation:
              'Entre 100 y 120 por minuto. Más lento no mueve suficiente sangre; más rápido no deja que el pecho se expanda y el corazón no se llena.',
          },
          {
            id: 'blk-quiz-boqueadas',
            order: 2,
            kind: ContentBlockKind.Quiz,
            question:
              'La persona no responde y da boqueadas ruidosas de vez en cuando. ¿Qué haces?',
            options: [
              {
                id: 'opt-boq-a',
                text: 'Esperar, porque está respirando',
                isCorrect: false,
              },
              {
                id: 'opt-boq-b',
                text: 'Empezar las compresiones',
                isCorrect: true,
              },
              {
                id: 'opt-boq-c',
                text: 'Buscarle el pulso en el cuello antes de decidir',
                isCorrect: false,
              },
            ],
            explanation:
              'Esas boqueadas aisladas no son respirar: son una señal de paro cardiaco. Hay que empezar a comprimir y no perder tiempo buscando el pulso.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Atragantamiento
  // =========================================================================
  {
    ...audit('mod-atragantamiento'),
    title: 'Atragantamiento',
    slug: 'atragantamiento',
    summary: 'Cómo ayudar a alguien que no puede respirar porque algo obstruye su vía aérea.',
    severity: ModuleSeverity.Critical,
    status: ModuleStatus.Published,
    iconName: 'Wind',
    tags: ['atragantamiento', 'obstrucción', 'heimlich', 'se ahoga', 'no puede respirar'],
    estimatedMinutes: 3,
    order: 2,
    authorId: SEED_AUTHOR_ID,
    lessons: [
      {
        ...audit('les-atrag-actuar'),
        title: 'Identifica y actúa',
        summary: 'Distingue una obstrucción leve de una completa.',
        order: 1,
        blocks: [
          {
            id: 'blk-atrag-intro',
            order: 1,
            kind: ContentBlockKind.Paragraph,
            text: 'Si la persona tose con fuerza y puede hablar, la obstrucción es parcial: anímala a seguir tosiendo. Si no puede hablar, toser ni respirar, actúa de inmediato.',
          },
          {
            id: 'blk-atrag-steps',
            order: 2,
            kind: ContentBlockKind.Steps,
            title: 'Obstrucción completa en un adulto consciente',
            steps: [
              {
                id: 'stp-atrag-1',
                title: 'Avisa y colócate',
                description:
                  `Pide que llamen al ${EMERGENCY_PHONE.number}. Colócate detrás de la persona y sostenla por el torso.`,
              },
              {
                id: 'stp-atrag-2',
                title: 'Cinco golpes entre los omóplatos',
                description:
                  'Inclínala hacia adelante y da hasta cinco golpes firmes con el talón de la mano entre los omóplatos.',
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
                  'Repite la secuencia de golpes y compresiones. Si pierde el conocimiento, inicia reanimación cardiopulmonar.',
              },
            ],
          },
          {
            id: 'blk-atrag-warning',
            order: 3,
            kind: ContentBlockKind.Warning,
            isCritical: true,
            text: 'No intentes sacar el objeto con los dedos a ciegas: puedes empujarlo más adentro.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Hemorragia externa
  // =========================================================================
  {
    ...audit('mod-hemorragia'),
    title: 'Hemorragia externa',
    slug: 'hemorragia-externa',
    summary: 'Cómo controlar un sangrado abundante mientras llega la ayuda.',
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
        summary: 'La presión directa y continua es la medida principal.',
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
              { id: 'chk-hemo-3', text: `Pide que llamen al ${EMERGENCY_PHONE.number}` },
            ],
          },
          {
            id: 'blk-hemo-steps',
            order: 2,
            kind: ContentBlockKind.Steps,
            steps: [
              {
                id: 'stp-hemo-1',
                title: 'Aplica presión directa',
                description:
                  'Cubre la herida con una gasa o tela limpia y presiona con firmeza sin levantar la mano.',
              },
              {
                id: 'stp-hemo-2',
                title: 'Mantén la presión',
                description:
                  'Si la tela se empapa, agrega otra capa encima. No retires la primera.',
              },
              {
                id: 'stp-hemo-3',
                title: 'Vigila a la persona',
                description:
                  'Mantenla acostada y abrigada. Observa si palidece, tiembla o se desorienta e infórmalo al personal de emergencias.',
              },
            ],
          },
          {
            id: 'blk-hemo-warning',
            order: 3,
            kind: ContentBlockKind.Warning,
            isCritical: false,
            text: 'No apliques torniquete salvo que el sangrado sea masivo en una extremidad y la presión directa no funcione. Anota la hora si lo colocas.',
          },
        ],
      },
    ],
  },
];
