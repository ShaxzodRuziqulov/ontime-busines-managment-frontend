<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Clock, Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ login: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({ login: '', password: '' })

function validateLogin() {
  fieldErrors.login = form.login.length < 3 ? 'Login kamida 3 ta belgi bo\'lishi kerak' : ''
}
function validatePassword() {
  fieldErrors.password = form.password.length < 1 ? 'Parol kiritilishi shart' : ''
}

async function handleLogin() {
  if (!form.login || !form.password) {
    error.value = 'Login va parol kiritilishi shart'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await authStore.login(form)
    const isAdmin = data.admin || data.roles?.includes('ROLE_ADMIN')
    const isOwner = data.businessOwner || data.roles?.includes('ROLE_BUSINESS_OWNER')
    if (isAdmin) {
      router.push('/admin')
    } else if (isOwner) {
      router.push('/')
    } else {
      // Oddiy user — biznes yaratish sahifasiga
      router.push('/onboarding')
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      error.value = 'Login yoki parol noto\'g\'ri'
    } else {
      error.value = 'Serverga ulanishda xatolik'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
    <!-- Left: Branding -->
    <div class="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
      <div class="flex items-center gap-3 mb-10">
        <div class="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Clock class="w-6 h-6 text-white" />
        </div>
        <span class="text-2xl font-bold tracking-tight">OnTime Business</span>
      </div>

      <h1 class="text-4xl font-bold leading-tight mb-4">
        Biznesingizni<br />
        <span class="text-primary-400">aqlli boshqaring</span>
      </h1>
      <p class="text-slate-400 text-lg leading-relaxed max-w-md">
        Navbatlar, xodimlar va xizmatlarni yagona platformada boshqaring. Mijozlaringiz vaqtini tejang.
      </p>

      <div class="mt-12 grid grid-cols-3 gap-6">
        <div
          v-for="stat in [
            { value: '14', label: 'Kun bepul sinov' },
            { value: '∞', label: 'Xodim qo\'shish' },
            { value: '24/7', label: 'Ishlash vaqti' },
          ]"
          :key="stat.label"
          class="bg-white/5 rounded-2xl p-4"
        >
          <div class="text-2xl font-bold text-primary-400">{{ stat.value }}</div>
          <div class="text-sm text-slate-400 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Right: Login form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Mobile logo -->
        <div class="flex items-center gap-2 mb-8 lg:hidden">
          <div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Clock class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-white">OnTime Business</span>
        </div>

        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-slate-800">Xush kelibsiz!</h2>
            <p class="text-slate-500 mt-1">Business panelga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <!-- Login -->
            <div>
              <label for="login-username" class="block text-sm font-medium text-slate-700 mb-1.5">Login</label>
              <input
                id="login-username"
                v-model="form.login"
                type="text"
                placeholder="loginni kiriting"
                autocomplete="username"
                @blur="validateLogin"
                :class="[
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white',
                  fieldErrors.login ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-primary-500',
                ]"
              />
              <p v-if="fieldErrors.login" class="text-xs text-red-500 mt-1">{{ fieldErrors.login }}</p>
            </div>

            <!-- Password -->
            <div>
              <label for="login-password" class="block text-sm font-medium text-slate-700 mb-1.5">Parol</label>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  @blur="validatePassword"
                  :class="[
                    'w-full px-4 py-3 pr-12 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white',
                    fieldErrors.password ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-primary-500',
                  ]"
                />
                <button
                  type="button"
                  :aria-label="showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
              <p v-if="fieldErrors.password" class="text-xs text-red-500 mt-1">{{ fieldErrors.password }}</p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Kirilmoqda...' : 'Kirish' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            Hali hisobingiz yo'qmi?
            <RouterLink to="/register" class="font-semibold text-primary-600 hover:text-primary-700">
              Ro'yxatdan o'ting
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
