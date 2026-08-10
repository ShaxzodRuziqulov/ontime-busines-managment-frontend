<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, CheckCircle2, Clock, Loader2, LockKeyhole, MailCheck } from 'lucide-vue-next'
import { authApi } from '@/api/auth'

const router = useRouter()
const step = ref<'request' | 'confirm'>('request')
const loading = ref(false)
const error = ref('')
const message = ref('')
const form = reactive({
  login: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

async function sendCode() {
  error.value = ''
  message.value = ''

  if (form.login.trim().length < 3) {
    error.value = 'Login kamida 3 ta belgi bo\'lishi kerak'
    return
  }

  loading.value = true
  try {
    await authApi.requestPasswordReset({ login: form.login.trim() })
    message.value = 'Agar login mavjud bo\'lsa, emailga kod yuborildi.'
    step.value = 'confirm'
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Kodni yuborishda xatolik yuz berdi'
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  error.value = ''
  message.value = ''

  if (form.code.trim().length !== 6) {
    error.value = '6 xonali kodni kiriting'
    return
  }
  if (form.newPassword.length < 4) {
    error.value = 'Parol kamida 4 ta belgi bo\'lishi kerak'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Parollar mos emas'
    return
  }

  loading.value = true
  try {
    await authApi.confirmPasswordReset({
      login: form.login.trim(),
      code: form.code.trim(),
      newPassword: form.newPassword,
    })
    router.push({ name: 'login', query: { reset: 'success' } })
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Kod noto\'g\'ri yoki muddati o\'tgan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
    <div class="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
      <div class="flex items-center gap-3 mb-10">
        <div class="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Clock class="w-6 h-6 text-white" />
        </div>
        <span class="text-2xl font-bold tracking-tight">OnTime Business</span>
      </div>

      <h1 class="text-4xl font-bold leading-tight mb-4">
        Hisobingizga<br />
        <span class="text-primary-400">qayta kiring</span>
      </h1>
      <p class="text-slate-400 text-lg leading-relaxed max-w-md">
        Login orqali kod so'rang va emailingizga kelgan tasdiqlash kodi bilan yangi parol o'rnating.
      </p>
    </div>

    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <div class="flex items-center gap-2 mb-8 lg:hidden">
          <div class="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Clock class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-white">OnTime Business</span>
        </div>

        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <div class="mb-8">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <MailCheck v-if="step === 'request'" class="w-6 h-6" />
              <LockKeyhole v-else class="w-6 h-6" />
            </div>
            <h2 class="text-2xl font-bold text-slate-800">Parolni tiklash</h2>
            <p class="text-slate-500 mt-1">
              {{ step === 'request' ? 'Loginni kiriting, emailga kod yuboramiz' : 'Kod va yangi parolni kiriting' }}
            </p>
          </div>

          <div
            v-if="error"
            class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <div
            v-if="message"
            class="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-6 text-sm"
          >
            <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
            {{ message }}
          </div>

          <form v-if="step === 'request'" @submit.prevent="sendCode" class="space-y-5">
            <div>
              <label for="reset-login" class="block text-sm font-medium text-slate-700 mb-1.5">Login</label>
              <input
                id="reset-login"
                v-model="form.login"
                type="text"
                placeholder="loginni kiriting"
                autocomplete="username"
                class="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Yuborilmoqda...' : 'Kod yuborish' }}
            </button>
          </form>

          <form v-else @submit.prevent="resetPassword" class="space-y-5">
            <div>
              <label for="reset-code" class="block text-sm font-medium text-slate-700 mb-1.5">Kod</label>
              <input
                id="reset-code"
                v-model="form.code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="6 xonali kod"
                class="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
              />
            </div>

            <div>
              <label for="new-password" class="block text-sm font-medium text-slate-700 mb-1.5">Yangi parol</label>
              <input
                id="new-password"
                v-model="form.newPassword"
                type="password"
                autocomplete="new-password"
                placeholder="Kamida 4 belgi"
                class="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
              />
            </div>

            <div>
              <label for="confirm-password" class="block text-sm font-medium text-slate-700 mb-1.5">Parolni tasdiqlang</label>
              <input
                id="confirm-password"
                v-model="form.confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="Yangi parolni qayta kiriting"
                class="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Saqlanmoqda...' : 'Parolni almashtirish' }}
            </button>

            <button type="button" class="w-full text-sm font-semibold text-primary-600 hover:text-primary-700" @click="step = 'request'">
              Loginni o'zgartirish
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            Parol esingizdami?
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-700">
              Tizimga kiring
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
