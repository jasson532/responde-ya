import type { TableData } from 'modules/dynamic-content/types/blocks.types';
import './TableBlock.scss';

/**
 * Datos en filas y columnas.
 *
 * La tabla va envuelta en un contenedor con desplazamiento horizontal y
 * `tabindex="0"`: en un móvil, cuatro columnas no caben, y sin el `tabindex`
 * quien navega con teclado no puede desplazar la tabla para ver el resto.
 *
 * El `<caption>` se oculta visualmente pero se lee: da nombre a la tabla para
 * un lector de pantalla, que anuncia «tabla» sin decir de qué.
 */
const TableBlock = ({ title, headers, rows }: TableData) => (
  <div className="table-block" data-testid="TableBlock">
    {title && <h3 className="table-block__title">{title}</h3>}

    <div
      className="table-block__scroller"
      tabIndex={0}
      role="region"
      aria-label={title ?? 'Tabla de datos'}
    >
      <table className="table-block__table">
        {title && <caption className="table-block__caption">{title}</caption>}

        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${header}-${index}`} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TableBlock;
