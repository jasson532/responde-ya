import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, FilePlus, House, Pencil, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES, buildRoute } from 'modules/shared/constants/routes';
import Button from 'modules/shared/components/atoms/Button/Button';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  createPage,
  deletePage,
  fetchCategories,
  fetchDynamicModuleById,
  reorderPages,
  selectCategories,
  selectDynamicDetailStatus,
  selectDynamicError,
  selectDynamicMutationStatus,
  selectSelectedDynamicModule,
  updateDynamicModule,
  updatePage,
} from 'modules/dynamic-content/store/dynamicSlice';
import {
  ModuleStatus,
  type ModuleDraft,
  type Page,
  type PageDraft,
} from 'modules/dynamic-content/types/dynamic.types';
import { SEVERITY_LABEL } from 'modules/dynamic-content/constants/severityLabels';
import EditorRow from 'modules/dynamic-content/components/editors/EditorRow/EditorRow';
import ModuleFormModal from 'modules/dynamic-content/components/editors/ModuleFormModal/ModuleFormModal';
import PageFormModal from 'modules/dynamic-content/components/editors/PageFormModal/PageFormModal';
import './AdminModuleEditorPage.scss';

const STATUS_LABEL: Record<ModuleStatus, string> = {
  [ModuleStatus.Draft]: 'Borrador',
  [ModuleStatus.ComingSoon]: 'Próximamente',
  [ModuleStatus.Published]: 'Publicado',
};

/**
 * Editor de un módulo: sus datos y sus páginas.
 *
 * Las secciones y los componentes se editan dentro de cada página, en otra
 * pantalla. Meter los tres niveles aquí daría un árbol que en un móvil no se
 * puede recorrer: un módulo con cuatro páginas de tres secciones y cinco
 * bloques son sesenta filas.
 */
const AdminModuleEditorPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const module = useAppSelector(selectSelectedDynamicModule);
  const categories = useAppSelector(selectCategories);
  const status = useAppSelector(selectDynamicDetailStatus);
  const mutationStatus = useAppSelector(selectDynamicMutationStatus);
  const error = useAppSelector(selectDynamicError);

  const [isEditingModule, setIsEditingModule] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const isBusy = mutationStatus === LoadingStatus.Pending;

  useEffect(() => {
    if (moduleId) void dispatch(fetchDynamicModuleById(moduleId));
    void dispatch(fetchCategories());
  }, [dispatch, moduleId]);

  /**
   * Mover una página una posición.
   *
   * Se recalculan las posiciones de TODAS las páginas y se envían juntas, en
   * vez de intercambiar solo las dos afectadas. Si el orden guardado tuviera
   * huecos o empates —algo posible al crear dos páginas a la vez—, un
   * intercambio los conservaría; reescribir la lista completa los normaliza.
   */
  const movePage = useCallback(
    (pages: Page[], index: number, direction: -1 | 1) => {
      const next = [...pages];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];

      void dispatch(
        reorderPages({
          moduleId: module?.id ?? '',
          items: next.map((page, position) => ({ id: page.id, position })),
        }),
      );
    },
    [dispatch, module?.id],
  );

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return (
      <>
        <TopBar title="Cargando" showBack backTo={ROUTES.ADMIN_DYN} />
        <Spinner size="lg" label="Cargando el módulo" />
      </>
    );
  }

  if (status === LoadingStatus.Failed || !module) {
    return (
      <>
        <TopBar title="Módulo" showBack backTo={ROUTES.ADMIN_DYN} />
        <div className="app-container admin-editor__error">
          <AlertMessage tone="error" title="No pudimos abrir este módulo">
            {error ?? 'El módulo no existe o fue eliminado.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const handleModuleSave = async (draft: ModuleDraft) => {
    const result = await dispatch(updateDynamicModule({ moduleId: module.id, draft }));
    if (result.meta.requestStatus === 'fulfilled') setIsEditingModule(false);
  };

  const handlePageCreate = async (draft: PageDraft) => {
    const result = await dispatch(createPage({ moduleId: module.id, draft }));
    if (result.meta.requestStatus === 'fulfilled') setIsAddingPage(false);
  };

  const handlePageSave = async (draft: PageDraft) => {
    if (editingPage === null) return;
    const result = await dispatch(
      updatePage({ moduleId: module.id, pageId: editingPage.id, draft }),
    );
    if (result.meta.requestStatus === 'fulfilled') setEditingPage(null);
  };

  const pages = [...module.pages].sort((a, b) => a.position - b.position);

  return (
    <>
      <TopBar title={module.title} showBack backTo={ROUTES.ADMIN_DYN} />

      <div className="app-container admin-editor rise-in" data-testid="AdminModuleEditorPage">
        {error && <AlertMessage tone="error">{error}</AlertMessage>}

        {/* --- Datos del módulo --- */}
        <section className="admin-editor__card">
          <div className="admin-editor__module-head">
            <span className="admin-editor__module-icon" aria-hidden="true">
              {getModuleIcon(module.iconName)}
            </span>

            <div className="admin-editor__module-text">
              <h2 className="admin-editor__module-title">{module.title}</h2>
              <p className="admin-editor__module-meta">
                {SEVERITY_LABEL[module.severity]} · {STATUS_LABEL[module.status]} ·{' '}
                {module.estimatedMinutes} min
              </p>
              {/* La dirección pública se muestra porque es lo que el
                  administrador necesita para compartir el módulo. */}
              <p className="admin-editor__module-slug">/c/{module.slug}</p>
            </div>
          </div>

          <div className="admin-editor__module-actions">
            <Button
              variant="secondary"
              size="sm"
              iconStart={<Pencil />}
              onClick={() => setIsEditingModule(true)}
              disabled={isBusy}
            >
              Editar datos
            </Button>

            <LinkButton
              to={buildRoute.dynModule(module.slug)}
              variant="ghost"
              size="sm"
              iconStart={<Eye />}
            >
              Ver público
            </LinkButton>
          </div>
        </section>

        {/* --- Páginas --- */}
        <section className="admin-editor__pages">
          <header className="admin-editor__pages-head">
            <h2 className="admin-editor__pages-title">Páginas</h2>
            <Button
              variant="primary"
              size="sm"
              iconStart={<FilePlus />}
              onClick={() => setIsAddingPage(true)}
              disabled={isBusy}
            >
              Añadir página
            </Button>
          </header>

          <ul className="admin-editor__list">
            {pages.map((page, index) => (
              <li key={page.id}>
                <EditorRow
                  icon={page.isHome ? <House /> : <Plus />}
                  title={page.title}
                  subtitle={page.subtitle ?? `/${page.slug}`}
                  badge={page.isHome ? 'Portada' : undefined}
                  isBusy={isBusy}
                  onOpen={() => navigate(buildRoute.adminDynPage(module.id, page.id))}
                  onEdit={() => setEditingPage(page)}
                  // La portada NO se puede borrar: un módulo sin portada no
                  // tiene nada que mostrar al entrar.
                  onDelete={page.isHome ? undefined : () => setPendingDelete(page.id)}
                  onMoveUp={index > 0 ? () => movePage(pages, index, -1) : undefined}
                  onMoveDown={
                    index < pages.length - 1 ? () => movePage(pages, index, 1) : undefined
                  }
                >
                  <p className="admin-editor__hint">
                    {page.sections.length === 0
                      ? 'Sin secciones. Entra para añadir contenido.'
                      : `${page.sections.length} ${page.sections.length === 1 ? 'sección' : 'secciones'}`}
                  </p>
                </EditorRow>

                {pendingDelete === page.id && (
                  <div className="admin-editor__confirm">
                    <p className="admin-editor__confirm-text">
                      Se eliminarán sus secciones y componentes. No se puede deshacer.
                    </p>
                    <div className="admin-editor__confirm-actions">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={isBusy}
                        onClick={async () => {
                          await dispatch(
                            deletePage({ moduleId: module.id, pageId: page.id }),
                          );
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
        </section>
      </div>

      <ModuleFormModal
        isOpen={isEditingModule}
        onClose={() => setIsEditingModule(false)}
        onSubmit={handleModuleSave}
        isSubmitting={isBusy}
        categories={categories}
        module={module}
      />

      <PageFormModal
        isOpen={isAddingPage}
        onClose={() => setIsAddingPage(false)}
        onSubmit={handlePageCreate}
        isSubmitting={isBusy}
      />

      {/* Clave con el id de la página: fuerza el remontaje al cambiar de
          página, para que el formulario arranque con SUS valores y no con los
          de la anterior. */}
      <PageFormModal
        key={editingPage?.id ?? 'none'}
        isOpen={editingPage !== null}
        onClose={() => setEditingPage(null)}
        onSubmit={handlePageSave}
        isSubmitting={isBusy}
        page={editingPage}
      />
    </>
  );
};

export default AdminModuleEditorPage;
