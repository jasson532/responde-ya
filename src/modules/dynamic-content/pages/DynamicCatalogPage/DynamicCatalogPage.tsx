import { useCallback, useEffect, useMemo } from 'react';
import { PackageOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import GreetingHeader from 'modules/shared/components/molecules/GreetingHeader/GreetingHeader';
import { selectIsAdmin } from 'modules/auth/store/authSlice';
import {
  fetchDynamicModules,
  selectDynamicError,
  selectDynamicListStatus,
  selectModulesBySeverity,
} from 'modules/dynamic-content/store/dynamicSlice';
import { ModuleStatus } from 'modules/dynamic-content/types/dynamic.types';
import DynamicModuleTile from 'modules/dynamic-content/components/molecules/DynamicModuleTile/DynamicModuleTile';
import './DynamicCatalogPage.scss';

const SECTION_TITLE_ID = 'catalogo-modulos';

/**
 * Inicio: saludo y rejilla de módulos.
 *
 * Sustituye al catálogo que leía de `localStorage`. El contenido vive ahora en
 * Postgres, así que lo que se ve depende de QUIÉN mira:
 *
 * - El administrador ve los tres estados, incluidos los borradores, para poder
 *   revisar cómo está quedando algo antes de publicarlo.
 * - Cualquier otra persona ve lo publicado y lo anunciado como «próximamente».
 *
 * El filtro se pide al repositorio, pero la que decide de verdad es la política
 * RLS de Postgres: aunque alguien pidiera los borradores sin ser administrador,
 * la base no los devolvería.
 */
const DynamicCatalogPage = () => {
  const dispatch = useAppDispatch();

  const isAdmin = useAppSelector(selectIsAdmin);
  const modules = useAppSelector(selectModulesBySeverity);
  const status = useAppSelector(selectDynamicListStatus);
  const error = useAppSelector(selectDynamicError);

  const load = useCallback(() => {
    void dispatch(fetchDynamicModules({ includeDrafts: isAdmin }));
  }, [dispatch, isAdmin]);

  // Depende de `isAdmin`: al iniciar sesión, la lista se recarga con los
  // borradores sin que haya que refrescar la página a mano.
  useEffect(load, [load]);

  /** Cuántos borradores hay, para avisar al administrador de lo que está viendo. */
  const draftCount = useMemo(
    () => modules.filter((module) => module.status === ModuleStatus.Draft).length,
    [modules],
  );

  return (
    <div className="catalog app-container" data-testid="DynamicCatalogPage">
      <GreetingHeader />

      <section className="catalog__modules" aria-labelledby={SECTION_TITLE_ID}>
        <h2 className="catalog__section-title" id={SECTION_TITLE_ID}>
          Aprende paso a paso
        </h2>

        {/* El aviso solo aparece si de verdad hay borradores: si no, sería una
            nota permanente que deja de leerse. */}
        {isAdmin && draftCount > 0 && (
          <AlertMessage tone="info">
            Estás viendo {draftCount} {draftCount === 1 ? 'borrador' : 'borradores'} que
            el público todavía no ve.
          </AlertMessage>
        )}

        {status === LoadingStatus.Pending || status === LoadingStatus.Idle ? (
          <Spinner size="lg" label="Cargando módulos" />
        ) : status === LoadingStatus.Failed ? (
          <AlertMessage tone="error" title="No pudimos cargar los módulos" onRetry={load}>
            {error ?? 'Intenta de nuevo en un momento.'}
          </AlertMessage>
        ) : modules.length === 0 ? (
          <EmptyState
            icon={<PackageOpen />}
            title="Aún no hay módulos publicados"
            description="Cuando el administrador publique contenido aparecerá aquí."
          />
        ) : (
          <ul className="catalog__grid">
            {modules.map((module, index) => (
              <li
                key={module.id}
                className="catalog__item"
                // Retardo de la entrada en cascada, topado para que un
                // catálogo largo no deje la última tarjeta invisible.
                style={{ '--tile-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <DynamicModuleTile module={module} canSeeDrafts={isAdmin} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DynamicCatalogPage;
