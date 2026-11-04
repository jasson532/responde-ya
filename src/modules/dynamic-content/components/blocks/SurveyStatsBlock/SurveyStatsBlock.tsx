import { useEffect, useMemo, useState } from 'react';
import { ChartColumn, EyeOff, MessageSquareQuote } from 'lucide-react';
import { useAppSelector } from 'modules/shared/store/hooks';
import { selectIsAdmin } from 'modules/auth/store/authSlice';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type { SurveyStatsData } from 'modules/dynamic-content/types/blocks.types';
import type { SurveySummary } from 'modules/dynamic-content/types/dynamic.types';
import './SurveyStatsBlock.scss';

const SCALE = [1, 2, 3, 4, 5] as const;

/** Geometría del rosco. El radio sale del tamaño menos el grosor del trazo. */
const DONUT_SIZE = 160;
const DONUT_STROKE = 26;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const percent = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/**
 * Fecha de cada opinión.
 *
 * Se construye una vez a nivel de módulo y no en cada renderizado: un
 * `Intl.DateTimeFormat` cuesta bastante más que formatear con él, y aquí se
 * usa una vez por opinión.
 *
 * Locale fijo y no el del navegador: el resto de la aplicación está en español
 * y así dos administradores con el equipo en idiomas distintos leen la misma
 * fecha.
 */
const DATE_FORMAT = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * ===========================================================================
 * RESULTADOS DE ENCUESTA
 * ===========================================================================
 * Barra apilada por pregunta, rosco del grupo entero y tabla.
 *
 * SOLO PARA EL ADMINISTRADOR. Para cualquier otra persona no pinta NADA, ni un
 * aviso de permisos: el bloque se coloca en una página pública de primeros
 * auxilios, y un recuadro diciendo «no puedes ver esto» sería ruido entre las
 * instrucciones. La base de datos lo respalda: la función agregadora rechaza a
 * quien no sea admin, así que esconderlo aquí no es la protección, es el buen
 * comportamiento visual.
 *
 * Pide sus datos al montarse y los guarda en estado LOCAL. Son de esta
 * instancia: pueden convivir dos bloques con grupos distintos en la misma
 * página, y un único campo en el store los mezclaría.
 * ===========================================================================
 */
const SurveyStatsBlock = ({ groupId, title, chart }: SurveyStatsData) => {
  const isAdmin = useAppSelector(selectIsAdmin);

  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sin sesión de administrador la función agregadora responde con un error;
    // no se pide nada para no provocarlo.
    if (!isAdmin) return;

    let cancelled = false;

    /**
     * Los dos reinicios van DENTRO de la carga, no en el cuerpo del efecto.
     * Llamar a `setState` de forma sincrónica al entrar en un efecto encadena
     * un renderizado de más por cada montaje; aquí solo hacen falta cuando
     * `groupId` cambia en un bloque ya montado, y ese caso lo cubre igual.
     */
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const repository = await getRepository();
        const result = await repository.getSurveySummary(groupId);
        if (!cancelled) setSummary(result);
      } catch (cause) {
        if (!cancelled) {
          setError(toErrorMessage(cause, 'No pudimos cargar los resultados.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    // Evita escribir estado si el bloque se desmontó mientras llegaba la
    // respuesta, por ejemplo al navegar a otra página.
    return () => {
      cancelled = true;
    };
  }, [groupId, isAdmin]);

  /** Distribución del grupo entero: suma los cinco valores de todas las preguntas. */
  const totals = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    summary?.questions.forEach((question) => {
      question.votes.forEach((votes, index) => {
        counts[index] += votes;
      });
    });
    return { counts, total: counts.reduce((sum, votes) => sum + votes, 0) };
  }, [summary]);

  if (!isAdmin) return null;

  const showBars = chart === 'bars' || chart === 'both';
  const showDonut = chart === 'donut' || chart === 'both';

  /**
   * Las opiniones no dependen de `chart`: no son un gráfico, son el texto que
   * la gente escribió. Elegir «solo el rosco» no debería esconderlas.
   */
  const opinions = summary?.opinions ?? [];

  return (
    <section className="survey-stats" data-testid="SurveyStatsBlock">
      <header className="survey-stats__head">
        <span className="survey-stats__badge" aria-hidden="true">
          <ChartColumn />
        </span>

        <div className="survey-stats__head-text">
          <h3 className="survey-stats__title">{title ?? 'Resultados de la encuesta'}</h3>
          <p className="survey-stats__meta">
            {/**
             * Las opiniones se cuentan aparte de las respuestas: una es un
             * número de la escala y la otra un texto. Sumarlas daría una cifra
             * que no significa nada. Solo aparecen si hay alguna.
             */}
            {summary === null
              ? 'Cargando…'
              : `${summary.submissions} ${summary.submissions === 1 ? 'envío' : 'envíos'} · ${totals.total} ${totals.total === 1 ? 'respuesta' : 'respuestas'}${
                  summary.opinions.length > 0
                    ? ` · ${summary.opinions.length} ${summary.opinions.length === 1 ? 'opinión' : 'opiniones'}`
                    : ''
                }`}
          </p>
        </div>
      </header>

      <p className="survey-stats__private">
        <EyeOff aria-hidden="true" />
        Solo visible para administración
      </p>

      {isLoading ? (
        <Spinner size="md" label="Cargando resultados" />
      ) : error !== null ? (
        <AlertMessage tone="error">{error}</AlertMessage>
      ) : /**
         * El aviso de «nadie ha contestado» exige que no haya NADA: ni números
         * ni textos. Un grupo que solo pide opinión no tiene respuestas de
         * escala y seguiría teniendo algo que mostrar.
         */
      totals.total === 0 && opinions.length === 0 ? (
        <AlertMessage tone="info">
          Todavía nadie ha contestado esta encuesta. Los resultados aparecerán aquí en
          cuanto llegue la primera respuesta.
        </AlertMessage>
      ) : (
        <>
          {totals.total > 0 && (
            <>
              {/* La leyenda sirve a las barras y al rosco, así que va una vez. */}
              <ul className="survey-stats__legend">
                {SCALE.map((value) => (
                  <li className="survey-stats__legend-item" key={value}>
                    <span
                      className={`survey-stats__swatch survey-stats__swatch--${value}`}
                      aria-hidden="true"
                    />
                    {value}
                  </li>
                ))}
              </ul>

              {showDonut && (
                <div className="survey-stats__donut">
                  {/* El gráfico va oculto para lectores de pantalla: el desglose de
                      al lado y la tabla de abajo dicen lo mismo en texto. */}
                  <div className="survey-stats__donut-chart" aria-hidden="true">
                    <svg
                      className="survey-stats__donut-svg"
                      viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                    >
                      <circle
                        className="survey-stats__donut-track"
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        r={DONUT_RADIUS}
                        strokeWidth={DONUT_STROKE}
                      />

                      {(() => {
                        /**
                         * Cada porción es un círculo completo al que se le deja
                         * visible solo su trozo con `stroke-dasharray`, desplazado
                         * por lo que ya ocupan las anteriores. Es el mismo recurso
                         * de `ProgressRing`: cinco círculos y ninguna librería de
                         * gráficos, que pesaría más que todo el módulo.
                         */
                        let consumed = 0;

                        return SCALE.map((value) => {
                          const votes = totals.counts[value - 1];
                          const length = (votes / totals.total) * DONUT_CIRCUMFERENCE;
                          const offset = -consumed;
                          consumed += length;

                          if (votes === 0) return null;

                          return (
                            <circle
                              key={value}
                              className={`survey-stats__donut-segment survey-stats__donut-segment--${value}`}
                              cx={DONUT_SIZE / 2}
                              cy={DONUT_SIZE / 2}
                              r={DONUT_RADIUS}
                              strokeWidth={DONUT_STROKE}
                              strokeDasharray={`${length} ${DONUT_CIRCUMFERENCE - length}`}
                              strokeDashoffset={offset}
                            />
                          );
                        });
                      })()}
                    </svg>

                    <div className="survey-stats__donut-center">
                      <div>
                        <p className="survey-stats__donut-value">{totals.total}</p>
                        <p className="survey-stats__donut-caption">respuestas</p>
                      </div>
                    </div>
                  </div>

                  <ul className="survey-stats__donut-rows">
                    {SCALE.map((value) => (
                      <li className="survey-stats__donut-row" key={value}>
                        <span
                          className={`survey-stats__dot survey-stats__dot--${value}`}
                          aria-hidden="true"
                        />
                        <span className="survey-stats__donut-count">
                          {totals.counts[value - 1]}
                        </span>
                        <span>
                          en {value} · {percent(totals.counts[value - 1], totals.total)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showBars && (
                <div className="survey-stats__bars">
                  {summary?.questions.map((question) => (
                    <div className="survey-stats__bar-row" key={question.questionId}>
                      <div className="survey-stats__bar-head">
                        <p className="survey-stats__bar-label">{question.questionText}</p>
                        {question.average !== null && (
                          <span className="survey-stats__average">
                            media {question.average.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {question.total === 0 ? (
                        <p className="survey-stats__bar-empty">Sin respuestas</p>
                      ) : (
                        <div className="survey-stats__bar" aria-hidden="true">
                          {SCALE.map((value) => {
                            const votes = question.votes[value - 1];
                            if (votes === 0) return null;

                            return (
                              <span
                                key={value}
                                className={`survey-stats__segment survey-stats__segment--${value}`}
                                // `flex-grow` proporcional en vez de anchos en
                                // porcentaje: los redondeos no dejan huecos ni
                                // desbordan la suma del 100%.
                                style={{ flexGrow: votes }}
                              >
                                {votes}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/**
               * La tabla es el equivalente textual de los dos gráficos. No es un
               * añadido: es lo que hace legibles estos datos con un lector de
               * pantalla y lo que permite copiar las cifras exactas.
               */}
              <div className="survey-stats__table-wrap">
                <table className="survey-stats__table">
                  <caption>Respuestas por pregunta y valor</caption>
                  <thead>
                    <tr>
                      <th scope="col">Pregunta</th>
                      {SCALE.map((value) => (
                        <th scope="col" key={value}>
                          {value}
                        </th>
                      ))}
                      <th scope="col">Total</th>
                      <th scope="col">Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.questions.map((question) => (
                      <tr key={question.questionId}>
                        <th scope="row">{question.questionText}</th>
                        {SCALE.map((value) => (
                          <td key={value}>{question.votes[value - 1]}</td>
                        ))}
                        <td>{question.total}</td>
                        <td>{question.average === null ? '—' : question.average.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/**
           * LAS OPINIONES
           *
           * No se agregan ni se resumen: se listan una a una, tal cual se
           * escribieron. Contar cuántas veces aparece una palabra sería
           * inventar una medida sobre veinte textos.
           *
           * Lo más reciente primero, que es el orden en que llegan de la base:
           * en una lista que crece, lo último escrito es lo que se viene a
           * leer.
           */}
          {opinions.length > 0 && (
            <div className="survey-stats__opinions">
              <h4 className="survey-stats__opinions-title">
                <MessageSquareQuote aria-hidden="true" />
                {opinions.length === 1
                  ? 'Una opinión escrita'
                  : `${opinions.length} opiniones escritas`}
              </h4>

              <ul className="survey-stats__opinion-list">
                {opinions.map((opinion) => (
                  <li className="survey-stats__opinion" key={opinion.id}>
                    {/**
                     * `blockquote` y no un párrafo: es una cita literal de otra
                     * persona, y eso es exactamente lo que el elemento dice.
                     *
                     * `white-space: pre-line` en el CSS respeta los saltos de
                     * línea que escribió quien contestó; sin él, tres párrafos
                     * se leerían como uno.
                     */}
                    <blockquote className="survey-stats__opinion-text">
                      {opinion.text}
                    </blockquote>
                    <p className="survey-stats__opinion-date">
                      <time dateTime={opinion.createdAt}>
                        {DATE_FORMAT.format(new Date(opinion.createdAt))}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SurveyStatsBlock;
