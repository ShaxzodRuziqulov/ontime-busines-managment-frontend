import apiClient from './client'
import type { Customer, CustomerCreateRequest, CustomerUpdateRequest, Page } from '@/types'

export const customersApi = {
  getAll: (businessId: string, params?: { search?: string; page?: number; size?: number }) =>
    apiClient.get<Page<Customer>>(`/businesses/${businessId}/customers`, { params }),

  getById: (businessId: string, customerId: string) =>
    apiClient.get<Customer>(`/businesses/${businessId}/customers/${customerId}`),

  create: (businessId: string, data: CustomerCreateRequest) =>
    apiClient.post<Customer>(`/businesses/${businessId}/customers`, data),

  update: (businessId: string, customerId: string, data: CustomerUpdateRequest) =>
    apiClient.put<Customer>(`/businesses/${businessId}/customers/${customerId}`, data),

  delete: (businessId: string, customerId: string) =>
    apiClient.delete(`/businesses/${businessId}/customers/${customerId}`),
}
