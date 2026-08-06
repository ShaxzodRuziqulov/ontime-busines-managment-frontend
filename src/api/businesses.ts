import apiClient from './client'
import type { Business, BusinessCategory, BusinessStatus, BusinessUpdateRequest, BusinessStatusUpdateRequest, Page } from '@/types'

export interface BusinessReviewRequest {
  action: 'APPROVE' | 'REJECT'
  note?: string
  subscriptionEndDate?: string
}

export const businessesApi = {
  getAll: (params?: {
    ownerId?: string
    page?: number
    size?: number
    sort?: string
    q?: string
    city?: string
    category?: BusinessCategory
    status?: BusinessStatus
  }) =>
    apiClient.get<Page<Business>>('/businesses', { params }),

  getCities: () =>
    apiClient.get<string[]>('/businesses/cities'),

  getById: (id: string) =>
    apiClient.get<Business>(`/businesses/${id}`),

  create: (data: Partial<Business>) =>
    apiClient.post<Business>('/businesses', data),

  update: (id: string, data: BusinessUpdateRequest) =>
    apiClient.put<Business>(`/businesses/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/businesses/${id}`),

  updateStatus: (id: string, data: BusinessStatusUpdateRequest) =>
    apiClient.put<Business>(`/businesses/${id}/status`, data),

  review: (id: string, data: BusinessReviewRequest) =>
    apiClient.post<Business>(`/businesses/${id}/review`, data),
}
