import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import type { QuizOption } from 'modules/content/types/content.types';
import './QuizCard.scss';

export interface QuizCardProps {
  question: string;
  options: QuizOption[];
  explanation: string;
}

const QuizCard = ({ question, options, explanation }: QuizCardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const selectedOption = options.find((option) => option.id === selectedId) ?? null;
  const isCorrect = selectedOption?.isCorrect ?? false;

  const handleReset = () => {
    setSelectedId(null);
    setIsAnswered(false);
  };

  return (
    <section className="quiz-card" data-testid="QuizCard">
      <h3 className="quiz-card__question">{question}</h3>

      <ul className="quiz-card__options" role="radiogroup" aria-label={question}>
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          const state = !isAnswered
            ? ''
            : option.isCorrect
              ? 'is-correct'
              : isSelected
                ? 'is-wrong'
                : '';

          return (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`quiz-card__option ${isSelected ? 'is-selected' : ''} ${state}`.trim()}
                disabled={isAnswered}
                onClick={() => setSelectedId(option.id)}
              >
                <span>{option.text}</span>
                {isAnswered && option.isCorrect && <CircleCheck aria-hidden="true" />}
                {isAnswered && isSelected && !option.isCorrect && <CircleX aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>

      {!isAnswered ? (
        <Button
          variant="primary"
          disabled={selectedId === null}
          onClick={() => setIsAnswered(true)}
        >
          Comprobar
        </Button>
      ) : (
        <div className="quiz-card__feedback" role="status">
          <p className={`quiz-card__verdict ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
            {isCorrect ? 'Correcto' : 'Revisa esto con calma'}
          </p>
          <p className="quiz-card__explanation">{explanation}</p>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Intentar otra vez
          </Button>
        </div>
      )}
    </section>
  );
};

export default QuizCard;
