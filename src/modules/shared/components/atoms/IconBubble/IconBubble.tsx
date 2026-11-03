import type { ReactNode } from 'react';
import './IconBubble.scss';

export type BubbleTone =
  | 'emergency'
  | 'warning'
  | 'safe'
  | 'info'
  | 'violet'
  | 'teal'
  | 'neutral';

export type BubbleSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface IconBubbleProps {
  children: ReactNode;
  tone?: BubbleTone;
  size?: BubbleSize;
  /** Circular en vez de cuadrado redondeado. */
  round?: boolean;
}

/**
 * Contenedor con tinte pastel para un icono. Es la pieza que unifica el
 * lenguaje visual: aparece en las fichas del inicio, en las filas de lista y
 * en las cabeceras de módulo, siempre con el mismo tamano y tinte por tono.
 *
 * Decorativo por definicion: marca `aria-hidden`, así que el significado tiene
 * que estar en el texto que lo acompana.
 */
const IconBubble = ({
  children,
  tone = 'neutral',
  size = 'md',
  round = false,
}: IconBubbleProps) => (
  <span
    className={`icon-bubble icon-bubble--${tone} icon-bubble--${size} ${round ? 'icon-bubble--round' : ''}`.trim()}
    aria-hidden="true"
    data-testid="IconBubble"
  >
    {children}
  </span>
);

export default IconBubble;
