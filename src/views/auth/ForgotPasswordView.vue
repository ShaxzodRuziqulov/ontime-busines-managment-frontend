<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, MailCheck } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const step = ref<'request' | 'confirm'>('request')
const loading = ref(false)
const error = ref('')
const message = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
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
    form.login = form.login.trim()
    await authApi.requestPasswordReset({ login: form.login })
    message.value = 'Agar login mavjud bo\'lsa, emailga kod yuborildi.'
    step.value = 'confirm'
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Kodni yuborishda xatolik yuz berdi'
  } finally {
    loading.value = false
  }
}

function normalizeCode() {
  form.code = form.code.replace(/\D/g, '').slice(0, 6)
}

function changeLogin() {
  error.value = ''
  message.value = ''
  form.code = ''
  form.newPassword = ''
  form.confirmPassword = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  step.value = 'request'
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
    form.code = ''
    form.newPassword = ''
    form.confirmPassword = ''
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
      <AppLogo size="lg" class="mb-10" />

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
        <AppLogo size="md" class="mb-8 lg:hidden" />

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
                required
                :disabled="loading"
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
                pattern="[0-9]{6}"
                placeholder="6 xonali kod"
                required
                :disabled="loading"
                @input="normalizeCode"
                class="w-full px-4 py-3 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
              />
            </div>

            <div>
              <label for="new-password" class="block text-sm font-medium text-slate-700 mb-1.5">Yangi parol</label>
              <div class="relative">
                <input
                  id="new-password"
                  v-model="form.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Kamida 4 belgi"
                  required
                  minlength="4"
                  :disabled="loading"
                  class="w-full px-4 py-3 pr-12 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
                />
                <button
                  type="button"
                  :aria-label="showNewPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  @click="showNewPassword = !showNewPassword"
                >
                  <EyeOff v-if="showNewPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label for="confirm-password" class="block text-sm font-medium text-slate-700 mb-1.5">Parolni tasdiqlang</label>
              <div class="relative">
                <input
                  id="confirm-password"
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Yangi parolni qayta kiriting"
                  required
                  minlength="4"
                  :disabled="loading"
                  class="w-full px-4 py-3 pr-12 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
                />
                <button
                  type="button"
                  :aria-label="showConfirmPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <EyeOff v-if="showConfirmPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Saqlanmoqda...' : 'Parolni almashtirish' }}
            </button>

            <div class="grid gap-2 sm:grid-cols-2">
              <button type="button" :disabled="loading" class="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60" @click="changeLogin">
                Loginni o'zgartirish
              </button>
              <button type="button" :disabled="loading" class="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60" @click="sendCode">
                Kodni qayta yuborish
              </button>
            </div>
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
