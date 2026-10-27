import { Outlet } from 'react-router-dom';
import BrandLogo from 'modules/shared/components/atoms/BrandLogo/BrandLogo';
import './AuthLayout.scss';

const AuthLayout = () => (
  <div className="auth-layout" data-testid="AuthLayout">
    <aside className="auth-layout__brand">
      {/* El logo es el h1 visual de la pantalla; su `alt` aporta el nombre. */}
      <h1 className="auth-layout__logo-wrap">
        <BrandLogo size="lg" priority />
      </h1>

      <p className="auth-layout__tagline">
        Primeros auxilios explicados paso a paso, para cuando no hay tiempo de buscar.
      </p>

      <ul className="auth-layout__highlights">
        <li>Modulos por situacion, de lo mas urgente a lo mas leve</li>
        <li>Pasos que marcas mientras actuas</li>
        <li>Llamada a emergencias a un toque</li>
      </ul>
    </aside>

    <main className="auth-layout__content">
      <Outlet />
    </main>
  </div>
);

export default AuthLayout;
