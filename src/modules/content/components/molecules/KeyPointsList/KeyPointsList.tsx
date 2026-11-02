import type { ReactNode } from 'react';
import { Check, CircleQuestionMark, TriangleAlert } from 'lucide-react';
import { KeyPointTone, type KeyPointItem } from 'modules/content/types/content.types';
import './KeyPointsList.scss';

export interface KeyPointsListProps {
  title?: string;
  points: KeyPointItem[];
}

/**
 * Icono por intención. El mapa vive aquí y no en los datos: qué dibujo
 * representa «alarma» es una decisión de presentación, y guardarla en el
 * contenido obligaría a migrar el navegador de todo el mundo para cambiarlo.
 */
const ICON_BY_TONE: Record<KeyPointTone, ReactNode> = {
  [KeyPointTone.Alert]: <TriangleAlert />,
  [KeyPointTone.Question]: <CircleQuestionMark />,
  [KeyPointTone.Check]: <Check />,
};

/**
 * Fichas con icono, titular y detalle.
 *
 * El titular va en `<strong>` dentro del párrafo y no como encabezado: son
 * hermanos sueltos dentro de una sección, y colgar cinco `<h4>` del árbol
 * ensucia el índice de encabezados que usa un lector de pantalla para navegar.
 */
const KeyPointsList = ({ title, points }: KeyPointsListProps) => (
  <section className="key-points" data-testid="KeyPointsList">
    {title && <h3 className="key-points__title">{title}</h3>}

    <ul className="key-points__list">
      {points.map((point) => (
        <li key={point.id} className={`key-points__item key-points__item--${point.tone}`}>
          <span className="key-points__icon" aria-hidden="true">
            {ICON_BY_TONE[point.tone]}
          </span>

          <p className="key-points__body">
            <strong className="key-points__point-title">{point.title}</strong>
            <span className="key-points__detail">{point.detail}</span>
          </p>
        </li>
      ))}
    </ul>
  </section>
);

export default KeyPointsList;
