import { CircleAlert, OctagonAlert } from 'lucide-react';
import EmergencyCallButton from 'modules/content/components/molecules/EmergencyCallButton/EmergencyCallButton';
import InteractiveChecklist from 'modules/content/components/molecules/InteractiveChecklist/InteractiveChecklist';
import QuizCard from 'modules/content/components/molecules/QuizCard/QuizCard';
import StepsSequence from 'modules/content/components/molecules/StepsSequence/StepsSequence';
import { ContentBlockKind, type ContentBlock } from 'modules/content/types/content.types';
import './ContentBlockRenderer.scss';

export interface ContentBlockRendererProps {
  blocks: ContentBlock[];
}

/**
 * Traduce un bloque de datos al componente que lo representa.
 * El `switch` es exhaustivo: agregar un `ContentBlockKind` sin manejarlo aqui
 * rompe la compilacion (ver `assertNever`), no la pantalla del usuario.
 */
const renderBlock = (block: ContentBlock) => {
  switch (block.kind) {
    case ContentBlockKind.Paragraph:
      return <p className="content-block__paragraph">{block.text}</p>;

    case ContentBlockKind.Steps:
      return <StepsSequence title={block.title} steps={block.steps} />;

    case ContentBlockKind.Warning:
      return (
        <aside
          className={`content-block__warning ${block.isCritical ? 'is-critical' : ''}`.trim()}
          role="note"
        >
          <span className="content-block__warning-icon" aria-hidden="true">
            {block.isCritical ? <OctagonAlert /> : <CircleAlert />}
          </span>
          <p>
            <strong>{block.isCritical ? 'Nunca hagas esto: ' : 'Ten en cuenta: '}</strong>
            {block.text}
          </p>
        </aside>
      );

    case ContentBlockKind.Checklist:
      return <InteractiveChecklist title={block.title} items={block.items} />;

    case ContentBlockKind.Image:
      return (
        <figure className="content-block__figure">
          <img src={block.url} alt={block.alt} loading="lazy" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );

    case ContentBlockKind.Video:
      return (
        <figure className="content-block__figure">
          <video controls preload="metadata" src={block.url} />
          <figcaption>{block.title}</figcaption>
        </figure>
      );

    case ContentBlockKind.Quiz:
      return (
        <QuizCard
          question={block.question}
          options={block.options}
          explanation={block.explanation}
        />
      );

    case ContentBlockKind.EmergencyCall:
      return <EmergencyCallButton phoneNumber={block.phoneNumber} label={block.label} />;

    default:
      return assertNever(block);
  }
};

const assertNever = (block: never): never => {
  throw new Error(`Bloque de contenido no soportado: ${JSON.stringify(block)}`);
};

const ContentBlockRenderer = ({ blocks }: ContentBlockRendererProps) => (
  <div className="content-block-renderer" data-testid="ContentBlockRenderer">
    {[...blocks]
      .sort((a, b) => a.order - b.order)
      .map((block) => (
        <div key={block.id} className="content-block">
          {renderBlock(block)}
        </div>
      ))}
  </div>
);

export default ContentBlockRenderer;
