import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Layers } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
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
import { ModuleSeverity, ModuleStatus } from 'modules/content/types/content.types';
import SeverityBadge from 'modules/content/components/molecules/SeverityBadge/SeverityBadge';
import LessonIndex from 'modules/content/components/organisms/LessonIndex/LessonIndex';
import './ModuleDetailPage.scss';

const TONE_BY_SEVERITY = {
  [ModuleSeverity.Critical]: 'emergency',
  [ModuleSeverity.Urgent]: 'warning',
  [ModuleSeverity.Basic]: 'safe',
} as const;

const INDEX_TITLE_ID = 'module-index';

/**
 * Índice del módulo: la portada con sus datos y la lista de pasos.
 *
 * Ya NO renderiza el contenido de un paso. Cada paso es su propia pantalla
 * (`LessonPage`), como en el prototipo: así el enlace a un paso se puede
 * compartir y el botón «atrás» del navegador vuelve al índice.
 */
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

  /**
   * La tarjeta de un módulo «próximamente» no es un enlace, pero la URL sigue
   * existiendo y se puede pegar o venir de un marcador. Si no se cierra aquí,
   * el contenido sin revisar queda accesible y la tarjeta apagada era un
   * adorno. Cerrarlo en el repositorio no sirve: el admin necesita abrirlo.
   */
  if (module.status === ModuleStatus.ComingSoon) {
    return (
      <>
        <TopBar title={module.title} showBack backTo={ROUTES.MODULES} />
        <div className="app-container module-detail__error">
          <AlertMessage tone="info" title="Este módulo todavía no está disponible">
            Estamos revisando el contenido de «{module.title}» antes de publicarlo.
            Mientras tanto, ante una emergencia llama primero a la línea de tu país.
          </AlertMessage>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={module.title} showBack backTo={ROUTES.MODULES} />

      <article className="module-detail rise-in" data-testid="ModuleDetailPage">
        <header
          className={`module-detail__hero module-detail__hero--${module.severity}`}
        >
          <div className="app-container module-detail__hero-inner">
            <IconBubble tone={TONE_BY_SEVERITY[module.severity]} size="2xl">
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
            <section className="module-detail__index" aria-labelledby={INDEX_TITLE_ID}>
              <h2 className="module-detail__index-title" id={INDEX_TITLE_ID}>
                Aprende paso a paso
              </h2>

              <LessonIndex moduleId={module.id} lessons={module.lessons} />
            </section>
          )}
        </div>
      </article>
    </>
  );
};

export default ModuleDetailPage;
