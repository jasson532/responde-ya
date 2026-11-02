import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, List } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES, buildRoute } from 'modules/shared/constants/routes';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import {
  clearSelectedModule,
  fetchModuleById,
  selectContentError,
  selectDetailStatus,
  selectSelectedModule,
} from 'modules/content/store/contentSlice';
import ContentBlockRenderer from 'modules/content/components/organisms/ContentBlockRenderer/ContentBlockRenderer';
import './LessonPage.scss';

/**
 * Un paso del módulo, en su propia pantalla.
 *
 * Carga el módulo completo y no solo el paso: el repositorio no expone una
 * lectura por lección, y el módulo entero son unos pocos kilobytes que ya
 * están en memoria si se viene del índice.
 */
const LessonPage = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
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
        <Spinner size="lg" label="Cargando el paso" />
      </>
    );
  }

  const ordered = module ? [...module.lessons].sort((a, b) => a.order - b.order) : [];
  const position = ordered.findIndex((lesson) => lesson.id === lessonId);
  const lesson = position === -1 ? undefined : ordered[position];
  const indexRoute = moduleId ? buildRoute.moduleDetail(moduleId) : ROUTES.MODULES;

  /**
   * Un paso inexistente se trata igual que un módulo que no carga. Puede pasar
   * con un enlace viejo: el administrador borró la sección y el id guardado en
   * un marcador ya no apunta a nada.
   */
  if (status === LoadingStatus.Failed || !module || !lesson) {
    return (
      <>
        <TopBar title="Paso" showBack backTo={indexRoute} />
        <div className="app-container lesson-page__error">
          <AlertMessage tone="error" title="No pudimos abrir este paso">
            {error ?? 'Ese paso no existe o fue eliminado del módulo.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const next = ordered[position + 1];

  return (
    <>
      {/* El «atrás» apunta al índice del módulo, no al catálogo: es de donde
          viene quien toca una fila del índice. */}
      <TopBar title={lesson.title} showBack backTo={indexRoute} />

      <article className="lesson-page rise-in" data-testid="LessonPage">
        <div className="app-container lesson-page__inner">
          <header className="lesson-page__head">
            {/* La posición en la secuencia, que en el índice daba el número del
                disco. Sin ella no se sabe cuánto queda. */}
            <p className="lesson-page__step">
              Paso {position + 1} de {ordered.length}
            </p>
            <h1 className="lesson-page__title">{lesson.title}</h1>
            {lesson.summary && (
              <p className="lesson-page__summary">{lesson.summary}</p>
            )}
          </header>

          <ContentBlockRenderer blocks={lesson.blocks} />

          <nav className="lesson-page__nav" aria-label="Continuar en el módulo">
            {next ? (
              <LinkButton
                to={buildRoute.lessonDetail(module.id, next.id)}
                variant="emergency"
                size="lg"
                fullWidth
                iconEnd={<ArrowRight />}
              >
                {next.title}
              </LinkButton>
            ) : (
              <LinkButton
                to={indexRoute}
                variant="secondary"
                size="md"
                fullWidth
                iconStart={<List />}
              >
                Volver al índice
              </LinkButton>
            )}
          </nav>
        </div>
      </article>
    </>
  );
};

export default LessonPage;
