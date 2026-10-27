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
import ListRow from 'modules/shared/components/molecules/ListRow/ListRow';
import SectionHeader from 'modules/shared/components/molecules/SectionHeader/SectionHeader';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import {
  deleteModule,
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModules,
} from 'modules/content/store/contentSlice';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  ModuleSeverity,
  ModuleStatus,
  type ContentModule,
} from 'modules/content/types/content.types';
import './AdminModulesPage.scss';

const TONE_BY_SEVERITY = {
  [ModuleSeverity.Critical]: 'emergency',
  [ModuleSeverity.Urgent]: 'warning',
  [ModuleSeverity.Basic]: 'safe',
} as const;

const AdminModulesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const modules = useAppSelector(selectModules);
  const status = useAppSelector(selectListStatus);
  const error = useAppSelector(selectContentError);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    // includeDrafts: el admin es el único que ve los borradores.
    void dispatch(fetchModules({ includeDrafts: true }));
  }, [dispatch]);

  useEffect(load, [load]);

  const handleConfirmDelete = async (module: ContentModule) => {
    await dispatch(deleteModule(module.id));
    setPendingDeleteId(null);
  };

  return (
    <>
      <TopBar title="Gestionar contenido" />

      <div className="admin-modules app-container rise-in" data-testid="AdminModulesPage">
        <SectionHeader
          title="Gestionar contenido"
          description="Crea, edita y pública los módulos que verán las personas usuarias."
        />

        <Button
          variant="primary"
          iconStart={<Plus />}
          onClick={() => navigate(ROUTES.ADMIN_MODULE_NEW)}
        >
          Nuevo módulo
        </Button>

        {error && <AlertMessage tone="error">{error}</AlertMessage>}

        {status === LoadingStatus.Pending ? (
          <Spinner size="lg" label="Cargando módulos" />
        ) : modules.length === 0 ? (
          <EmptyState
            title="Todavía no has creado módulos"
            description="Empieza con las situaciones más frecuentes: reanimación, atragantamiento, hemorragias y quemaduras."
            action={
              <Button variant="primary" onClick={() => navigate(ROUTES.ADMIN_MODULE_NEW)}>
                Crear el primero
              </Button>
            }
          />
        ) : (
          <ul className="admin-modules__list">
            {modules.map((module) => (
              <li key={module.id}>
                <ListRow
                  title={module.title}
                  subtitle={module.summary}
                  icon={getModuleIcon(module.iconName)}
                  tone={TONE_BY_SEVERITY[module.severity]}
                  meta={
                    <>
                      <Badge
                        tone={module.status === ModuleStatus.Published ? 'safe' : 'neutral'}
                      >
                        {module.status === ModuleStatus.Published
                          ? 'Publicado'
                          : 'Borrador'}
                      </Badge>
                      <span className="admin-modules__count">
                        {module.lessons.length}{' '}
                        {module.lessons.length === 1 ? 'sección' : 'secciones'}
                      </span>
                    </>
                  }
                  trailing={
                    pendingDeleteId === module.id ? (
                      <span className="admin-modules__confirm">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => void handleConfirmDelete(module)}
                        >
                          Eliminar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          No
                        </Button>
                      </span>
                    ) : (
                      <span className="admin-modules__actions">
                        <LinkButton
                          to={buildRoute.adminModuleEdit(module.id)}
                          variant="secondary"
                          size="sm"
                          iconStart={<Pencil />}
                          aria-label={`Editar ${module.title}`}
                        >
                          Editar
                        </LinkButton>
                        <Button
                          variant="danger"
                          size="sm"
                          iconStart={<Trash2 />}
                          onClick={() => setPendingDeleteId(module.id)}
                          aria-label={`Eliminar ${module.title}`}
                        >
                          Eliminar
                        </Button>
                      </span>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default AdminModulesPage;
