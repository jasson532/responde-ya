import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import './EditorRow.scss';

export interface EditorRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string | null;
  /** Etiqueta a la derecha del título. Ej. «Portada», «Plana». */
  badge?: string;
  /** Si viene, la fila entera es pulsable y entra a su contenido. */
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isBusy?: boolean;
  children?: ReactNode;
}

/**
 * Una fila del editor: página, sección o bloque.
 *
 * Los tres niveles comparten la misma anatomía —icono, título, acciones— así
 * que comparten componente. Escribirla tres veces garantizaría que las tres
 * acabaran comportándose de forma ligeramente distinta.
 *
 * Reordenar va con botones de subir y bajar, no arrastrando. El arrastre
 * accesible por teclado es un proyecto en sí mismo, y con listas de cinco
 * elementos los botones hacen el mismo trabajo. `onMoveUp` y `onMoveDown`
 * llegan sin definir en los extremos de la lista, y entonces el botón se
 * deshabilita en lugar de desaparecer: así la fila no cambia de ancho.
 */
const EditorRow = ({
  icon,
  title,
  subtitle,
  badge,
  onOpen,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isBusy = false,
  children,
}: EditorRowProps) => (
  <div className="editor-row" data-testid="EditorRow">
    <div className="editor-row__main">
      {icon && (
        <span className="editor-row__icon" aria-hidden="true">
          {icon}
        </span>
      )}

      <div className="editor-row__text">
        <span className="editor-row__title-line">
          {/* Si la fila se puede abrir, el título es el botón: da un objetivo
              grande sin convertir el contenedor en un control, que anidaría
              los botones de acción dentro de otro botón. */}
          {onOpen ? (
            <button type="button" className="editor-row__open" onClick={onOpen}>
              {title}
            </button>
          ) : (
            <span className="editor-row__title">{title}</span>
          )}

          {badge && <span className="editor-row__badge">{badge}</span>}
        </span>

        {subtitle && <span className="editor-row__subtitle">{subtitle}</span>}
      </div>

      <div className="editor-row__actions">
        {(onMoveUp || onMoveDown) && (
          <>
            <button
              type="button"
              className="editor-row__action"
              onClick={onMoveUp}
              disabled={!onMoveUp || isBusy}
              aria-label={`Subir ${title}`}
            >
              <ChevronUp aria-hidden="true" />
            </button>
            <button
              type="button"
              className="editor-row__action"
              onClick={onMoveDown}
              disabled={!onMoveDown || isBusy}
              aria-label={`Bajar ${title}`}
            >
              <ChevronDown aria-hidden="true" />
            </button>
          </>
        )}

        {onEdit && (
          <button
            type="button"
            className="editor-row__action"
            onClick={onEdit}
            disabled={isBusy}
            aria-label={`Editar ${title}`}
          >
            <Pencil aria-hidden="true" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="editor-row__action editor-row__action--danger"
            onClick={onDelete}
            disabled={isBusy}
            aria-label={`Eliminar ${title}`}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>
    </div>

    {children && <div className="editor-row__nested">{children}</div>}
  </div>
);

export default EditorRow;
