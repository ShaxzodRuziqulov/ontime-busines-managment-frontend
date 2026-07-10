import apiClient from './client'
import type { StaffMember, StaffCreateRequest, StaffRegisterRequest, StaffAccountUpdateRequest } from '@/types'
import type { UserLookup } from './users'

export const staffApi = {
  getAll: (businessId: string) =>
    apiClient.get<StaffMember[]>(`/businesses/${businessId}/staff`),

  create: (businessId: string, data: StaffCreateRequest) =>
    apiClient.post<StaffMember>(`/businesses/${businessId}/staff`, data),

  register: (businessId: string, data: StaffRegisterRequest) =>
    apiClient.post<StaffMember>(`/businesses/${businessId}/staff/register`, data),

  registerForExisting: (businessId: string, staffId: string, data: StaffRegisterRequest) =>
    apiClient.post<StaffMember>(`/businesses/${businessId}/staff/${staffId}/register`, data),

  update: (businessId: string, staffId: string, data: Partial<StaffCreateRequest>) =>
    apiClient.put<StaffMember>(`/businesses/${businessId}/staff/${staffId}`, data),

  getAccount: (businessId: string, staffId: string) =>
    apiClient.get<UserLookup>(`/businesses/${businessId}/staff/${staffId}/account`),

  updateAccount: (businessId: string, staffId: string, data: StaffAccountUpdateRequest) =>
    apiClient.put<StaffMember>(`/businesses/${businessId}/staff/${staffId}/account`, data),

  delete: (businessId: string, staffId: string) =>
    apiClient.delete(`/businesses/${businessId}/staff/${staffId}`),
}
