import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import SearchBar from 'modules/shared/components/molecules/SearchBar/SearchBar';
import {
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModulesBySeverity,
} from 'modules/content/store/contentSlice';
import { ModuleSeverity } from 'modules/content/types/content.types';
import ModuleGrid from 'modules/content/components/organisms/ModuleGrid/ModuleGrid';
import './ModulesCatalogPage.scss';

const SEVERITY_FILTERS = [
  { value: undefined, label: 'Todo' },
  { value: ModuleSeverity.Critical, label: 'Riesgo vital' },
  { value: ModuleSeverity.Urgent, label: 'Urgente' },
  { value: ModuleSeverity.Basic, label: 'Basico' },
] as const;

const ModulesCatalogPage = () => {
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
    <section className="modules-catalog" data-testid="ModulesCatalogPage">
      <header className="modules-catalog__header">
        <h1 className="modules-catalog__title">Que esta pasando?</h1>
        <p className="modules-catalog__subtitle">
          Elige la situacion y te mostramos que hacer, paso a paso.
        </p>
      </header>

      <SearchBar onSearch={setQuery} />

      <div className="modules-catalog__filters" role="group" aria-label="Filtrar por gravedad">
        {SEVERITY_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            className={`modules-catalog__filter ${severity === filter.value ? 'is-active' : ''}`.trim()}
            aria-pressed={severity === filter.value}
            onClick={() => setSeverity(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <ModuleGrid
        modules={modules}
        status={status}
        error={error}
        onRetry={load}
        emptyTitle={
          query ? `Sin resultados para "${query}"` : 'Aun no hay modulos publicados'
        }
        emptyDescription={
          query
            ? 'Prueba con otra palabra, por ejemplo "quemadura" o "sangrado".'
            : 'Cuando el administrador publique contenido aparecera aqui.'
        }
      />
    </section>
  );
};

export default ModulesCatalogPage;
