import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types'

function parseJwtPayload(token: string): Record<string, any> | null {
    try {
        return JSON.parse(atob(token.split('.')[1]))
    } catch {
        return null
    }
}

function parseJwtRoles(token: string): string[] {
    const payload = parseJwtPayload(token)
    return Array.isArray(payload?.roles) ? payload.roles : []
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<AuthResponse | null>(
        JSON.parse(localStorage.getItem('user') || 'null')
    );
    const token = ref<string | null>(localStorage.getItem('token'))

    const pendingCredentials = ref<{ login: string; password: string } | null>(null)

    const isAuthenticated = computed(() => !!user.value)
    const isAdmin = computed(() => user.value?.admin === true || (user.value?.roles?.includes('ROLE_ADMIN') ?? false))
    const isBusinessOwner = computed(() => user.value?.roles?.includes('ROLE_BUSINESS_OWNER') ?? false)
    const isManager = computed(() => user.value?.roles?.includes('ROLE_MANAGER') ?? false)
    const isStaff = computed(() => user.value?.roles?.includes('ROLE_STAFF') ?? false)
    const canManageBusiness = computed(() =>
        user.value?.roles?.some(r => ['ROLE_BUSINESS_OWNER', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(r)) ?? false
    )

    // Token muddati tugaganini tekshirish. `exp` claim bo'lmasa — muddatsiz deb hisoblanadi.
    function isTokenExpired(): boolean {
        if (!token.value) return true
        const payload = parseJwtPayload(token.value)
        if (!payload?.exp) return false
        // JWT `exp` soniyalarda, Date.now() millisekundlarda
        return Date.now() >= payload.exp * 1000
    }

    // Sessiya haqiqiy holatini tekshiradi: token bor-yo'qligi va muddati.
    // Muddati tugagan bo'lsa — avtomatik logout qiladi va false qaytaradi.
    function checkAuth(): boolean {
        if (!user.value || !token.value) return false
        if (isTokenExpired()) {
            logout()
            return false
        }
        return true
    }

    async function login(credentials: LoginRequest) {
        const { data } = await authApi.login(credentials)
        if (!data || typeof data !== 'object') {
            throw new Error('Serverdan noto\'g\'ri javob keldi')
        }
        if (!data.roles || data.roles.length === 0) {
            data.roles = parseJwtRoles(data.accessToken)
        }
        user.value = data
        token.value = data.accessToken
        localStorage.setItem('token', data.accessToken)
        localStorage.setItem('user', JSON.stringify(data))
        const { useBusinessStore } = await import('./business')
        useBusinessStore().clear()
        return data
    }

    async function register(data: RegisterRequest) {
        await authApi.register(data)
        pendingCredentials.value = { login: data.login, password: data.password }
        return login({ login: data.login, password: data.password })
    }

    async function relogin() {
        if (!pendingCredentials.value) return null
        const creds = pendingCredentials.value
        pendingCredentials.value = null
        return login(creds)
    }

    function updateAvatar(avatarUrl: string | null) {
        if (!user.value) return
        user.value = { ...user.value, avatarUrl }
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    function updateProfile(partial: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null }) {
        if (!user.value) return
        user.value = { ...user.value, ...partial }
        localStorage.setItem('user', JSON.stringify(user.value))
    }

    function logout() {
        user.value = null
        token.value = null
        pendingCredentials.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        import('./business').then(({ useBusinessStore }) => {
            useBusinessStore().clear()
        })
    }

    return {
        user,
        token,
        isAuthenticated,
        isAdmin,
        isBusinessOwner,
        isManager,
        isStaff,
        canManageBusiness,
        hasPendingCredentials: computed(() => !!pendingCredentials.value),
        isTokenExpired,
        checkAuth,
        login,
        register,
        relogin,
        updateAvatar,
        updateProfile,
        logout,
    }
})