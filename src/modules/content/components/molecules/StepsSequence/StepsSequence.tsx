import { useState } from 'react';
import { Check, Timer } from 'lucide-react';
import type { StepItem } from 'modules/content/types/content.types';
import './StepsSequence.scss';

export interface StepsSequenceProps {
  title?: string;
  steps: StepItem[];
}

/**
 * Pasos marcables. El estado de avance es local y efimero a proposito:
 * en una emergencia nadie quiere arrastrar el progreso de la vez anterior.
 */
const StepsSequence = ({ title, steps }: StepsSequenceProps) => {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (stepId: string) => {
    setDoneIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <section className="steps-sequence" data-testid="StepsSequence">
      {title && <h3 className="steps-sequence__title">{title}</h3>}

      <ol className="steps-sequence__list">
        {steps.map((step, index) => {
          const isDone = doneIds.has(step.id);

          return (
            <li
              key={step.id}
              className={`steps-sequence__item ${isDone ? 'is-done' : ''}`.trim()}
            >
              <button
                type="button"
                className="steps-sequence__marker"
                onClick={() => toggle(step.id)}
                aria-pressed={isDone}
                aria-label={
                  isDone
                    ? `Desmarcar paso ${index + 1}: ${step.title}`
                    : `Marcar como hecho el paso ${index + 1}: ${step.title}`
                }
              >
                {isDone ? <Check aria-hidden="true" /> : index + 1}
              </button>

              <div className="steps-sequence__body">
                <h4 className="steps-sequence__step-title">{step.title}</h4>
                <p className="steps-sequence__step-text">{step.description}</p>

                {step.durationSeconds !== undefined && (
                  <p className="steps-sequence__duration">
                    <Timer aria-hidden="true" />
                    {step.durationSeconds} segundos
                  </p>
                )}

                {step.imageUrl && (
                  <img
                    className="steps-sequence__image"
                    src={step.imageUrl}
                    alt={`Apoyo visual del paso: ${step.title}`}
                    loading="lazy"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default StepsSequence;
