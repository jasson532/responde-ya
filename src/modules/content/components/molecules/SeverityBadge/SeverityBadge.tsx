import { AlertTriangle, HeartPulse, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import Badge, { type BadgeTone } from 'modules/shared/components/atoms/Badge/Badge';
import { ModuleSeverity } from 'modules/content/types/content.types';

export interface SeverityBadgeProps {
  severity: ModuleSeverity;
}

const CONFIG: Record<ModuleSeverity, { label: string; tone: BadgeTone; icon: ReactNode }> = {
  [ModuleSeverity.Critical]: {
    label: 'Riesgo vital',
    tone: 'emergency',
    icon: <HeartPulse />,
  },
  [ModuleSeverity.Urgent]: {
    label: 'Atención urgente',
    tone: 'warning',
    icon: <AlertTriangle />,
  },
  [ModuleSeverity.Basic]: {
    label: 'Cuidado básico',
    tone: 'safe',
    icon: <Info />,
  },
};

const SeverityBadge = ({ severity }: SeverityBadgeProps) => {
  const { label, tone, icon } = CONFIG[severity];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
};

export default SeverityBadge;
