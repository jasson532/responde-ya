import { Check, X } from 'lucide-react';
import type { DoDontItem } from 'modules/content/types/content.types';
import './DoDontGrid.scss';

export interface DoDontGridProps {
  doTitle?: string;
  dontTitle?: string;
  doItems: DoDontItem[];
  dontItems: DoDontItem[];
}

/**
 * Lo que sí y lo que nunca, enfrentados.
 *
 * Condensa varias advertencias sueltas en una sola lectura comparativa. Los
 * iconos de ✓ y ✗ van en el texto accesible de cada columna, no por elemento:
 * repetirlos 8 veces en un lector de pantalla es ruido.
 */
const DoDontGrid = ({
  doTitle = 'Hazlo así',
  dontTitle = 'Nunca',
  doItems,
  dontItems,
}: DoDontGridProps) => (
  <div className="do-dont" data-testid="DoDontGrid">
    <section className="do-dont__col do-dont__col--do">
      <h3 className="do-dont__head">
        <span className="do-dont__badge" aria-hidden="true">
          <Check />
        </span>
        {doTitle}
      </h3>
      <ul className="do-dont__list">
        {doItems.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </section>

    <section className="do-dont__col do-dont__col--dont">
      <h3 className="do-dont__head">
        <span className="do-dont__badge" aria-hidden="true">
          <X />
        </span>
        {dontTitle}
      </h3>
      <ul className="do-dont__list">
        {dontItems.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </section>
  </div>
);

export default DoDontGrid;
