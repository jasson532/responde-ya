import { useCallback, useEffect, useState } from 'react';
import { SearchX } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import Chip from 'modules/shared/components/atoms/Chip/Chip';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import SearchBar from 'modules/shared/components/molecules/SearchBar/SearchBar';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import { selectIsAdmin, selectIsAuthBootstrapped } from 'modules/auth/store/authSlice';
import {
  fetchCategories,
  fetchDynamicModules,
  selectCategories,
  selectDynamicError,
  selectDynamicListStatus,
  selectModulesBySeverity,
} from 'modules/dynamic-content/store/dynamicSlice';
import DynamicModuleTile from 'modules/dynamic-content/components/molecules/DynamicModuleTile/DynamicModuleTile';
import './DynamicSearchPage.scss';

/**
 * Búsqueda de módulos contra Postgres.
 *
 * Sustituye al buscador que filtraba `localStorage`: desde que el catálogo lee
 * de la base, aquel buscaba en un contenido que ya no se mostraba.
 *
 * El filtrado lo hace Postgres sobre `search_text`, la columna generada que
 * concatena título, resumen y etiquetas (migración 004). Las etiquetas son lo
 * que hace que funcione: la gente escribe «se ahoga», no «atragantamiento».
 *
 * El retardo al teclear lo pone `SearchBar`, que ya lo trae. Añadir aquí otro
 * mecanismo daría dos retardos sumados sobre la misma pulsación.
 */
const DynamicSearchPage = () => {
  const dispatch = useAppDispatch();

  const isAdmin = useAppSelector(selectIsAdmin);
  const isBootstrapped = useAppSelector(selectIsAuthBootstrapped);
  const categories = useAppSelector(selectCategories);
  const modules = useAppSelector(selectModulesBySeverity);
  const status = useAppSelector(selectDynamicListStatus);
  const error = useAppSelector(selectDynamicError);

  const [term, setTerm] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const load = useCallback(() => {
    // Mientras la sesión se restaura, `isAdmin` todavía no significa nada:
    // ver el comentario de `DynamicCatalogPage`.
    if (!isBootstrapped) return;
    void dispatch(
      fetchDynamicModules({
        query: term.trim() === '' ? undefined : term.trim(),
        categoryId: categoryId ?? undefined,
        includeDrafts: isAdmin,
      }),
    );
  }, [dispatch, term, categoryId, isAdmin, isBootstrapped]);

  useEffect(load, [load]);

  useEffect(() => {
    void dispatch(fetchCategories());
  }, [dispatch]);

  const hasFilters = term.trim() !== '' || categoryId !== null;

  return (
    <>
      <TopBar title="Buscar" />

      <div className="search-page app-container" data-testid="DynamicSearchPage">
        <SearchBar
          onSearch={setTerm}
          placeholder="Se ahoga, no respira, quemadura…"
          label="Buscar módulos"
        />

        {categories.length > 0 && (
          <nav className="search-page__filters" aria-label="Filtrar por categoría">
            <Chip isActive={categoryId === null} onClick={() => setCategoryId(null)}>
              Todas
            </Chip>

            {categories.map((category) => (
              <Chip
                key={category.id}
                isActive={categoryId === category.id}
                // Volver a pulsar la categoría activa la quita: es el gesto
                // que se espera de un filtro, y evita tener que ir a «Todas».
                onClick={() =>
                  setCategoryId(categoryId === category.id ? null : category.id)
                }
              >
                {category.name}
              </Chip>
            ))}
          </nav>
        )}

        {/* `Idle` cuenta como carga: es el hueco entre montar la pantalla y
            tener la sesión restaurada, y ahí «Sin resultados» sería mentira. */}
        {status === LoadingStatus.Pending || status === LoadingStatus.Idle ? (
          <Spinner size="lg" label="Buscando" />
        ) : status === LoadingStatus.Failed ? (
          <AlertMessage tone="error" title="No pudimos buscar" onRetry={load}>
            {error ?? 'Intenta de nuevo en un momento.'}
          </AlertMessage>
        ) : modules.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={hasFilters ? 'Sin resultados' : 'Aún no hay módulos'}
            description={
              hasFilters
                ? 'Prueba con otras palabras, o quita el filtro de categoría.'
                : 'Cuando el administrador publique contenido aparecerá aquí.'
            }
          />
        ) : (
          <>
            {/* El recuento solo con filtros: sin ellos esto es el catálogo
                completo, y decir cuántos hay no aporta nada.
                `role="status"` lo anuncia a un lector de pantalla cuando
                cambia, que es la única forma de saber que la búsqueda terminó
                sin mirar la pantalla. */}
            {hasFilters && (
              <p className="search-page__count" role="status">
                {modules.length} {modules.length === 1 ? 'resultado' : 'resultados'}
              </p>
            )}

            <ul className="search-page__grid">
              {modules.map((module) => (
                <li key={module.id} className="search-page__item">
                  <DynamicModuleTile module={module} canSeeDrafts={isAdmin} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
};

export default DynamicSearchPage;
