import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES, buildRoute } from 'modules/shared/constants/routes';
import Badge from 'modules/shared/components/atoms/Badge/Badge';
import Button from 'modules/shared/components/atoms/Button/Button';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import {
  deleteModule,
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModules,
} from 'modules/content/store/contentSlice';
import { ModuleStatus, type ContentModule } from 'modules/content/types/content.types';
import SeverityBadge from 'modules/content/components/molecules/SeverityBadge/SeverityBadge';
import './AdminModulesPage.scss';

const AdminModulesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const modules = useAppSelector(selectModules);
  const status = useAppSelector(selectListStatus);
  const error = useAppSelector(selectContentError);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    // includeDrafts: el admin es el unico que ve los borradores.
    void dispatch(fetchModules({ includeDrafts: true }));
  }, [dispatch]);

  useEffect(load, [load]);

  const handleConfirmDelete = async (module: ContentModule) => {
    await dispatch(deleteModule(module.id));
    setPendingDeleteId(null);
  };

  if (status === LoadingStatus.Pending) {
    return <Spinner size="lg" label="Cargando modulos" />;
  }

  return (
    <section className="admin-modules" data-testid="AdminModulesPage">
      <header className="admin-modules__header">
        <div>
          <h1 className="admin-modules__title">Administrar contenido</h1>
          <p className="admin-modules__subtitle">
            Crea, edita y publica los modulos que veran las personas usuarias.
          </p>
        </div>

        <Button
          variant="primary"
          iconStart={<Plus />}
          onClick={() => navigate(ROUTES.ADMIN_MODULE_NEW)}
        >
          Nuevo modulo
        </Button>
      </header>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      {modules.length === 0 ? (
        <EmptyState
          title="Todavia no has creado modulos"
          description="Empieza con las situaciones mas frecuentes: reanimacion, atragantamiento, hemorragias y quemaduras."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.ADMIN_MODULE_NEW)}>
              Crear el primero
            </Button>
          }
        />
      ) : (
        <ul className="admin-modules__list">
          {modules.map((module) => (
            <li key={module.id} className="admin-modules__row">
              <div className="admin-modules__row-main">
                <h2 className="admin-modules__row-title">{module.title}</h2>
                <p className="admin-modules__row-summary">{module.summary}</p>
                <div className="admin-modules__row-meta">
                  <SeverityBadge severity={module.severity} />
                  <Badge tone={module.status === ModuleStatus.Published ? 'safe' : 'neutral'}>
                    {module.status === ModuleStatus.Published ? 'Publicado' : 'Borrador'}
                  </Badge>
                  <span className="admin-modules__row-count">
                    {module.lessons.length}{' '}
                    {module.lessons.length === 1 ? 'seccion' : 'secciones'}
                  </span>
                </div>
              </div>

              {pendingDeleteId === module.id ? (
                <div className="admin-modules__confirm" role="group">
                  <p className="admin-modules__confirm-text">
                    Eliminar &ldquo;{module.title}&rdquo; y todo su contenido?
                  </p>
                  <div className="admin-modules__actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleConfirmDelete(module)}
                    >
                      Si, eliminar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="admin-modules__actions">
                  <LinkButton
                    to={buildRoute.adminModuleEdit(module.id)}
                    variant="secondary"
                    size="sm"
                    iconStart={<Pencil />}
                  >
                    Editar
                  </LinkButton>
                  <Button
                    variant="danger"
                    size="sm"
                    iconStart={<Trash2 />}
                    onClick={() => setPendingDeleteId(module.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AdminModulesPage;
