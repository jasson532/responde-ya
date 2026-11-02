import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from 'modules/shared/components/atoms/Button/Button';
import Textarea from 'modules/shared/components/atoms/Textarea/Textarea';
import FormField from 'modules/shared/components/molecules/FormField/FormField';
import Modal from 'modules/shared/components/molecules/Modal/Modal';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import { sanitizeBlockData } from 'modules/dynamic-content/services/blocks.schema';
import { BlockKind } from 'modules/dynamic-content/types/blocks.types';
import type { Page } from 'modules/dynamic-content/types/dynamic.types';
import { blockLabel } from 'modules/dynamic-content/constants/blockLibrary';
import {
  CalloutForm,
  DividerForm,
  HeadingForm,
  KeyPointsForm,
  MetronomeForm,
  PageLinksForm,
  StatsForm,
  TextForm,
} from '../blockForms/blockForms';
import './BlockFormModal.scss';

export interface BlockFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
  kind: string;
  initialData: Record<string, unknown>;
  pages: Page[];
}

/**
 * Formulario de un componente.
 *
 * Elige la interfaz según el tipo. Los que todavía no tienen una propia caen en
 * un editor de JSON: así ningún componente queda sin poder editarse mientras se
 * escriben los demás formularios. No es bonito, pero es honesto —se ve que es
 * provisional— y evita que la biblioteca prometa componentes que no se pueden
 * configurar.
 */
const BlockFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  kind,
  initialData,
  pages,
}: BlockFormModalProps) => {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(initialData, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    /**
     * Se valida ANTES de enviar, con el mismo guarda que usa el repositorio.
     *
     * Sin esto, el error llegaría desde el servidor como «ese bloque está
     * incompleto», sin decir qué campo falta y después de un viaje de red.
     */
    const clean = sanitizeBlockData(kind, data);

    if (clean === null) {
      setError(
        'Faltan datos obligatorios o alguno no es válido. Revisa los campos marcados.',
      );
      return;
    }

    setError(null);
    onSubmit(clean);
  };

  /** El editor de JSON sincroniza su texto con los datos al escribir. */
  const handleRawChange = (value: string) => {
    setRawJson(value);
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        setData(parsed as Record<string, unknown>);
        setError(null);
      } else {
        setError('El contenido debe ser un objeto JSON.');
      }
    } catch {
      setError('El JSON tiene un error de sintaxis.');
    }
  };

  const renderForm = () => {
    switch (kind) {
      case BlockKind.Heading:
        return <HeadingForm data={data as never} onChange={setData as never} />;
      case BlockKind.Text:
        return <TextForm data={data as never} onChange={setData as never} />;
      case BlockKind.Divider:
        return <DividerForm />;
      case BlockKind.Callout:
        return <CalloutForm data={data as never} onChange={setData as never} />;
      case BlockKind.Stats:
        return <StatsForm data={data as never} onChange={setData as never} />;
      case BlockKind.KeyPoints:
        return <KeyPointsForm data={data as never} onChange={setData as never} />;
      case BlockKind.Metronome:
        return <MetronomeForm data={data as never} onChange={setData as never} />;
      case BlockKind.PageLinks:
        return (
          <PageLinksForm data={data as never} onChange={setData as never} pages={pages} />
        );

      default:
        return (
          <>
            <AlertMessage tone="info" title="Formulario en construcción">
              Este componente todavía no tiene su formulario. Mientras tanto puedes
              configurarlo editando sus datos directamente.
            </AlertMessage>

            <FormField label="Datos del componente (JSON)">
              <Textarea
                rows={14}
                value={rawJson}
                onChange={(event) => handleRawChange(event.target.value)}
                spellCheck={false}
              />
            </FormField>
          </>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={blockLabel(kind)}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="primary"
            loading={isSubmitting}
            iconStart={<Save />}
            onClick={handleSave}
          >
            Guardar
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <div className="block-form">
        {error && <AlertMessage tone="error">{error}</AlertMessage>}
        {renderForm()}
      </div>
    </Modal>
  );
};

export default BlockFormModal;
