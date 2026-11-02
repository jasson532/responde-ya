import { NavLink } from 'react-router-dom';
import { House, Search, Settings, ShieldUser } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppSelector } from 'modules/shared/store/hooks';
import { selectIsAdmin } from 'modules/auth/store/authSlice';
import { ROUTES } from 'modules/shared/constants/routes';
import './BottomNav.scss';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** `end` evita que la pestana quede activa en todas las rutas hijas. */
  end?: boolean;
}

/**
 * Barra de pestanas inferior. Es la navegación principal en movil: el pulgar
 * alcanza la parte baja de la pantalla, no la alta.
 *
 * En escritorio se oculta y manda el AppHeader (ver AppShell).
 */
const BottomNav = () => {
  const isAdmin = useAppSelector(selectIsAdmin);

  /**
   * «Inicio» apunta a los módulos, no a `/`.
   *
   * La pantalla de bienvenida (`/`) es una puerta de entrada que se cruza una
   * vez; el inicio real, con el saludo y la rejilla, es `/modulos`. Tener una
   * pestaña «Inicio» y otra «Módulos» para dos pantallas parecidas solo
   * obligaba a adivinar cuál era cuál.
   */
  const items: NavItem[] = [
    { to: ROUTES.MODULES, label: 'Inicio', icon: <House /> },
    { to: ROUTES.SEARCH, label: 'Buscar', icon: <Search /> },
    // «Gestionar» lleva al editor de contenido dinámico, que es donde se
    // trabaja. El contenido antiguo sigue en `/admin/modulos` para quien
    // necesite llegar, pero ya no ocupa la pestaña.
    isAdmin
      ? { to: ROUTES.ADMIN_DYN, label: 'Gestionar', icon: <Settings /> }
      : { to: ROUTES.WELCOME, label: 'Admin', icon: <ShieldUser />, end: true },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal" data-testid="BottomNav">
      <ul className="bottom-nav__list">
        {items.map((item) => (
          <li key={item.label} className="bottom-nav__item">
            <NavLink to={item.to} end={item.end} className="bottom-nav__link">
              <span className="bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;
