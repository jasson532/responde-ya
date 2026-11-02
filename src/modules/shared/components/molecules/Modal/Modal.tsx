import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './Modal.scss';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Zona de acciones al pie. Suele llevar guardar y cancelar. */
  footer?: ReactNode;
  /** `lg` para formularios con listas de elementos. */
  size?: 'md' | 'lg';
}

/**
 * ===========================================================================
 * DIÁLOGO MODAL
 * ===========================================================================
 * Usa el `<dialog>` nativo con `showModal()`, no un `div` con posición fija.
 *
 * El elemento nativo resuelve por su cuenta cuatro cosas que, a mano, se
 * implementan mal casi siempre: el foco queda atrapado dentro del diálogo, el
 * resto de la página se vuelve inerte para los lectores de pantalla, la tecla
 * Escape cierra, y el fondo se oscurece con `::backdrop` sin añadir un nodo.
 * ===========================================================================
 */
const Modal = ({ isOpen, title, onClose, children, footer, size = 'md' }: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  /**
   * Abrir y cerrar se sincroniza con la prop, comprobando antes el estado real
   * del elemento: llamar a `showModal()` sobre un diálogo ya abierto lanza una
   * excepción.
   */
  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  /**
   * Escape no cierra solo: dispara `cancel`, y hay que avisar al padre para
   * que actualice su estado. Sin esto, el diálogo se cerraría visualmente
   * mientras la aplicación sigue creyéndolo abierto, y no volvería a abrirse.
   */
  const handleCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      onClose();
    },
    [onClose],
  );

  /**
   * Clic en el fondo oscuro.
   *
   * El `::backdrop` no es un nodo aparte: los clics sobre él tienen al propio
   * `<dialog>` como destino, mientras que los de dentro tienen a sus hijos. Esa
   * diferencia es lo que distingue «fuera» de «dentro» sin medir coordenadas.
   */
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === ref.current) onClose();
    },
    [onClose],
  );

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
      data-testid="Modal"
    >
      {/* El contenido se monta solo mientras está abierto: así un formulario
          arranca limpio en cada apertura, sin arrastrar lo escrito la vez
          anterior. */}
      {isOpen && (
        <div className="modal__panel">
          <header className="modal__head">
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>

            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div className="modal__body">{children}</div>

          {footer && <footer className="modal__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
};

export default Modal;
