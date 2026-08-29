export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogUser {
  id: number;
  username: string;
  role: string;
}

export interface AuditLog {
  id: number;
  tableName: string;
  recordId: number;
  action: AuditAction;
  oldValues?: any;
  newValues?: any;
  changedBy?: number | null;
  user?: AuditLogUser | null;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  tableName?: string;
  action?: AuditAction;
  search?: string;
}
