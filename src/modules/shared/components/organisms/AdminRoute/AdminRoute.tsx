import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from 'modules/shared/store/hooks';
import { selectIsAdmin, selectIsAuthBootstrapped } from 'modules/auth/store/authSlice';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';

/**
 * Guard de las rutas de administracion.
 *
 * Reemplaza al antiguo `ProtectedRoute`: el contenido ya no se protege, es
 * publico. Lo unico que hay que custodiar es la escritura.
 *
 * Un visitante anonimo no es "alguien sin permiso" sino "alguien que todavia no
 * se ha identificado", asi que se le manda a la pantalla de bienvenida con la
 * ruta original guardada, no a una pantalla de error.
 *
 * AVISO: esto es seguridad de interfaz, no de verdad. Impide llegar a la
 * pantalla, no ejecutar la escritura. La autorizacion real vive en el backend.
 */
const AdminRoute = () => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const isBootstrapped = useAppSelector(selectIsAuthBootstrapped);
  const location = useLocation();

  // Mientras se rehidrata la sesion no se puede decidir: redirigir aqui
  // expulsaria a un admin que si tiene sesion guardada.
  if (!isBootstrapped) {
    return <Spinner size="lg" label="Verificando tu sesion" />;
  }

  if (!isAdmin) {
    return <Navigate to={ROUTES.WELCOME} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
