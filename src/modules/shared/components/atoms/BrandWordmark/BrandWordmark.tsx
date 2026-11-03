import { Link } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { ROUTES } from 'modules/shared/constants/routes';
import './BrandWordmark.scss';

export interface BrandWordmarkProps {
  /** Clases del contenedor, para que quien lo coloque ajuste su sitio. */
  className?: string;
}

/**
 * ===========================================================================
 * MARCA COMPACTA
 * ===========================================================================
 * El escudo y «RespondeYa», enlazando al inicio.
 *
 * Es la versión reducida del logo, NO el logo. El lockup de
 * `shared/assets/images/brand-logo.jpeg` mide 523×375 y a 40px de alto se
 * vuelve ilegible, así que aquí se reproduce su reparto de color: el nombre en
 * azul marino y la sílaba «Ya» en rojo.
 *
 * Vive en su propio átomo porque aparece en dos sitios —la cabecera de
 * escritorio y la cabecera del saludo en móvil— y con una copia en cada uno
 * acabarían siendo dos marcas distintas.
 *
 * Es un enlace, siempre al inicio: la convención de que el logo de una
 * aplicación lleva a su portada está tan asentada que no hacerlo desconcierta.
 * ===========================================================================
 */
const BrandWordmark = ({ className = '' }: BrandWordmarkProps) => (
  <Link
    to={ROUTES.WELCOME}
    className={`brand-wordmark ${className}`.trim()}
    // El texto de la marca ya está en el enlace, pero sin esto el lector de
    // pantalla lo anuncia sin decir a dónde lleva.
    aria-label="RespondeYa, ir al inicio"
    data-testid="BrandWordmark"
  >
    <span className="brand-wordmark__badge" aria-hidden="true">
      <ShieldPlus />
    </span>

    {/* `aria-hidden` porque el `aria-label` del enlace ya lo dice: sin esto se
        leería «RespondeYa ir al inicio RespondeYa». */}
    <span className="brand-wordmark__name" aria-hidden="true">
      Responde<strong>Ya</strong>
    </span>
  </Link>
);

export default BrandWordmark;
