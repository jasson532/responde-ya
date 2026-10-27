import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearSelectedModule,
  createModule,
  fetchModuleById,
  selectContentError,
  selectDetailStatus,
  selectMutationStatus,
  selectSelectedModule,
  updateModule,
} from 'modules/content/store/contentSlice';
import type { ContentModuleDraft } from 'modules/content/types/content.types';
import ModuleForm from 'modules/content/components/organisms/ModuleForm/ModuleForm';
import LessonManager from 'modules/content/components/organisms/LessonManager/LessonManager';
import './AdminModuleFormPage.scss';

/** Sirve a dos rutas: crear (sin :moduleId) y editar (con :moduleId). */
const AdminModuleFormPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const isEditing = Boolean(moduleId);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const module = useAppSelector(selectSelectedModule);
  const detailStatus = useAppSelector(selectDetailStatus);
  const mutationStatus = useAppSelector(selectMutationStatus);
  const error = useAppSelector(selectContentError);

  useEffect(() => {
    if (moduleId) void dispatch(fetchModuleById(moduleId));
    return () => void dispatch(clearSelectedModule());
  }, [dispatch, moduleId]);

  const initialValue = useMemo<ContentModuleDraft | undefined>(() => {
    if (!module) return undefined;
    return {
      title: module.title,
      summary: module.summary,
      severity: module.severity,
      status: module.status,
      iconName: module.iconName,
      tags: module.tags,
      estimatedMinutes: module.estimatedMinutes,
    };
  }, [module]);

  const handleSubmit = async (draft: ContentModuleDraft) => {
    const result = moduleId
      ? await dispatch(updateModule({ moduleId, draft }))
      : await dispatch(createModule(draft));

    // Solo navega si la mutacion termino bien: si falla, el error queda visible.
    if (result.meta.requestStatus === 'fulfilled') {
      navigate(ROUTES.ADMIN_MODULES);
    }
  };

  if (isEditing && (detailStatus === LoadingStatus.Pending || detailStatus === LoadingStatus.Idle)) {
    return <Spinner size="lg" label="Cargando el módulo" />;
  }

  if (isEditing && !module) {
    return (
      <AlertMessage tone="error" title="No encontramos ese módulo">
        {error ?? 'Puede que haya sido eliminado.'}
      </AlertMessage>
    );
  }

  return (
    <section className="admin-module-form" data-testid="AdminModuleFormPage">
      <Link to={ROUTES.ADMIN_MODULES} className="admin-module-form__back">
        <ArrowLeft aria-hidden="true" />
        Volver a administrar
      </Link>

      <h1 className="admin-module-form__title">
        {isEditing ? 'Editar módulo' : 'Nuevo módulo'}
      </h1>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <ModuleForm
        initialValue={initialValue}
        isSubmitting={mutationStatus === LoadingStatus.Pending}
        onSubmit={(draft) => void handleSubmit(draft)}
        onCancel={() => navigate(ROUTES.ADMIN_MODULES)}
      />

      {module && <LessonManager module={module} />}
    </section>
  );
};

export default AdminModuleFormPage;
