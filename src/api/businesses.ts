import apiClient from './client'
import type { Business, BusinessUpdateRequest, BusinessStatusUpdateRequest } from '@/types'

export const businessesApi = {
  getAll: (params?: { ownerId?: string }) =>
    apiClient.get<Business[]>('/businesses', { params }),

  getById: (id: string) =>
    apiClient.get<Business>(`/businesses/${id}`),

  create: (data: Partial<Business>) =>
    apiClient.post<Business>('/businesses', data),

  update: (id: string, data: BusinessUpdateRequest) =>
    apiClient.put<Business>(`/businesses/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/businesses/${id}`),

  updateStatus: (id: string, data: BusinessStatusUpdateRequest) =>
    apiClient.put(`/businesses/${id}/status`, data),
}
