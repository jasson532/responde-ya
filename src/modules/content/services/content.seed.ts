import {
  ContentBlockKind,
  KeyPointTone,
  ModuleSeverity,
  ModuleStatus,
  type ContentModule,
} from 'modules/content/types/content.types';
import { EMERGENCY_PHONE } from 'modules/shared/constants/emergency';
import compressionsArtUrl from 'modules/shared/assets/images/img-welcome.jpg';

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
export const SEED_VERSION = 6;

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
  // v3 -> v4: retirado por decisión del usuario.
  'mod-hemorragia',
  // v5 -> v6: retirado por decisión del usuario. Estuvo publicado y luego como
  // «próximamente», así que puede estar en el navegador de cualquiera de las
  // dos formas; la migración lo borra en ambos casos.
  'mod-atragantamiento',
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
    iconName: 'cpr',
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
    estimatedMinutes: 3,
    order: 1,
    authorId: SEED_AUTHOR_ID,
    /**
     * Las tres secciones del índice del prototipo (pantalla 2), en su orden.
     *
     * Los pasos 04 «Uso del DEA» y 05 «Algoritmo y video» quedan fuera por
     * decisión del usuario, y con ellos la indicación «Solicita un DEA» que la
     * pantalla 4 incluía entre las tres de la llamada.
     */
    lessons: [
      // --- 01 → pantalla 3 del prototipo, «Reconoce la emergencia» ---
      {
        ...audit('les-rcp-reconoce'),
        title: 'Reconoce el paro cardíaco',
        summary: 'Identifica los signos',
        order: 1,
        blocks: [
          {
            id: 'blk-rec-signals',
            order: 1,
            kind: ContentBlockKind.KeyPoints,
            title: 'Identifica estas señales',
            points: [
              {
                id: 'kp-rec-responde',
                tone: KeyPointTone.Alert,
                title: 'No responde',
                detail: 'No reacciona al hablarle o tocar sus hombros.',
              },
              {
                id: 'kp-rec-respira',
                tone: KeyPointTone.Question,
                title: 'No respira normalmente',
                detail: 'Puede presentar jadeos agónicos.',
              },
            ],
          },
          {
            id: 'blk-rec-call',
            order: 2,
            kind: ContentBlockKind.EmergencyCall,
            phoneNumber: EMERGENCY_PHONE.number,
            label: 'Pide ayuda',
          },
        ],
      },

      // --- 02 → pantalla 4 del prototipo, «Activa la ayuda» ---
      {
        ...audit('les-rcp-activa'),
        title: 'Activa emergencias',
        summary: 'Pide ayuda oportunamente',
        order: 2,
        blocks: [
          {
            id: 'blk-act-call',
            order: 1,
            kind: ContentBlockKind.EmergencyCall,
            phoneNumber: EMERGENCY_PHONE.number,
            // El componente ya rotula «Llamar al 123» en grande; la etiqueta
            // de arriba aporta el país, como el pie del prototipo.
            label: 'En Colombia',
          },
          {
            id: 'blk-act-points',
            order: 2,
            kind: ContentBlockKind.KeyPoints,
            points: [
              {
                id: 'kp-act-comunica',
                tone: KeyPointTone.Check,
                title: 'Comunica la emergencia',
                detail: 'Indica dónde estás y qué ocurre.',
              },
              {
                id: 'kp-act-indicaciones',
                tone: KeyPointTone.Check,
                title: 'Sigue las indicaciones',
                detail: 'Pon el teléfono en altavoz.',
              },
            ],
          },
        ],
      },

      // --- 03 → pantalla 5 del prototipo, «Compresiones torácicas» ---
      {
        ...audit('les-rcp-comprime'),
        title: 'Inicia compresiones',
        summary: 'Recomendaciones básicas',
        order: 3,
        blocks: [
          {
            id: 'blk-com-image',
            order: 1,
            kind: ContentBlockKind.Image,
            url: compressionsArtUrl,
            alt: 'Una persona con los brazos rectos comprime el centro del pecho de alguien tendido en el suelo',
          },
          {
            id: 'blk-com-stats',
            order: 2,
            kind: ContentBlockKind.Stats,
            title: 'Manos en el centro del pecho',
            stats: [
              { id: 'st-com-bpm', value: '100-120', label: 'compresiones por minuto' },
              { id: 'st-com-depth', value: '5-6 cm', label: 'profundidad en adultos' },
            ],
          },
          {
            id: 'blk-com-recoil',
            order: 3,
            kind: ContentBlockKind.Paragraph,
            text: 'Permite que el pecho vuelva a su posición entre compresiones.',
          },
          {
            // El metrónomo no sale en el prototipo, pero es lo único de la app
            // que enseña el ritmo en vez de describirlo. Se queda aquí, que es
            // la sección a la que pertenece.
            id: 'blk-com-metronome',
            order: 4,
            kind: ContentBlockKind.Metronome,
            beatsPerMinute: 110,
            relaySeconds: 120,
            title: 'Comprime en cada pulso',
            hint: 'Fuerte, rápido y deja que el pecho suba.',
          },
        ],
      },
    ],
  },

];
