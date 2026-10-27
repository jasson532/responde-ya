import { useCallback, useEffect, useMemo, useState } from 'react';
import { PhoneCall, Siren } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import SearchBar from 'modules/shared/components/molecules/SearchBar/SearchBar';
import SectionHeader from 'modules/shared/components/molecules/SectionHeader/SectionHeader';
import Chip from 'modules/shared/components/atoms/Chip/Chip';
import TopBar from 'modules/shared/components/organisms/TopBar/TopBar';
import { EMERGENCY_PHONE } from 'modules/shared/constants/emergency';
import {
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModulesBySeverity,
} from 'modules/content/store/contentSlice';
import { ModuleSeverity } from 'modules/content/types/content.types';
import ModuleGrid from 'modules/content/components/organisms/ModuleGrid/ModuleGrid';
import './ModulesCatalogPage.scss';

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

  const isFiltering = query.length > 0 || severity !== undefined;

  const criticalCount = useMemo(
    () => modules.filter((module) => module.severity === ModuleSeverity.Critical).length,
    [modules],
  );

  return (
    <>
      <TopBar title="Módulos" />

      <div className="catalog app-container rise-in" data-testid="ModulesCatalogPage">
        <header className="catalog__hero">
          <p className="catalog__eyebrow">
            <Siren aria-hidden="true" />
            Guía de primeros auxilios
          </p>
          <h1 className="catalog__title">¿Qué está pasando?</h1>
          <p className="catalog__subtitle">
            Elige la situación y te mostramos qué hacer, paso a paso.
          </p>
        </header>

        {/* Llamar es la acción más importante de la app: va arriba, grande y
            como enlace tel: para que marque directo desde el móvil. */}
        <a className="catalog__call" href={`tel:${EMERGENCY_PHONE.number}`}>
          <span className="catalog__call-icon" aria-hidden="true">
            <PhoneCall />
          </span>
          <span className="catalog__call-body">
            <span className="catalog__call-label">Emergencia en curso</span>
            <span className="catalog__call-number">
              Llamar al {EMERGENCY_PHONE.number}
            </span>
          </span>
        </a>

        <SearchBar onSearch={setQuery} />

        <div className="catalog__filters" role="group" aria-label="Filtrar por gravedad">
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

        <SectionHeader
          title={isFiltering ? 'Resultados' : 'Actúa primero'}
          description={
            isFiltering
              ? `${modules.length} ${modules.length === 1 ? 'módulo' : 'módulos'}`
              : criticalCount > 0
                ? 'Lo de riesgo vital va primero. Cada segundo cuenta.'
                : 'Ordenado de lo más urgente a lo más leve.'
          }
        />

        <ModuleGrid
          modules={modules}
          status={status}
          error={error}
          onRetry={load}
          highlightFirst={!isFiltering}
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

export default ModulesCatalogPage;
