import { PackageOpen } from 'lucide-react';
import Spinner from 'modules/shared/components/atoms/Spinner/Spinner';
import AlertMessage from 'modules/shared/components/molecules/AlertMessage/AlertMessage';
import EmptyState from 'modules/shared/components/molecules/EmptyState/EmptyState';
import { LoadingStatus } from 'modules/shared/types/common.types';
import ModuleTile from 'modules/content/components/molecules/ModuleTile/ModuleTile';
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
 * Presentacional. Recibe datos y estado; no despacha nada, así la misma
 * rejilla sirve al inicio y a la búsqueda.
 */
const ModuleGrid = ({
  modules,
  status,
  error,
  onRetry,
  emptyTitle = 'Aún no hay módulos publicados',
  emptyDescription = 'Cuando el administrador publique contenido aparecerá aquí.',
}: ModuleGridProps) => {
  if (status === LoadingStatus.Pending) {
    return <Spinner size="lg" label="Cargando módulos" />;
  }

  if (status === LoadingStatus.Failed) {
    return (
      <AlertMessage tone="error" title="No pudimos cargar los módulos" onRetry={onRetry}>
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
          <ModuleTile module={module} />
        </li>
      ))}
    </ul>
  );
};

export default ModuleGrid;
