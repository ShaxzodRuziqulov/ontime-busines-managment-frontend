import apiClient from './client'
import type { StaffMember, StaffCreateRequest } from '@/types'

export const staffApi = {
  getAll: (businessId: string) =>
    apiClient.get<StaffMember[]>(`/businesses/${businessId}/staff`),

  create: (businessId: string, data: StaffCreateRequest) =>
    apiClient.post<StaffMember>(`/businesses/${businessId}/staff`, data),

  update: (businessId: string, staffId: string, data: Partial<StaffCreateRequest>) =>
    apiClient.put<StaffMember>(`/businesses/${businessId}/staff/${staffId}`, data),

  delete: (businessId: string, staffId: string) =>
    apiClient.delete(`/businesses/${businessId}/staff/${staffId}`),
}
