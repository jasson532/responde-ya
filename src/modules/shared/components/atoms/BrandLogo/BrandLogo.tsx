import brandLogoSrc from 'modules/shared/assets/images/brand-logo.jpeg';
import './BrandLogo.scss';

/** Dimensiones intrinsecas del archivo. Fijarlas evita salto de layout (CLS). */
const INTRINSIC_WIDTH = 523;
const INTRINSIC_HEIGHT = 375;

export type BrandLogoSize = 'md' | 'lg';

export interface BrandLogoProps {
  size?: BrandLogoSize;
  /**
   * `true` cuando el logo es el encabezado principal de la pantalla: se precarga
   * con prioridad alta porque es el elemento visible mas grande (LCP).
   */
  priority?: boolean;
}

/**
 * Lockup completo de la marca: corazon, ECG y wordmark "RespondeYa".
 *
 * El archivo es un JPEG con fondo opaco (#fcfcfa), no transparente. Colocarlo
 * sobre un fondo distinto deja un rectangulo visible: usar siempre
 * `$color-brand-canvas` en la superficie contenedora.
 */
const BrandLogo = ({ size = 'md', priority = false }: BrandLogoProps) => (
  <img
    className={`brand-logo brand-logo--${size}`}
    src={brandLogoSrc}
    width={INTRINSIC_WIDTH}
    height={INTRINSIC_HEIGHT}
    alt="RespondeYa"
    loading={priority ? 'eager' : 'lazy'}
    fetchPriority={priority ? 'high' : 'auto'}
    decoding="async"
    data-testid="BrandLogo"
  />
);

export default BrandLogo;
