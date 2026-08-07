import { useAuthStore } from '@/stores/auth'

/**
 * Joriy sessiya haqiqiyligini tekshiradi.
 * Token muddati tugagan bo'lsa, avtomatik logout qiladi va false qaytaradi.
 */
export function checkToken(): boolean {
    const auth = useAuthStore()
    return auth.checkAuth()
}