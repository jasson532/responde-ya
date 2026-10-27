import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import IconBubble, {
  type BubbleTone,
} from 'modules/shared/components/atoms/IconBubble/IconBubble';
import './ListRow.scss';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  tone?: BubbleTone;
  /** Si se pasa, la fila completa es un enlace y muestra chevron. */
  to?: string;
  /** Contenido a la derecha (badges, acciones). Reemplaza al chevron. */
  trailing?: ReactNode;
  /** Etiquetas bajo el subtitulo. */
  meta?: ReactNode;
}

/**
 * Fila de lista: icono con tinte, título, subtitulo y chevron.
 *
 * Cuando hay `to`, el elemento raiz ES el enlace y ocupa toda la fila, en vez
 * de poner un enlace pequeno dentro. Asi el area tocable es la fila entera,
 * que es lo que la gente intenta pulsar.
 */
const ListRow = ({
  title,
  subtitle,
  icon,
  tone = 'neutral',
  to,
  trailing,
  meta,
}: ListRowProps) => {
  const body = (
    <>
      <IconBubble tone={tone} size="md">
        {icon}
      </IconBubble>

      <span className="list-row__body">
        <span className="list-row__title">{title}</span>
        {subtitle && <span className="list-row__subtitle">{subtitle}</span>}
        {meta && <span className="list-row__meta">{meta}</span>}
      </span>

      {trailing ? (
        <span className="list-row__trailing">{trailing}</span>
      ) : (
        to && (
          <span className="list-row__chevron" aria-hidden="true">
            <ChevronRight />
          </span>
        )
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="list-row list-row--link" data-testid="ListRow">
        {body}
      </Link>
    );
  }

  return (
    <div className="list-row" data-testid="ListRow">
      {body}
    </div>
  );
};

export default ListRow;
