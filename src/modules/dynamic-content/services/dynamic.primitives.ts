/**
 * Primitivas de validación.
 *
 * Existen porque el contenido lo escribe un editor y lo guarda Postgres en una
 * columna `jsonb`: la base garantiza que `data` es un objeto, nada más. Todo
 * lo que llega de ahí es `unknown` hasta que se demuestre lo contrario.
 *
 * Cada función devuelve el valor saneado o `null`, nunca lanza. Un bloque mal
 * formado tiene que poder saltarse; no puede tumbar la pantalla de alguien que
 * está buscando cómo hacer una reanimación.
 */

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Cadena con contenido real. Una cadena de espacios no cuenta. */
export const str = (value: unknown, max = 5000): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) return null;
  return trimmed;
};

/** Cadena opcional: ausente es válido, presente tiene que valer. */
export const optStr = (value: unknown, max = 5000): string | null | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return str(value, max);
};

export const num = (value: unknown, min: number, max: number): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
};

export const optNum = (
  value: unknown,
  min: number,
  max: number,
): number | null | undefined => {
  if (value === undefined || value === null) return undefined;
  return num(value, min, max);
};

export const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

/** Valor que debe pertenecer a un conjunto cerrado (los enums de bloque). */
export const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;

export const optOneOf = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null | undefined => {
  if (value === undefined || value === null) return undefined;
  return oneOf(value, allowed);
};

/**
 * Lista cuyos elementos pasan por `parseItem`.
 *
 * Los elementos inválidos se DESCARTAN en lugar de invalidar la lista entera:
 * un paso corrupto entre cinco no debe borrar los otros cuatro. Si tras filtrar
 * no queda ninguno y la lista era obligatoria, el guarda del bloque decide.
 */
export const list = <T>(
  value: unknown,
  parseItem: (item: unknown, index: number) => T | null,
  max = 100,
): T[] => {
  if (!Array.isArray(value)) return [];

  const out: T[] = [];
  for (const [index, raw] of value.slice(0, max).entries()) {
    const parsed = parseItem(raw, index);
    if (parsed !== null) out.push(parsed);
  }
  return out;
};

/**
 * Identificador de un elemento dentro de un bloque.
 *
 * Si falta, se genera uno estable a partir del índice en lugar de rechazar el
 * elemento: el id solo sirve como `key` de React, y perder un paso del
 * protocolo por no tener id sería un mal intercambio.
 */
export const itemId = (value: unknown, index: number, prefix: string): string =>
  str(value, 80) ?? `${prefix}-${index}`;

/** Lista de cadenas. Para `tags` y las cabeceras de una tabla. */
export const strList = (value: unknown, max = 50): string[] =>
  list(value, (item) => str(item, 120), max);

/**
 * URL http(s).
 *
 * Rechaza `javascript:` y `data:` explícitamente: estas URL acaban en el `src`
 * de un `<img>` o un `<iframe>`, y vienen de un campo de texto.
 */
export const httpUrl = (value: unknown): string | null => {
  const raw = str(value, 2000);
  if (raw === null) return null;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
};

/** Número de teléfono. Dígitos, espacios y los signos habituales. */
export const phone = (value: unknown): string | null => {
  const raw = str(value, 24);
  if (raw === null) return null;
  return /^[+()\d\s-]{3,24}$/.test(raw) ? raw : null;
};

/** `slug` en minúsculas separado por guiones. Debe coincidir con el CHECK de Postgres. */
export const slug = (value: unknown): string | null => {
  const raw = str(value, 120);
  if (raw === null) return null;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(raw) ? raw : null;
};
