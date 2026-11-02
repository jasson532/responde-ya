import logger from 'modules/shared/services/logger/logger';
import CprMetronome from 'modules/content/components/molecules/CprMetronome/CprMetronome';
import DoDontGrid from 'modules/content/components/molecules/DoDontGrid/DoDontGrid';
import EmergencyCallButton from 'modules/content/components/molecules/EmergencyCallButton/EmergencyCallButton';
import InteractiveChecklist from 'modules/content/components/molecules/InteractiveChecklist/InteractiveChecklist';
import KeyPointsList from 'modules/content/components/molecules/KeyPointsList/KeyPointsList';
import QuizCard from 'modules/content/components/molecules/QuizCard/QuizCard';
import StatsRow from 'modules/content/components/molecules/StatsRow/StatsRow';
import StepsSequence from 'modules/content/components/molecules/StepsSequence/StepsSequence';
import { KeyPointTone } from 'modules/content/types/content.types';
import {
  BlockKind,
  BlockTone,
  type ContentBlock,
  type KeyPointItemData,
  type StepItemData,
} from 'modules/dynamic-content/types/blocks.types';
import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import AccordionBlock from '../../blocks/AccordionBlock/AccordionBlock';
import CalloutBlock from '../../blocks/CalloutBlock/CalloutBlock';
import EmbedBlock from '../../blocks/EmbedBlock/EmbedBlock';
import GalleryBlock from '../../blocks/GalleryBlock/GalleryBlock';
import MediaFigure from '../../blocks/MediaFigure/MediaFigure';
import PageLinksBlock from '../../blocks/PageLinksBlock/PageLinksBlock';
import TableBlock from '../../blocks/TableBlock/TableBlock';
import './BlockRenderer.scss';

/**
 * Lo que un bloque necesita saber de su entorno.
 *
 * Solo `PageLinks` lo usa hoy, para resolver sus `pageId` y construir las
 * rutas. Viaja como prop y no por un contexto de React porque recorre un único
 * nivel: montar un proveedor para eso sería maquinaria sin beneficio.
 */
export interface BlockContext {
  moduleSlug: string;
  pages: Page[];
}

export interface BlockRendererProps {
  blocks: ContentBlock[];
  context: BlockContext;
}

/**
 * DEUDA CONOCIDA: estos tres mapas existen porque las moléculas que pintan
 * pasos y fichas viven todavía en `modules/content` y usan sus tipos.
 *
 * Cuando `content` se jubile, las moléculas se mueven a `shared` y adoptan
 * `BlockTone` directamente. Hasta entonces, adaptar aquí es más barato que
 * duplicar ocho componentes que ya funcionan.
 */
const KEY_POINT_TONE: Record<BlockTone, KeyPointTone> = {
  [BlockTone.Danger]: KeyPointTone.Alert,
  [BlockTone.Warning]: KeyPointTone.Alert,
  [BlockTone.Info]: KeyPointTone.Question,
  [BlockTone.Neutral]: KeyPointTone.Question,
  [BlockTone.Success]: KeyPointTone.Check,
};

const toLegacyKeyPoint = (point: KeyPointItemData) => ({
  id: point.id,
  title: point.title,
  detail: point.detail,
  tone: KEY_POINT_TONE[point.tone],
});

/** La molécula de pasos espera `imageUrl`; el bloque nuevo guarda un `MediaRef`. */
const toLegacyStep = (step: StepItemData) => ({
  id: step.id,
  title: step.title,
  description: step.description,
  imageUrl: step.media?.url,
  durationSeconds: step.durationSeconds,
});

/**
 * Traduce un bloque al componente que lo pinta.
 *
 * El `switch` es exhaustivo: añadir un `BlockKind` sin manejarlo aquí rompe la
 * compilación en `assertNever`, no la pantalla de quien está buscando cómo
 * hacer una reanimación.
 */
const renderBlock = (block: ContentBlock, context: BlockContext) => {
  switch (block.kind) {
    // --- Texto ---
    case BlockKind.Heading: {
      const { text, level, align } = block.data;
      const className = `block-heading block-heading--h${level} block-heading--${align ?? 'start'}`;
      // Nivel 2 o 3 según los datos. El `h1` lo pone el título de la página,
      // nunca un bloque: si no, habría dos y el esquema de encabezados mentiría.
      return level === 3 ? (
        <h3 className={className}>{text}</h3>
      ) : (
        <h2 className={className}>{text}</h2>
      );
    }

    case BlockKind.Text:
      return (
        <p
          className={[
            'block-text',
            `block-text--${block.data.align ?? 'start'}`,
            block.data.isLead ? 'block-text--lead' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {block.data.text}
        </p>
      );

    case BlockKind.Divider:
      return <hr className="block-divider" />;

    // --- Multimedia ---
    case BlockKind.Image:
      return (
        <MediaFigure
          media={block.data.media}
          caption={block.data.caption}
          fit={block.data.fit}
          displayWidth={block.data.displayWidth}
          displayHeight={block.data.displayHeight}
        />
      );

    case BlockKind.Gallery:
      return <GalleryBlock items={block.data.items} columns={block.data.columns} />;

    case BlockKind.Embed:
      return (
        <EmbedBlock
          source={block.data.source}
          url={block.data.url}
          title={block.data.title}
          width={block.data.width}
          height={block.data.height}
          posterUrl={block.data.posterUrl}
        />
      );

    // --- Destacados ---
    case BlockKind.Callout:
      return (
        <CalloutBlock
          tone={block.data.tone}
          title={block.data.title}
          text={block.data.text}
        />
      );

    case BlockKind.KeyPoints:
      return (
        <KeyPointsList
          title={block.data.title}
          points={block.data.points.map(toLegacyKeyPoint)}
        />
      );

    case BlockKind.Stats:
      return <StatsRow title={block.data.title} stats={block.data.stats} />;

    // --- Secuencias ---
    case BlockKind.Steps:
      return (
        <StepsSequence
          title={block.data.title}
          steps={block.data.steps.map(toLegacyStep)}
        />
      );

    case BlockKind.Checklist:
      return <InteractiveChecklist title={block.data.title} items={block.data.items} />;

    case BlockKind.DoDont:
      return (
        <DoDontGrid
          doTitle={block.data.doTitle}
          dontTitle={block.data.dontTitle}
          doItems={block.data.doItems}
          dontItems={block.data.dontItems}
        />
      );

    case BlockKind.Accordion:
      return <AccordionBlock title={block.data.title} items={block.data.items} />;

    case BlockKind.Table:
      return (
        <TableBlock
          title={block.data.title}
          headers={block.data.headers}
          rows={block.data.rows}
        />
      );

    // --- Interactivos ---
    case BlockKind.Quiz:
      return (
        <QuizCard
          question={block.data.question}
          options={block.data.options}
          explanation={block.data.explanation}
        />
      );

    case BlockKind.EmergencyCall:
      return (
        <EmergencyCallButton
          phoneNumber={block.data.phoneNumber}
          label={block.data.label}
        />
      );

    case BlockKind.Metronome:
      return (
        <CprMetronome
          beatsPerMinute={block.data.beatsPerMinute}
          relaySeconds={block.data.relaySeconds}
          title={block.data.title}
          hint={block.data.hint}
        />
      );

    // --- Navegación ---
    case BlockKind.PageLinks:
      return (
        <PageLinksBlock
          title={block.data.title}
          variant={block.data.variant}
          source={block.data.source}
          items={block.data.items}
          moduleSlug={context.moduleSlug}
          pages={context.pages}
        />
      );

    default:
      return assertNever(block);
  }
};

/**
 * Se registra y devuelve `null` en lugar de lanzar.
 *
 * Es inalcanzable mientras el `switch` siga exhaustivo —TypeScript lo garantiza
 * en compilación—, pero podría llegarse en ejecución si una fila de Postgres
 * trajera un `kind` que esta versión del código no conoce. En ese caso vale más
 * perder un bloque que la pantalla entera.
 */
const assertNever = (block: never): null => {
  logger.error('Bloque sin renderizador', { block });
  return null;
};

const BlockRenderer = ({ blocks, context }: BlockRendererProps) => (
  <div className="block-renderer" data-testid="BlockRenderer">
    {[...blocks]
      .sort((a, b) => a.position - b.position)
      .map((block) => (
        <div key={block.id} className="block-renderer__item">
          {renderBlock(block, context)}
        </div>
      ))}
  </div>
);

export default BlockRenderer;
