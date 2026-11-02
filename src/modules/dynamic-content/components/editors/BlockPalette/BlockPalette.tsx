import Modal from 'modules/shared/components/molecules/Modal/Modal';
import {
  GROUP_LABEL,
  GROUP_ORDER,
  blocksInGroup,
  type BlockDefinition,
} from 'modules/dynamic-content/constants/blockLibrary';
import './BlockPalette.scss';

export interface BlockPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (definition: BlockDefinition) => void;
}

/**
 * La biblioteca de componentes, en un diálogo.
 *
 * Agrupada por familias porque diecisiete fichas en lista plana no se recorren
 * con la vista: hay que leerlas una por una. Cada ficha lleva una línea que
 * dice PARA QUÉ sirve, no qué es, porque «fichas con icono» no le dice nada a
 * quien busca cómo poner las señales de un paro cardíaco.
 *
 * Elegir un componente no crea nada todavía: abre su formulario. Así cancelar
 * no deja bloques a medio hacer en la página.
 */
const BlockPalette = ({ isOpen, onClose, onPick }: BlockPaletteProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Añadir componente" size="lg">
    <div className="block-palette" data-testid="BlockPalette">
      {GROUP_ORDER.map((group) => {
        const definitions = blocksInGroup(group);
        if (definitions.length === 0) return null;

        return (
          <section key={group} className="block-palette__group">
            <h3 className="block-palette__group-title">{GROUP_LABEL[group]}</h3>

            <ul className="block-palette__list">
              {definitions.map((definition) => (
                <li key={definition.kind}>
                  <button
                    type="button"
                    className="block-palette__option"
                    onClick={() => onPick(definition)}
                  >
                    <span className="block-palette__icon" aria-hidden="true">
                      {definition.icon}
                    </span>

                    <span className="block-palette__text">
                      <span className="block-palette__label">{definition.label}</span>
                      <span className="block-palette__description">
                        {definition.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  </Modal>
);

export default BlockPalette;
