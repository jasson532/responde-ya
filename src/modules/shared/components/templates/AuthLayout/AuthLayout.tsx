import { Outlet } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import './AuthLayout.scss';

const AuthLayout = () => (
  <div className="auth-layout" data-testid="AuthLayout">
    <div className="auth-layout__panel">
      <span className="auth-layout__logo" aria-hidden="true">
        <ShieldPlus />
      </span>
      <h1 className="auth-layout__title">
        Responde<strong>YA</strong>
      </h1>
      <p className="auth-layout__tagline">
        Primeros auxilios explicados paso a paso, para cuando no hay tiempo de buscar.
      </p>
    </div>

    <main className="auth-layout__content">
      <Outlet />
    </main>
  </div>
);

export default AuthLayout;
