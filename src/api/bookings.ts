import apiClient from './client'
import type { Booking, BookingCreateRequest, BookingUpdateRequest } from '@/types'

export const bookingsApi = {
  getAll: (params?: { customerId?: string; businessId?: string }) =>
    apiClient.get<Booking[]>('/bookings', { params }),

  get: (id: string) =>
    apiClient.get<Booking>(`/bookings/${id}`),

  create: (data: BookingCreateRequest) =>
    apiClient.post<Booking>('/bookings', data),

  update: (id: string, data: BookingUpdateRequest) =>
    apiClient.put<Booking>(`/bookings/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/bookings/${id}`),
}
