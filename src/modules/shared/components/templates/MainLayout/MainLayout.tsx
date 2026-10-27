import { Outlet } from 'react-router-dom';
import AppHeader from 'modules/shared/components/organisms/AppHeader/AppHeader';
import './MainLayout.scss';

const MainLayout = () => (
  <div className="main-layout" data-testid="MainLayout">
    <a href="#contenido" className="skip-link">
      Saltar al contenido
    </a>

    <AppHeader />

    <main id="contenido" className="main-layout__content app-container">
      <Outlet />
    </main>

    <footer className="main-layout__footer">
      <div className="app-container">
        <p className="main-layout__disclaimer">
          RespondeYA es material informativo de apoyo. No reemplaza la atencion de personal de
          salud. Ante una emergencia, llama primero a la linea de emergencias de tu pais.
        </p>
      </div>
    </footer>
  </div>
);

export default MainLayout;
