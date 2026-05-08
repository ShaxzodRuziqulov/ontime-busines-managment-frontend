import apiClient from './client'
import type { OfferedService, ServiceCreateRequest } from '@/types'

export const servicesApi = {
  getAll: (businessId: string) =>
    apiClient.get<OfferedService[]>(`/businesses/${businessId}/services`),

  create: (businessId: string, data: ServiceCreateRequest) =>
    apiClient.post<OfferedService>(`/businesses/${businessId}/services`, data),

  update: (businessId: string, serviceId: string, data: Partial<ServiceCreateRequest>) =>
    apiClient.put<OfferedService>(`/businesses/${businessId}/services/${serviceId}`, data),

  delete: (businessId: string, serviceId: string) =>
    apiClient.delete(`/businesses/${businessId}/services/${serviceId}`),

  uploadImage: (businessId: string, serviceId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<OfferedService>(
      `/businesses/${businessId}/services/${serviceId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },

  deleteImage: (businessId: string, serviceId: string) =>
    apiClient.delete<OfferedService>(`/businesses/${businessId}/services/${serviceId}/image`),
}
