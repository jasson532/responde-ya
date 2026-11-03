import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Layers } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import IconBubble from 'modules/shared/components/atoms/IconBubble/IconBubble';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  clearSelectedModule,
  fetchDynamicModuleBySlug,
  selectDynamicDetailStatus,
  selectDynamicError,
  selectHomePage,
  selectSelectedDynamicModule,
} from 'modules/dynamic-content/store/dynamicSlice';
import { SEVERITY_LABEL, SEVERITY_TONE } from 'modules/dynamic-content/constants/severityLabels';
import PageRenderer from 'modules/dynamic-content/components/organisms/PageRenderer/PageRenderer';
import './DynamicModulePage.scss';

/**
 * Portada de un módulo dinámico.
 *
 * El héroe (icono, título, resumen, datos) lo construye la aplicación con los
 * metadatos del módulo. Todo lo que va debajo lo decide el administrador: es la
 * página marcada como portada, con sus secciones y bloques.
 *
 * Así la cabecera es consistente en todos los módulos —importa para reconocer
 * de un vistazo la gravedad— y el contenido es libre.
 */
const DynamicModulePage = () => {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const dispatch = useAppDispatch();

  const module = useAppSelector(selectSelectedDynamicModule);
  const homePage = useAppSelector(selectHomePage);
  const status = useAppSelector(selectDynamicDetailStatus);
  const error = useAppSelector(selectDynamicError);

  useEffect(() => {
    if (moduleSlug) void dispatch(fetchDynamicModuleBySlug(moduleSlug));
    return () => void dispatch(clearSelectedModule());
  }, [dispatch, moduleSlug]);

  /**
   * El contexto que necesitan los bloques de índice para resolver sus enlaces.
   *
   * Memorizado por identidad del módulo: sin esto se crearía un objeto nuevo en
   * cada render y `BlockRenderer` volvería a montar los bloques, perdiendo el
   * estado de los interactivos (un metrónomo en marcha, una lista marcada).
   */
  const context = useMemo(
    () => ({ moduleSlug: module?.slug ?? '', pages: module?.pages ?? [] }),
    [module?.slug, module?.pages],
  );

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
        <div className="app-container dyn-module__error">
          <AlertMessage tone="error" title="No pudimos abrir este módulo">
            {error ?? 'El módulo no existe o fue eliminado.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const pageCount = module.pages.length;

  return (
    <>
      <TopBar title={module.title} showBack backTo={ROUTES.MODULES} />

      <article className="dyn-module rise-in" data-testid="DynamicModulePage">
        <header className={`dyn-module__hero dyn-module__hero--${module.severity}`}>
          <div className="app-container dyn-module__hero-inner">
            <IconBubble tone={SEVERITY_TONE[module.severity]} size="3xl">
              {getModuleIcon(module.iconName)}
            </IconBubble>

            <h1 className="dyn-module__title">{module.title}</h1>

            {module.summary && <p className="dyn-module__summary">{module.summary}</p>}

            <div className="dyn-module__meta">
              <span
                className={`dyn-module__badge dyn-module__badge--${module.severity}`}
              >
                {SEVERITY_LABEL[module.severity]}
              </span>

              <span className="dyn-module__stat">
                <Clock aria-hidden="true" />
                {module.estimatedMinutes} min
              </span>

              <span className="dyn-module__stat">
                <Layers aria-hidden="true" />
                {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
              </span>
            </div>
          </div>
        </header>

        <div className="app-container dyn-module__content">
          {homePage ? (
            <PageRenderer page={homePage} context={context} />
          ) : (
            <AlertMessage tone="info" title="Módulo sin contenido">
              Este módulo todavía no tiene contenido publicado.
            </AlertMessage>
          )}
        </div>
      </article>
    </>
  );
};

export default DynamicModulePage;
