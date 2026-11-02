/**
 * Traduce una URL de vídeo a su dirección de incrustación.
 *
 * Lista CERRADA de proveedores, no la URL tal cual en el `src` de un
 * `<iframe>`. Esa URL la escribe una persona en un campo de texto, y un iframe
 * de origen arbitrario puede intentar navegar la página que lo contiene.
 *
 * Vive aquí, fuera del componente, porque la necesitan dos: el bloque para
 * pintar y el formulario para avisar de que un enlace no vale ANTES de
 * guardarlo. Duplicarla dejaría al formulario aceptando enlaces que el bloque
 * luego no sabría mostrar.
 *
 * Devuelve `null` si el proveedor no está reconocido.
 */
export const toEmbedUrl = (raw: string): string | null => {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // `/watch?v=ID` es la forma larga; `/embed/ID` ya viene lista.
    const id = url.searchParams.get('v') ?? url.pathname.replace('/embed/', '');
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
};

/** Nombre del proveedor, para decirle al administrador qué ha reconocido. */
export const embedProvider = (raw: string): 'YouTube' | 'Vimeo' | null => {
  const embed = toEmbedUrl(raw);
  if (embed === null) return null;
  return embed.includes('youtube') ? 'YouTube' : 'Vimeo';
};
