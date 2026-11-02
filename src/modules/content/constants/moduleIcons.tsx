import type { ReactNode } from 'react';
import HealthIcon from 'modules/shared/components/atoms/HealthIcon/HealthIcon';
import {
  HEALTH_ICON_LABELS,
  type HealthIconName,
} from 'modules/shared/components/atoms/HealthIcon/healthIconNodes';

/**
 * Registro de iconos de módulo.
 *
 * Son iconos del set Health Icons (CC0), pensados para software sanitario, en
 * vez de los genéricos de la interfaz: para el módulo de reanimación hay un
 * icono que muestra la maniobra, no un corazón cualquiera.
 *
 * La lista NO se escribe aquí: sale de `healthIconNodes.tsx`, que está generado
 * a partir de los SVG descargados. Ver `docs/icons/CATALOGO.md` para añadir uno.
 * Duplicar las etiquetas a mano garantizaba que antes o después se
 * desincronizaran del set real.
 *
 * Lucide se sigue usando para el *chrome* de la interfaz (chevrons, buscar,
 * navegación). Los dos sets no coinciden nunca en la misma fila, que es lo que
 * delataría la diferencia de trazo.
 */

/** Etiquetas del selector del administrador. */
export const MODULE_ICON_LABELS = HEALTH_ICON_LABELS;

export const MODULE_ICON_NAMES = Object.keys(HEALTH_ICON_LABELS) as HealthIconName[];

export const DEFAULT_MODULE_ICON: HealthIconName = 'emergency-post';

/**
 * Nombres de iconos de Lucide usados antes de pasar a Health Icons.
 *
 * Hacen falta porque `iconName` se guarda EN LOS DATOS: un módulo que creó un
 * administrador con `iconName: 'HeartPulse'` sigue en su navegador. Sin estos
 * alias, ese módulo perdería su icono y caería al de respaldo sin avisar.
 *
 * El valor es `string` y no `HealthIconName` a propósito: un alias puede
 * apuntar a un icono que ya no esté instalado, y `resolveIconName` lo valida en
 * tiempo de ejecución en vez de romper la compilación.
 */
const LEGACY_ICON_ALIASES: Readonly<Record<string, string>> = {
  HeartPulse: 'cpr',
  Activity: 'heartbeat',
  Wind: 'lungs',
  Droplet: 'bleeding',
  Flame: 'burn',
  Bandage: 'wound',
  Bone: 'bone',
  Brain: 'head',
  Zap: 'electricity',
  Biohazard: 'hazardous',
  Thermometer: 'thermometer',
  Snowflake: 'thermometer',
  PillBottle: 'pills',
  Stethoscope: 'stethoscope',
  LifeBuoy: 'emergency-post',
  TriangleAlert: 'alert-triangle',
};

const isInstalled = (name: string): name is HealthIconName =>
  Object.hasOwn(HEALTH_ICON_LABELS, name);

/** Traduce un `iconName` guardado al del set instalado. */
export const resolveIconName = (iconName: string): HealthIconName => {
  if (isInstalled(iconName)) return iconName;

  const alias = LEGACY_ICON_ALIASES[iconName];
  if (alias !== undefined && isInstalled(alias)) return alias;

  return DEFAULT_MODULE_ICON;
};

/** Devuelve el icono por nombre, con respaldo seguro si no se reconoce. */
export const getModuleIcon = (iconName: string): ReactNode => (
  <HealthIcon name={resolveIconName(iconName)} />
);

/** Etiqueta legible de un `iconName` guardado. */
export const getModuleIconLabel = (iconName: string): string =>
  HEALTH_ICON_LABELS[resolveIconName(iconName)];
