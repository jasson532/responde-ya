import { Outlet } from 'react-router-dom';
import './AuthLayout.scss';

/**
 * Lienzo de la portada: una sola columna centrada.
 *
 * Antes partía la pantalla en dos (panel de marca a un lado, contenido al
 * otro). El prototipo apila logo, ilustración y acción en una columna, y con
 * dos columnas el logo acababa AL LADO del botón en vez de encima.
 *
 * Todo el contenido —incluido el logo, que es el `h1` de la pantalla— lo pone
 * `WelcomePage`: es la única ruta que usa este layout y necesita decidir el
 * orden vertical. Aquí solo queda el lienzo de marca y el centrado.
 */
const AuthLayout = () => (
  <div className="auth-layout" data-testid="AuthLayout">
    <main className="auth-layout__content">
      <Outlet />
    </main>
  </div>
);

export default AuthLayout;
