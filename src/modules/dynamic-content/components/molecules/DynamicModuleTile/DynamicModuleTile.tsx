import { Link } from 'react-router-dom';
import { buildRoute } from 'modules/shared/constants/routes';
import { getModuleIcon } from 'modules/content/constants/moduleIcons';
import {
  ModuleStatus,
  type ModuleSummary,
} from 'modules/dynamic-content/types/dynamic.types';
import { SEVERITY_LABEL } from 'modules/dynamic-content/constants/severityLabels';
// Reutiliza las clases de la tarjeta del catálogo antiguo: el diseño es el
// mismo y duplicar 250 líneas de estilos para repetirlo garantizaría que las
// dos versiones se separasen con el primer ajuste. Cuando `content` se jubile,
// la hoja se mueve aquí.
import 'modules/content/components/molecules/ModuleTile/ModuleTile.scss';

export interface DynamicModuleTileProps {
  module: ModuleSummary;
  /** El administrador puede abrir cualquier módulo, también sin publicar. */
  canSeeDrafts: boolean;
}

/**
 * Tarjeta del catálogo para un módulo dinámico.
 *
 * Tres estados visibles:
 * - Publicado: tarjeta con el color de su gravedad, se abre.
 * - Próximamente: en gris y sin abrir para el público; el administrador sí
 *   puede entrar, porque necesita ver cómo está quedando.
 * - Borrador: solo lo ve el administrador, con su etiqueta, y se abre.
 */
const DynamicModuleTile = ({ module, canSeeDrafts }: DynamicModuleTileProps) => {
  const isComingSoon = module.status === ModuleStatus.ComingSoon;
  const isDraft = module.status === ModuleStatus.Draft;

  /**
   * Se bloquea solo lo anunciado, y solo para el público. Un borrador NO se
   * bloquea: si el administrador no pudiera abrirlo, no tendría forma de
   * revisar lo que está montando antes de publicarlo.
   */
  const isLocked = isComingSoon && !canSeeDrafts;

  const className = [
    'module-tile',
    `module-tile--${module.severity}`,
    isLocked && 'module-tile--locked',
  ]
    .filter(Boolean)
    .join(' ');

  /** Qué dice la micro-etiqueta del pie. El estado manda sobre la gravedad. */
  const label = isDraft
    ? 'Borrador'
    : isComingSoon
      ? 'Próximamente'
      : SEVERITY_LABEL[module.severity];

  const body = (
    <>
      <span className="module-tile__icon" aria-hidden="true">
        {getModuleIcon(module.iconName)}
      </span>

      <span className="module-tile__title">{module.title}</span>

      {/* Los estados van en pastilla y la gravedad en micro-texto: así se
          distingue de un vistazo lo que es un aviso de publicación de lo que
          es información clínica. */}
      {isDraft || isComingSoon ? (
        <span className="module-tile__tag">{label}</span>
      ) : (
        <span className="module-tile__severity">{label}</span>
      )}
    </>
  );

  if (isLocked) {
    return (
      <div className={className} aria-disabled="true" data-testid="DynamicModuleTile">
        {body}
      </div>
    );
  }

  return (
    <Link
      to={buildRoute.dynModule(module.slug)}
      className={className}
      data-testid="DynamicModuleTile"
    >
      {body}
    </Link>
  );
};

export default DynamicModuleTile;
