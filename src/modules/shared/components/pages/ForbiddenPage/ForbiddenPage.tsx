import { Lock } from 'lucide-react';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import { ROUTES } from 'modules/shared/constants/routes';
import './ForbiddenPage.scss';

const ForbiddenPage = () => (
  <div className="forbidden-page" data-testid="ForbiddenPage">
    <EmptyState
      icon={<Lock />}
      title="No tienes permisos para entrar aqui"
      description="La administracion de contenido esta reservada al rol administrador. Si necesitas ese acceso, solicitalo a quien administra RespondeYA."
      action={
        <LinkButton to={ROUTES.MODULES} variant="secondary" size="lg">
          Volver a los modulos
        </LinkButton>
      }
    />
  </div>
);

export default ForbiddenPage;
