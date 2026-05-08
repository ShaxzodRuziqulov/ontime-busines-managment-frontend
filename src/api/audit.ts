import apiClient from './client'

export interface AuditLog {
  id: string
  adminLogin: string
  action: string
  entityType: string
  entityId: string
  details: string | null
  createdAt: string
}

export interface AuditPage {
  content: AuditLog[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const auditApi = {
  getAll: (params: {
    entityType?: string
    action?: string
    adminLogin?: string
    page?: number
    size?: number
  }) =>
    apiClient.get<AuditPage>('/admin/audit-logs', { params }),
}
