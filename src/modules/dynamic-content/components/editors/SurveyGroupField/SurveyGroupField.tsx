import { useEffect, useState } from 'react';
import { FolderPlus, Plus, Settings2, Trash2 } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type {
  SurveyGroup,
  SurveyGroupUsage,
} from 'modules/dynamic-content/types/dynamic.types';
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

  // --- Gestión de grupos ---
  const [isManaging, setIsManaging] = useState(false);
  const [usage, setUsage] = useState<SurveyGroupUsage[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  /**
   * El recuento se pide solo al abrir la gestión.
   *
   * Son tres consultas —grupos, respuestas y bloques— y quien abre este
   * formulario casi siempre viene a elegir un grupo, no a borrarlo.
   */
  const openManager = async () => {
    setIsManaging(true);
    setUsage(null);
    setError(null);

    try {
      const repository = await getRepository();
      setUsage(await repository.listSurveyGroupUsage());
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos cargar los grupos.'));
    }
  };

  const handleDelete = async (groupId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      const repository = await getRepository();
      await repository.deleteSurveyGroup(groupId);

      setGroups((current) => current.filter((group) => group.id !== groupId));
      setUsage((current) =>
        current === null ? null : current.filter((item) => item.group.id !== groupId),
      );
      setPendingDelete(null);

      /**
       * Si el bloque que se está editando usaba ese grupo, la selección se
       * vacía. Dejarla apuntando a un grupo borrado haría que el formulario
       * pareciera correcto y fallara al guardar.
       */
      if (value === groupId) onChange('');
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos eliminar el grupo.'));
    } finally {
      setIsDeleting(false);
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
        <div className="survey-group-field__actions">
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconStart={<Settings2 />}
            onClick={() => (isManaging ? setIsManaging(false) : void openManager())}
            disabled={isLoading}
          >
            {isManaging ? 'Ocultar grupos' : 'Gestionar grupos'}
          </Button>
        </div>
      )}

      {isManaging && (
        <div className="survey-group-field__manager">
          {usage === null ? (
            <Spinner size="sm" label="Cargando grupos" />
          ) : usage.length === 0 ? (
            <p className="survey-group-field__empty">
              Todavía no hay ningún grupo. Crea uno para empezar a recoger respuestas.
            </p>
          ) : (
            <ul className="survey-group-field__list">
              {usage.map((item) => (
                <li className="survey-group-field__row" key={item.group.id}>
                  <div className="survey-group-field__row-text">
                    <p className="survey-group-field__row-title">{item.group.title}</p>
                    <p className="survey-group-field__row-meta">
                      {item.submissions} {item.submissions === 1 ? 'envío' : 'envíos'} ·{' '}
                      {item.answers} {item.answers === 1 ? 'respuesta' : 'respuestas'} ·{' '}
                      {item.blocks} {item.blocks === 1 ? 'componente' : 'componentes'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconStart={<Trash2 />}
                    aria-label={`Eliminar el grupo ${item.group.title}`}
                    onClick={() => setPendingDelete(item.group.id)}
                    disabled={isDeleting}
                  />

                  {/**
                   * La confirmación dice EXACTAMENTE qué desaparece, con los
                   * números delante. «¿Seguro?» no da la información que hace
                   * falta para decidir, y aquí lo que se borra incluye
                   * contenido de páginas que pueden estar publicadas.
                   */}
                  {pendingDelete === item.group.id && (
                    <div className="survey-group-field__confirm">
                      <p className="survey-group-field__confirm-text">
                        Se eliminarán <strong>{item.answers}</strong>{' '}
                        {item.answers === 1 ? 'respuesta' : 'respuestas'} y{' '}
                        <strong>{item.blocks}</strong>{' '}
                        {item.blocks === 1
                          ? 'componente de encuesta, con sus preguntas'
                          : 'componentes de encuesta, con sus preguntas'}
                        . No se puede deshacer.
                      </p>

                      <div className="survey-group-field__confirm-actions">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={isDeleting}
                          onClick={() => void handleDelete(item.group.id)}
                        >
                          Sí, eliminar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDelete(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default SurveyGroupField;
