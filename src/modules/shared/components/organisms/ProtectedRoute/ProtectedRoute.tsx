import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from 'modules/shared/store/hooks';
import {
  selectAuthUser,
  selectIsAuthBootstrapped,
} from 'modules/auth/store/authSlice';
import { ROUTES } from 'modules/shared/constants/routes';
import { UserRole } from 'modules/shared/types/common.types';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';

export interface ProtectedRouteProps {
  /**
   * Roles autorizados. Sin esta prop basta estar autenticado.
   * Un usuario autenticado sin el rol requerido ve /sin-permisos, no el login:
   * su sesion es valida, lo que falta es autorizacion.
   */
  allowedRoles?: readonly UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const user = useAppSelector(selectAuthUser);
  const isBootstrapped = useAppSelector(selectIsAuthBootstrapped);
  const location = useLocation();

  // Mientras se rehidrata la sesion no se puede decidir: redirigir aqui
  // expulsaria a un usuario que si tiene sesion guardada.
  if (!isBootstrapped) {
    return <Spinner size="lg" label="Verificando tu sesion" />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
