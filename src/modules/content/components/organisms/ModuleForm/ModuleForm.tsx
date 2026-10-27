import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select, { type SelectOption } from 'modules/shared/components/atoms/Select/Select';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import {
  ModuleSeverity,
  ModuleStatus,
  type ContentModuleDraft,
} from 'modules/content/types/content.types';
import {
  DEFAULT_MODULE_ICON,
  MODULE_ICON_NAMES,
  getModuleIcon,
} from 'modules/content/constants/moduleIcons';
import './ModuleForm.scss';

export interface ModuleFormProps {
  initialValue?: ContentModuleDraft;
  isSubmitting?: boolean;
  onSubmit: (draft: ContentModuleDraft) => void;
  onCancel: () => void;
}

type FieldErrors = Partial<Record<keyof ContentModuleDraft, string>>;

const EMPTY_DRAFT: ContentModuleDraft = {
  title: '',
  summary: '',
  severity: ModuleSeverity.Basic,
  status: ModuleStatus.Draft,
  iconName: DEFAULT_MODULE_ICON,
  tags: [],
  estimatedMinutes: 3,
};

const SEVERITY_OPTIONS: readonly SelectOption[] = [
  { value: ModuleSeverity.Critical, label: 'Riesgo vital' },
  { value: ModuleSeverity.Urgent, label: 'Atencion urgente' },
  { value: ModuleSeverity.Basic, label: 'Cuidado basico' },
];

const validate = (draft: ContentModuleDraft): FieldErrors => {
  const errors: FieldErrors = {};

  if (draft.title.trim().length < 3) {
    errors.title = 'El titulo debe tener al menos 3 caracteres.';
  }
  if (draft.summary.trim().length < 10) {
    errors.summary = 'Escribe un resumen de al menos 10 caracteres.';
  }
  if (!Number.isFinite(draft.estimatedMinutes) || draft.estimatedMinutes < 1) {
    errors.estimatedMinutes = 'La duracion debe ser de 1 minuto o mas.';
  }

  return errors;
};

/** Presentacional: valida y entrega el draft. No conoce Redux ni servicios. */
const ModuleForm = ({
  initialValue = EMPTY_DRAFT,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: ModuleFormProps) => {
  const [draft, setDraft] = useState<ContentModuleDraft>(initialValue);
  const [tagsText, setTagsText] = useState(initialValue.tags.join(', '));
  const [errors, setErrors] = useState<FieldErrors>({});

  const patch = <K extends keyof ContentModuleDraft>(key: K, value: ContentModuleDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const candidate: ContentModuleDraft = {
      ...draft,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const nextErrors = validate(candidate);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) onSubmit(candidate);
  };

  return (
    <form className="module-form" onSubmit={handleSubmit} noValidate data-testid="ModuleForm">
      <FormField label="Titulo del modulo" error={errors.title} required>
        <Input
          value={draft.title}
          onChange={(event) => patch('title', event.target.value)}
          placeholder="Ej. Quemaduras leves"
        />
      </FormField>

      <FormField
        label="Resumen"
        hint="Una frase que le diga al usuario cuando usar este modulo."
        error={errors.summary}
        required
      >
        <Textarea
          value={draft.summary}
          onChange={(event) => patch('summary', event.target.value)}
          placeholder="Que hacer cuando la piel se quema con agua caliente o fuego."
        />
      </FormField>

      <div className="module-form__row">
        <FormField label="Gravedad">
          <Select
            options={SEVERITY_OPTIONS}
            value={draft.severity}
            onChange={(event) => patch('severity', event.target.value as ModuleSeverity)}
          />
        </FormField>

        <FormField label="Duracion estimada (minutos)" error={errors.estimatedMinutes}>
          <Input
            type="number"
            min={1}
            max={60}
            value={draft.estimatedMinutes}
            onChange={(event) => patch('estimatedMinutes', Number(event.target.value))}
          />
        </FormField>
      </div>

      <FormField
        label="Etiquetas de busqueda"
        hint="Separadas por comas. Son las palabras que el usuario escribiria en una emergencia."
      >
        <Input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="quemadura, fuego, agua caliente"
        />
      </FormField>

      <fieldset className="module-form__icons">
        <legend className="module-form__legend">Icono</legend>
        <div className="module-form__icon-grid">
          {MODULE_ICON_NAMES.map((iconName) => (
            <button
              key={iconName}
              type="button"
              className={`module-form__icon ${draft.iconName === iconName ? 'is-active' : ''}`.trim()}
              aria-pressed={draft.iconName === iconName}
              aria-label={`Usar icono ${iconName}`}
              onClick={() => patch('iconName', iconName)}
            >
              {getModuleIcon(iconName)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="module-form__status">
        <legend className="module-form__legend">Visibilidad</legend>
        <label className="module-form__radio">
          <input
            type="radio"
            name="status"
            checked={draft.status === ModuleStatus.Draft}
            onChange={() => patch('status', ModuleStatus.Draft)}
          />
          <span>
            <strong>Borrador</strong> — solo tu lo ves
          </span>
        </label>
        <label className="module-form__radio">
          <input
            type="radio"
            name="status"
            checked={draft.status === ModuleStatus.Published}
            onChange={() => patch('status', ModuleStatus.Published)}
          />
          <span>
            <strong>Publicado</strong> — visible para todas las personas usuarias
          </span>
        </label>
      </fieldset>

      <div className="module-form__actions">
        <Button type="submit" variant="primary" loading={isSubmitting} iconStart={<Save />}>
          Guardar modulo
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default ModuleForm;
