<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Clock, Loader2, AlertCircle, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  login: '',
  password: '',
  displayName: '',
  email: '',
  phone: '',
})
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({ displayName: '', login: '', password: '' })

function validateDisplayName() {
  fieldErrors.displayName = form.displayName.length < 2 ? 'Ism kamida 2 ta belgi bo\'lishi kerak' : ''
}
function validateLogin() {
  fieldErrors.login = form.login.length < 3 ? 'Login kamida 3 ta belgi bo\'lishi kerak' : ''
}
function validatePassword() {
  fieldErrors.password = form.password.length < 8 ? 'Parol kamida 8 ta belgi bo\'lishi kerak' : ''
}

async function handleRegister() {
  if (!form.login || !form.displayName) {
    error.value = 'Login va ism kiritilishi shart'
    return
  }
  if (form.password.length < 8) {
    error.value = 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register(form)
    router.push('/onboarding')
  } catch (e: any) {
    if (e.response?.status === 409) {
      error.value = 'Bu login allaqachon band'
    } else if (e.response?.status === 400) {
      error.value = e.response.data?.message || 'Ma\'lumotlar noto\'g\'ri'
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
        <span class="text-primary-400">bugun boshlang</span>
      </h1>
      <p class="text-slate-400 text-lg leading-relaxed max-w-md">
        14 kun bepul sinov davri bilan biznesingizni ro'yxatdan o'tkazing va navbat boshqaruvini boshlang.
      </p>

      <div class="mt-12 space-y-4">
        <div
          v-for="step in [
            { num: '1', text: 'Ro\'yxatdan o\'ting' },
            { num: '2', text: 'Biznesingizni yarating' },
            { num: '3', text: '14 kun bepul foydalaning' },
          ]"
          :key="step.num"
          class="flex items-center gap-4"
        >
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {{ step.num }}
          </div>
          <span class="text-slate-300">{{ step.text }}</span>
        </div>
      </div>
    </div>

    <!-- Right: Register form -->
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
            <div class="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus class="w-6 h-6 text-primary-600" />
            </div>
            <h2 class="text-2xl font-bold text-slate-800">Ro'yxatdan o'tish</h2>
            <p class="text-slate-500 mt-1">Hisob yarating va biznesingizni boshqaring</p>
          </div>

          <!-- Error -->
          <div
            v-if="error"
            class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Display name -->
            <div>
              <label for="reg-displayname" class="block text-sm font-medium text-slate-700 mb-1.5">To'liq ism *</label>
              <input
                id="reg-displayname"
                v-model="form.displayName"
                type="text"
                placeholder="Ism Familiya"
                autocomplete="name"
                @blur="validateDisplayName"
                :class="[
                  'w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white',
                  fieldErrors.displayName ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-primary-500',
                ]"
              />
              <p v-if="fieldErrors.displayName" class="text-xs text-red-500 mt-1">{{ fieldErrors.displayName }}</p>
            </div>

            <!-- Login -->
            <div>
              <label for="reg-username" class="block text-sm font-medium text-slate-700 mb-1.5">Login *</label>
              <input
                id="reg-username"
                v-model="form.login"
                type="text"
                placeholder="username"
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
              <label for="reg-password" class="block text-sm font-medium text-slate-700 mb-1.5">Parol *</label>
              <div class="relative">
                <input
                  id="reg-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="new-password"
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

            <!-- Email & Phone -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="reg-email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  id="reg-email"
                  v-model="form.email"
                  type="email"
                  placeholder="email@example.com"
                  autocomplete="email"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
              <div>
                <label for="reg-phone" class="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                <input
                  id="reg-phone"
                  v-model="form.phone"
                  type="tel"
                  placeholder="+998901234567"
                  autocomplete="tel"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Davom etish' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            Hisobingiz bormi?
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-700">
              Kirish
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
