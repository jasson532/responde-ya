import { useState } from 'react';
import type { ChecklistItem } from 'modules/content/types/content.types';
import './InteractiveChecklist.scss';

export interface InteractiveChecklistProps {
  title?: string;
  items: ChecklistItem[];
}

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

  return (
    <section className="interactive-checklist" data-testid="InteractiveChecklist">
      {title && <h3 className="interactive-checklist__title">{title}</h3>}

      <p className="interactive-checklist__progress" aria-live="polite">
        {checkedIds.size} de {items.length} listo
      </p>

      <ul className="interactive-checklist__list">
        {items.map((item) => {
          const isChecked = checkedIds.has(item.id);

          return (
            <li key={item.id} className="interactive-checklist__item">
              <label className="interactive-checklist__label">
                <input
                  type="checkbox"
                  className="interactive-checklist__input"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                />
                <span className={isChecked ? 'is-checked' : ''}>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default InteractiveChecklist;
