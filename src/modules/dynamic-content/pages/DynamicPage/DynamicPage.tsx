import { useEffect, useMemo } from 'react';
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
  fetchDynamicModuleBySlug,
  selectDynamicDetailStatus,
  selectDynamicError,
  selectSelectedDynamicModule,
} from 'modules/dynamic-content/store/dynamicSlice';
import PageRenderer from 'modules/dynamic-content/components/organisms/PageRenderer/PageRenderer';
import './DynamicPage.scss';

/**
 * Una página de un módulo dinámico.
 *
 * Carga el módulo completo y no solo la página: la jerarquía entera viene en
 * una consulta, los bloques de índice necesitan conocer las demás páginas para
 * construir sus enlaces, y si se llega desde la portada ya está en memoria.
 */
const DynamicPage = () => {
  const { moduleSlug, pageSlug } = useParams<{ moduleSlug: string; pageSlug: string }>();
  const dispatch = useAppDispatch();

  const module = useAppSelector(selectSelectedDynamicModule);
  const status = useAppSelector(selectDynamicDetailStatus);
  const error = useAppSelector(selectDynamicError);

  useEffect(() => {
    if (moduleSlug) void dispatch(fetchDynamicModuleBySlug(moduleSlug));
    return () => void dispatch(clearSelectedModule());
  }, [dispatch, moduleSlug]);

  const context = useMemo(
    () => ({ moduleSlug: module?.slug ?? '', pages: module?.pages ?? [] }),
    [module?.slug, module?.pages],
  );

  const moduleRoute = moduleSlug ? buildRoute.dynModule(moduleSlug) : ROUTES.MODULES;

  if (status === LoadingStatus.Pending || status === LoadingStatus.Idle) {
    return (
      <>
        <TopBar title="Cargando" showBack backTo={moduleRoute} />
        <Spinner size="lg" label="Cargando la página" />
      </>
    );
  }

  /**
   * Las páginas que puede recorrer quien lee, en orden y sin la portada: la
   * portada es la pantalla anterior, no un paso más de la secuencia.
   */
  const ordered = module ? module.pages.filter((page) => !page.isHome) : [];
  const position = ordered.findIndex((page) => page.slug === pageSlug);
  const page = position === -1 ? undefined : ordered[position];

  /**
   * Una página inexistente se trata igual que un módulo que no carga. Pasa con
   * un enlace viejo: el administrador la renombró y el slug guardado en un
   * marcador ya no apunta a nada.
   */
  if (status === LoadingStatus.Failed || !module || !page) {
    return (
      <>
        <TopBar title="Página" showBack backTo={moduleRoute} />
        <div className="app-container dyn-page__error">
          <AlertMessage tone="error" title="No pudimos abrir esta página">
            {error ?? 'Esa página no existe o fue eliminada del módulo.'}
          </AlertMessage>
        </div>
      </>
    );
  }

  const next = ordered[position + 1];

  return (
    <>
      {/* El «atrás» va a la portada del módulo, que es de donde viene quien
          toca una ficha del índice. */}
      <TopBar title={page.title} showBack backTo={moduleRoute} />

      <article className="dyn-page rise-in" data-testid="DynamicPage">
        <div className="app-container dyn-page__inner">
          <header className="dyn-page__head">
            {/* Solo se anuncia la posición si hay secuencia que recorrer. Con
                una sola página, «Paso 1 de 1» no informa de nada. */}
            {ordered.length > 1 && (
              <p className="dyn-page__step">
                Paso {position + 1} de {ordered.length}
              </p>
            )}

            <h1 className="dyn-page__title">{page.title}</h1>

            {page.subtitle && <p className="dyn-page__subtitle">{page.subtitle}</p>}
          </header>

          <PageRenderer page={page} context={context} />

          <nav className="dyn-page__nav" aria-label="Continuar en el módulo">
            {next ? (
              <LinkButton
                to={buildRoute.dynPage(module.slug, next.slug)}
                variant="emergency"
                size="lg"
                fullWidth
                iconEnd={<ArrowRight />}
              >
                {next.title}
              </LinkButton>
            ) : (
              <LinkButton
                to={moduleRoute}
                variant="secondary"
                size="md"
                fullWidth
                iconStart={<List />}
              >
                Volver al módulo
              </LinkButton>
            )}
          </nav>
        </div>
      </article>
    </>
  );
};

export default DynamicPage;
