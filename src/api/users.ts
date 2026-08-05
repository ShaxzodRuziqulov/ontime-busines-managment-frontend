import apiClient from './client'
import type { User, UserCreateRequest, UserUpdateRequest } from '@/types'

export interface UserLookup {
  id: string
  login: string
  firstName: string | null
  lastName: string | null
  email?: string
  phone?: string
}

export const usersApi = {
  getAll: () =>
    apiClient.get<User[]>('/users'),

  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  lookupByLogin: (login: string) =>
    apiClient.get<UserLookup>(`/users/by-login/${encodeURIComponent(login)}`),

  /** Telefon bo'yicha ro'yxatdagi mijoz(lar)ni qidiradi — topilmasa bo'sh massiv. */
  lookupByPhone: (phone: string) =>
    apiClient.get<UserLookup[]>(`/users/by-phone/${encodeURIComponent(phone)}`),

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
