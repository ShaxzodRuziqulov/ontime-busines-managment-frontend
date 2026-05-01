import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types'

function parseJwtRoles(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.roles ? payload.roles.split(' ') : []
  } catch {
    return []
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthResponse | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  // Faqat xotirada — localStorage'ga saqlanmaydi
  const pendingCredentials = ref<{ login: string; password: string } | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.admin || user.value?.roles?.includes('ROLE_ADMIN') || false)
  const isBusinessOwner = computed(() =>
    user.value?.roles?.some(r => ['ROLE_BUSINESS_OWNER', 'ROLE_ADMIN'].includes(r)) ?? false
  )

  async function login(credentials: LoginRequest) {
    const { data } = await authApi.login(credentials)
    if (!data.roles || data.roles.length === 0) {
      data.roles = parseJwtRoles(data.accessToken)
    }
    user.value = data
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('user', JSON.stringify(data))
    return data
  }

  async function register(data: RegisterRequest) {
    await authApi.register(data)
    // Keyingi re-login uchun credentials'ni xotirada saqlash
    pendingCredentials.value = { login: data.login, password: data.password }
    return login({ login: data.login, password: data.password })
  }

  // Biznes yaratgandan keyin yangi token (businessOwner: true) olish uchun
  async function relogin() {
    if (!pendingCredentials.value) return null
    const creds = pendingCredentials.value
    pendingCredentials.value = null
    return login(creds)
  }

  function logout() {
    user.value = null
    pendingCredentials.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    isBusinessOwner,
    hasPendingCredentials: computed(() => !!pendingCredentials.value),
    login,
    register,
    relogin,
    logout,
  }
})
