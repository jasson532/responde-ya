// ---------------------------------------------------------------------------
// Contrato público del módulo shared.
// ---------------------------------------------------------------------------

// Atoms
export {
  Badge,
  BrandLogo,
  Button,
  Chip,
  IconBubble,
  Input,
  LinkButton,
  ProgressRing,
  Select,
  Spinner,
  Textarea,
} from './components/atoms';

// Molecules
export {
  AlertMessage,
  EmptyState,
  FormField,
  ListRow,
  SearchBar,
  SectionHeader,
} from './components/molecules';

// Organisms
export { default as AdminRoute } from './components/organisms/AdminRoute/AdminRoute';
export { default as AppHeader } from './components/organisms/AppHeader/AppHeader';
export { default as BottomNav } from './components/organisms/BottomNav/BottomNav';
export { default as ErrorBoundary } from './components/organisms/ErrorBoundary/ErrorBoundary';
export { default as TopBar } from './components/organisms/TopBar/TopBar';

// Templates
export { default as AppShell } from './components/templates/AppShell/AppShell';
export { default as AuthLayout } from './components/templates/AuthLayout/AuthLayout';

// Pages transversales
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
export { EMERGENCY_PHONE } from './constants/emergency';

// Types
export { LoadingStatus, UserRole } from './types/common.types';
export type { AuditedEntity, AsyncSliceState, Nullable } from './types/common.types';
export { AppError } from './types/api.types';
export type { NormalizedError, PaginatedResponse } from './types/api.types';
