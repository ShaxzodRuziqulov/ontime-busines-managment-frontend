import apiClient from './client'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
} from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post('/auth/register', data),

  requestPasswordReset: (data: PasswordResetRequest) =>
    apiClient.post('/auth/password-reset/request', data),

  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    apiClient.post('/auth/password-reset/confirm', data),
}
