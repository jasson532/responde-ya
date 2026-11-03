import { useState } from 'react';
import { Check, RotateCcw, Timer } from 'lucide-react';
import ProgressRing from 'modules/shared/components/atoms/ProgressRing/ProgressRing';
import type { StepItem } from 'modules/content/types/content.types';
import './StepsSequence.scss';

export interface StepsSequenceProps {
  title?: string;
  steps: StepItem[];
}

/**
 * Pasos marcables con anillo de progreso.
 *
 * El avance es local y efímero a propósito: en una emergencia nadie quiere
 * arrastrar los pasos que marcó la vez anterior. Se reinicia al salir.
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

  const doneCount = doneIds.size;
  const isComplete = doneCount === steps.length && steps.length > 0;

  return (
    <section className="steps" data-testid="StepsSequence">
      <header className={`steps__head ${isComplete ? 'is-complete' : ''}`.trim()}>
        {/* El anillo pasa a verde al completarse: es la confirmación de haber
            terminado la secuencia, y el rojo de urgencia ahí ya no aplica. */}
        <ProgressRing
          value={doneCount}
          max={steps.length}
          size={64}
          tone={isComplete ? 'safe' : 'emergency'}
        />

        <div className="steps__head-text">
          <h3 className="steps__title">{title ?? 'Paso a paso'}</h3>
          <p className="steps__progress" aria-live="polite">
            {isComplete
              ? 'Completaste todos los pasos'
              : `${doneCount} de ${steps.length} pasos marcados`}
          </p>
        </div>

        {doneCount > 0 && (
          <button
            type="button"
            className="steps__reset"
            onClick={() => setDoneIds(new Set())}
          >
            <RotateCcw aria-hidden="true" />
            <span className="sr-only">Reiniciar los pasos marcados</span>
          </button>
        )}
      </header>

      <ol className="steps__list">
        {steps.map((step, index) => {
          const isDone = doneIds.has(step.id);

          return (
            <li key={step.id} className={`steps__item ${isDone ? 'is-done' : ''}`.trim()}>
              <button
                type="button"
                className="steps__marker"
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

              <div className="steps__body">
                <h4 className="steps__step-title">{step.title}</h4>
                <p className="steps__step-text">{step.description}</p>

                {step.durationSeconds !== undefined && (
                  <p className="steps__duration">
                    <Timer aria-hidden="true" />
                    {step.durationSeconds} segundos
                  </p>
                )}

                {step.imageUrl && (
                  <img
                    className="steps__image"
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
