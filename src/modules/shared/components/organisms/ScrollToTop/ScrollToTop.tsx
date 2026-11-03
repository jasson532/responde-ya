import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ===========================================================================
 * AL CAMBIAR DE PANTALLA, ARRIBA
 * ===========================================================================
 * Una aplicación de una sola página no recarga el documento al navegar, así que
 * el navegador deja el desplazamiento donde estaba. Al abrir una página desde
 * el final de un índice largo, la nueva aparecía empezada por la mitad y había
 * que subir a mano para leer el título.
 *
 * No existe `ScrollRestoration` aquí: ese componente de React Router solo
 * funciona con los routers de datos (`createBrowserRouter`), y esta aplicación
 * usa `<BrowserRouter>` con `<Routes>`.
 * ===========================================================================
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    /**
     * Volver atrás NO se toca.
     *
     * En una navegación `POP` —el botón de atrás del navegador o el gesto del
     * móvil— el navegador restaura por su cuenta la posición que tenía esa
     * entrada del historial. Subir al principio aquí pisaría esa restauración
     * y devolvería a quien vuelve de una lección al encabezado del catálogo en
     * lugar de a la tarjeta que acababa de tocar.
     */
    if (navigationType === 'POP') return;

    /**
     * `instant` es obligatorio, no una preferencia.
     *
     * El reset declara `scroll-behavior: smooth` en `html` para que los
     * enlaces internos se deslicen. Sin forzar el modo, esa regla se aplica
     * también aquí y cada cambio de pantalla arrastraba la página hacia arriba
     * con una animación de medio segundo, sobre el contenido nuevo ya pintado.
     */
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
