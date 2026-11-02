import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import Modal from 'modules/shared/components/molecules/Modal/Modal';
import {
  MODULE_ICON_LABELS,
  MODULE_ICON_NAMES,
  getModuleIcon,
} from 'modules/content/constants/moduleIcons';
import {
  ModuleSeverity,
  ModuleStatus,
  type Category,
  type ModuleDraft,
  type ModuleSummary,
} from 'modules/dynamic-content/types/dynamic.types';
import { SEVERITY_LABEL } from 'modules/dynamic-content/constants/severityLabels';
import './ModuleFormModal.scss';

export interface ModuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: ModuleDraft) => void;
  isSubmitting: boolean;
  categories: Category[];
  /** Si viene, el formulario edita; si no, crea. */
  module?: ModuleSummary | null;
}

const SEVERITY_OPTIONS = Object.values(ModuleSeverity).map((value) => ({
  value,
  label: SEVERITY_LABEL[value],
}));

const STATUS_OPTIONS = [
  { value: ModuleStatus.Draft, label: 'Borrador — solo tú lo ves' },
  { value: ModuleStatus.ComingSoon, label: 'Próximamente — visible en gris' },
  { value: ModuleStatus.Published, label: 'Publicado — visible para todos' },
];

/**
 * Datos del módulo: lo que el administrador rellena al crearlo con el botón.
 *
 * No incluye el slug. Se deriva del título al crear y NO cambia al renombrar:
 * es una URL que puede estar compartida, y moverla rompería esos enlaces en
 * silencio. Cambiarlo a mano será una acción aparte y explícita.
 */
const ModuleFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  categories,
  module = null,
}: ModuleFormModalProps) => {
  const isEditing = module !== null;

  const [title, setTitle] = useState(module?.title ?? '');
  const [summary, setSummary] = useState(module?.summary ?? '');
  const [iconName, setIconName] = useState(module?.iconName ?? 'emergency-post');
  const [categoryId, setCategoryId] = useState(module?.categoryId ?? '');
  const [severity, setSeverity] = useState(module?.severity ?? ModuleSeverity.Basic);
  const [status, setStatus] = useState(module?.status ?? ModuleStatus.Draft);
  const [minutes, setMinutes] = useState(String(module?.estimatedMinutes ?? 3));
  const [tags, setTags] = useState((module?.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }

    setError(null);

    onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      iconName,
      categoryId: categoryId === '' ? null : categoryId,
      severity,
      status,
      estimatedMinutes: Number(minutes) || 3,
      // Las etiquetas se escriben separadas por comas, que es lo natural en un
      // campo de texto. El filtro quita las vacías que dejan las comas
      // sobrantes al final.
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar módulo' : 'Nuevo módulo'}
      size="lg"
      footer={
        <>
          <Button
            type="submit"
            form="module-form"
            variant="primary"
            loading={isSubmitting}
            iconStart={<Save />}
          >
            Guardar
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      {/* El `form` tiene id y los botones viven en el pie del diálogo con
          `form="module-form"`: así quedan siempre visibles aunque el
          formulario sea largo y haya que desplazarlo. */}
      <form id="module-form" className="module-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Título" error={error} required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Quemaduras leves"
            autoFocus
          />
        </FormField>

        <FormField
          label="Resumen"
          hint="Una o dos líneas. Es lo que se lee bajo el título."
        >
          <Textarea
            rows={2}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </FormField>

        <div className="module-form__row">
          <FormField label="Gravedad" hint="Define el color de la tarjeta.">
            <Select
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={(event) => setSeverity(event.target.value as ModuleSeverity)}
            />
          </FormField>

          <FormField label="Minutos estimados">
            <Input
              type="number"
              min={1}
              max={180}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Categoría">
          <Select
            options={[
              { value: '', label: 'Sin categoría' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          />
        </FormField>

        <FormField label="Visibilidad">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value as ModuleStatus)}
          />
        </FormField>

        <FormField
          label="Etiquetas"
          hint="Separadas por comas. Ayudan a encontrar el módulo al buscar."
        >
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="quemadura, fuego, agua fría"
          />
        </FormField>

        <fieldset className="module-form__icons">
          <legend className="module-form__legend">Icono</legend>

          <div className="module-form__icon-grid">
            {MODULE_ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={`module-form__icon ${iconName === name ? 'is-active' : ''}`.trim()}
                aria-pressed={iconName === name}
                title={MODULE_ICON_LABELS[name]}
                aria-label={`Usar icono de ${MODULE_ICON_LABELS[name]}`}
                onClick={() => setIconName(name)}
              >
                {getModuleIcon(name)}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

export default ModuleFormModal;
