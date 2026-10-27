/** Contratos genericos de transporte. Independientes del backend elegido. */

export interface ApiResponse<TData> {
  data: TData;
  message?: string;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Error normalizado: la UI nunca ve el error crudo de Axios/fetch/Supabase. */
export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error implements NormalizedError {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor({ status, code, message, details }: NormalizedError) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
