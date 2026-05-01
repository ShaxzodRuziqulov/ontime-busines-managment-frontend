import apiClient from './client'
import type { User, UserCreateRequest, UserUpdateRequest } from '@/types'

export const usersApi = {
  getAll: () =>
    apiClient.get<User[]>('/users'),

  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  create: (data: UserCreateRequest) =>
    apiClient.post<User>('/users', data),

  update: (id: string, data: UserUpdateRequest) =>
    apiClient.put<User>(`/users/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
}
