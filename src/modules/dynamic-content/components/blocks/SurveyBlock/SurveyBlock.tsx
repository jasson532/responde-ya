import { useId, useState } from 'react';
import { Check, ClipboardList, Send } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type { SurveyData } from 'modules/dynamic-content/types/blocks.types';
import './SurveyBlock.scss';

/** Los cinco valores de la escala. Fijos: la agregación cuenta con ellos. */
const SCALE = [1, 2, 3, 4, 5] as const;

/**
 * ===========================================================================
 * ENCUESTA DE 1 A 5
 * ===========================================================================
 * Una fila por pregunta con cinco círculos, y las etiquetas de los extremos a
 * los lados de la escala.
 *
 * SOBRE EL MARCADO
 * Cada pregunta es un `<fieldset>` con su `<legend>` y cinco
 * `<input type="radio">` de verdad que comparten `name`. Dibujar cinco `div`
 * con `onClick` habría salido igual de bonito y habría costado reimplementar a
 * mano el recorrido con flechas, el foco, la agrupación que anuncia un lector
 * de pantalla y el hecho de que elegir uno desmarca el anterior.
 *
 * SOBRE EL ESTADO
 * Las respuestas y el envío son estado LOCAL, no de Redux. Son de esta
 * instancia del bloque: puede haber dos encuestas en la misma página, y un
 * campo compartido en el store las mezclaría.
 * ===========================================================================
 */
const SurveyBlock = ({
  groupId,
  title,
  intro,
  lowLabel,
  highLabel,
  questions,
}: SurveyData) => {
  /** `useId` da un prefijo único por instancia: sin él, dos encuestas en la
   * misma página compartirían los `name` de sus radios y elegir en una
   * desmarcaría la otra. */
  const prefix = useId();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(answers).length;

  const handleSubmit = async () => {
    setError(null);
    setIsSending(true);

    try {
      const repository = await getRepository();

      await repository.submitSurveyAnswers({
        groupId,
        /**
         * Solo las contestadas. Una pregunta en blanco no se manda como cero:
         * el valor 0 no existe en la escala, y rellenarla con un 3 inventaría
         * una opinión que nadie dio.
         *
         * El enunciado viaja con la respuesta porque puede reescribirse después
         * y las estadísticas tienen que seguir diciendo a qué se contestó.
         */
        answers: questions
          .filter((question) => answers[question.id] !== undefined)
          .map((question) => ({
            questionId: question.id,
            questionText: question.text,
            value: answers[question.id],
          })),
      });

      setIsSent(true);
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos enviar tus respuestas.'));
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <section className="survey survey--sent" data-testid="SurveyBlock">
        <span className="survey__done-icon" aria-hidden="true">
          <Check />
        </span>
        <div>
          <p className="survey__done-title">¡Gracias por responder!</p>
          <p className="survey__done-text">
            Tus respuestas se han guardado de forma anónima.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="survey" data-testid="SurveyBlock">
      <header className="survey__head">
        <span className="survey__badge" aria-hidden="true">
          <ClipboardList />
        </span>

        <div className="survey__head-text">
          <h3 className="survey__title">{title ?? 'Cuéntanos tu opinión'}</h3>
          <p className="survey__progress" aria-live="polite">
            {answered} de {questions.length} contestadas
          </p>
        </div>
      </header>

      {intro && <p className="survey__intro">{intro}</p>}

      {/* La leyenda de la escala, una vez arriba. Repetirla en cada pregunta
          en pantallas anchas sería ruido; en móvil cada fila la repite porque
          la escala queda lejos de esta cabecera. */}
      <div className="survey__legend" aria-hidden="true">
        <span className="survey__legend-end">1 · {lowLabel}</span>
        <span className="survey__legend-end">5 · {highLabel}</span>
      </div>

      <ol className="survey__list">
        {questions.map((question, index) => (
          <li key={question.id} className="survey__item">
            <fieldset className="survey__field">
              <legend className="survey__question">
                <span className="survey__number" aria-hidden="true">
                  {index + 1}
                </span>
                {question.text}
              </legend>

              <div className="survey__scale">
                <span className="survey__scale-label" aria-hidden="true">
                  {lowLabel}
                </span>

                <div className="survey__options">
                  {SCALE.map((value) => {
                    const id = `${prefix}-${question.id}-${value}`;
                    const isChecked = answers[question.id] === value;

                    return (
                      <div className="survey__option" key={value}>
                        <input
                          type="radio"
                          id={id}
                          className="survey__radio"
                          name={`${prefix}-${question.id}`}
                          value={value}
                          checked={isChecked}
                          disabled={isSending}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: value,
                            }))
                          }
                        />
                        {/**
                         * La etiqueta dice el número Y lo que significa en los
                         * extremos: «1, muy en desacuerdo» informa, «1» sin
                         * más obliga a buscar la leyenda que está arriba.
                         */}
                        <label className="survey__option-label" htmlFor={id}>
                          <span aria-hidden="true">{value}</span>
                          <span className="sr-only">
                            {value}
                            {value === 1 ? `, ${lowLabel}` : ''}
                            {value === 5 ? `, ${highLabel}` : ''}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>

                <span className="survey__scale-label" aria-hidden="true">
                  {highLabel}
                </span>
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <Button
        variant="primary"
        size="md"
        fullWidth
        iconStart={<Send />}
        loading={isSending}
        // Sin ninguna respuesta no hay nada que enviar. Con algunas sí se
        // permite: obligar a contestarlo todo hace que se abandone la encuesta.
        disabled={answered === 0}
        onClick={() => void handleSubmit()}
      >
        {answered === 0 ? 'Elige al menos una respuesta' : 'Enviar respuestas'}
      </Button>
    </section>
  );
};

export default SurveyBlock;
