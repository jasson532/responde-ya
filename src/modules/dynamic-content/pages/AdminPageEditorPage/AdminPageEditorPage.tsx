import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, LayoutPanelTop, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES, buildRoute } from 'modules/shared/constants/routes';
import Button from 'modules/shared/components/atoms/Button/Button';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import {
  createBlock,
  createSection,
  deleteBlock,
  deleteSection,
  fetchDynamicModuleById,
  reorderBlocks,
  reorderSections,
  selectDynamicDetailStatus,
  selectDynamicError,
  selectDynamicMutationStatus,
  selectSelectedDynamicModule,
  updateBlock,
  updateSection,
} from 'modules/dynamic-content/store/dynamicSlice';
import {
  SectionVariant,
  type Section,
  type SectionDraft,
} from 'modules/dynamic-content/types/dynamic.types';
import type { ContentBlock } from 'modules/dynamic-content/types/blocks.types';
import {
  blockIcon,
  blockLabel,
  type BlockDefinition,
} from 'modules/dynamic-content/constants/blockLibrary';
import EditorRow from 'modules/dynamic-content/components/editors/EditorRow/EditorRow';
import SectionFormModal from 'modules/dynamic-content/components/editors/SectionFormModal/SectionFormModal';
import BlockPalette from 'modules/dynamic-content/components/editors/BlockPalette/BlockPalette';
import BlockFormModal from 'modules/dynamic-content/components/editors/BlockFormModal/BlockFormModal';
import './AdminPageEditorPage.scss';

const VARIANT_BADGE: Record<SectionVariant, string> = {
  [SectionVariant.Plain]: 'Sin fondo',
  [SectionVariant.Card]: 'Tarjeta',
  [SectionVariant.Tinted]: 'Tintada',
};

/** Qué diálogo está abierto. Un solo estado evita que se solapen dos. */
type Dialog =
  | { type: 'none' }
  | { type: 'newSection' }
  | { type: 'editSection'; section: Section }
  | { type: 'palette'; sectionId: string }
  | { type: 'newBlock'; sectionId: string; definition: BlockDefinition }
  | { type: 'editBlock'; block: ContentBlock };

/**
 * Editor de una página: sus secciones y los componentes de cada una.
 *
 * Es la pantalla donde se construye el contenido. El flujo es el que pediste:
 * añadir sección, añadir componente dentro, y configurarlo en un formulario.
 */
const AdminPageEditorPage = () => {
  const { moduleId, pageId } = useParams<{ moduleId: string; pageId: string }>();
  const dispatch = useAppDispatch();

  const module = useAppSelector(selectSelectedDynamicModule);
  const status = useAppSelector(selectDynamicDetailStatus);
  const mutationStatus = useAppSelector(selectDynamicMutationStatus);
  const error = useAppSelector(selectDynamicError);

  const [dialog, setDialog] = useState<Dialog>({ type: 'none' });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const isBusy = mutationStatus === LoadingStatus.Pending;

  useEffect(() => {
    if (moduleId) void dispatch(fetchDynamicModuleById(moduleId));
  }, [dispatch, moduleId]);

  const backTo = moduleId ? buildRoute.adminDynModule(moduleId) : ROUTES.ADMIN_DYN;

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return (
      <>
        <TopBar title="Cargando" showBack backTo={backTo} />
        <Spinner size="lg" label="Cargando la página" />
      </>
    );
  }

  const page = module?.pages.find((candidate) => candidate.id === pageId);

  if (status === LoadingStatus.Failed || !module || !page) {
    return (
      <>
        <TopBar title="Página" showBack backTo={backTo} />
        <div className="app-container page-editor__error">
          <AlertMessage tone="error" title="No pudimos abrir esta página">
            {error ?? 'La página no existe o fue eliminada.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const sections = [...page.sections].sort((a, b) => a.position - b.position);
  const close = () => setDialog({ type: 'none' });

  /**
   * Reordenar reescribe las posiciones de toda la lista, no intercambia dos.
   * Si el orden guardado tuviera huecos o empates, un intercambio los
   * conservaría; reescribir la lista completa los normaliza.
   */
  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];

    void dispatch(
      reorderSections({
        moduleId: module.id,
        items: next.map((section, position) => ({ id: section.id, position })),
      }),
    );
  };

  const moveBlock = (blocks: ContentBlock[], index: number, direction: -1 | 1) => {
    const next = [...blocks];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];

    void dispatch(
      reorderBlocks({
        moduleId: module.id,
        items: next.map((block, position) => ({ id: block.id, position })),
      }),
    );
  };

  /**
   * Las dos ramas despachan por separado y no se asigna la acción a una
   * variable: la unión de dos `AsyncThunkAction` distintos no es despachable,
   * porque cada uno lleva su propio tipo de argumento.
   */
  const handleSectionSubmit = async (draft: SectionDraft) => {
    if (dialog.type === 'editSection') {
      const result = await dispatch(
        updateSection({ moduleId: module.id, sectionId: dialog.section.id, draft }),
      );
      if (result.meta.requestStatus === 'fulfilled') close();
      return;
    }

    const result = await dispatch(
      createSection({ moduleId: module.id, pageId: page.id, draft }),
    );
    if (result.meta.requestStatus === 'fulfilled') close();
  };

  const handleBlockSubmit = async (data: Record<string, unknown>) => {
    if (dialog.type === 'newBlock') {
      const result = await dispatch(
        createBlock({
          moduleId: module.id,
          sectionId: dialog.sectionId,
          draft: { kind: dialog.definition.kind, data },
        }),
      );
      if (result.meta.requestStatus === 'fulfilled') close();
      return;
    }

    if (dialog.type === 'editBlock') {
      const result = await dispatch(
        updateBlock({
          moduleId: module.id,
          blockId: dialog.block.id,
          draft: { data },
        }),
      );
      if (result.meta.requestStatus === 'fulfilled') close();
    }
  };

  return (
    <>
      <TopBar title={page.title} showBack backTo={backTo} />

      <div className="app-container page-editor rise-in" data-testid="AdminPageEditorPage">
        {error && <AlertMessage tone="error">{error}</AlertMessage>}

        <header className="page-editor__head">
          <div className="page-editor__head-text">
            <h2 className="page-editor__title">{page.title}</h2>
            <p className="page-editor__slug">
              /c/{module.slug}/{page.slug}
            </p>
          </div>

          <LinkButton
            to={
              page.isHome
                ? buildRoute.dynModule(module.slug)
                : buildRoute.dynPage(module.slug, page.slug)
            }
            variant="ghost"
            size="sm"
            iconStart={<Eye />}
          >
            Ver
          </LinkButton>
        </header>

        <Button
          variant="primary"
          size="sm"
          iconStart={<Plus />}
          onClick={() => setDialog({ type: 'newSection' })}
          disabled={isBusy}
        >
          Añadir sección
        </Button>

        {sections.length === 0 ? (
          <EmptyState
            icon={<LayoutPanelTop />}
            title="Esta página está vacía"
            description="Crea una sección y añade dentro los componentes que quieras mostrar."
          />
        ) : (
          <ul className="page-editor__sections">
            {sections.map((section, sectionIndex) => {
              const blocks = [...section.blocks].sort((a, b) => a.position - b.position);

              return (
                <li key={section.id}>
                  <EditorRow
                    title={section.title ?? 'Sección sin título'}
                    subtitle={`${blocks.length} ${blocks.length === 1 ? 'componente' : 'componentes'}`}
                    badge={VARIANT_BADGE[section.variant]}
                    isBusy={isBusy}
                    onEdit={() => setDialog({ type: 'editSection', section })}
                    onDelete={() => setPendingDelete(section.id)}
                    onMoveUp={
                      sectionIndex > 0 ? () => moveSection(sectionIndex, -1) : undefined
                    }
                    onMoveDown={
                      sectionIndex < sections.length - 1
                        ? () => moveSection(sectionIndex, 1)
                        : undefined
                    }
                  >
                    {blocks.map((block, blockIndex) => (
                      <EditorRow
                        key={block.id}
                        icon={blockIcon(block.kind)}
                        title={blockLabel(block.kind)}
                        isBusy={isBusy}
                        onEdit={() => setDialog({ type: 'editBlock', block })}
                        onDelete={() =>
                          void dispatch(
                            deleteBlock({ moduleId: module.id, blockId: block.id }),
                          )
                        }
                        onMoveUp={
                          blockIndex > 0
                            ? () => moveBlock(blocks, blockIndex, -1)
                            : undefined
                        }
                        onMoveDown={
                          blockIndex < blocks.length - 1
                            ? () => moveBlock(blocks, blockIndex, 1)
                            : undefined
                        }
                      />
                    ))}

                    <Button
                      variant="secondary"
                      size="sm"
                      iconStart={<Plus />}
                      onClick={() => setDialog({ type: 'palette', sectionId: section.id })}
                      disabled={isBusy}
                    >
                      Añadir componente
                    </Button>
                  </EditorRow>

                  {pendingDelete === section.id && (
                    <div className="page-editor__confirm">
                      <p className="page-editor__confirm-text">
                        Se eliminarán también sus {blocks.length}{' '}
                        {blocks.length === 1 ? 'componente' : 'componentes'}.
                      </p>
                      <div className="page-editor__confirm-actions">
                        <Button
                          variant="danger"
                          size="sm"
                          loading={isBusy}
                          onClick={async () => {
                            await dispatch(
                              deleteSection({
                                moduleId: module.id,
                                sectionId: section.id,
                              }),
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
              );
            })}
          </ul>
        )}
      </div>

      {/* --- Diálogos --- */}

      <SectionFormModal
        key={dialog.type === 'editSection' ? dialog.section.id : 'new-section'}
        isOpen={dialog.type === 'newSection' || dialog.type === 'editSection'}
        onClose={close}
        onSubmit={handleSectionSubmit}
        isSubmitting={isBusy}
        section={dialog.type === 'editSection' ? dialog.section : null}
      />

      <BlockPalette
        isOpen={dialog.type === 'palette'}
        onClose={close}
        onPick={(definition) => {
          /**
           * Elegir no crea nada: abre el formulario con los valores iniciales.
           * Así cancelar no deja un componente a medio hacer en la página.
           */
          if (dialog.type === 'palette') {
            setDialog({ type: 'newBlock', sectionId: dialog.sectionId, definition });
          }
        }}
      />

      {(dialog.type === 'newBlock' || dialog.type === 'editBlock') && (
        <BlockFormModal
          // La clave fuerza el remontaje al cambiar de componente, para que el
          // formulario arranque con SUS datos y no con los del anterior.
          key={dialog.type === 'newBlock' ? dialog.definition.kind : dialog.block.id}
          isOpen
          onClose={close}
          onSubmit={handleBlockSubmit}
          isSubmitting={isBusy}
          kind={dialog.type === 'newBlock' ? dialog.definition.kind : dialog.block.kind}
          initialData={
            dialog.type === 'newBlock'
              ? (dialog.definition.defaultData as Record<string, unknown>)
              : (dialog.block.data as unknown as Record<string, unknown>)
          }
          pages={module.pages}
          moduleId={module.id}
        />
      )}
    </>
  );
};

export default AdminPageEditorPage;
