import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutPanelTop, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { buildRoute } from 'modules/shared/constants/routes';
import Button from 'modules/shared/components/atoms/Button/Button';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import SectionHeader from 'modules/shared/components/molecules/SectionHeader/SectionHeader';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  createDynamicModule,
  deleteDynamicModule,
  fetchCategories,
  fetchDynamicModules,
  selectCategories,
  selectDynamicError,
  selectDynamicListStatus,
  selectDynamicModules,
  selectDynamicMutationStatus,
} from 'modules/dynamic-content/store/dynamicSlice';
import { ModuleStatus, type ModuleDraft } from 'modules/dynamic-content/types/dynamic.types';
import { SEVERITY_LABEL } from 'modules/dynamic-content/constants/severityLabels';
import EditorRow from 'modules/dynamic-content/components/editors/EditorRow/EditorRow';
import ModuleFormModal from 'modules/dynamic-content/components/editors/ModuleFormModal/ModuleFormModal';
import './AdminDynamicModulesPage.scss';

const STATUS_BADGE: Record<ModuleStatus, string> = {
  [ModuleStatus.Draft]: 'Borrador',
  [ModuleStatus.ComingSoon]: 'Próximamente',
  [ModuleStatus.Published]: 'Publicado',
};

/**
 * Lista de módulos dinámicos. El punto de entrada del administrador.
 */
const AdminDynamicModulesPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const modules = useAppSelector(selectDynamicModules);
  const categories = useAppSelector(selectCategories);
  const status = useAppSelector(selectDynamicListStatus);
  const mutationStatus = useAppSelector(selectDynamicMutationStatus);
  const error = useAppSelector(selectDynamicError);

  const [isCreating, setIsCreating] = useState(false);
  /** Id pendiente de confirmación de borrado. Evita un `confirm()` nativo. */
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const isBusy = mutationStatus === LoadingStatus.Pending;

  const load = useCallback(() => {
    // includeDrafts: el administrador es el único que ve los borradores.
    void dispatch(fetchDynamicModules({ includeDrafts: true }));
    void dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(load, [load]);

  const handleCreate = async (draft: ModuleDraft) => {
    const result = await dispatch(createDynamicModule(draft));

    /**
     * `.fulfilled.match` en vez de comprobar `meta.requestStatus`: es un
     * discriminador de tipos, así que dentro del `if` TypeScript sabe que
     * `payload` es el módulo y no el mensaje de error del rechazo.
     */
    if (createDynamicModule.fulfilled.match(result)) {
      setIsCreating(false);
      // Se entra directo a editarlo: crear un módulo y quedarse en la lista
      // obliga a buscarlo para empezar a trabajar.
      navigate(buildRoute.adminDynModule(result.payload.id));
    }
  };

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return (
      <>
        <TopBar title="Contenido" />
        <Spinner size="lg" label="Cargando módulos" />
      </>
    );
  }

  return (
    <>
      <TopBar title="Contenido" />

      <div className="app-container admin-dyn rise-in" data-testid="AdminDynamicModulesPage">
        <SectionHeader
          title="Módulos"
          description="Crea un módulo y añade dentro las páginas, secciones y componentes."
        />

        {error && <AlertMessage tone="error">{error}</AlertMessage>}

        <Button
          variant="primary"
          iconStart={<Plus />}
          onClick={() => setIsCreating(true)}
          disabled={isBusy}
        >
          Nuevo módulo
        </Button>

        {modules.length === 0 ? (
          <EmptyState
            icon={<LayoutPanelTop />}
            title="Todavía no hay módulos"
            description="Empieza creando el primero. Después podrás añadirle páginas y contenido."
          />
        ) : (
          <ul className="admin-dyn__list">
            {modules.map((module) => (
              <li key={module.id}>
                <EditorRow
                  icon={getModuleIcon(module.iconName)}
                  title={module.title}
                  subtitle={`${SEVERITY_LABEL[module.severity]} · ${module.summary || 'Sin resumen'}`}
                  badge={STATUS_BADGE[module.status]}
                  isBusy={isBusy}
                  onOpen={() => navigate(buildRoute.adminDynModule(module.id))}
                  onEdit={() => navigate(buildRoute.adminDynModule(module.id))}
                  onDelete={() => setPendingDelete(module.id)}
                />

                {/* Confirmación en línea en vez de `confirm()` nativo: el del
                    navegador no se puede estilar, bloquea el hilo y en móvil
                    aparece como un aviso del sistema que no parece de la app. */}
                {pendingDelete === module.id && (
                  <div className="admin-dyn__confirm">
                    <p className="admin-dyn__confirm-text">
                      Se eliminarán también sus páginas, secciones, componentes e
                      imágenes. No se puede deshacer.
                    </p>
                    <div className="admin-dyn__confirm-actions">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={isBusy}
                        onClick={async () => {
                          await dispatch(deleteDynamicModule(module.id));
                          setPendingDelete(null);
                        }}
                      >
                        Sí, eliminar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModuleFormModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreate}
        isSubmitting={isBusy}
        categories={categories}
      />
    </>
  );
};

export default AdminDynamicModulesPage;
