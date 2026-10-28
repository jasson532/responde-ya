import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import GreetingHeader from 'modules/shared/components/molecules/GreetingHeader/GreetingHeader';
import {
  fetchModules,
  selectContentError,
  selectListStatus,
  selectModulesBySeverity,
} from 'modules/content/store/contentSlice';
import ModuleGrid from 'modules/content/components/organisms/ModuleGrid/ModuleGrid';
import './ModulesCatalogPage.scss';

/**
 * Inicio. Saludo y rejilla de módulos, nada más.
 *
 * Sin barra superior a propósito: el saludo ya es la cabecera de la pantalla y
 * una barra que dijera «Inicio» justo encima solo repetiría la información.
 *
 * La búsqueda y los filtros viven en `SearchPage`. Aquí la tarea es reconocer
 * la situación de un vistazo, no acotar una lista.
 */
const ModulesCatalogPage = () => {
  const dispatch = useAppDispatch();
  const modules = useAppSelector(selectModulesBySeverity);
  const status = useAppSelector(selectListStatus);
  const error = useAppSelector(selectContentError);

  const load = useCallback(() => {
    void dispatch(fetchModules());
  }, [dispatch]);

  useEffect(load, [load]);

  return (
    <div className="home app-container rise-in" data-testid="ModulesCatalogPage">
      <GreetingHeader />

      <p className="home__lead">
        Elige qué está pasando y te mostramos qué hacer, paso a paso.
      </p>

      <ModuleGrid modules={modules} status={status} error={error} onRetry={load} />
    </div>
  );
};

export default ModulesCatalogPage;
