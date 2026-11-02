import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import Modal from 'modules/shared/components/molecules/Modal/Modal';
import { slugify } from 'modules/shared/utils/id';
import type { Page, PageDraft } from 'modules/dynamic-content/types/dynamic.types';

export interface PageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: PageDraft) => void;
  isSubmitting: boolean;
  page?: Page | null;
}

/**
 * Datos de una página.
 *
 * El slug se muestra SIEMPRE, también al crear, porque es la URL que la gente
 * va a ver y compartir. Al crear se propone a partir del título; al editar se
 * deja el que ya tiene y solo cambia si se toca a mano: renombrar una página no
 * debe mover su dirección y romper los enlaces que alguien haya guardado.
 */
const PageFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  page = null,
}: PageFormModalProps) => {
  const isEditing = page !== null;

  const [title, setTitle] = useState(page?.title ?? '');
  const [subtitle, setSubtitle] = useState(page?.subtitle ?? '');
  const [slug, setSlug] = useState(page?.slug ?? '');
  /** Mientras no se toque el slug a mano, sigue al título. */
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length < 1) {
      setError('La página necesita un título.');
      return;
    }

    const finalSlug = slugify(slug || title);
    if (finalSlug.length === 0) {
      setError('El título debe tener al menos una letra o número para la dirección.');
      return;
    }

    setError(null);

    onSubmit({
      title: title.trim(),
      subtitle: subtitle.trim() === '' ? null : subtitle.trim(),
      slug: finalSlug,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar página' : 'Nueva página'}
      footer={
        <>
          <Button
            type="submit"
            form="page-form"
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
      <form
        id="page-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <FormField label="Título" error={error} required>
          <Input
            value={title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="Ej. Reconoce el paro cardíaco"
            autoFocus
          />
        </FormField>

        <FormField
          label="Subtítulo"
          hint="Opcional. Aparece bajo el título y en el índice."
        >
          <Input
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Identifica los signos"
          />
        </FormField>

        <FormField
          label="Dirección"
          hint={
            isEditing
              ? 'Cambiarla rompe los enlaces que ya se hayan compartido.'
              : 'Se propone desde el título. Puedes ajustarla.'
          }
        >
          <Input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="reconoce-el-paro"
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default PageFormModal;
