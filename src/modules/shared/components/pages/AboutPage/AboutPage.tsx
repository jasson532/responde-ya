import type { ReactNode } from 'react';
import {
  FileText,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  House,
  Image as ImageIcon,
  Target,
  UsersRound,
  Video,
} from 'lucide-react';
import { ROUTES } from 'modules/shared/constants/routes';
import BrandLogo from 'modules/shared/components/atoms/BrandLogo/BrandLogo';
import IconBubble, {
  type BubbleTone,
} from 'modules/shared/components/atoms/IconBubble/IconBubble';
import LinkButton from 'modules/shared/components/atoms/LinkButton/LinkButton';
import './AboutPage.scss';

interface Entry {
  id: string;
  icon: ReactNode;
  tone: BubbleTone;
  label: string;
}

/**
 * A quién va dirigida la aplicación.
 *
 * La enumeración del texto («personas de la comunidad, familiares,
 * estudiantes, cuidadores…») se dibuja como rejilla en vez de como una frase
 * con comas: cada grupo gana un icono y se reconoce de un vistazo. Ninguna
 * palabra se pierde — el predicado que las unía cierra la sección debajo.
 */
const AUDIENCES: readonly Entry[] = [
  { id: 'comunidad', icon: <UsersRound />, tone: 'emergency', label: 'Comunidad' },
  { id: 'familias', icon: <HeartHandshake />, tone: 'violet', label: 'Familiares' },
  { id: 'estudiantes', icon: <GraduationCap />, tone: 'info', label: 'Estudiantes' },
  { id: 'cuidadores', icon: <HandHeart />, tone: 'safe', label: 'Cuidadores' },
];

/** Los tres formatos del contenido, sacados de la frase del propósito. */
const FORMATS: readonly Entry[] = [
  { id: 'textos', icon: <FileText />, tone: 'info', label: 'Textos' },
  { id: 'imagenes', icon: <ImageIcon />, tone: 'teal', label: 'Imágenes' },
  { id: 'videos', icon: <Video />, tone: 'emergency', label: 'Videos' },
];

/**
 * Qué es RespondeYa y para quién.
 *
 * Vive en `shared/components/pages` junto a `NotFoundPage`: es una página de
 * la aplicación, no de un dominio de negocio. No hay módulo `about` porque un
 * módulo entero para una pantalla estática sería andamiaje sin uso.
 */
const AboutPage = () => (
  <article className="about rise-in" data-testid="AboutPage">
    <header className="about__head">
      <BrandLogo size="md" />
      <h1 className="about__title">Conoce RespondeYa</h1>
    </header>

    <section className="about__block" aria-labelledby="about-publico">
      <div className="about__block-head">
        <IconBubble tone="emergency" size="lg">
          <UsersRound />
        </IconBubble>
        <h2 className="about__block-title" id="about-publico">
          ¿Para quién es RespondeYa?
        </h2>
      </div>

      <p className="about__shout">¡Para todos!</p>

      <ul className="about__grid">
        {AUDIENCES.map((entry) => (
          <li key={entry.id} className="about__card">
            <IconBubble tone={entry.tone} size="lg" round>
              {entry.icon}
            </IconBubble>
            <span className="about__card-label">{entry.label}</span>
          </li>
        ))}
      </ul>

      <p className="about__text">
        Personas de la comunidad, familiares, estudiantes, cuidadores y cualquier persona
        interesada en aprender cómo responder inicialmente ante una emergencia.
      </p>
    </section>

    <section className="about__block" aria-labelledby="about-proposito">
      <div className="about__block-head">
        <IconBubble tone="safe" size="lg">
          <Target />
        </IconBubble>
        <h2 className="about__block-title" id="about-proposito">
          Nuestro propósito
        </h2>
      </div>

      <p className="about__text">
        Acercar conocimientos claros y confiables sobre primeros auxilios a personas sin
        formación sanitaria, mediante textos, imágenes y videos fáciles de comprender.
      </p>

      <ul className="about__grid about__grid--formats">
        {FORMATS.map((entry) => (
          <li key={entry.id} className="about__card">
            <IconBubble tone={entry.tone} size="lg" round>
              {entry.icon}
            </IconBubble>
            <span className="about__card-label">{entry.label}</span>
          </li>
        ))}
      </ul>
    </section>

    <div className="about__actions">
      <LinkButton to={ROUTES.MODULES} variant="emergency" size="lg" fullWidth>
        <span className="about__cta-label">Comenzar</span>
      </LinkButton>

      <LinkButton
        to={ROUTES.WELCOME}
        variant="secondary"
        size="md"
        fullWidth
        iconStart={<House />}
      >
        Inicio
      </LinkButton>
    </div>
  </article>
);

export default AboutPage;
