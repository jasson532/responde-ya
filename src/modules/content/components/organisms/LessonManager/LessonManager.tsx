import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from 'modules/shared/store/hooks';
import { LoadingStatus } from 'modules/shared/types/common.types';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import {
  createLesson,
  deleteLesson,
  selectMutationStatus,
} from 'modules/content/store/contentSlice';
import type { ContentModule } from 'modules/content/types/content.types';
import './LessonManager.scss';

export interface LessonManagerProps {
  module: ContentModule;
}

/**
 * Gestion de las secciones (lecciones) de un modulo.
 * El editor de bloques interactivos es el siguiente incremento: hoy una
 * seccion se crea vacia y sus bloques se cargan desde el repositorio.
 */
const LessonManager = ({ module }: LessonManagerProps) => {
  const dispatch = useAppDispatch();
  const mutationStatus = useAppSelector(selectMutationStatus);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = mutationStatus === LoadingStatus.Pending;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length < 3) {
      setError('El titulo de la seccion debe tener al menos 3 caracteres.');
      return;
    }

    setError(null);

    const result = await dispatch(
      createLesson({
        moduleId: module.id,
        draft: { title, summary, blocks: [] },
      }),
    );

    if (result.meta.requestStatus === 'fulfilled') {
      setTitle('');
      setSummary('');
    }
  };

  return (
    <section className="lesson-manager" data-testid="LessonManager">
      <h2 className="lesson-manager__title">Secciones del modulo</h2>

      {module.lessons.length === 0 ? (
        <p className="lesson-manager__empty">
          Este modulo aun no tiene secciones. Agrega la primera abajo.
        </p>
      ) : (
        <ol className="lesson-manager__list">
          {module.lessons.map((lesson) => (
            <li key={lesson.id} className="lesson-manager__item">
              <div className="lesson-manager__item-main">
                <h3 className="lesson-manager__item-title">{lesson.title}</h3>
                {lesson.summary && (
                  <p className="lesson-manager__item-summary">{lesson.summary}</p>
                )}
                <p className="lesson-manager__item-count">
                  {lesson.blocks.length}{' '}
                  {lesson.blocks.length === 1 ? 'bloque' : 'bloques'} de contenido
                </p>
              </div>

              <Button
                variant="danger"
                size="sm"
                iconStart={<Trash2 />}
                disabled={isSubmitting}
                onClick={() =>
                  void dispatch(deleteLesson({ moduleId: module.id, lessonId: lesson.id }))
                }
              >
                Eliminar
              </Button>
            </li>
          ))}
        </ol>
      )}

      <form className="lesson-manager__form" onSubmit={handleCreate} noValidate>
        <h3 className="lesson-manager__form-title">Agregar seccion</h3>

        <FormField label="Titulo de la seccion" error={error} required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Actua ahora"
          />
        </FormField>

        <FormField label="Resumen" hint="Opcional. Una linea sobre que cubre la seccion.">
          <Textarea
            rows={2}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Secuencia inmediata antes de que llegue la ayuda."
          />
        </FormField>

        <Button type="submit" variant="secondary" loading={isSubmitting} iconStart={<Plus />}>
          Agregar seccion
        </Button>
      </form>
    </section>
  );
};

export default LessonManager;
