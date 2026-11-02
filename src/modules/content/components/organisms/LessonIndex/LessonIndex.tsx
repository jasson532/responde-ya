import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { buildRoute } from 'modules/shared/constants/routes';
import type { Lesson } from 'modules/content/types/content.types';
import './LessonIndex.scss';

export interface LessonIndexProps {
  moduleId: string;
  lessons: Lesson[];
}

/**
 * Índice del módulo: una fila por paso, numerada, que lleva a su pantalla.
 *
 * Sustituye a las pastillas que había antes. Con pastillas los pasos parecían
 * filtros intercambiables; numerados y en vertical se leen como la secuencia
 * que son, y además caben el título y el subtítulo de cada uno.
 *
 * El número va `aria-hidden`: la posición ya la anuncia el lector de pantalla
 * al recorrer la lista, así que leerlo en voz alta solo añade ruido.
 */
const LessonIndex = ({ moduleId, lessons }: LessonIndexProps) => (
  <ol className="lesson-index" data-testid="LessonIndex">
    {[...lessons]
      .sort((a, b) => a.order - b.order)
      .map((lesson, index) => (
        <li key={lesson.id} className="lesson-index__item">
          <Link
            className="lesson-index__link"
            to={buildRoute.lessonDetail(moduleId, lesson.id)}
          >
            <span className="lesson-index__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>

            <span className="lesson-index__body">
              <span className="lesson-index__title">{lesson.title}</span>
              {lesson.summary && (
                <span className="lesson-index__summary">{lesson.summary}</span>
              )}
            </span>

            <span className="lesson-index__chevron" aria-hidden="true">
              <ChevronRight />
            </span>
          </Link>
        </li>
      ))}
  </ol>
);

export default LessonIndex;
