import { useRef, useState, type ChangeEvent } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useAppDispatch } from 'modules/shared/store/hooks';
import Button from 'modules/shared/components/atoms/Button/Button';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { uploadMedia } from 'modules/dynamic-content/store/dynamicSlice';
import './VideoUploadField.scss';

export interface VideoUploadResult {
  url: string;
  mediaId: string | null;
  width?: number;
  height?: number;
}

export interface VideoUploadFieldProps {
  url: string;
  moduleId: string;
  onChange: (result: VideoUploadResult) => void;
  onRemove: () => void;
  /** Avisa de cada archivo subido, para poder descartarlo si no se usa. */
  onUploaded?: (mediaId: string) => void;
}

/**
 * Sube un vídeo a Storage.
 *
 * A diferencia de las imágenes, el archivo NO se recomprime: reconvertir vídeo
 * en el navegador exigiría WebCodecs o un ffmpeg en WASM, que son megabytes de
 * código y minutos de proceso. Solo se comprueba el formato, se mide y se
 * sube, y el tope está en 50 MB.
 */
const VideoUploadField = ({
  url,
  moduleId,
  onChange,
  onRemove,
  onUploaded,
}: VideoUploadFieldProps) => {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const result = await dispatch(uploadMedia({ file, moduleId, alt: '' }));

    setIsUploading(false);

    // El input no dispara `change` con el mismo archivo dos veces: vaciarlo
    // permite reintentar tras un fallo sin elegir otro primero.
    if (inputRef.current !== null) inputRef.current.value = '';

    if (uploadMedia.fulfilled.match(result)) {
      const asset = result.payload;

      // Un vídeo son megabytes: es el archivo que más urge no dejar olvidado.
      onUploaded?.(asset.id);

      onChange({
        url: asset.publicUrl,
        mediaId: asset.id,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
      });
      return;
    }

    setError(
      typeof result.payload === 'string'
        ? result.payload
        : 'No pudimos subir el vídeo. Intenta de nuevo.',
    );
  };

  return (
    <div className="video-upload">
      <FormField label="Archivo de vídeo" required>
        <div className="video-upload__preview">
          {isUploading ? (
            <Spinner size="md" label="Subiendo vídeo" />
          ) : url ? (
            // `preload="metadata"` para que la previsualización del editor no
            // descargue el archivo entero cada vez que se abre el formulario.
            <video className="video-upload__video" src={url} controls preload="metadata" />
          ) : (
            <span className="video-upload__empty">
              <Upload aria-hidden="true" />
              <span className="video-upload__empty-text">
                MP4, WebM u OGG.
                <br />
                Máximo 50 MB.
              </span>
            </span>
          )}
        </div>
      </FormField>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <div className="video-upload__actions">
        <input
          ref={inputRef}
          className="video-upload__input"
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={handleFile}
          disabled={isUploading}
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconStart={<Upload />}
          loading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {url ? 'Cambiar vídeo' : 'Elegir vídeo'}
        </Button>

        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconStart={<Trash2 />}
            onClick={onRemove}
            disabled={isUploading}
          >
            Quitar
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoUploadField;
