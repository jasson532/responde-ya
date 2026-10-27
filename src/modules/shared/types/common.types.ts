/**
 * Tipos transversales de RespondeYa.
 * Aquí NO va logica de negocio de ningun dominio concreto.
 */

/** Estado de carga de cualquier operacion asincrona. */
export enum LoadingStatus {
  Idle = 'idle',
  Pending = 'pending',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

/**
 * Roles de la aplicacion.
 *
 * `User` es el rol POR DEFECTO y NO requiere credenciales: cualquier visitante
 * que abre la app lo tiene y puede leer todo el contenido publicado. En una app
 * de primeros auxilios pedir login antes de mostrar un protocolo cuesta
 * segundos que no se tienen.
 *
 * `Admin` es el único rol que se autentica, y es el único que puede escribir.
 */
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
