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

  uploadAvatar: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<User>(`/users/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
}
