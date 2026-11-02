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
 * Tampoco hay frase descriptiva. La promesa de «paso a paso» ya se hace en la
 * pantalla de bienvenida, y quien abre esta pantalla porque algo está pasando
 * necesita ver las tarjetas, no leer sobre la aplicación.
 *
 * La búsqueda y los filtros viven en `SearchPage`. Aquí la tarea es reconocer
 * la situación de un vistazo, no acotar una lista.
 */
const SECTION_TITLE_ID = 'home-modulos';
const ModulesCatalogPage = () => {
  const dispatch = useAppDispatch();
  const modules = useAppSelector(selectModulesBySeverity);
  const status = useAppSelector(selectListStatus);
  const error = useAppSelector(selectContentError);

  const load = useCallback(() => {
    void dispatch(fetchModules());
  }, [dispatch]);

  useEffect(load, [load]);

  // Sin `rise-in` en el contenedor: las tarjetas traen su propia entrada en
  // cascada y animar también el padre las movería dos veces a la vez.
  return (
    <div className="home app-container" data-testid="ModulesCatalogPage">
      <GreetingHeader />

      {/* Encabezado en vez de una frase descriptiva: orienta en tres palabras y
          además da nombre accesible a la rejilla, que antes no tenía.

          Antes decía «¿Qué está pasando?», que presupone una emergencia en
          curso y una lista donde elegir. Con un solo módulo no hay nada que
          elegir, y quien entra a leer el protocolo con calma no está en medio
          de nada. «Aprende paso a paso» es además el encabezado que usa el
          prototipo en la pantalla de índice. */}
      <section className="home__modules" aria-labelledby={SECTION_TITLE_ID}>
        <h2 className="home__section-title" id={SECTION_TITLE_ID}>
          Aprende paso a paso
        </h2>

        <ModuleGrid modules={modules} status={status} error={error} onRetry={load} />
      </section>
    </div>
  );
};

export default ModulesCatalogPage;
