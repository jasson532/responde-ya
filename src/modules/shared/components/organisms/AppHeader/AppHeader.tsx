import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings, ShieldPlus, ShieldUser } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { logoutAdmin, selectAdminUser, selectIsAdmin } from 'modules/auth/store/authSlice';
import { ROUTES } from 'modules/shared/constants/routes';
import Badge from 'modules/shared/components/atoms/Badge/Badge';
import Button from 'modules/shared/components/atoms/Button/Button';
import './AppHeader.scss';

const AppHeader = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = useAppSelector(selectIsAdmin);
  const admin = useAppSelector(selectAdminUser);

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    // Al salir no se expulsa a nadie: se vuelve a visitante anonimo, que sigue
    // teniendo acceso completo de lectura.
    navigate(ROUTES.MODULES, { replace: true });
  };

  return (
    <header className="app-header" data-testid="AppHeader">
      <div className="app-header__inner app-container">
        {/* La marca lleva al inicio, como se espera de un logo de cabecera. */}
        <Link to={ROUTES.WELCOME} className="app-header__brand" aria-label="RespondeYa, ir al inicio">
          <span className="app-header__logo" aria-hidden="true">
            <ShieldPlus />
          </span>
          <span className="app-header__name">
            Responde<strong>Ya</strong>
          </span>
        </Link>

        <nav className="app-header__nav" aria-label="Navegación principal">
          <NavLink to={ROUTES.MODULES} className="app-header__link">
            Módulos
          </NavLink>
          <NavLink to={ROUTES.SEARCH} className="app-header__link">
            Buscar
          </NavLink>
          {isAdmin && (
            <NavLink to={ROUTES.ADMIN_MODULES} className="app-header__link">
              <Settings aria-hidden="true" />
              Gestionar contenido
            </NavLink>
          )}
        </nav>

        <div className="app-header__user">
          {isAdmin ? (
            <>
              <span className="app-header__user-name">{admin?.displayName}</span>
              <Badge tone="info">Admin</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLogout()}
                iconStart={<LogOut />}
              >
                Salir
              </Button>
            </>
          ) : (
            // Discreto a propósito: el visitante anonimo no necesita cuenta.
            <NavLink to={ROUTES.WELCOME} className="app-header__link" end>
              <ShieldUser aria-hidden="true" />
              Soy administrador
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
