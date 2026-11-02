import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Input from 'modules/shared/components/atoms/Input/Input';
import Select from 'modules/shared/components/atoms/Select/Select';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import Modal from 'modules/shared/components/molecules/Modal/Modal';
import {
  SectionVariant,
  type Section,
  type SectionDraft,
} from 'modules/dynamic-content/types/dynamic.types';

export interface SectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: SectionDraft) => void;
  isSubmitting: boolean;
  section?: Section | null;
}

const VARIANT_OPTIONS = [
  { value: SectionVariant.Plain, label: 'Sin fondo — sobre el lienzo' },
  { value: SectionVariant.Card, label: 'Tarjeta — fondo blanco con borde' },
  { value: SectionVariant.Tinted, label: 'Tintada — fondo gris suave' },
];

/**
 * Datos de una sección: un título opcional y su fondo.
 *
 * Una sección agrupa componentes dentro de la página. El título es opcional a
 * propósito: a veces se agrupa solo para separar visualmente, sin anunciar la
 * agrupación con un encabezado que no aporta nada.
 */
const SectionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  section = null,
}: SectionFormModalProps) => {
  const [title, setTitle] = useState(section?.title ?? '');
  const [variant, setVariant] = useState(section?.variant ?? SectionVariant.Plain);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title: title.trim() === '' ? null : title.trim(),
      variant,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={section === null ? 'Nueva sección' : 'Editar sección'}
      footer={
        <>
          <Button
            type="submit"
            form="section-form"
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
        id="section-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <FormField
          label="Título"
          hint="Opcional. Déjalo vacío si solo quieres agrupar sin encabezado."
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Dudas frecuentes"
            autoFocus
          />
        </FormField>

        <FormField label="Fondo">
          <Select
            options={VARIANT_OPTIONS}
            value={variant}
            onChange={(event) => setVariant(event.target.value as SectionVariant)}
          />
        </FormField>
      </form>
    </Modal>
  );
};

export default SectionFormModal;
