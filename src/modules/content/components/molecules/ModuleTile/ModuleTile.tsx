import { Link } from 'react-router-dom';
import { Clock, Layers } from 'lucide-react';
import IconBubble, {
  type BubbleTone,
} from 'modules/shared/components/atoms/IconBubble/IconBubble';
import Badge from 'modules/shared/components/atoms/Badge/Badge';
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
  /** La ficha destacada ocupa el ancho completo de la rejilla. */
  featured?: boolean;
}

const TONE_BY_SEVERITY: Record<ModuleSeverity, BubbleTone> = {
  [ModuleSeverity.Critical]: 'emergency',
  [ModuleSeverity.Urgent]: 'warning',
  [ModuleSeverity.Basic]: 'safe',
};

const LABEL_BY_SEVERITY: Record<ModuleSeverity, string> = {
  [ModuleSeverity.Critical]: 'Riesgo vital',
  [ModuleSeverity.Urgent]: 'Urgente',
  [ModuleSeverity.Basic]: 'Básico',
};

/**
 * Ficha de módulo para la rejilla del inicio. El tinte lo marca la gravedad,
 * así que el color comunica urgencia antes de que nadie lea el título.
 */
const ModuleTile = ({ module, featured = false }: ModuleTileProps) => {
  const tone = TONE_BY_SEVERITY[module.severity];

  return (
    <Link
      to={buildRoute.moduleDetail(module.id)}
      className={`module-tile module-tile--${module.severity} ${featured ? 'module-tile--featured' : ''}`.trim()}
      data-testid="ModuleTile"
    >
      <span className="module-tile__top">
        <IconBubble tone={tone} size={featured ? 'xl' : 'lg'}>
          {getModuleIcon(module.iconName)}
        </IconBubble>

        <span className="module-tile__severity">{LABEL_BY_SEVERITY[module.severity]}</span>
      </span>

      <span className="module-tile__body">
        <span className="module-tile__title">{module.title}</span>
        <span className="module-tile__summary">{module.summary}</span>
      </span>

      <span className="module-tile__meta">
        <span className="module-tile__stat">
          <Clock aria-hidden="true" />
          {module.estimatedMinutes} min
        </span>
        <span className="module-tile__stat">
          <Layers aria-hidden="true" />
          {module.lessons.length} {module.lessons.length === 1 ? 'sección' : 'secciones'}
        </span>
        {module.status === ModuleStatus.Draft && <Badge tone="neutral">Borrador</Badge>}
      </span>
    </Link>
  );
};

export default ModuleTile;
