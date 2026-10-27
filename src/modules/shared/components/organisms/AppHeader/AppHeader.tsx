import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings, ShieldPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { logoutUser, selectAuthUser, selectIsAdmin } from 'modules/auth/store/authSlice';
import { ROUTES } from 'modules/shared/constants/routes';
import Badge from 'modules/shared/components/atoms/Badge/Badge';
import Button from 'modules/shared/components/atoms/Button/Button';
import './AppHeader.scss';

const AppHeader = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const isAdmin = useAppSelector(selectIsAdmin);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="app-header" data-testid="AppHeader">
      <div className="app-header__inner app-container">
        <Link to={ROUTES.HOME} className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true">
            <ShieldPlus />
          </span>
          <span className="app-header__name">
            Responde<strong>Ya</strong>
          </span>
        </Link>

        <nav className="app-header__nav" aria-label="Navegacion principal">
          <NavLink to={ROUTES.MODULES} className="app-header__link">
            Modulos
          </NavLink>
          <NavLink to={ROUTES.SEARCH} className="app-header__link">
            Buscar
          </NavLink>
          {isAdmin && (
            <NavLink to={ROUTES.ADMIN_MODULES} className="app-header__link">
              <Settings aria-hidden="true" />
              Administrar
            </NavLink>
          )}
        </nav>

        <div className="app-header__user">
          {user && (
            <>
              <span className="app-header__user-name">{user.displayName}</span>
              {isAdmin && <Badge tone="info">Admin</Badge>}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                iconStart={<LogOut />}
                aria-label="Cerrar sesion"
              >
                Salir
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
