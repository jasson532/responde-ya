import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import './AlertMessage.scss';

export type AlertTone = 'error' | 'warning' | 'success' | 'info';

export interface AlertMessageProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

const ICON_BY_TONE: Record<AlertTone, ReactNode> = {
  error: <OctagonAlert />,
  warning: <AlertTriangle />,
  success: <CheckCircle2 />,
  info: <Info />,
};

const AlertMessage = ({
  tone = 'info',
  title,
  children,
  onRetry,
  retryLabel = 'Intentar de nuevo',
}: AlertMessageProps) => (
  <div
    className={`alert-message alert-message--${tone}`}
    role={tone === 'error' ? 'alert' : 'status'}
    data-testid="AlertMessage"
  >
    <span className="alert-message__icon" aria-hidden="true">
      {ICON_BY_TONE[tone]}
    </span>

    <div className="alert-message__body">
      {title && <p className="alert-message__title">{title}</p>}
      <div className="alert-message__text">{children}</div>
    </div>

    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </div>
);

export default AlertMessage;
