/**
 * ===========================================================================
 * CONSTANTES DE LA ENCUESTA
 * ===========================================================================
 * Lo que tienen que compartir el bloque público, el repositorio y las
 * estadísticas. Están aquí y no repetidas en cada archivo porque la clave de la
 * opinión es un acuerdo entre tres sitios: si uno escribiera otra cadena, las
 * opiniones se guardarían y nadie las encontraría al leerlas.
 * ===========================================================================
 */

/**
 * Clave de pregunta reservada para la opinión abierta.
 *
 * La opinión se guarda en la MISMA lista de respuestas que las puntuaciones,
 * así que necesita un `questionId` que no pueda chocar con uno real. Los de
 * verdad se generan como `q-<n>-<timestamp>`, de modo que los guiones bajos de
 * los extremos bastan para que no coincidan ni por accidente; el repositorio
 * además descarta cualquier pregunta que intente usar esta clave.
 */
export const SURVEY_OPINION_KEY = '__opinion__';

/** Tope del texto libre. La base lo repite en un `check`: la escritura es pública. */
export const SURVEY_OPINION_MAX_LENGTH = 2000;

/** Lo que se pregunta si el grupo no tiene un texto propio. */
export const SURVEY_OPINION_DEFAULT_LABEL = '¿Quieres contarnos algo más?';
