import type { KeyPointsData } from 'modules/dynamic-content/types/blocks.types';
import { TONE_ICON } from 'modules/dynamic-content/constants/toneIcons';
import './KeyPointsBlock.scss';

/**
 * ===========================================================================
 * FICHAS CON ICONO
 * ===========================================================================
 * Señales o indicaciones, cada una con su titular y su detalle.
 *
 * Antes lo pintaba `KeyPointsList`, la molécula del módulo antiguo, y el
 * renderizador traducía los cinco tonos del bloque a los tres que esa molécula
 * entiende. Eso hacía que el formulario prometiera algo que la pantalla no
 * cumplía: elegir «peligro» o «atención» daba exactamente el mismo rojo, y
 * «neutro» o «información» el mismo azul.
 *
 * Al tener su propio componente, `BlockTone` se usa tal cual y los cinco tonos
 * se ven distintos. La molécula antigua sigue intacta para el contenido viejo.
 * ===========================================================================
 */
const KeyPointsBlock = ({ title, points }: KeyPointsData) => (
  <section className="key-points-block" data-testid="KeyPointsBlock">
    {title && <h3 className="key-points-block__title">{title}</h3>}

    <ul className="key-points-block__list">
      {points.map((point) => (
        <li
          key={point.id}
          className={`key-points-block__item key-points-block__item--${point.tone}`}
        >
          {/* Decorativo: el tono y el texto ya dicen lo que significa. */}
          <span className="key-points-block__icon" aria-hidden="true">
            {TONE_ICON[point.tone]}
          </span>

          {/**
           * El titular va en `<strong>` dentro del párrafo y NO como
           * encabezado: las fichas son hermanas sueltas dentro de una sección,
           * y colgar cinco `<h4>` del árbol ensucia el índice de encabezados
           * con el que un lector de pantalla navega la página.
           */}
          <p className="key-points-block__body">
            <strong className="key-points-block__point-title">{point.title}</strong>
            {point.detail.trim() !== '' && (
              <span className="key-points-block__detail">{point.detail}</span>
            )}
          </p>
        </li>
      ))}
    </ul>
  </section>
);

export default KeyPointsBlock;
