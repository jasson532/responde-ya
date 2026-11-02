import type { StatItem } from 'modules/content/types/content.types';
import './StatsRow.scss';

export interface StatsRowProps {
  title?: string;
  stats: StatItem[];
}

/**
 * Cifras clave en grande.
 *
 * Reemplaza párrafos como «comprime entre 100 y 120 veces por minuto hundiendo
 * el pecho unos 5 cm»: el dato se localiza con la vista en vez de leerse.
 */
const StatsRow = ({ title, stats }: StatsRowProps) => (
  <section className="stats-row" data-testid="StatsRow">
    {title && <h3 className="stats-row__title">{title}</h3>}

    <dl className="stats-row__list">
      {stats.map((stat) => (
        <div key={stat.id} className="stats-row__item">
          <dd className="stats-row__value">{stat.value}</dd>
          <dt className="stats-row__label">{stat.label}</dt>
        </div>
      ))}
    </dl>
  </section>
);

export default StatsRow;
