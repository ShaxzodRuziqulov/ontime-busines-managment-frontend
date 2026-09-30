<template>
  <div class="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
    <div class="absolute right-4 top-4 z-10">
      <LanguageSwitcher />
    </div>
    <div class="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
      <AppLogo size="lg" class="mb-10" />

      <h1 class="text-4xl font-bold leading-tight mb-4">
        {{ t('auth.fpHeroLine1') }}
        <br />
        <span class="text-primary-400">
          {{ t('auth.fpHeroHighlight') }}
        </span>
      </h1>
      <p class="text-slate-400 text-lg leading-relaxed max-w-md">
        {{ t('auth.fpHeroDesc') }}
      </p>
    </div>

    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <AppLogo size="md" class="mb-8 lg:hidden" />

        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <div class="mb-8">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
              <MailCheck
                  v-if="step === 'request'"
                  class="w-6 h-6"
              />
              <LockKeyhole
                  v-else
                  class="w-6 h-6"
              />
            </div>
            <h2 class="text-2xl font-bold text-slate-800">{{ t('auth.resetTitle') }}</h2>
            <p class="text-slate-500 mt-1">
              {{ step === 'request' ? t('auth.resetRequestDesc') : t('auth.resetConfirmDesc') }}
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

          <form
              v-if="step === 'request'"
              @submit.prevent="sendCode"
              class="space-y-5"
          >
            <div>
              <label
                  for="reset-login"
                  class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {{ t('auth.login') }}
              </label>
              <input
                id="reset-login"
                v-model="form.login"
                type="text"
                :placeholder="t('auth.loginPlaceholder')"
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
              {{ loading ? t('auth.sending') : t('auth.sendCode') }}
            </button>
          </form>

          <form
              v-else
              @submit.prevent="resetPassword"
              class="space-y-5"
          >
            <div>
              <label
                  for="reset-code-0"
                  class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {{ t('auth.code') }}
              </label>
              <div class="flex justify-between gap-2">
                <input
                  v-for="(_, index) in codeDigits"
                  :id="`reset-code-${index}`"
                  :key="index"
                  :ref="el => setCodeInput(el, index)"
                  :value="codeDigits[index]"
                  type="text"
                  inputmode="numeric"
                  :autocomplete="index === 0 ? 'one-time-code' : 'off'"
                  :aria-label="t('auth.codeDigit', { n: index + 1 })"
                  :disabled="loading"
                  class="w-12 h-14 sm:w-14 text-center text-2xl font-semibold rounded-xl border text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
                  @input="onCodeInput($event, index)"
                  @keydown="onCodeKeydown($event, index)"
                  @paste.prevent="onCodePaste($event, index)"
                  @focus="($event.target as HTMLInputElement).select()"
                />
              </div>
            </div>

            <div>
              <label
                  for="new-password"
                  class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {{ t('auth.newPassword') }}
              </label>
              <div class="relative">
                <input
                  id="new-password"
                  v-model="form.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :placeholder="t('auth.min4')"
                  required
                  minlength="4"
                  :disabled="loading"
                  class="w-full px-4 py-3 pr-12 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
                />
                <button
                  type="button"
                  :aria-label="showNewPassword ? t('auth.hidePassword') : t('auth.showPassword')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  @click="showNewPassword = !showNewPassword"
                >
                  <EyeOff v-if="showNewPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label
                  for="confirm-password"
                  class="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {{ t('auth.confirmPassword') }}
              </label>
              <div class="relative">
                <input
                  id="confirm-password"
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  :placeholder="t('auth.confirmPasswordPlaceholder')"
                  required
                  minlength="4"
                  :disabled="loading"
                  class="w-full px-4 py-3 pr-12 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white border-slate-200 focus:ring-primary-500"
                />
                <button
                  type="button"
                  :aria-label="showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')"
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
              {{ loading ? t('common.saving') : t('auth.changePassword') }}
            </button>

            <div class="grid gap-2 sm:grid-cols-2">
              <button
                  type="button"
                  :disabled="loading"
                  class="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60"
                  @click="changeLogin"
              >
                {{ t('auth.changeLogin') }}
              </button>
              <button
                  type="button"
                  :disabled="loading"
                  class="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60"
                  @click="sendCode"
              >
                {{ t('auth.resendCode') }}
              </button>
            </div>
          </form>

          <p class="mt-6 text-center text-sm text-slate-500">
            {{ t('auth.rememberPassword') }}
            <RouterLink to="/login" class="font-semibold text-primary-600 hover:text-primary-700">
              {{ t('auth.signInAgain') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, MailCheck } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import AppLogo from '@/components/common/AppLogo.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

const CODE_LENGTH = 6
const codeDigits = ref<string[]>(Array(CODE_LENGTH).fill(''))
const codeInputs: HTMLInputElement[] = []

watch(step, async (value) => {
  if (value !== 'confirm') return
  await nextTick()
  focusCodeInput(0)
})

async function sendCode() {
  error.value = ''
  message.value = ''

  if (form.login.trim().length < 3) {
    error.value = t('auth.loginMin')
    return
  }

  loading.value = true
  try {
    form.login = form.login.trim()
    await authApi.requestPasswordReset({ login: form.login })
    message.value = t('auth.codeSent')
    step.value = 'confirm'
  } catch (e: any) {
    error.value = e.response?.data?.message || t('auth.sendCodeError')
  } finally {
    loading.value = false
  }
}

function setCodeInput(el: unknown, index: number) {
  if (el instanceof HTMLInputElement) codeInputs[index] = el
}

function focusCodeInput(index: number) {
  codeInputs[Math.max(0, Math.min(CODE_LENGTH - 1, index))]?.focus()
}

function syncCode() {
  form.code = codeDigits.value.join('')
}

function clearCode() {
  codeDigits.value = Array(CODE_LENGTH).fill('')
  syncCode()
}

// Bir nechta raqamni (paste yoki SMS/email autofill) index'dan boshlab joylaydi
function fillCodeFrom(index: number, value: string) {
  const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH - index).split('')
  digits.forEach((digit, i) => {
    codeDigits.value[index + i] = digit
  })
  syncCode()
  return digits.length
}

function onCodeInput(event: Event, index: number) {
  const target = event.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')

  if (!digits) {
    codeDigits.value[index] = ''
    target.value = ''
    syncCode()
    return
  }

  if (digits.length > 1) {
    const filled = fillCodeFrom(index, digits)
    target.value = codeDigits.value[index]
    focusCodeInput(index + filled)
    return
  }

  codeDigits.value[index] = digits
  target.value = digits
  syncCode()
  if (index < CODE_LENGTH - 1) focusCodeInput(index + 1)
}

function onCodeKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Backspace') {
    if (codeDigits.value[index]) {
      codeDigits.value[index] = ''
      syncCode()
    } else if (index > 0) {
      codeDigits.value[index - 1] = ''
      syncCode()
      focusCodeInput(index - 1)
    }
    event.preventDefault()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    focusCodeInput(index - 1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    focusCodeInput(index + 1)
  }
}

function onCodePaste(event: ClipboardEvent, index: number) {
  const text = event.clipboardData?.getData('text') ?? ''
  const filled = fillCodeFrom(index, text)
  if (filled) focusCodeInput(index + filled)
}

function changeLogin() {
  error.value = ''
  message.value = ''
  clearCode()
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
    error.value = t('auth.enterCode')
    return
  }
  if (form.newPassword.length < 4) {
    error.value = t('auth.passwordMin')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = t('auth.passwordsMismatch')
    return
  }

  loading.value = true
  try {
    await authApi.confirmPasswordReset({
      login: form.login.trim(),
      code: form.code.trim(),
      newPassword: form.newPassword,
    })
    clearCode()
    form.newPassword = ''
    form.confirmPassword = ''
    await router.push({name: 'login', query: {reset: 'success'}})
  } catch (e: any) {
    error.value = e.response?.data?.message || t('auth.codeInvalid')
  } finally {
    loading.value = false
  }
}
</script>
