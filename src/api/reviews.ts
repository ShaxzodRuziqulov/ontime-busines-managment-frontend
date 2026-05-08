import apiClient from './client'
import type { Review } from '@/types'

export interface ReviewCreateRequest {
  bookingId: string
  stars: number
  comment?: string
}

export interface ReviewUpdateRequest {
  stars?: number
  comment?: string
}

export const reviewsApi = {
  getAll: (params?: { businessId?: string; staffId?: string }) =>
    apiClient.get<Review[]>('/reviews', { params: params ?? {} }),

  get: (id: string) =>
    apiClient.get<Review>(`/reviews/${id}`),

  create: (data: ReviewCreateRequest) =>
    apiClient.post<Review>('/reviews', data),

  update: (id: string, data: ReviewUpdateRequest) =>
    apiClient.put<Review>(`/reviews/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/reviews/${id}`),

  staffAvgRating: (staffId: string) =>
    apiClient.get<number>(`/reviews/staff/${staffId}/avg`),
}
