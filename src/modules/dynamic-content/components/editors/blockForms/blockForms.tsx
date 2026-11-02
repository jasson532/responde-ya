import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import {
  BlockTone,
  type CalloutData,
  type HeadingData,
  type KeyPointsData,
  type MetronomeData,
  type PageLinksData,
  type StatsData,
  type TextData,
} from 'modules/dynamic-content/types/blocks.types';
import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import ItemListEditor from '../ItemListEditor/ItemListEditor';

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
