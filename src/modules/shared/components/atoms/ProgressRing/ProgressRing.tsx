import './ProgressRing.scss';

export interface ProgressRingProps {
  value: number;
  max: number;
  /** Diametro en pixeles. */
  size?: number;
  tone?: 'emergency' | 'safe' | 'info';
  /** Texto accesible. Si se omite se describe como "N de M". */
  label?: string;
}

const STROKE_RATIO = 0.11;

/**
 * Anillo de progreso en SVG. Sin dependencias de graficos: son dos circulos y
 * un `stroke-dashoffset`, y pesa cero frente a traer una libreria entera.
 *
 * El valor se expone con `role="progressbar"`, así que un lector de pantalla
 * anuncia el avance sin depender del texto del centro.
 */
const ProgressRing = ({
  value,
  max,
  size = 72,
  tone = 'emergency',
  label,
}: ProgressRingProps) => {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ratio = clamped / safeMax;

  const stroke = size * STROKE_RATIO;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const isComplete = clamped === safeMax;

  return (
    <div
      className={`progress-ring progress-ring--${tone} ${isComplete ? 'is-complete' : ''}`.trim()}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label ?? `${clamped} de ${safeMax} completados`}
      data-testid="ProgressRing"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <span className="progress-ring__text" aria-hidden="true">
        <strong>{clamped}</strong>
        <span className="progress-ring__total">/{safeMax}</span>
      </span>
    </div>
  );
};

export default ProgressRing;
