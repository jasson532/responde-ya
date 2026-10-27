// ---------------------------------------------------------------------------
// Contrato publico del modulo shared.
// ---------------------------------------------------------------------------

// Atoms
export {
  Badge,
  BrandLogo,
  Button,
  Input,
  LinkButton,
  Select,
  Spinner,
  Textarea,
} from './components/atoms';

// Molecules
export { AlertMessage, EmptyState, FormField, SearchBar } from './components/molecules';

// Organisms
export { default as AppHeader } from './components/organisms/AppHeader/AppHeader';
export { default as ErrorBoundary } from './components/organisms/ErrorBoundary/ErrorBoundary';
export { default as ProtectedRoute } from './components/organisms/ProtectedRoute/ProtectedRoute';

// Templates
export { default as AuthLayout } from './components/templates/AuthLayout/AuthLayout';
export { default as MainLayout } from './components/templates/MainLayout/MainLayout';

// Pages transversales
export { default as ForbiddenPage } from './components/pages/ForbiddenPage/ForbiddenPage';
export { default as NotFoundPage } from './components/pages/NotFoundPage/NotFoundPage';

// Store
export { store } from './store';
export type { AppDispatch, RootState } from './store';
export { useAppDispatch, useAppSelector } from './store/hooks';

// Services
export { default as appConfig } from './services/config/appConfig';
export { default as httpClient } from './services/http/httpClient';
export { default as logger } from './services/logger/logger';
export { default as localStore } from './services/storage/localStore';

// Hooks
export { default as useDebounce } from './hooks/useDebounce';
export { default as useLocalStorage } from './hooks/useLocalStorage';

// Constants
export { ROUTES, buildRoute } from './constants/routes';
export { ERROR_CODES, ERROR_MESSAGES } from './constants/errorMessages';

// Types
export { LoadingStatus, UserRole } from './types/common.types';
export type { AuditedEntity, AsyncSliceState, Nullable } from './types/common.types';
export { AppError } from './types/api.types';
export type { NormalizedError, PaginatedResponse } from './types/api.types';
