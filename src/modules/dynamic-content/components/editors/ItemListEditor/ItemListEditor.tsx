import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import './ItemListEditor.scss';

export interface ItemListEditorProps<T> {
  label: string;
  hint?: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** Crea un elemento vacío. Recibe el índice para generar un id único. */
  createItem: (index: number) => T;
  /** Pinta los campos de un elemento. Recibe el elemento y cómo actualizarlo. */
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  addLabel?: string;
  /** Por debajo de este número no se puede borrar. Suele ser 1. */
  minItems?: number;
  maxItems?: number;
}

/**
 * Lista de elementos dentro del formulario de un componente.
 *
 * La usan las fichas, las cifras, los pasos, las opciones de una pregunta y
 * las columnas de «sí y no»: todas son «una lista de cosas con los mismos
 * campos, que se añaden, se quitan y se reordenan». Escribir ese mecanismo en
 * cada formulario daría cinco versiones que se comportan distinto.
 *
 * Genérica en `T` para que cada formulario mantenga sus propios tipos: el
 * `renderItem` de las cifras recibe una cifra, no un objeto cualquiera.
 */
const ItemListEditor = <T,>({
  label,
  hint,
  items,
  onChange,
  createItem,
  renderItem,
  addLabel = 'Añadir',
  minItems = 1,
  maxItems = 20,
}: ItemListEditorProps<T>) => {
  const update = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="item-list">
      <legend className="item-list__legend">{label}</legend>
      {hint && <p className="item-list__hint">{hint}</p>}

      <ol className="item-list__list">
        {items.map((item, index) => (
          // El índice como clave es correcto aquí: la lista se reordena
          // reemplazando el array completo, así que React vuelve a pintar
          // todas las filas de todos modos.
          <li key={index} className="item-list__item">
            <div className="item-list__fields">
              {renderItem(item, (patch) => update(index, patch), index)}
            </div>

            <div className="item-list__actions">
              <button
                type="button"
                className="item-list__action"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Subir elemento ${index + 1}`}
              >
                <ChevronUp aria-hidden="true" />
              </button>

              <button
                type="button"
                className="item-list__action"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Bajar elemento ${index + 1}`}
              >
                <ChevronDown aria-hidden="true" />
              </button>

              <button
                type="button"
                className="item-list__action item-list__action--danger"
                onClick={() => remove(index)}
                // No se puede dejar la lista por debajo del mínimo: un bloque
                // de cifras sin cifras no pasaría la validación al guardar, y
                // el error llegaría sin explicar qué falta.
                disabled={items.length <= minItems}
                aria-label={`Eliminar elemento ${index + 1}`}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        iconStart={<Plus />}
        onClick={() => onChange([...items, createItem(items.length)])}
        disabled={items.length >= maxItems}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
};

export default ItemListEditor;
