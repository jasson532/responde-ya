import { Link } from 'react-router-dom';
import { buildRoute } from 'modules/shared/constants/routes';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  ModuleSeverity,
  ModuleStatus,
  type ContentModule,
} from 'modules/content/types/content.types';
import './ModuleTile.scss';

export interface ModuleTileProps {
  module: ContentModule;
}

const LABEL_BY_SEVERITY: Record<ModuleSeverity, string> = {
  [ModuleSeverity.Critical]: 'Riesgo vital',
  [ModuleSeverity.Urgent]: 'Urgente',
  [ModuleSeverity.Basic]: 'Básico',
};

/**
 * Tarjeta de módulo: icono, título y nada más.
 *
 * El relleno pastel lo marca la gravedad, pero el color NO puede ser el único
 * portador de esa información (WCAG 1.4.1): por eso se mantiene la etiqueta de
 * gravedad, aunque sea diminuta. Es dato de seguridad, no decoración.
 *
 * Un módulo «próximamente» se dibuja en gris y NO se renderiza como enlace.
 * Un `<a>` con `aria-disabled` seguiría siendo tabulable y navegable con Enter:
 * la única forma de que no se pueda abrir es que no sea un enlace.
 */
const ModuleTile = ({ module }: ModuleTileProps) => {
  const isLocked = module.status === ModuleStatus.ComingSoon;

  const className = [
    'module-tile',
    `module-tile--${module.severity}`,
    isLocked && 'module-tile--locked',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="module-tile__icon" aria-hidden="true">
        {getModuleIcon(module.iconName)}
      </span>

      <span className="module-tile__title">{module.title}</span>

      {/* En gris la gravedad ya no se puede leer en el color, pero tampoco
          sirve de nada: no hay protocolo que seguir todavía. La etiqueta pasa a
          explicar por qué la tarjeta está apagada. */}
      {isLocked ? (
        <span className="module-tile__tag">Próximamente</span>
      ) : (
        <span className="module-tile__severity">
          {module.status === ModuleStatus.Draft
            ? 'Borrador'
            : LABEL_BY_SEVERITY[module.severity]}
        </span>
      )}
    </>
  );

  if (isLocked) {
    return (
      <div className={className} aria-disabled="true" data-testid="ModuleTile">
        {body}
      </div>
    );
  }

  return (
    <Link
      to={buildRoute.moduleDetail(module.id)}
      className={className}
      data-testid="ModuleTile"
    >
      {body}
    </Link>
  );
};

export default ModuleTile;
