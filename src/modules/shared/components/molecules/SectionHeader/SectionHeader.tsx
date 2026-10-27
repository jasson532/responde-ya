import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './SectionHeader.scss';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Enlace opcional de "ver todo". */
  actionLabel?: string;
  actionTo?: string;
}

const SectionHeader = ({
  title,
  description,
  actionLabel,
  actionTo,
}: SectionHeaderProps) => (
  <div className="section-header" data-testid="SectionHeader">
    <div className="section-header__text">
      <h2 className="section-header__title">{title}</h2>
      {description && <p className="section-header__description">{description}</p>}
    </div>

    {actionLabel && actionTo && (
      <Link to={actionTo} className="section-header__action">
        {actionLabel}
        <ChevronRight aria-hidden="true" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
