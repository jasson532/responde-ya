/**
 * Tipos transversales de RespondeYa.
 * Aqui NO va logica de negocio de ningun dominio concreto.
 */

/** Estado de carga de cualquier operacion asincrona. */
export enum LoadingStatus {
  Idle = 'idle',
  Pending = 'pending',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

/** Roles de la aplicacion. El contenido lo administra Admin; User solo consume. */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

/** Shape base de cualquier slice que cargue datos remotos. */
export interface AsyncSliceState {
  status: LoadingStatus;
  error: string | null;
}

/** Entidad persistible: todo lo que se guarda lleva id y auditoria. */
export interface AuditedEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type Nullable<T> = T | null;

export type WithoutAudit<T extends AuditedEntity> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;
