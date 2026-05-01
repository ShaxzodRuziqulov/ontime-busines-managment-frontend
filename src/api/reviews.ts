import apiClient from './client'
import type { Review } from '@/types'

export const reviewsApi = {
  getAll: (businessId?: string) =>
    apiClient.get<Review[]>('/reviews', { params: { businessId } }),

  create: (data: Omit<Review, 'id' | 'createdAt'>) =>
    apiClient.post<Review>('/reviews', data),
}
