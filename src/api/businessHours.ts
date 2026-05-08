import apiClient from './client'
import type { BusinessHours, BusinessHoursCreateRequest, BusinessHoursUpdateRequest } from '@/types'

export const businessHoursApi = {
  getAll: (businessId: string) =>
    apiClient.get<BusinessHours[]>(`/businesses/${businessId}/hours`),

  create: (businessId: string, data: BusinessHoursCreateRequest) =>
    apiClient.post<BusinessHours>(`/businesses/${businessId}/hours`, data),

  update: (businessId: string, hoursId: string, data: BusinessHoursUpdateRequest) =>
    apiClient.put<BusinessHours>(`/businesses/${businessId}/hours/${hoursId}`, data),

  delete: (businessId: string, hoursId: string) =>
    apiClient.delete(`/businesses/${businessId}/hours/${hoursId}`),
}
