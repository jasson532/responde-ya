import { PackageOpen } from 'lucide-react';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import { LoadingStatus } from 'modules/shared/types/common.types';
import ModuleCard from 'modules/content/components/molecules/ModuleCard/ModuleCard';
import type { ContentModule } from 'modules/content/types/content.types';
import './ModuleGrid.scss';

export interface ModuleGridProps {
  modules: ContentModule[];
  status: LoadingStatus;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Presentacional. Recibe datos y estado; no despacha nada.
 * Asi la misma rejilla sirve al catalogo publico y a la vista de busqueda.
 */
const ModuleGrid = ({
  modules,
  status,
  error,
  onRetry,
  emptyTitle = 'Aun no hay modulos publicados',
  emptyDescription = 'Cuando el administrador publique contenido aparecera aqui.',
}: ModuleGridProps) => {
  if (status === LoadingStatus.Pending) {
    return <Spinner size="lg" label="Cargando modulos" />;
  }

  if (status === LoadingStatus.Failed) {
    return (
      <AlertMessage tone="error" title="No pudimos cargar los modulos" onRetry={onRetry}>
        {error ?? 'Intenta de nuevo en un momento.'}
      </AlertMessage>
    );
  }

  if (modules.length === 0) {
    return (
      <EmptyState icon={<PackageOpen />} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className="module-grid" data-testid="ModuleGrid">
      {modules.map((module) => (
        <li key={module.id} className="module-grid__item">
          <ModuleCard module={module} />
        </li>
      ))}
    </ul>
  );
};

export default ModuleGrid;
