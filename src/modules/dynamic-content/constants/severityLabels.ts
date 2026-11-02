import { ModuleSeverity } from 'modules/dynamic-content/types/dynamic.types';

/**
 * Etiqueta y tono de cada gravedad.
 *
 * Duplica lo que hace `SeverityBadge` en el módulo `content`, y es a propósito:
 * TypeScript trata los enums como tipos nominales, así que el `ModuleSeverity`
 * de aquí no es asignable al de allí aunque las cadenas coincidan. Reutilizar
 * ese componente exigiría un `as unknown as`, que es exactamente la clase de
 * conversión que oculta un error el día que los dos enums dejen de coincidir.
 *
 * Son tres filas. Cuando `content` se jubile, se queda solo esta.
 */
export const SEVERITY_LABEL: Record<ModuleSeverity, string> = {
  [ModuleSeverity.Critical]: 'Riesgo vital',
  [ModuleSeverity.Urgent]: 'Urgente',
  [ModuleSeverity.Basic]: 'Básico',
};

/** Tono visual del héroe y de la etiqueta. Coincide con los de `IconBubble`. */
export const SEVERITY_TONE = {
  [ModuleSeverity.Critical]: 'emergency',
  [ModuleSeverity.Urgent]: 'warning',
  [ModuleSeverity.Basic]: 'safe',
} as const;
