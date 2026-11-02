import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import { ROUTES } from 'modules/shared/constants/routes';
import BrandLogo from 'modules/shared/components/atoms/BrandLogo/BrandLogo';
import Button from 'modules/shared/components/atoms/Button/Button';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import welcomeArtSrc from 'modules/shared/assets/images/img-welcome.jpg';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import {
  clearAuthError,
  loginAdmin,
  selectAuthError,
  selectAuthStatus,
  selectIsAdmin,
} from 'modules/auth/store/authSlice';
import AdminLoginForm from 'modules/auth/components/molecules/AdminLoginForm/AdminLoginForm';
import { isRealAuth } from 'modules/auth/services/auth.service';
import { DEMO_CREDENTIALS } from 'modules/auth/services/auth.local.repository';
import type { LoginCredentials } from 'modules/auth/types/auth.types';
import './WelcomePage.scss';

interface LocationState {
  from?: { pathname: string };
}

/**
 * Portada. Marca, una ilustración y una sola acción.
 *
 * Nada más, a propósito: lo que antes había aquí —tres tarjetas de lo que
 * ofrece la app, un separador y un botón de administración— obligaba a elegir
 * en la primera pantalla. Quien abre esto quiere entrar.
 *
 * El acceso de administración se anuncia al final y en discreto. El formulario
 * no está puesto: lo abre ese botón y se cierra con «Cancelar».
 */
const WelcomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const isAdmin = useAppSelector(selectIsAdmin);

  /**
   * Si el formulario está abierto.
   *
   * Estado del componente y NO `location.state`, que es de donde salía antes.
   * React Router guarda ese estado en `history.state`, que el navegador
   * conserva entre recargas: el formulario reaparecía al recargar y no había
   * manera de cerrarlo salvo navegando a otra pantalla.
   *
   * Al vivir aquí, recargar lo cierra sin que haya que hacer nada: un montaje
   * nuevo arranca en `false`.
   */
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  /**
   * El botón que abre el formulario. Al cerrarlo hay que devolverle el foco:
   * si no, se queda en el `<body>` y quien navega con teclado tiene que
   * recorrer la pantalla entera otra vez para volver donde estaba.
   */
  const adminButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Marca que el cierre lo pidió una persona, para devolverle el foco.
   *
   * El foco NO se puede mover dentro del manejador de «Cancelar»: en ese
   * instante el botón está desmontado —lo oculta el formulario abierto— y la
   * referencia es nula. Se mueve en el efecto de abajo, cuando ya ha vuelto al
   * DOM.
   *
   * Y hace falta la marca porque ese efecto también corre al montar la
   * pantalla, donde `isLoginOpen` ya es `false`: sin ella, abrir la portada
   * robaría el foco hasta el botón de administración, saltándose «COMENZAR».
   */
  const restoreFocus = useRef(false);

  /**
   * Ruta de admin desde la que el guard redirigió, si aplica.
   *
   * Ya NO decide si se ve el formulario; solo a dónde ir después de entrar.
   * Sin esto, quien abre un enlace directo a una pantalla del editor acabaría
   * en el listado genérico en lugar de donde quería ir.
   *
   * Se copia a estado local en el primer renderizado porque el efecto de abajo
   * borra el original.
   */
  const [intendedAdminPath] = useState(
    () => (location.state as LocationState | null)?.from?.pathname ?? null,
  );

  /**
   * El destino se consume una sola vez.
   *
   * `history.state` sobrevive a las recargas, y dejarlo ahí tiene dos efectos
   * raros: el aviso sigue hablando de «esa sección» cuando ya nadie viene
   * rebotado, y al entrar te manda a una ruta profunda que pediste en otra
   * visita. Reescribir la entrada del historial sin estado lo convierte en lo
   * que es: una intención válida para este rebote y nada más.
   */
  useEffect(() => {
    if ((location.state as LocationState | null)?.from === undefined) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const closeLogin = () => {
    restoreFocus.current = true;
    setIsLoginOpen(false);
    // El error se limpia al cerrar: reabrir el formulario no debe empezar con
    // el aviso de un intento anterior.
    dispatch(clearAuthError());
  };

  useEffect(() => {
    if (isLoginOpen || !restoreFocus.current) return;
    restoreFocus.current = false;
    adminButtonRef.current?.focus();
  }, [isLoginOpen]);

  const handleAdminLogin = async (credentials: LoginCredentials) => {
    const result = await dispatch(loginAdmin(credentials));

    if (result.meta.requestStatus === 'fulfilled') {
      // Sin rebote del guard se va al editor de contenido dinámico, que es
      // donde se trabaja. Apuntaba a `/admin/modulos`, el editor antiguo.
      navigate(intendedAdminPath ?? ROUTES.ADMIN_DYN, { replace: true });
    }
  };

  return (
    <section className="welcome" data-testid="WelcomePage">
      {/* El logo es el encabezado de la pantalla; su `alt` aporta el nombre. */}
      <h1 className="welcome__logo">
        <BrandLogo size="lg" priority />
      </h1>

      {/* En minúsculas en el código y en mayúsculas por CSS: algunos lectores
          de pantalla leen las mayúsculas reales letra a letra. */}
      <p className="welcome__tagline">
        Educación digital en primer respondiente para la comunidad
      </p>

      {/**
       * La ilustración del diseño, en lugar del icono monocromo que había
       * aquí. Trae su propio fondo azul con la onda, así que NO va dentro de un
       * panel de color: se apoya directamente sobre el lienzo.
       *
       * `width`/`height` son las dimensiones reales del archivo; fijarlas
       * reserva el hueco y evita que el texto de abajo salte al cargar (CLS).
       */}
      <img
        className="welcome__art"
        src={welcomeArtSrc}
        width={1130}
        height={598}
        alt="Una persona realizando compresiones torácicas sobre alguien tendido en el suelo"
        fetchPriority="high"
        decoding="async"
      />

      {/* El signo de cierre en rojo, como en el diseño: recoge el reparto de
          color del logo (navy + rojo) sin repetir el truco de «RespondeYa». */}
      <p className="welcome__greeting">
        ¡Bienvenido a RespondeYa
        <span className="welcome__greeting-mark">!</span>
      </p>

      <div className="welcome__actions">
        <LinkButton to={ROUTES.MODULES} variant="emergency" size="lg" fullWidth>
          <span className="welcome__cta-label">Comenzar</span>
        </LinkButton>

        <LinkButton
          to={ROUTES.ABOUT}
          variant="secondary"
          size="md"
          fullWidth
          iconStart={<BookOpen />}
        >
          Conoce la aplicación
        </LinkButton>
      </div>

      {/* El punto separador va `aria-hidden`: es puntuación decorativa y algunos
          lectores de pantalla lo anuncian como «punto medio» entre las dos
          palabras. */}
      <p className="welcome__terms">
        Gratis
        <span className="welcome__terms-dot" aria-hidden="true">
          ·
        </span>
        Sin registro
      </p>

      {/**
       * Acceso de administración.
       *
       * Con sesión viva es un ENLACE al panel: pedir otra vez unas credenciales
       * que ya se dieron sobra. Sin sesión es un BOTÓN que abre el formulario
       * aquí mismo, sin salir de la pantalla.
       *
       * Desaparece mientras el formulario está abierto: un control que no
       * haría nada visible es peor que no tenerlo.
       */}
      {!isLoginOpen &&
        (isAdmin ? (
          <LinkButton
            to={ROUTES.ADMIN}
            variant="ghost"
            size="sm"
            className="welcome__admin-access"
            iconStart={<ShieldCheck />}
          >
            Ir al panel de administración
          </LinkButton>
        ) : (
          <Button
            ref={adminButtonRef}
            variant="ghost"
            size="sm"
            className="welcome__admin-access"
            iconStart={<ShieldCheck />}
            onClick={() => setIsLoginOpen(true)}
          >
            Soy administrador
          </Button>
        ))}

      {isLoginOpen && (
        <div className="welcome__admin-panel">
          {error ? (
            <AlertMessage tone="error">{error}</AlertMessage>
          ) : (
            <AlertMessage tone="info">
              {/* El mensaje depende de cómo se llegó: «esa sección» solo tiene
                  sentido si el guard acaba de rebotar desde una. */}
              {intendedAdminPath
                ? 'Identifícate como administrador para entrar a esa sección.'
                : 'Esta parte es solo para quien gestiona el contenido.'}
            </AlertMessage>
          )}

          <AdminLoginForm
            onSubmit={handleAdminLogin}
            isSubmitting={status === LoadingStatus.Pending}
          />

          <Button
            variant="ghost"
            size="sm"
            fullWidth
            iconStart={<X />}
            onClick={closeLogin}
            disabled={status === LoadingStatus.Pending}
          >
            Cancelar
          </Button>

          {/* Las credenciales de demostración solo se anuncian cuando el
              acceso ES de demostración. Con Supabase Auth configurado ya no
              funcionan, y mostrarlas mandaría al administrador a probar una
              contraseña que va a fallar. */}
          {!isRealAuth() && (
            <aside className="welcome__demo">
              <p className="welcome__demo-title">Cuenta de demostración</p>
              <ul className="welcome__demo-list">
                {DEMO_CREDENTIALS.map((account) => (
                  <li key={account.email}>
                    {account.email} / {account.password}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      )}
    </section>
  );
};

export default WelcomePage;
