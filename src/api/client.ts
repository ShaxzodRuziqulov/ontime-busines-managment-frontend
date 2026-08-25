import axios from 'axios'
import { useToast } from '@/composables/useToast'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9092/api/v1'

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

function isAuthRequest(url?: string) {
  return !!url && (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/password-reset')
  )
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      import('@/stores/auth').then(({ useAuthStore }) => {
        useAuthStore().logout()
      })
      import('@/router').then(({ default: router }) => {
        if (router.currentRoute.value.name !== 'login') {
          router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
        }
      })
    }
    // 402 Payment Required — sinov/obuna muddati tugagan (read-only rejim).
    // Backend yozuv amalini bloklaydi; foydalanuvchini ogohlantirib, biznes
    // holatini yangilaymiz — shunda UI darhol read-only ko'rinishga o'tadi.
    if (error.response?.status === 402) {
      const message = error.response?.data?.message
        || "Sinov/obuna muddati tugagan. Faqat ko'rish mumkin — obuna sotib oling."
      useToast().warning(message)
      import('@/stores/business').then(({ useBusinessStore }) => {
        useBusinessStore().fetchMyBusiness()
      })
    }
    return Promise.reject(error)
  }
)

export default apiClient
