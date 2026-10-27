import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearSelectedModule,
  fetchModuleById,
  selectContentError,
  selectDetailStatus,
  selectSelectedModule,
} from 'modules/content/store/contentSlice';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import SeverityBadge from 'modules/content/components/molecules/SeverityBadge/SeverityBadge';
import ContentBlockRenderer from 'modules/content/components/organisms/ContentBlockRenderer/ContentBlockRenderer';
import './ModuleDetailPage.scss';

const ModuleDetailPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const dispatch = useAppDispatch();

  const module = useAppSelector(selectSelectedModule);
  const status = useAppSelector(selectDetailStatus);
  const error = useAppSelector(selectContentError);

  useEffect(() => {
    if (moduleId) void dispatch(fetchModuleById(moduleId));
    return () => void dispatch(clearSelectedModule());
  }, [dispatch, moduleId]);

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return <Spinner size="lg" label="Cargando el modulo" />;
  }

  if (status === LoadingStatus.Failed || !module) {
    return (
      <AlertMessage tone="error" title="No pudimos abrir este modulo">
        {error ?? 'El modulo no existe o fue eliminado.'}
      </AlertMessage>
    );
  }

  return (
    <article className="module-detail" data-testid="ModuleDetailPage">
      <Link to={ROUTES.MODULES} className="module-detail__back">
        <ArrowLeft aria-hidden="true" />
        Todos los modulos
      </Link>

      <header className={`module-detail__header module-detail__header--${module.severity}`}>
        <span className="module-detail__icon" aria-hidden="true">
          {getModuleIcon(module.iconName)}
        </span>

        <div className="module-detail__head-text">
          <h1 className="module-detail__title">{module.title}</h1>
          <p className="module-detail__summary">{module.summary}</p>

          <div className="module-detail__meta">
            <SeverityBadge severity={module.severity} />
            <span className="module-detail__duration">
              <Clock aria-hidden="true" />
              {module.estimatedMinutes} min de lectura
            </span>
          </div>
        </div>
      </header>

      {module.lessons.length === 0 ? (
        <AlertMessage tone="info" title="Modulo sin contenido">
          Este modulo todavia no tiene secciones publicadas.
        </AlertMessage>
      ) : (
        <div className="module-detail__lessons">
          {module.lessons.map((lesson) => (
            <section key={lesson.id} className="module-detail__lesson">
              <header className="module-detail__lesson-head">
                <h2 className="module-detail__lesson-title">{lesson.title}</h2>
                {lesson.summary && (
                  <p className="module-detail__lesson-summary">{lesson.summary}</p>
                )}
              </header>

              <ContentBlockRenderer blocks={lesson.blocks} />
            </section>
          ))}
        </div>
      )}
    </article>
  );
};

export default ModuleDetailPage;
