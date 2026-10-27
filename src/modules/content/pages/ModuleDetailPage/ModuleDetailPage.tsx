import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Layers } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import Chip from 'modules/shared/components/atoms/Chip/Chip';
import IconBubble from 'modules/shared/components/atoms/IconBubble/IconBubble';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import {
  clearSelectedModule,
  fetchModuleById,
  selectContentError,
  selectDetailStatus,
  selectSelectedModule,
} from 'modules/content/store/contentSlice';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import { ModuleSeverity } from 'modules/content/types/content.types';
import SeverityBadge from 'modules/content/components/molecules/SeverityBadge/SeverityBadge';
import ContentBlockRenderer from 'modules/content/components/organisms/ContentBlockRenderer/ContentBlockRenderer';
import './ModuleDetailPage.scss';

const TONE_BY_SEVERITY = {
  [ModuleSeverity.Critical]: 'emergency',
  [ModuleSeverity.Urgent]: 'warning',
  [ModuleSeverity.Basic]: 'safe',
} as const;

const ModuleDetailPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const dispatch = useAppDispatch();

  const module = useAppSelector(selectSelectedModule);
  const status = useAppSelector(selectDetailStatus);
  const error = useAppSelector(selectContentError);

  /**
   * Sección visible. Se guarda el id, no el índice: al cambiar de módulo el id
   * guardado deja de existir y la sección activa cae sola en la primera, que es
   * la de actuar. Derivarlo así evita sincronizar estado con un efecto.
   */
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (moduleId) void dispatch(fetchModuleById(moduleId));
    return () => void dispatch(clearSelectedModule());
  }, [dispatch, moduleId]);

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return (
      <>
        <TopBar title="Cargando" showBack backTo={ROUTES.MODULES} />
        <Spinner size="lg" label="Cargando el módulo" />
      </>
    );
  }

  if (status === LoadingStatus.Failed || !module) {
    return (
      <>
        <TopBar title="Módulo" showBack backTo={ROUTES.MODULES} />
        <div className="app-container module-detail__error">
          <AlertMessage tone="error" title="No pudimos abrir este módulo">
            {error ?? 'El módulo no existe o fue eliminado.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const activeLesson =
    module.lessons.find((lesson) => lesson.id === activeLessonId) ?? module.lessons[0];
  const hasSeveralLessons = module.lessons.length > 1;

  return (
    <>
      <TopBar title={module.title} showBack backTo={ROUTES.MODULES} />

      <article className="module-detail rise-in" data-testid="ModuleDetailPage">
        <header
          className={`module-detail__hero module-detail__hero--${module.severity}`}
        >
          <div className="app-container module-detail__hero-inner">
            <IconBubble tone={TONE_BY_SEVERITY[module.severity]} size="xl">
              {getModuleIcon(module.iconName)}
            </IconBubble>

            <h1 className="module-detail__title">{module.title}</h1>
            <p className="module-detail__summary">{module.summary}</p>

            <div className="module-detail__meta">
              <SeverityBadge severity={module.severity} />
              <span className="module-detail__stat">
                <Clock aria-hidden="true" />
                {module.estimatedMinutes} min
              </span>
              <span className="module-detail__stat">
                <Layers aria-hidden="true" />
                {module.lessons.length}{' '}
                {module.lessons.length === 1 ? 'sección' : 'secciones'}
              </span>
            </div>
          </div>
        </header>

        <div className="app-container module-detail__content">
          {module.lessons.length === 0 ? (
            <AlertMessage tone="info" title="Módulo sin contenido">
              Este módulo todavía no tiene secciones publicadas.
            </AlertMessage>
          ) : (
            <>
              {hasSeveralLessons && (
                <nav
                  className="module-detail__sections"
                  aria-label="Secciones del módulo"
                >
                  {module.lessons.map((lesson) => (
                    <Chip
                      key={lesson.id}
                      isActive={lesson.id === activeLesson?.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                    >
                      {lesson.title}
                    </Chip>
                  ))}
                </nav>
              )}

              {activeLesson && (
                // `key` fuerza el remontaje al cambiar de sección: reinicia los
                // pasos marcados y la animación de entrada.
                <section key={activeLesson.id} className="module-detail__lesson rise-in">
                  <header className="module-detail__lesson-head">
                    <h2 className="module-detail__lesson-title">{activeLesson.title}</h2>
                    {activeLesson.summary && (
                      <p className="module-detail__lesson-summary">
                        {activeLesson.summary}
                      </p>
                    )}
                  </header>

                  <ContentBlockRenderer blocks={activeLesson.blocks} />
                </section>
              )}
            </>
          )}
        </div>
      </article>
    </>
  );
};

export default ModuleDetailPage;
