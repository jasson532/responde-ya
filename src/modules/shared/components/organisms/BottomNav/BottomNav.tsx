import { NavLink } from 'react-router-dom';
import { House, Search, Settings, ShieldUser, Siren } from 'lucide-react';
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

  const items: NavItem[] = [
    { to: ROUTES.WELCOME, label: 'Inicio', icon: <House />, end: true },
    { to: ROUTES.MODULES, label: 'Módulos', icon: <Siren /> },
    { to: ROUTES.SEARCH, label: 'Buscar', icon: <Search /> },
    isAdmin
      ? { to: ROUTES.ADMIN_MODULES, label: 'Gestionar', icon: <Settings /> }
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
