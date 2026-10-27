import { Outlet } from 'react-router-dom';
import AppHeader from 'modules/shared/components/organisms/AppHeader/AppHeader';
import BottomNav from 'modules/shared/components/organisms/BottomNav/BottomNav';
import './AppShell.scss';

/**
 * Armazón de la aplicación.
 *
 * Dos navegaciones excluyentes por ancho de pantalla: pestañas inferiores en
 * móvil (donde llega el pulgar) y cabecera en escritorio. Cada una se oculta
 * en el breakpoint de la otra desde su propio SCSS.
 *
 * La barra superior contextual NO se renderiza aquí: la pone cada página, que
 * es la única que sabe su título y si procede un botón de volver.
 */
const AppShell = () => (
  <div className="app-shell" data-testid="AppShell">
    <a href="#contenido" className="skip-link">
      Saltar al contenido
    </a>

    <AppHeader />

    <main id="contenido" className="app-shell__main">
      <Outlet />
    </main>

    <footer className="app-shell__footer">
      <div className="app-container">
        <p className="app-shell__disclaimer">
          RespondeYa es material informativo de apoyo. No reemplaza la atención de personal
          de salud. Ante una emergencia, llama primero a la línea de emergencias de tu país.
        </p>
      </div>
    </footer>

    <BottomNav />
  </div>
);

export default AppShell;
