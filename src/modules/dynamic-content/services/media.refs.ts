/**
 * ===========================================================================
 * QUÉ ARCHIVOS USA UN BLOQUE
 * ===========================================================================
 * El contenido de un bloque vive en una columna `jsonb` y cada tipo lo
 * organiza a su manera. Hoy hay cuatro sitios distintos donde puede aparecer
 * una referencia a un archivo del bucket:
 *
 *   image    → data.media.mediaId
 *   gallery  → data.items[].mediaId
 *   embed    → data.mediaId
 *   steps    → data.steps[].media.mediaId
 *
 * Enumerar esas cuatro rutas sería más explícito y bastante peor: el día que
 * un tipo nuevo guarde una imagen, su archivo dejaría de limpiarse y nadie se
 * daría cuenta hasta que el almacenamiento se llene. Recorrer el objeto
 * buscando la clave `mediaId` cubre los cuatro de hoy y los que vengan.
 *
 * El recorrido es seguro porque `data` siempre viene de un `jsonb` o de un
 * formulario: son objetos planos, sin ciclos ni prototipos.
 * ===========================================================================
 */

/** Nombre de la clave que referencia un archivo. No se renombra: está en la BD. */
const MEDIA_KEY = 'mediaId';

const walk = (node: unknown, found: Set<string>): void => {
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, found));
    return;
  }

  if (typeof node !== 'object' || node === null) return;

  Object.entries(node).forEach(([key, value]) => {
    // Una referencia vacía o `null` significa «sin archivo»: las imágenes
    // externas por URL guardan `mediaId: null` precisamente para eso.
    if (key === MEDIA_KEY) {
      if (typeof value === 'string' && value.trim() !== '') found.add(value);
      return;
    }

    walk(value, found);
  });
};

/** Identificadores de archivo que aparecen en el contenido, a cualquier nivel. */
export const collectMediaIds = (data: unknown): string[] => {
  const found = new Set<string>();
  walk(data, found);
  return [...found];
};

/**
 * Archivos que estaban en el contenido anterior y ya no están en el nuevo.
 *
 * Es lo que hay que borrar del bucket al guardar una edición: cambiar la
 * imagen de un bloque no borra la anterior por sí solo, y sin este cálculo
 * cada cambio de imagen dejaría un archivo pagando sitio para siempre.
 */
export const removedMediaIds = (before: unknown, after: unknown): string[] => {
  const kept = new Set(collectMediaIds(after));
  return collectMediaIds(before).filter((id) => !kept.has(id));
};
