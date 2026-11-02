import { validationError } from 'modules/shared/utils/errors';

/**
 * ===========================================================================
 * PREPARACIÓN DE IMÁGENES ANTES DE SUBIRLAS
 * ===========================================================================
 * Sin este paso, el administrador sube la foto tal cual sale del móvil —unos
 * 5 MB y 4000 px de ancho— para que luego se pinte en una tarjeta de 400 px.
 * El archivo viajaría entero a cada visitante.
 *
 * Aquí se reduce a un ancho útil y se recomprime a WebP. Una foto de 5 MB baja
 * a unos 180 KB, que es la diferencia entre que la pantalla abra al instante o
 * tarde varios segundos en una conexión móvil.
 * ===========================================================================
 */

/** Ancho máximo. Cubre pantallas de alta densidad sin pasarse. */
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;

/**
 * 0,82 es el punto donde WebP deja de ganar peso perceptible y todavía no se
 * ven artefactos en los degradados, que es lo primero que se estropea.
 */
const QUALITY = 0.82;

/** Límite de entrada. Por encima, el navegador puede quedarse sin memoria. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
  /** Miniatura en base64 para pintar borrosa mientras llega la imagen real. */
  placeholder: string;
}

/** Carga el archivo en un bitmap y libera la URL temporal en cualquier caso. */
const loadBitmap = async (file: File): Promise<ImageBitmap> => {
  // `createImageBitmap` decodifica fuera del hilo principal: con una foto de
  // 12 megapíxeles, hacerlo con un `<img>` congela la interfaz.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return await createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Encaja las dimensiones dentro del límite sin deformar la imagen. */
const fitWithin = (width: number, height: number) => {
  const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const drawToCanvas = (
  source: ImageBitmap,
  width: number,
  height: number,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw validationError('Tu navegador no pudo procesar la imagen.');
  }

  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  return canvas;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob === null
          ? reject(validationError('No pudimos convertir la imagen.'))
          : resolve(blob),
      type,
      quality,
    );
  });

/**
 * Reduce, recomprime y genera el placeholder.
 *
 * El GIF se devuelve intacto: pasarlo por un canvas se quedaría con el primer
 * fotograma y perdería la animación sin avisar.
 */
export const prepareImage = async (file: File): Promise<PreparedImage> => {
  if (!ACCEPTED.includes(file.type)) {
    throw validationError('Formato no admitido. Usa JPG, PNG, WebP o AVIF.');
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw validationError('La imagen pesa más de 25 MB. Redúcela antes de subirla.');
  }

  const bitmap = await loadBitmap(file);

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);

    if (file.type === 'image/gif') {
      return {
        file,
        width: bitmap.width,
        height: bitmap.height,
        placeholder: await buildPlaceholder(bitmap),
      };
    }

    const canvas = drawToCanvas(bitmap, width, height);
    const blob = await canvasToBlob(canvas, 'image/webp', QUALITY);

    /**
     * Si recomprimir no mejora nada —una imagen ya optimizada o muy pequeña—
     * se sube la original. Sustituirla por una versión mayor sería absurdo.
     */
    const useOriginal = blob.size >= file.size && width === bitmap.width;

    return {
      file: useOriginal
        ? file
        : new File([blob], `${stripExtension(file.name)}.webp`, { type: 'image/webp' }),
      width: useOriginal ? bitmap.width : width,
      height: useOriginal ? bitmap.height : height,
      placeholder: await buildPlaceholder(bitmap),
    };
  } finally {
    // Sin esto, cada imagen preparada deja su bitmap descodificado en memoria.
    bitmap.close();
  }
};

/**
 * Miniatura de 20 px de ancho en base64. Unos 400 bytes: cabe en el `jsonb`
 * del bloque sin coste y evita el salto de maquetación mientras carga la real.
 */
const buildPlaceholder = async (bitmap: ImageBitmap): Promise<string> => {
  const width = 20;
  const height = Math.max(1, Math.round((bitmap.height / bitmap.width) * width));

  try {
    const canvas = drawToCanvas(bitmap, width, height);
    const blob = await canvasToBlob(canvas, 'image/webp', 0.5);
    return await blobToDataUrl(blob);
  } catch {
    // El placeholder es una mejora, no un requisito: si falla, se sube sin él.
    return '';
  }
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(validationError('No pudimos leer la imagen.'));
    reader.readAsDataURL(blob);
  });

const stripExtension = (name: string) => name.replace(/\.[^./\\]+$/, '') || 'imagen';

/**
 * Nombre del archivo en el bucket.
 *
 * Agrupado por módulo para poder borrar su carpeta entera al eliminarlo, y con
 * un identificador aleatorio para que dos fotos llamadas `IMG_0001.jpg` no se
 * pisen. El nombre original no se conserva: puede traer acentos, espacios y
 * barras que rompen las rutas de Storage.
 */
export const buildStoragePath = (moduleId: string | null, file: File): string => {
  const extension = file.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'bin');
  const unique = crypto.randomUUID();
  const folder = moduleId ?? 'sin-modulo';
  return `modules/${folder}/${unique}.${extension.toLowerCase()}`;
};
