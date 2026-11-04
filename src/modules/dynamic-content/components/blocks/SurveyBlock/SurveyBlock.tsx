import { useEffect, useId, useState } from 'react';
import { Check, ClipboardList, MessageSquare, Send } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import {
  SURVEY_OPINION_DEFAULT_LABEL,
  SURVEY_OPINION_KEY,
  SURVEY_OPINION_MAX_LENGTH,
} from 'modules/dynamic-content/constants/survey';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type { SurveyData } from 'modules/dynamic-content/types/blocks.types';
import type { SurveyGroup } from 'modules/dynamic-content/types/dynamic.types';
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
const SurveyBlock = ({ groupId, title, intro }: SurveyData) => {
  /**
   * El grupo trae las preguntas y las etiquetas.
   *
   * Son una consulta extra, sí. La alternativa era guardar una copia en el
   * bloque y sincronizarla al editar, y entonces una encuesta puesta en tres
   * páginas tendría tres copias que hay que recordar actualizar. Con la lectura
   * directa, editar el grupo cambia las tres a la vez.
   */
  const [group, setGroup] = useState<SurveyGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const repository = await getRepository();
        const result = await repository.getSurveyGroup(groupId);
        if (!cancelled) setGroup(result);
      } catch (cause) {
        if (!cancelled) {
          setLoadError(toErrorMessage(cause, 'No pudimos cargar las preguntas.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const questions = group?.questions ?? [];
  const lowLabel = group?.lowLabel ?? 'Muy en desacuerdo';
  const highLabel = group?.highLabel ?? 'Totalmente de acuerdo';
  /** El grupo decide si además de puntuar se pide un texto libre. */
  const wantsOpinion = group?.opinionEnabled ?? false;
  const opinionLabel = group?.opinionLabel ?? SURVEY_OPINION_DEFAULT_LABEL;
  /** `useId` da un prefijo único por instancia: sin él, dos encuestas en la
   * misma página compartirían los `name` de sus radios y elegir en una
   * desmarcaría la otra. */
  const prefix = useId();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [opinion, setOpinion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const remaining = questions.length - answered;
  const opinionText = opinion.trim();

  /**
   * Qué hace falta para poder enviar.
   *
   * La opinión es OPCIONAL: está para quien tenga algo que decir, y exigirla
   * convertiría una encuesta de dos minutos en una redacción. Las puntuaciones
   * sí son todas obligatorias, para que las medias de las preguntas se calculen
   * sobre el mismo número de respuestas.
   *
   * El caso sin preguntas no es teórico: un grupo puede pedir solo opinión, y
   * entonces lo que falta es justamente el texto.
   */
  const isComplete =
    questions.length > 0 ? remaining === 0 : wantsOpinion && opinionText !== '';

  const handleSubmit = async () => {
    setError(null);
    setIsSending(true);

    try {
      const repository = await getRepository();

      await repository.submitSurveyAnswers({
        groupId,
        /**
         * El filtro se queda aunque el botón ya garantice que están todas.
         *
         * Es una red, no una comprobación duplicada: sin él, una pregunta sin
         * responder viajaría con `value: undefined` y la base devolvería un
         * error de columna nula en lugar de ignorarla. Cuesta una línea y
         * convierte un fallo en un no-problema.
         *
         * El enunciado viaja con la respuesta porque puede reescribirse después
         * y las estadísticas tienen que seguir diciendo a qué se contestó.
         */
        answers: [
          ...questions
            .filter((question) => answers[question.id] !== undefined)
            .map((question) => ({
              questionId: question.id,
              questionText: question.text,
              value: answers[question.id],
            })),

          /**
           * La opinión viaja en la MISMA lista, con la clave reservada y sin
           * puntuación. Así comparte `submission_id` con las respuestas que la
           * acompañan y se puede saber qué puntuó quien escribió esto.
           *
           * `questionText` lleva el enunciado con el que se pidió, por lo mismo
           * que las preguntas: el administrador puede reescribirlo después y la
           * opinión antigua tiene que seguir diciendo a qué contestaba.
           */
          ...(wantsOpinion && opinionText !== ''
            ? [
                {
                  questionId: SURVEY_OPINION_KEY,
                  questionText: opinionLabel,
                  value: null,
                  text: opinionText,
                },
              ]
            : []),
        ],
      });

      setIsSent(true);
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos enviar tus respuestas.'));
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <section className="survey" data-testid="SurveyBlock">
        <Spinner size="md" label="Cargando las preguntas" />
      </section>
    );
  }

  /**
   * Sin preguntas no se pinta NADA, ni un aviso.
   *
   * Pasa con un grupo recién creado al que todavía no se le han escrito
   * enunciados. Un recuadro vacío entre instrucciones de primeros auxilios
   * estorba más que la ausencia del bloque, y el administrador ya ve el aviso
   * en el editor.
   */
  if (loadError !== null || (questions.length === 0 && !wantsOpinion)) return null;

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
          {/* El encabezado propio de esta colocación gana al del grupo: una
              misma encuesta puede presentarse distinto en cada página. */}
          <h3 className="survey__title">
            {title ?? group?.title ?? 'Cuéntanos tu opinión'}
          </h3>
          {/* Un «0 de 0 contestadas» en un grupo que solo pide opinión sería
              una cuenta de nada. */}
          {questions.length > 0 && (
            <p className="survey__progress" aria-live="polite">
              {answered} de {questions.length} contestadas
            </p>
          )}
        </div>
      </header>

      {intro && <p className="survey__intro">{intro}</p>}

      {/* La leyenda de la escala, una vez arriba. Repetirla en cada pregunta
          en pantallas anchas sería ruido; en móvil cada fila la repite porque
          la escala queda lejos de esta cabecera. */}
      {questions.length > 0 && (
        <div className="survey__legend" aria-hidden="true">
          <span className="survey__legend-end">1 · {lowLabel}</span>
          <span className="survey__legend-end">5 · {highLabel}</span>
        </div>
      )}

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

      {/**
       * La opinión abierta, debajo de los enunciados.
       *
       * Va al final a propósito: escribir cuesta más que pulsar un círculo, y
       * puesta arriba haría abandonar a quien solo pensaba puntuar. Aquí llega
       * con la encuesta ya contestada.
       *
       * `label` de verdad con `htmlFor`, no un párrafo encima: es lo que hace
       * que al pulsar el texto se enfoque el recuadro y que un lector de
       * pantalla anuncie qué se pide al entrar en él.
       */}
      {wantsOpinion && (
        <div className="survey__opinion">
          <label className="survey__opinion-label" htmlFor={`${prefix}-opinion`}>
            <span className="survey__opinion-icon" aria-hidden="true">
              <MessageSquare />
            </span>
            {opinionLabel}
          </label>

          <Textarea
            id={`${prefix}-opinion`}
            className="survey__opinion-input"
            rows={4}
            value={opinion}
            disabled={isSending}
            // El tope lo repite la base en un `check`. Aquí evita que alguien
            // escriba de más y lo pierda al enviar.
            maxLength={SURVEY_OPINION_MAX_LENGTH}
            onChange={(event) => setOpinion(event.target.value)}
            placeholder="Lo que quieras contarnos: qué te ha servido, qué no has entendido…"
          />

          <p className="survey__opinion-foot">
            <span>Opcional. No pongas datos personales.</span>
            {/* El recuento aparece solo cuando hay texto: un «0/2000» sobre un
                recuadro vacío parece un requisito. */}
            {opinion.length > 0 && (
              <span className="survey__opinion-count">
                {opinion.length}/{SURVEY_OPINION_MAX_LENGTH}
              </span>
            )}
          </p>
        </div>
      )}

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <Button
        variant="primary"
        size="md"
        fullWidth
        iconStart={<Send />}
        loading={isSending}
        // Hay que contestarlo todo. Así ninguna pregunta queda sin datos y las
        // medias de todas se calculan sobre el mismo número de respuestas.
        disabled={!isComplete}
        onClick={() => void handleSubmit()}
      >
        {/**
         * Un botón deshabilitado sin explicación deja a quien lo ve buscando
         * qué le falta, así que la etiqueta lo dice y se actualiza con cada
         * respuesta. El contador de la cabecera va en `aria-live`, de modo que
         * un lector de pantalla también se enterará.
         */}
        {isComplete
          ? 'Enviar respuestas'
          : questions.length === 0
            ? 'Escribe tu opinión para poder enviarla'
            : `Falta${remaining === 1 ? '' : 'n'} ${remaining} ${remaining === 1 ? 'pregunta' : 'preguntas'} por contestar`}
      </Button>
    </section>
  );
};

export default SurveyBlock;
