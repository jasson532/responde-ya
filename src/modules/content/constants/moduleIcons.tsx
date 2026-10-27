import type { ReactNode } from 'react';
import {
  Activity,
  Bandage,
  Biohazard,
  Bone,
  Brain,
  Droplet,
  Flame,
  HeartPulse,
  LifeBuoy,
  PillBottle,
  Snowflake,
  Stethoscope,
  Thermometer,
  TriangleAlert,
  Wind,
  Zap,
} from 'lucide-react';

/**
 * Registro cerrado de iconos. El admin elige de esta lista en vez de escribir
 * un nombre libre: garantiza que el icono siempre exista y mantiene el bundle
 * acotado (importar `lucide-react` completo serian cientos de kilobytes).
 */
export const MODULE_ICONS: Readonly<Record<string, ReactNode>> = {
  HeartPulse: <HeartPulse />,
  Wind: <Wind />,
  Droplet: <Droplet />,
  Flame: <Flame />,
  Bandage: <Bandage />,
  Bone: <Bone />,
  Brain: <Brain />,
  Zap: <Zap />,
  Snowflake: <Snowflake />,
  Thermometer: <Thermometer />,
  Biohazard: <Biohazard />,
  PillBottle: <PillBottle />,
  Stethoscope: <Stethoscope />,
  LifeBuoy: <LifeBuoy />,
  Activity: <Activity />,
  TriangleAlert: <TriangleAlert />,
};

export const MODULE_ICON_NAMES = Object.keys(MODULE_ICONS);

export const DEFAULT_MODULE_ICON = 'LifeBuoy';

/** Devuelve el icono por nombre, con respaldo seguro si el nombre no existe. */
export const getModuleIcon = (iconName: string): ReactNode =>
  MODULE_ICONS[iconName] ?? MODULE_ICONS[DEFAULT_MODULE_ICON];
