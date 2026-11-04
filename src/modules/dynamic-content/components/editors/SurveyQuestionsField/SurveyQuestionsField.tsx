import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { toErrorMessage } from 'modules/shared/utils/errors';
import { getRepository } from 'modules/dynamic-content/services/dynamic.service';
import type {
  SurveyGroup,
  SurveyQuestion,
} from 'modules/dynamic-content/types/dynamic.types';
import ItemListEditor from '../ItemListEditor/ItemListEditor';
import './SurveyQuestionsField.scss';

export interface SurveyQuestionsFieldProps {
  /** Grupo seleccionado. Vacío mientras no se ha elegido ninguno. */
  groupId: string;
}

/**
 * ===========================================================================
 * PREGUNTAS DEL GRUPO
 * ===========================================================================
 * Al elegir un grupo, carga SUS enunciados y permite editarlos y añadir más.
 *
 * SOBRE EL BOTÓN DE GUARDAR PROPIO
 * Tiene el suyo, aparte del «Guardar» del diálogo. No es un descuido: lo que se
 * edita aquí NO es este bloque, es el grupo, y el grupo lo comparten todas las
 * páginas donde esté puesta la encuesta. Colar ese cambio en el guardado del
 * bloque significaría que tocar el título de una colocación reescribe las
 * preguntas de las otras tres sin que nadie lo haya pedido. El aviso de
 * «cambios sin guardar» está por lo mismo.
 *
 * SOBRE EL ORDEN
 * Reordenar o borrar una pregunta NO borra las respuestas que ya tenía: viven
 * en otra tabla con su propia copia del enunciado. Lo que ocurre es que dejan
 * de aparecer en la encuesta y siguen contando en las estadísticas, que es el
 * comportamiento correcto para no falsear lo ya medido.
 * ===========================================================================
 */
const SurveyQuestionsField = ({ groupId }: SurveyQuestionsFieldProps) => {
  const [group, setGroup] = useState<SurveyGroup | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [lowLabel, setLowLabel] = useState('');
  const [highLabel, setHighLabel] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Sin grupo no hay nada que cargar; se vacía lo que hubiera del anterior.
      if (groupId === '') {
        setGroup(null);
        setQuestions([]);
        setIsDirty(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsDirty(false);
      setJustSaved(false);

      try {
        const repository = await getRepository();
        const result = await repository.getSurveyGroup(groupId);
        if (cancelled) return;

        setGroup(result);
        setQuestions(result.questions);
        setLowLabel(result.lowLabel);
        setHighLabel(result.highLabel);
      } catch (cause) {
        if (!cancelled) {
          setError(toErrorMessage(cause, 'No pudimos cargar las preguntas del grupo.'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // Se recarga al cambiar de grupo: es justo lo que se espera al elegir otro
    // en el selector de arriba.
  }, [groupId]);

  /** Marca el cambio como pendiente en cuanto se toca algo. */
  const touch = () => {
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const repository = await getRepository();
      const saved = await repository.updateSurveyGroup(groupId, {
        questions,
        lowLabel,
        highLabel,
      });

      setGroup(saved);
      // Se recarga desde lo guardado: el repositorio descarta los enunciados
      // en blanco, y así el editor muestra exactamente lo que hay en la base.
      setQuestions(saved.questions);
      setIsDirty(false);
      setJustSaved(true);
    } catch (cause) {
      setError(toErrorMessage(cause, 'No pudimos guardar las preguntas.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (groupId === '') {
    return (
      <p className="block-form__note">
        Elige un grupo arriba para ver y editar sus preguntas.
      </p>
    );
  }

  if (isLoading) return <Spinner size="sm" label="Cargando las preguntas" />;

  return (
    <div className="survey-questions">
      <div className="survey-questions__head">
        <p className="survey-questions__title">
          Preguntas de <strong>{group?.title ?? 'este grupo'}</strong>
        </p>
        <p className="survey-questions__note">
          Se comparten con todas las páginas donde esté puesta esta encuesta.
        </p>
      </div>

      {error && <AlertMessage tone="error">{error}</AlertMessage>}

      <FormField label="Qué significa el 1" required>
        <Input
          value={lowLabel}
          onChange={(event) => {
            setLowLabel(event.target.value);
            touch();
          }}
          placeholder="Muy en desacuerdo"
        />
      </FormField>

      <FormField label="Qué significa el 5" required>
        <Input
          value={highLabel}
          onChange={(event) => {
            setHighLabel(event.target.value);
            touch();
          }}
          placeholder="Totalmente de acuerdo"
        />
      </FormField>

      <ItemListEditor
        label="Enunciados"
        hint="Cada uno se contesta en la escala de 1 a 5."
        items={questions}
        onChange={(next) => {
          setQuestions(next);
          touch();
        }}
        createItem={(index) => ({ id: `q-${index + 1}-${Date.now()}`, text: '' })}
        addLabel="Añadir pregunta"
        minItems={0}
        maxItems={40}
        renderItem={(question, update) => (
          <FormField label="Enunciado" required>
            <Textarea
              rows={2}
              value={question.text}
              onChange={(event) => update({ text: event.target.value })}
              placeholder="Me siento capaz de actuar ante un paro cardíaco"
            />
          </FormField>
        )}
      />

      <div className="survey-questions__actions">
        <Button
          type="button"
          variant="primary"
          size="sm"
          iconStart={<Save />}
          loading={isSaving}
          disabled={!isDirty}
          onClick={() => void handleSave()}
        >
          Guardar preguntas
        </Button>

        {isDirty && (
          <span className="survey-questions__state survey-questions__state--dirty">
            Cambios sin guardar
          </span>
        )}
        {justSaved && !isDirty && (
          <span className="survey-questions__state survey-questions__state--saved">
            Preguntas guardadas
          </span>
        )}
      </div>
    </div>
  );
};

export default SurveyQuestionsField;
