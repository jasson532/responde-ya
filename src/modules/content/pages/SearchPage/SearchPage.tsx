import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import Chip from 'modules/shared/components/atoms/Chip/Chip';
import SearchBar from 'modules/shared/components/molecules/SearchBar/SearchBar';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import {
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModulesBySeverity,
} from 'modules/content/store/contentSlice';
import { ModuleSeverity } from 'modules/content/types/content.types';
import ModuleGrid from 'modules/content/components/organisms/ModuleGrid/ModuleGrid';
import './SearchPage.scss';

interface SeverityFilter {
  value: ModuleSeverity | undefined;
  label: string;
}

const SEVERITY_FILTERS: readonly SeverityFilter[] = [
  { value: undefined, label: 'Todo' },
  { value: ModuleSeverity.Critical, label: 'Riesgo vital' },
  { value: ModuleSeverity.Urgent, label: 'Urgente' },
  { value: ModuleSeverity.Basic, label: 'Básico' },
];

/**
 * Búsqueda y filtros.
 *
 * Están aquí y no en el inicio porque son herramientas para cuando ya sabes qué
 * buscas; el inicio es para reconocer la situación de un vistazo. Separarlos
 * deja las dos pantallas haciendo una sola cosa cada una.
 */
const SearchPage = () => {
  const dispatch = useAppDispatch();
  const modules = useAppSelector(selectModulesBySeverity);
  const status = useAppSelector(selectListStatus);
  const error = useAppSelector(selectContentError);

  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState<ModuleSeverity | undefined>(undefined);

  const load = useCallback(() => {
    void dispatch(fetchModules({ query, severity }));
  }, [dispatch, query, severity]);

  useEffect(load, [load]);

  return (
    <>
      <TopBar title="Buscar" />

      <div className="search-page app-container rise-in" data-testid="SearchPage">
        <h1 className="search-page__title">¿Qué necesitas?</h1>

        <SearchBar onSearch={setQuery} autoFocus />

        <div className="search-page__filters" role="group" aria-label="Filtrar por gravedad">
          {SEVERITY_FILTERS.map((filter) => (
            <Chip
              key={filter.label}
              isActive={severity === filter.value}
              onClick={() => setSeverity(filter.value)}
            >
              {filter.label}
            </Chip>
          ))}
        </div>

        <p className="search-page__count" aria-live="polite">
          {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
        </p>

        <ModuleGrid
          modules={modules}
          status={status}
          error={error}
          onRetry={load}
          emptyTitle={query ? `Sin resultados para «${query}»` : 'Aún no hay módulos'}
          emptyDescription={
            query
              ? 'Prueba con otra palabra, por ejemplo «quemadura» o «sangrado».'
              : 'Cuando el administrador publique contenido aparecerá aquí.'
          }
        />
      </div>
    </>
  );
};

export default SearchPage;
