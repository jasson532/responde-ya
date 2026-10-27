import { Link } from 'react-router-dom';
import { Clock, FileStack } from 'lucide-react';
import Badge from 'modules/shared/components/atoms/Badge/Badge';
import { buildRoute } from 'modules/shared/constants/routes';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import { ModuleStatus, type ContentModule } from 'modules/content/types/content.types';
import SeverityBadge from 'modules/content/components/molecules/SeverityBadge/SeverityBadge';
import './ModuleCard.scss';

export interface ModuleCardProps {
  module: ContentModule;
}

const ModuleCard = ({ module }: ModuleCardProps) => (
  <article className={`module-card module-card--${module.severity}`} data-testid="ModuleCard">
    <Link to={buildRoute.moduleDetail(module.id)} className="module-card__link">
      <span className="module-card__icon" aria-hidden="true">
        {getModuleIcon(module.iconName)}
      </span>

      <div className="module-card__head">
        <h3 className="module-card__title">{module.title}</h3>
        <p className="module-card__summary">{module.summary}</p>
      </div>

      <div className="module-card__meta">
        <SeverityBadge severity={module.severity} />
        {module.status === ModuleStatus.Draft && <Badge tone="neutral">Borrador</Badge>}
      </div>

      <dl className="module-card__stats">
        <div>
          <dt className="sr-only">Duracion estimada</dt>
          <dd>
            <Clock aria-hidden="true" />
            {module.estimatedMinutes} min
          </dd>
        </div>
        <div>
          <dt className="sr-only">Cantidad de pasos</dt>
          <dd>
            <FileStack aria-hidden="true" />
            {module.lessons.length} {module.lessons.length === 1 ? 'seccion' : 'secciones'}
          </dd>
        </div>
      </dl>
    </Link>
  </article>
);

export default ModuleCard;
