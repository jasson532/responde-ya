import { useEffect, useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type { SurveyGroup } from 'modules/dynamic-content/types/dynamic.types';
import './SurveyGroupField.scss';

export interface SurveyGroupFieldProps {
  value: string;
  onChange: (groupId: string) => void;
  hint?: string;
}

/**
 * ===========================================================================
 * ELEGIR O CREAR UN GRUPO DE PREGUNTAS
 * ===========================================================================
 * Lo comparten el formulario de la encuesta y el de los resultados: uno elige
 * dónde guardar las respuestas y el otro qué grupo mirar, pero los dos
 * necesitan la misma lista.
 *
 * El grupo es lo que une varias colocaciones del bloque. Dos encuestas en
 * páginas distintas con el MISMO grupo suman sus respuestas; con grupos
 * distintos se cuentan por separado. Esa es toda la decisión que hay que tomar
 * aquí, y por eso el campo lo explica en lugar de limitarse a listar.
 * ===========================================================================
 */
const SurveyGroupField = ({ value, onChange, hint }: SurveyGroupFieldProps) => {
  const [groups, setGroups] = useState<SurveyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const repository = await getRepository();
        const result = await repository.listSurveyGroups();
        if (!cancelled) setGroups(result);
      } catch (cause) {
        if (!cancelled) {
          setError(toErrorMessage(cause, 'No pudimos cargar los grupos.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (title.length < 2) {
      setError('Pon un nombre de al menos dos caracteres.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const repository = await getRepository();
      const group = await repository.createSurveyGroup(title);

      setGroups((current) => [group, ...current]);
      // Se selecciona solo: quien acaba de crear un grupo lo quiere usar.
      onChange(group.id);
      setIsCreating(false);
      setNewTitle('');
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos crear el grupo.'));
    } finally {
      setIsSaving(false);
    }
  };

  const options = [
    { value: '', label: isLoading ? 'Cargando grupos…' : 'Elige un grupo…' },
    ...groups.map((group) => ({ value: group.id, label: group.title })),
  ];

  return (
    <>
      <FormField
        label="Grupo de preguntas"
        hint={
          hint ??
          'Las respuestas se guardan en este grupo. Si pones el mismo grupo en varias páginas, sus respuestas se suman.'
        }
        required
      >
        <Select
          options={options}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isLoading}
        />
      </FormField>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      {isCreating ? (
        <>
          {/* Los botones van FUERA del `FormField`: ese componente inyecta el
              `id` y los estados de error en un único hijo de control, y con
              varios hijos no sabría a cuál. */}
          <FormField
            label="Nombre del grupo nuevo"
            hint="Ej. «Evaluación del módulo de RCP»."
          >
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Evaluación del módulo de RCP"
              autoFocus
            />
          </FormField>

          <div className="survey-group-field__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              iconStart={<Plus />}
              loading={isSaving}
              onClick={() => void handleCreate()}
            >
              Crear grupo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setError(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconStart={<FolderPlus />}
          onClick={() => setIsCreating(true)}
          disabled={isLoading}
        >
          Crear un grupo nuevo
        </Button>
      )}
    </>
  );
};

export default SurveyGroupField;
