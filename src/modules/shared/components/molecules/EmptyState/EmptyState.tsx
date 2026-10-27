import type { ReactNode } from 'react';
import './EmptyState.scss';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="empty-state" data-testid="EmptyState">
    {icon && (
      <span className="empty-state__icon" aria-hidden="true">
        {icon}
      </span>
    )}
    <h2 className="empty-state__title">{title}</h2>
    {description && <p className="empty-state__description">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

export default EmptyState;
