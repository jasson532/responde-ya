import { useState } from 'react';
import { Check, ListChecks } from 'lucide-react';
import type { ChecklistItem } from 'modules/content/types/content.types';
import './InteractiveChecklist.scss';

export interface InteractiveChecklistProps {
  title?: string;
  items: ChecklistItem[];
}

/**
 * Lista que se va marcando mientras se actúa.
 *
 * El avance es local y efímero: nadie quiere arrastrar lo que marcó la vez
 * anterior, y menos en una emergencia.
 *
 * La casilla que se ve es nuestra, pero el `<input type="checkbox">` sigue ahí
 * debajo: se le quita la apariencia nativa, no el elemento. Dibujar un `div`
 * con un `onClick` habría costado reimplementar a mano el foco, la barra
 * espaciadora, el estado que anuncia un lector de pantalla y la asociación con
 * la etiqueta.
 */
const InteractiveChecklist = ({ title, items }: InteractiveChecklistProps) => {
  const [checkedIds, setCheckedIds] = useState<ReadonlySet<string>>(new Set());

  const toggle = (itemId: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const doneCount = checkedIds.size;
  const total = items.length;
  const isComplete = doneCount === total && total > 0;
  // Sin elementos el porcentaje sería 0/0: se fuerza el divisor a 1.
  const percent = Math.round((doneCount / Math.max(total, 1)) * 100);

  return (
    <section
      className={`checklist ${isComplete ? 'is-complete' : ''}`.trim()}
      data-testid="InteractiveChecklist"
    >
      <header className="checklist__head">
        <span className="checklist__badge" aria-hidden="true">
          {isComplete ? <Check /> : <ListChecks />}
        </span>

        <div className="checklist__head-text">
          <h3 className="checklist__title">{title ?? 'Lista de comprobación'}</h3>
          {/**
           * El avance se anuncia por voz al cambiar. Va en el texto y no solo
           * en la barra porque una barra de progreso sin número no dice nada a
           * quien no la ve.
           */}
          <p className="checklist__progress" aria-live="polite">
            {isComplete ? 'Todo listo' : `${doneCount} de ${total} listo`}
          </p>
        </div>
      </header>

      {/* Decorativa: el texto de arriba ya da el dato exacto. */}
      <div className="checklist__bar" aria-hidden="true">
        <span className="checklist__bar-fill" style={{ width: `${percent}%` }} />
      </div>

      <ul className="checklist__list">
        {items.map((item) => {
          const isChecked = checkedIds.has(item.id);

          return (
            <li key={item.id} className="checklist__item">
              <label className={`checklist__label ${isChecked ? 'is-checked' : ''}`.trim()}>
                <input
                  type="checkbox"
                  className="checklist__input"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                />

                {/* El visto se dibuja encima de la casilla y solo se ve cuando
                    está marcada; el `input` hermano lo controla por CSS. */}
                <span className="checklist__check" aria-hidden="true">
                  <Check />
                </span>

                <span className="checklist__text">{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default InteractiveChecklist;
