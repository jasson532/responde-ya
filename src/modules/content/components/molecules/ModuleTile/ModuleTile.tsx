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
 */
const ModuleTile = ({ module }: ModuleTileProps) => (
  <Link
    to={buildRoute.moduleDetail(module.id)}
    className={`module-tile module-tile--${module.severity}`}
    data-testid="ModuleTile"
  >
    <span className="module-tile__icon" aria-hidden="true">
      {getModuleIcon(module.iconName)}
    </span>

    <span className="module-tile__title">{module.title}</span>

    <span className="module-tile__severity">
      {module.status === ModuleStatus.Draft
        ? 'Borrador'
        : LABEL_BY_SEVERITY[module.severity]}
    </span>
  </Link>
);

export default ModuleTile;
