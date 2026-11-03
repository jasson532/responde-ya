import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import {
  BlockTone,
  type CalloutData,
  type ChecklistData,
  type EmbedData,
  type HeadingData,
  type ImageData,
  type KeyPointsData,
  type MetronomeData,
  type PageLinksData,
  type StatsData,
  type StepsData,
  type SurveyChart,
  type SurveyData,
  type SurveyStatsData,
  type TextData,
} from 'modules/dynamic-content/types/blocks.types';
import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import { embedProvider } from 'modules/dynamic-content/services/embed';
import ItemListEditor from '../ItemListEditor/ItemListEditor';
import ImageUploadField from '../ImageUploadField/ImageUploadField';
import SurveyGroupField from '../SurveyGroupField/SurveyGroupField';
import VideoUploadField from '../VideoUploadField/VideoUploadField';

/**
 * ===========================================================================
 * FORMULARIOS POR TIPO DE COMPONENTE
 * ===========================================================================
 * Cada uno recibe sus datos y un `onChange` que devuelve los datos completos.
 * No guardan estado propio: el estado vive en `BlockFormModal`, que es quien
 * sabe si hay cambios sin guardar.
 *
 * Están juntos en un archivo porque son formularios de cinco a veinte líneas
 * cada uno. Diecisiete carpetas con un `<Input>` dentro serían andamiaje.
 * ===========================================================================
 */

export interface BlockFormProps<T> {
  data: T;
  onChange: (data: T) => void;
  /** Páginas del módulo. Solo las necesita el índice. */
  pages?: Page[];
  /** Módulo al que pertenece. Lo necesitan los que suben archivos. */
  moduleId?: string;
  /**
   * Avisa de cada archivo subido desde este formulario.
   *
   * El aviso sube hasta el diálogo porque solo él sabe cuándo termina la
   * edición, que es el momento en que se puede decidir qué subidas sobran.
   * Sin esto, elegir una imagen y cancelar dejaría el archivo en el bucket
   * para siempre.
   */
  onUploaded?: (mediaId: string) => void;
}

const TONE_OPTIONS = [
  { value: BlockTone.Neutral, label: 'Neutro — gris' },
  { value: BlockTone.Info, label: 'Información — azul' },
  { value: BlockTone.Success, label: 'Correcto — verde' },
  { value: BlockTone.Warning, label: 'Atención — ámbar' },
  { value: BlockTone.Danger, label: 'Peligro — rojo' },
];

const ALIGN_OPTIONS = [
  { value: 'start', label: 'Izquierda' },
  { value: 'center', label: 'Centrado' },
];

// ---------------------------------------------------------------------------
// Título
// ---------------------------------------------------------------------------

export const HeadingForm = ({ data, onChange }: BlockFormProps<HeadingData>) => (
  <>
    <FormField label="Texto" required>
      <Input
        value={data.text}
        onChange={(event) => onChange({ ...data, text: event.target.value })}
        autoFocus
      />
    </FormField>

    <FormField
      label="Nivel"
      hint="El nivel 2 es un apartado; el 3, una subdivisión dentro de él."
    >
      <Select
        options={[
          { value: '2', label: 'Nivel 2 — apartado' },
          { value: '3', label: 'Nivel 3 — subapartado' },
        ]}
        value={String(data.level)}
        onChange={(event) =>
          onChange({ ...data, level: event.target.value === '3' ? 3 : 2 })
        }
      />
    </FormField>

    <FormField label="Alineación">
      <Select
        options={ALIGN_OPTIONS}
        value={data.align ?? 'start'}
        onChange={(event) =>
          onChange({ ...data, align: event.target.value as 'start' | 'center' })
        }
      />
    </FormField>
  </>
);

// ---------------------------------------------------------------------------
// Párrafo
// ---------------------------------------------------------------------------

export const TextForm = ({ data, onChange }: BlockFormProps<TextData>) => (
  <>
    <FormField label="Texto" required>
      <Textarea
        rows={6}
        value={data.text}
        onChange={(event) => onChange({ ...data, text: event.target.value })}
        autoFocus
      />
    </FormField>

    <FormField
      label="Estilo"
      hint="«Entradilla» lo pinta algo más grande. Úsalo para el primer párrafo."
    >
      <Select
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'lead', label: 'Entradilla' },
        ]}
        value={data.isLead ? 'lead' : 'normal'}
        onChange={(event) => onChange({ ...data, isLead: event.target.value === 'lead' })}
      />
    </FormField>

    <FormField label="Alineación">
      <Select
        options={ALIGN_OPTIONS}
        value={data.align ?? 'start'}
        onChange={(event) =>
          onChange({ ...data, align: event.target.value as 'start' | 'center' })
        }
      />
    </FormField>
  </>
);

// ---------------------------------------------------------------------------
// Separador
// ---------------------------------------------------------------------------

export const DividerForm = () => (
  <p className="block-form__note">
    Este componente no tiene opciones. Dibuja una línea para separar partes de la
    página.
  </p>
);

// ---------------------------------------------------------------------------
// Aviso
// ---------------------------------------------------------------------------

export const CalloutForm = ({ data, onChange }: BlockFormProps<CalloutData>) => (
  <>
    <FormField label="Tono" hint="Define el color y el icono del recuadro.">
      <Select
        options={TONE_OPTIONS}
        value={data.tone}
        onChange={(event) => onChange({ ...data, tone: event.target.value as BlockTone })}
      />
    </FormField>

    <FormField label="Título" hint="Opcional.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <FormField label="Texto" required>
      <Textarea
        rows={4}
        value={data.text}
        onChange={(event) => onChange({ ...data, text: event.target.value })}
      />
    </FormField>
  </>
);

// ---------------------------------------------------------------------------
// Cifras
// ---------------------------------------------------------------------------

export const StatsForm = ({ data, onChange }: BlockFormProps<StatsData>) => (
  <>
    <FormField label="Título" hint="Opcional. Se lee sobre las cifras.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <ItemListEditor
      label="Cifras"
      hint="Máximo tres o cuatro: con más dejan de leerse de un vistazo."
      items={data.stats}
      onChange={(stats) => onChange({ ...data, stats })}
      createItem={(index) => ({ id: `st-${index + 1}-${Date.now()}`, value: '', label: '' })}
      addLabel="Añadir cifra"
      maxItems={6}
      renderItem={(stat, update) => (
        <>
          <FormField label="Cifra" required>
            <Input
              value={stat.value}
              onChange={(event) => update({ value: event.target.value })}
              placeholder="100-120"
            />
          </FormField>
          <FormField label="Qué mide">
            <Input
              value={stat.label}
              onChange={(event) => update({ label: event.target.value })}
              placeholder="compresiones por minuto"
            />
          </FormField>
        </>
      )}
    />
  </>
);

// ---------------------------------------------------------------------------
// Fichas con icono
// ---------------------------------------------------------------------------

export const KeyPointsForm = ({ data, onChange }: BlockFormProps<KeyPointsData>) => (
  <>
    <FormField label="Título" hint="Opcional. Ej. «Identifica estas señales».">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <ItemListEditor
      label="Fichas"
      items={data.points}
      onChange={(points) => onChange({ ...data, points })}
      createItem={(index) => ({
        id: `kp-${index + 1}-${Date.now()}`,
        tone: BlockTone.Info,
        title: '',
        detail: '',
      })}
      addLabel="Añadir ficha"
      renderItem={(point, update) => (
        <>
          <FormField label="Titular" required>
            <Input
              value={point.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="No responde"
            />
          </FormField>
          <FormField label="Detalle">
            <Textarea
              rows={2}
              value={point.detail}
              onChange={(event) => update({ detail: event.target.value })}
              placeholder="No reacciona al hablarle o tocar sus hombros."
            />
          </FormField>
          <FormField label="Tono">
            <Select
              options={TONE_OPTIONS}
              value={point.tone}
              onChange={(event) => update({ tone: event.target.value as BlockTone })}
            />
          </FormField>
        </>
      )}
    />
  </>
);

// ---------------------------------------------------------------------------
// Metrónomo
// ---------------------------------------------------------------------------

export const MetronomeForm = ({ data, onChange }: BlockFormProps<MetronomeData>) => (
  <>
    <FormField
      label="Pulsaciones por minuto"
      hint="Entre 30 y 220. Para reanimación de adulto, entre 100 y 120."
      required
    >
      <Input
        type="number"
        min={30}
        max={220}
        value={String(data.beatsPerMinute)}
        onChange={(event) =>
          onChange({ ...data, beatsPerMinute: Number(event.target.value) || 110 })
        }
      />
    </FormField>

    <FormField label="Título" hint="Opcional.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <FormField label="Pie" hint="Opcional. Una línea bajo el pulso.">
      <Input
        value={data.hint ?? ''}
        onChange={(event) => onChange({ ...data, hint: event.target.value })}
      />
    </FormField>

    <FormField
      label="Avisar de relevo cada (segundos)"
      hint="Déjalo vacío para no avisar. Las guías recomiendan 120."
    >
      <Input
        type="number"
        min={10}
        max={600}
        value={data.relaySeconds === undefined ? '' : String(data.relaySeconds)}
        onChange={(event) =>
          onChange({
            ...data,
            relaySeconds:
              event.target.value === '' ? undefined : Number(event.target.value),
          })
        }
      />
    </FormField>
  </>
);

// ---------------------------------------------------------------------------
// Índice de páginas
// ---------------------------------------------------------------------------

export const PageLinksForm = ({
  data,
  onChange,
  pages = [],
}: BlockFormProps<PageLinksData>) => {
  /**
   * Las páginas se eligen de una lista, no se escribe su identificador.
   *
   * La ficha guarda un `pageId`, y pedirle a alguien que copie un UUID es
   * pedirle que se equivoque. Se excluye la portada: el índice vive EN la
   * portada, y una ficha que lleva a la pantalla donde ya estás no sirve.
   */
  const options = [
    { value: '', label: 'Elige una página…' },
    ...pages
      .filter((page) => !page.isHome)
      .map((page) => ({ value: page.id, label: page.title })),
  ];

  return (
    <>
      <FormField label="Título" hint="Opcional. Ej. «Aprende paso a paso».">
        <Input
          value={data.title ?? ''}
          onChange={(event) => onChange({ ...data, title: event.target.value })}
        />
      </FormField>

      <FormField label="Estilo">
        <Select
          options={[
            { value: 'numbered', label: 'Numerado — 01, 02, 03' },
            { value: 'plain', label: 'Con icono' },
          ]}
          value={data.variant ?? 'numbered'}
          onChange={(event) =>
            onChange({ ...data, variant: event.target.value as 'numbered' | 'plain' })
          }
        />
      </FormField>

      <FormField
        label="Qué páginas lista"
        hint="En automático se mantiene al día: al crear o reordenar páginas, el índice las recoge sin que tengas que volver aquí."
      >
        <Select
          options={[
            { value: 'auto', label: 'Todas las páginas, automáticamente' },
            { value: 'manual', label: 'Solo las que yo elija' },
          ]}
          value={data.source ?? 'auto'}
          onChange={(event) =>
            onChange({ ...data, source: event.target.value as 'auto' | 'manual' })
          }
        />
      </FormField>

      {(data.source ?? 'auto') === 'auto' ? (
        <p className="block-form__note">
          {options.length === 1
            ? 'Listará las páginas de este módulo en cuanto crees alguna más, aparte de la portada.'
            : `Listará las ${options.length - 1} páginas de este módulo, en su orden actual.`}
        </p>
      ) : options.length === 1 ? (
        <p className="block-form__note">
          Este módulo todavía no tiene más páginas a las que enlazar. Crea primero las
          páginas, o déjalo en automático.
        </p>
      ) : (
        <ItemListEditor
          label="Fichas"
          hint="Cada una lleva a una página de este módulo."
          items={data.items}
          onChange={(items) => onChange({ ...data, items })}
          createItem={(index) => ({
            id: `lnk-${index + 1}-${Date.now()}`,
            pageId: '',
          })}
          addLabel="Añadir ficha"
          minItems={0}
          renderItem={(item, update) => (
            <>
              <FormField label="Página de destino" required>
                <Select
                  options={options}
                  value={item.pageId}
                  onChange={(event) => update({ pageId: event.target.value })}
                />
              </FormField>
              <FormField
                label="Texto"
                hint="Opcional. Si lo dejas vacío usa el título de la página."
              >
                <Input
                  value={item.label ?? ''}
                  onChange={(event) => update({ label: event.target.value })}
                />
              </FormField>
            </>
          )}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Imagen
// ---------------------------------------------------------------------------

export const ImageForm = ({
  data,
  onChange,
  moduleId = '',
  onUploaded,
}: BlockFormProps<ImageData>) => (
  <>
    <ImageUploadField
      media={data.media.url === '' ? null : data.media}
      moduleId={moduleId}
      onChange={(media) => onChange({ ...data, media })}
      onUploaded={onUploaded}
      /**
       * Quitar solo vacía la referencia aquí; el archivo lo borra quien sabe
       * si de verdad ha dejado de usarse. Si se había subido en este mismo
       * formulario, lo descarta el diálogo al cerrarse; si ya estaba guardado,
       * lo borra el repositorio al guardar el bloque sin ella. Hacerlo en este
       * `onRemove` borraría el archivo de un bloque que todavía lo usa en
       * cuanto alguien cancelara.
       */
      onRemove={() =>
        onChange({ ...data, media: { mediaId: null, url: '', alt: '' } })
      }
    />

    <FormField label="Pie de foto" hint="Opcional. Se lee bajo la imagen.">
      <Input
        value={data.caption ?? ''}
        onChange={(event) => onChange({ ...data, caption: event.target.value })}
      />
    </FormField>

    <FormField
      label="Encaje"
      hint="«Completa» respeta la proporción; «Recortada» la ajusta al marco."
    >
      <Select
        options={[
          { value: 'contain', label: 'Completa — se ve toda' },
          { value: 'cover', label: 'Recortada — llena el marco' },
        ]}
        value={data.fit ?? 'contain'}
        onChange={(event) =>
          onChange({ ...data, fit: event.target.value as 'contain' | 'cover' })
        }
      />
    </FormField>

    {/* Tamaño de visualización. Los dos campos vacíos dejan el comportamiento
        por defecto: la imagen ocupa el ancho disponible. */}
    <FormField
      label="Ancho en pantalla (px)"
      hint="Déjalo vacío para que ocupe todo el ancho. En pantallas estrechas se reduce solo, nunca desborda."
    >
      <Input
        type="number"
        min={16}
        max={4000}
        value={data.displayWidth === undefined ? '' : String(data.displayWidth)}
        onChange={(event) =>
          onChange({
            ...data,
            displayWidth:
              event.target.value === '' ? undefined : Number(event.target.value),
          })
        }
        placeholder={data.media.width ? `original: ${data.media.width}` : 'auto'}
      />
    </FormField>

    <FormField
      label="Alto en pantalla (px)"
      hint="Déjalo vacío para que lo calcule según el ancho y no se deforme."
    >
      <Input
        type="number"
        min={16}
        max={4000}
        value={data.displayHeight === undefined ? '' : String(data.displayHeight)}
        onChange={(event) =>
          onChange({
            ...data,
            displayHeight:
              event.target.value === '' ? undefined : Number(event.target.value),
          })
        }
        placeholder={data.media.height ? `original: ${data.media.height}` : 'auto'}
      />
    </FormField>

    {data.displayWidth !== undefined && data.displayHeight !== undefined && (
      <p className="block-form__note">
        Con ancho y alto fijos la imagen puede deformarse. Si no quieres que pase, deja
        uno de los dos vacío, o usa el encaje «Recortada» para que recorte en vez de
        estirar.
      </p>
    )}
  </>
);

// ---------------------------------------------------------------------------
// Vídeo
// ---------------------------------------------------------------------------

export const EmbedForm = ({
  data,
  onChange,
  moduleId = '',
  onUploaded,
}: BlockFormProps<EmbedData>) => {
  const source = data.source ?? 'provider';

  /**
   * Se comprueba el proveedor MIENTRAS se escribe, no al guardar.
   *
   * El bloque solo sabe incrustar YouTube y Vimeo; con cualquier otro enlace
   * pinta un enlace de texto. Avisarlo aquí evita que alguien pegue una URL de
   * Drive, guarde, y descubra en la pantalla pública que no se ve el vídeo.
   */
  const provider = data.url.trim() === '' ? null : embedProvider(data.url);
  const isUnknown = source === 'provider' && data.url.trim() !== '' && provider === null;

  return (
    <>
      <FormField label="Origen del vídeo">
        <Select
          options={[
            { value: 'provider', label: 'Enlace de YouTube o Vimeo' },
            { value: 'file', label: 'Subir un archivo desde mi equipo' },
          ]}
          value={source}
          onChange={(event) =>
            onChange({
              ...data,
              source: event.target.value as 'provider' | 'file',
              // Al cambiar de origen se limpia la referencia: dejar la
              // anterior mientras el selector dice otra cosa haría dudar de
              // qué se va a guardar.
              url: '',
              mediaId: null,
              width: undefined,
              height: undefined,
            })
          }
        />
      </FormField>

      {source === 'provider' ? (
        <>
          <FormField
            label="Enlace del vídeo"
            hint="Pega la dirección de YouTube o Vimeo tal como aparece en el navegador."
            error={isUnknown ? 'No reconocemos ese enlace.' : null}
            required
          >
            <Input
              value={data.url}
              onChange={(event) => onChange({ ...data, url: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
          </FormField>

          {provider !== null && (
            <p className="block-form__note">Reconocido: vídeo de {provider}.</p>
          )}

          {isUnknown && (
            <p className="block-form__note">
              Solo se pueden incrustar vídeos de YouTube y Vimeo. Con otro enlace, en la
              página se mostrará un enlace de texto en lugar del reproductor.
            </p>
          )}
        </>
      ) : (
        <>
          <VideoUploadField
            url={data.url}
            moduleId={moduleId}
            onUploaded={onUploaded}
            onChange={({ url, mediaId, width, height }) =>
              onChange({ ...data, url, mediaId, width, height })
            }
            onRemove={() =>
              onChange({
                ...data,
                url: '',
                mediaId: null,
                width: undefined,
                height: undefined,
              })
            }
          />

          <p className="block-form__note">
            Un archivo propio lo descarga cada visitante entero, sin versiones de
            distinta calidad como en YouTube. Para vídeos de más de unos segundos
            conviene subirlos a YouTube y pegar el enlace.
          </p>
        </>
      )}

      <FormField
        label="Título"
        hint="Describe el vídeo. Se lee debajo y lo usan los lectores de pantalla."
        required
      >
        <Input
          value={data.title}
          onChange={(event) => onChange({ ...data, title: event.target.value })}
          placeholder="Cómo hacer compresiones torácicas"
        />
      </FormField>
    </>
  );
};

// ---------------------------------------------------------------------------
// Pasos numerados
// ---------------------------------------------------------------------------

export const StepsForm = ({ data, onChange }: BlockFormProps<StepsData>) => (
  <>
    <FormField label="Título" hint="Opcional. Se lee sobre la secuencia.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <ItemListEditor
      label="Pasos"
      hint="Se numeran solos en el orden de esta lista."
      items={data.steps}
      onChange={(steps) => onChange({ ...data, steps })}
      createItem={(index) => ({
        id: `stp-${index + 1}-${Date.now()}`,
        title: '',
        description: '',
      })}
      addLabel="Añadir paso"
      maxItems={30}
      renderItem={(step, update) => (
        <>
          <FormField label="Qué hacer" required>
            <Input
              value={step.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Comprueba si responde"
            />
          </FormField>

          <FormField label="Detalle">
            <Textarea
              rows={2}
              value={step.description}
              onChange={(event) => update({ description: event.target.value })}
              placeholder="Sacude sus hombros y llámala en voz alta."
            />
          </FormField>

          <FormField
            label="Duración en segundos"
            hint="Opcional. Para pasos que hay que mantener un tiempo."
          >
            <Input
              type="number"
              min={1}
              max={3600}
              value={step.durationSeconds === undefined ? '' : String(step.durationSeconds)}
              onChange={(event) =>
                update({
                  durationSeconds:
                    event.target.value === '' ? undefined : Number(event.target.value),
                })
              }
            />
          </FormField>
        </>
      )}
    />
  </>
);

// ---------------------------------------------------------------------------
// Lista para marcar
// ---------------------------------------------------------------------------

export const ChecklistForm = ({ data, onChange }: BlockFormProps<ChecklistData>) => (
  <>
    <FormField label="Título" hint="Opcional. Ej. «Antes de empezar».">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
    </FormField>

    <ItemListEditor
      label="Puntos"
      hint="Quien lee los va marcando mientras actúa, así que conviene que sean acciones."
      items={data.items}
      onChange={(items) => onChange({ ...data, items })}
      createItem={(index) => ({ id: `chk-${index + 1}-${Date.now()}`, text: '' })}
      addLabel="Añadir punto"
      maxItems={30}
      renderItem={(item, update) => (
        <FormField label="Texto" required>
          <Input
            value={item.text}
            onChange={(event) => update({ text: event.target.value })}
            placeholder="Comprueba que la zona es segura"
          />
        </FormField>
      )}
    />
  </>
);

// ---------------------------------------------------------------------------
// Encuesta de 1 a 5
// ---------------------------------------------------------------------------

export const SurveyForm = ({ data, onChange }: BlockFormProps<SurveyData>) => (
  <>
    <SurveyGroupField
      value={data.groupId}
      onChange={(groupId) => onChange({ ...data, groupId })}
    />

    <FormField label="Título" hint="Opcional. Se lee sobre las preguntas.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
        placeholder="¿Qué te ha parecido este módulo?"
      />
    </FormField>

    <FormField label="Introducción" hint="Opcional. Una o dos líneas antes de la escala.">
      <Textarea
        rows={2}
        value={data.intro ?? ''}
        onChange={(event) => onChange({ ...data, intro: event.target.value })}
        placeholder="Tus respuestas son anónimas y nos ayudan a mejorar."
      />
    </FormField>

    {/* Las etiquetas son del grupo entero, no de cada pregunta: una escala que
        cambiara de significado entre preguntas no se podría agregar. */}
    <FormField label="Qué significa el 1" required>
      <Input
        value={data.lowLabel}
        onChange={(event) => onChange({ ...data, lowLabel: event.target.value })}
        placeholder="Muy en desacuerdo"
      />
    </FormField>

    <FormField label="Qué significa el 5" required>
      <Input
        value={data.highLabel}
        onChange={(event) => onChange({ ...data, highLabel: event.target.value })}
        placeholder="De acuerdo"
      />
    </FormField>

    <ItemListEditor
      label="Preguntas"
      hint="Cada una se contesta en la escala de 1 a 5."
      items={data.questions}
      onChange={(questions) => onChange({ ...data, questions })}
      createItem={(index) => ({ id: `q-${index + 1}-${Date.now()}`, text: '' })}
      addLabel="Añadir pregunta"
      maxItems={40}
      renderItem={(question, update) => (
        <FormField label="Enunciado" required>
          <Textarea
            rows={2}
            value={question.text}
            onChange={(event) => update({ text: event.target.value })}
            placeholder="Después de leer esto, me siento capaz de actuar"
          />
        </FormField>
      )}
    />
  </>
);

// ---------------------------------------------------------------------------
// Resultados de encuesta
// ---------------------------------------------------------------------------

export const SurveyStatsForm = ({ data, onChange }: BlockFormProps<SurveyStatsData>) => (
  <>
    <SurveyGroupField
      value={data.groupId}
      onChange={(groupId) => onChange({ ...data, groupId })}
      hint="De qué grupo se muestran los resultados."
    />

    <p className="block-form__note">
      Este componente solo lo ves tú. Quien visite la página no verá nada en su lugar:
      ni los gráficos ni un aviso de permisos.
    </p>

    <FormField label="Título" hint="Opcional.">
      <Input
        value={data.title ?? ''}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
        placeholder="Resultados de la encuesta"
      />
    </FormField>

    <FormField
      label="Qué gráficos mostrar"
      hint="La tabla de números aparece siempre: es lo que hace legibles los gráficos con un lector de pantalla."
    >
      <Select
        options={[
          { value: 'both', label: 'Barras por pregunta y rosco del total' },
          { value: 'bars', label: 'Solo barras por pregunta' },
          { value: 'donut', label: 'Solo el rosco del total' },
        ]}
        value={data.chart}
        onChange={(event) =>
          onChange({ ...data, chart: event.target.value as SurveyChart })
        }
      />
    </FormField>
  </>
);
