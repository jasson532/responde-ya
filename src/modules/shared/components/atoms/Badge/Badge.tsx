import type { ReactNode } from 'react';
import './Badge.scss';

export type BadgeTone = 'neutral' | 'emergency' | 'safe' | 'warning' | 'info';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
}

const Badge = ({ children, tone = 'neutral', icon }: BadgeProps) => (
  <span className={`badge badge--${tone}`} data-testid="Badge">
    {icon && (
      <span className="badge__icon" aria-hidden="true">
        {icon}
      </span>
    )}
    {children}
  </span>
);

export default Badge;
