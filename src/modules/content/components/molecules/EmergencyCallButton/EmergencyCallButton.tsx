import { PhoneCall } from 'lucide-react';
import './EmergencyCallButton.scss';

export interface EmergencyCallButtonProps {
  phoneNumber: string;
  label: string;
}

/**
 * Enlace `tel:` en vez de botón: en movil marca directo y sigue funcionando
 * sin JavaScript. En una emergencia es la acción mas importante de la pantalla.
 */
const EmergencyCallButton = ({ phoneNumber, label }: EmergencyCallButtonProps) => (
  <a
    className="emergency-call"
    href={`tel:${phoneNumber}`}
    data-testid="EmergencyCallButton"
  >
    <span className="emergency-call__icon" aria-hidden="true">
      <PhoneCall />
    </span>
    <span className="emergency-call__body">
      <span className="emergency-call__label">{label}</span>
      <span className="emergency-call__number">Llamar al {phoneNumber}</span>
    </span>
  </a>
);

export default EmergencyCallButton;
