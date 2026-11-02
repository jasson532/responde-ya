import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { ImageUp, Link2, Trash2 } from 'lucide-react';
import { useAppDispatch } from 'modules/shared/store/hooks';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { uploadMedia } from 'modules/dynamic-content/store/dynamicSlice';
import type { MediaRef } from 'modules/dynamic-content/types/blocks.types';
import './ImageUploadField.scss';

export interface ImageUploadFieldProps {
  media: MediaRef | null;
  onChange: (media: MediaRef) => void;
  onRemove?: () => void;
  moduleId: string;
  label?: string;
  /** Avisa de cada archivo subido, para poder descartarlo si no se usa. */
  onUploaded?: (mediaId: string) => void;
}

/** De dónde sale la imagen. */
type Source = 'upload' | 'url';

const SOURCE_OPTIONS = [
  { value: 'upload', label: 'Subir desde mi equipo' },
  { value: 'url', label: 'Pegar la dirección de una imagen' },
];

/**
 * Comprueba que una URL apunte de verdad a una imagen y devuelve su tamaño.
 *
 * Cargarla en memoria sirve para dos cosas: confirmar que existe —una
 * dirección bien escrita que da 404 se detecta aquí y no en la pantalla
 * pública— y leer sus dimensiones reales.
 *
 * Las dimensiones importan: son lo que permite reservar el hueco en el `<img>`
 * para que el texto de debajo no salte al acabar de cargar. Con una imagen
 * subida las sabemos porque las mide el redimensionado; con una externa, no.
 *
 * No usa `canvas`, así que no necesita cabeceras CORS del otro servidor.
 */
const probeImage = (url: string) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    const image = new Image();
    const timer = setTimeout(() => resolve(null), 10000);

    image.onload = () => {
      clearTimeout(timer);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    image.src = url;
  });

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Elige la imagen de un bloque: subiéndola a Storage o pegando una dirección.
 *
 * Subir es lo recomendado y el modo por defecto: el archivo queda en nuestro
 * bucket, se sirve por CDN y se reduce antes de viajar. Una dirección externa
 * es cómoda para reutilizar algo ya publicado, pero depende de un servidor que
 * no controlamos y puede dejar de responder cualquier día.
 */
const ImageUploadField = ({
  media,
  onChange,
  onRemove,
  moduleId,
  label = 'Imagen',
  onUploaded,
}: ImageUploadFieldProps) => {
  const dispatch = useAppDispatch();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * El modo se deduce de lo que ya hay: con `mediaId` la imagen está en
   * Storage; con URL pero sin id, es externa. Así al reabrir el formulario
   * aparece el modo con el que se configuró.
   */
  const [source, setSource] = useState<Source>(() =>
    media?.url && media.mediaId === null ? 'url' : 'upload',
  );

  const [urlDraft, setUrlDraft] = useState(media?.mediaId === null ? (media?.url ?? '') : '');
  const [isUploading, setIsUploading] = useState(false);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Subida ---

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const result = await dispatch(
      uploadMedia({ file, moduleId, alt: media?.alt ?? '' }),
    );

    setIsUploading(false);

    /**
     * El `<input type="file">` no dispara `change` si se elige el MISMO
     * archivo dos veces seguidas. Vaciarlo permite reintentar tras un fallo
     * sin tener que elegir otro archivo primero.
     */
    if (inputRef.current !== null) inputRef.current.value = '';

    if (uploadMedia.fulfilled.match(result)) {
      const asset = result.payload;

      /**
       * El aviso va ANTES de entregar la imagen. El archivo ya está en el
       * bucket: desde este instante alguien tiene que saber que existe para
       * poder descartarlo si el formulario se cancela.
       */
      onUploaded?.(asset.id);

      onChange({
        mediaId: asset.id,
        url: asset.publicUrl,
        alt: media?.alt ?? '',
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
      });
      return;
    }

    setError(
      typeof result.payload === 'string'
        ? result.payload
        : 'No pudimos subir la imagen. Intenta de nuevo.',
    );
  };

  // --- Dirección externa ---

  /**
   * La dirección se comprueba con 700 ms de retardo tras dejar de escribir.
   *
   * Sin el retardo, cada carácter pegado lanzaría una carga de imagen, y al
   * escribir una URL larga el campo se llenaría de errores de direcciones a
   * medio escribir.
   */
  useEffect(() => {
    if (source !== 'url') return;

    const trimmed = urlDraft.trim();

    if (trimmed === '') {
      setError(null);
      return;
    }

    if (!isHttpUrl(trimmed)) {
      setError('La dirección debe empezar por http:// o https://');
      return;
    }

    let cancelled = false;
    setError(null);

    const timer = setTimeout(async () => {
      setIsProbing(true);
      const size = await probeImage(trimmed);
      if (cancelled) return;

      setIsProbing(false);

      if (size === null) {
        setError('No pudimos cargar esa imagen. Comprueba que la dirección es pública.');
        return;
      }

      onChange({
        // Sin `mediaId`: no hay archivo nuestro que limpiar después.
        mediaId: null,
        url: trimmed,
        alt: media?.alt ?? '',
        width: size.width,
        height: size.height,
      });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `media.alt` fuera a propósito: escribir el texto alternativo no debe
    // volver a comprobar la dirección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDraft, source]);

  const handleSourceChange = (next: Source) => {
    setSource(next);
    setError(null);
    // La referencia se limpia al cambiar de modo: dejar la imagen anterior
    // mientras el selector dice otra cosa haría dudar de qué se va a guardar.
    if (media?.url) onRemove?.();
    if (next === 'upload') setUrlDraft('');
  };

  const isBusy = isUploading || isProbing;

  return (
    <div className="image-upload">
      <FormField label="Origen de la imagen">
        <Select
          options={SOURCE_OPTIONS}
          value={source}
          onChange={(event) => handleSourceChange(event.target.value as Source)}
        />
      </FormField>

      <FormField label={label} required>
        <div className="image-upload__preview">
          {isBusy ? (
            <Spinner size="md" label={isUploading ? 'Subiendo imagen' : 'Comprobando'} />
          ) : media?.url ? (
            <img className="image-upload__img" src={media.url} alt="" />
          ) : (
            <span className="image-upload__empty">
              {source === 'upload' ? <ImageUp aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              <span className="image-upload__empty-text">
                {source === 'upload' ? (
                  <>
                    Elige una imagen de tu equipo.
                    <br />
                    Se reduce y optimiza sola antes de subirse.
                  </>
                ) : (
                  <>
                    Pega la dirección de una imagen pública.
                    <br />
                    Se comprobará antes de guardarla.
                  </>
                )}
              </span>
            </span>
          )}
        </div>
      </FormField>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      {source === 'upload' ? (
        <div className="image-upload__actions">
          {/* El input nativo va oculto y el botón lo dispara: el control de
              archivo no se puede estilar, y así mantiene el foco por teclado. */}
          <input
            ref={inputRef}
            id={inputId}
            className="image-upload__input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={handleFile}
            disabled={isBusy}
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconStart={<ImageUp />}
            loading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {media?.url ? 'Cambiar imagen' : 'Elegir imagen'}
          </Button>

          {media?.url && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconStart={<Trash2 />}
              onClick={onRemove}
              disabled={isBusy}
            >
              Quitar
            </Button>
          )}
        </div>
      ) : (
        <FormField
          label="Dirección de la imagen"
          hint="Depende de un servidor que no controlamos: si esa imagen se mueve o se borra, aquí dejará de verse."
        >
          <Input
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            spellCheck={false}
          />
        </FormField>
      )}

      {media?.url && (
        <>
          <FormField
            label="Texto alternativo"
            hint="Describe qué se ve, para quien no puede verla. Déjalo vacío solo si la imagen es decorativa."
          >
            <Input
              value={media.alt}
              onChange={(event) => onChange({ ...media, alt: event.target.value })}
              placeholder="Una persona comprimiendo el centro del pecho"
            />
          </FormField>

          {media.width && media.height && (
            <p className="image-upload__meta">
              {media.width} × {media.height} px
              {media.mediaId === null ? ' · imagen externa' : ' · subida al proyecto'}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUploadField;
