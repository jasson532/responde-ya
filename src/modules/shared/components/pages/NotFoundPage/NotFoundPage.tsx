import { Compass } from 'lucide-react';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import { ROUTES } from 'modules/shared/constants/routes';
import './NotFoundPage.scss';

const NotFoundPage = () => (
  <div className="not-found-page" data-testid="NotFoundPage">
    <EmptyState
      icon={<Compass />}
      title="Esta pagina no existe"
      description="Puede que el enlace haya cambiado. Vuelve al listado de modulos para encontrar lo que necesitas."
      action={
        <LinkButton to={ROUTES.MODULES} variant="primary" size="lg">
          Ver modulos
        </LinkButton>
      }
    />
  </div>
);

export default NotFoundPage;
