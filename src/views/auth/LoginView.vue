<template>
  <div class="relative flex min-h-screen overflow-hidden bg-[#081120] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(37,99,235,.22),transparent_27%),radial-gradient(circle_at_72%_78%,rgba(20,184,166,.16),transparent_25%)]" />
    <div class="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:42px_42px]" />

    <section class="relative hidden min-h-screen flex-1 lg:flex lg:max-w-[58%] lg:flex-col lg:justify-between lg:px-16 lg:py-12 xl:px-24">
      <AppLogo size="lg" />
      <div class="max-w-xl">
        <div
            class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/25 bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-200"
        >
          <Sparkles class="h-3.5 w-3.5" />
          {{ t('auth.tagline') }}
        </div>
        <h1
            class="text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl"
        >
          {{ t('auth.heroLine1') }}
          <br />
          <span
              class="bg-gradient-to-r from-primary-300 to-teal-300 bg-clip-text text-transparent"
          >
            {{ t('auth.heroHighlight') }}
          </span>
          {{ t('auth.heroLine2') }}
        </h1>
        <p class="mt-6 max-w-lg text-lg leading-8 text-slate-300">
          {{ t('auth.heroDesc') }}
        </p>
      </div>
      <div class="grid max-w-2xl grid-cols-3 gap-3">
        <div
            class="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"
        >
          <CalendarCheck2 class="h-5 w-5 text-teal-300" />
          <p class="mt-4 text-xl font-black">{{ t('auth.trialDays') }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ t('auth.freeTrial') }}</p>
        </div>
        <div
            class="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"
        >
          <UsersRound class="h-5 w-5 text-primary-300" />
          <p class="mt-4 text-xl font-black">{{ t('auth.unlimited') }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ t('auth.teamMembers') }}</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur">
          <ShieldCheck class="h-5 w-5 text-cyan-300" />
          <p class="mt-4 text-xl font-black">{{ t('auth.secure') }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ t('auth.managementSystem') }}</p>
        </div>
      </div>
    </section>

    <section class="relative flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:border-l lg:border-white/[.06]">
      <div class="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div class="w-full max-w-md">
        <AppLogo size="md" class="mb-10 lg:hidden" />
        <div class="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div class="mb-8">
            <p class="text-sm font-bold text-primary-300">
              OnTime Biznes
            </p>
            <h2 class="mt-2 text-3xl font-black tracking-tight">
              {{ t('auth.welcome') }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              {{ t('auth.loginDesc') }}
            </p>
          </div>

          <!-- Error -->
          <div
            v-if="route.query.reset === 'success'"
            class="mb-6 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          >
            {{ t('auth.resetSuccess') }}
          </div>

          <div
            v-if="error"
            class="mb-6 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <form
              @submit.prevent="handleLogin"
              class="space-y-5"
          >
            <!-- Login -->
            <div>
              <label
                  for="login-username"
                  class="mb-1.5 block text-sm font-bold text-slate-200"
              >
                {{ t('auth.login') }}
              </label>
              <input
                id="login-username"
                v-model="form.login"
                type="text"
                :placeholder="t('auth.loginPlaceholder')"
                autocomplete="username"
                @blur="validateLogin"
                :class="[
                  'w-full rounded-xl border bg-white/[.045] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30',
                  fieldErrors.login ? 'border-red-400/60' : 'border-white/10 focus:border-primary-400',
                ]"
              />
              <p
                  v-if="fieldErrors.login"
                  class="text-xs text-red-500 mt-1"
              >
                {{ fieldErrors.login }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label
                    for="login-password"
                    class="block text-sm font-bold text-slate-200"
                >
                  {{ t('auth.password') }}
                </label>
                <RouterLink
                    to="/forgot-password"
                    class="text-sm font-bold text-primary-300 transition hover:text-primary-200"
                >
                  {{ t('auth.forgotPassword') }}
                </RouterLink>
              </div>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  @blur="validatePassword"
                  :class="[
                    'w-full rounded-xl border bg-white/[.045] px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30',
                    fieldErrors.password ? 'border-red-400/60' : 'border-white/10 focus:border-primary-400',
                  ]"
                />
                <button
                  type="button"
                  :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-white"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
              <p
                  v-if="fieldErrors.password"
                  class="text-xs text-red-500 mt-1"
              >
                {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 font-bold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Loader2
                  v-if="loading"
                  class="w-5 h-5 animate-spin"
              />
              {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
              <ArrowRight
                  v-if="!loading"
                  class="h-4 w-4"
              />
            </button>
          </form>

          <p class="mt-7 text-center text-sm text-slate-400">
            {{ t('auth.noAccount') }}
            <RouterLink
                :to="{ name: 'register' }"
                class="font-bold text-primary-300 transition hover:text-primary-200"
                @click="error = ''"
            >
              {{ t('auth.register') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, CalendarCheck2, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Sparkles, UsersRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/common/AppLogo.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({ login: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({ login: '', password: '' })

function validateLogin() {
  fieldErrors.login = form.login.length < 3 ? t('auth.loginMin') : ''
}
function validatePassword() {
  fieldErrors.password = form.password.length < 1 ? t('auth.passwordRequired') : ''
}

const handleLogin = async () => {
  if (loading.value) return
  if (!form.login || !form.password) {
    error.value = t('auth.credentialsRequired')
    return
  }

  loading.value = true
  error.value = ''

  try {
    const data = await authStore.login(form)
    const isAdmin = data.admin || data.roles?.includes('ROLE_ADMIN')
    const isOwner = data.businessOwner || data.roles?.includes('ROLE_BUSINESS_OWNER')
    const isManager = data.roles?.includes('ROLE_MANAGER')
    const isStaff = data.roles?.includes('ROLE_STAFF')
    if (isAdmin) {
      await router.push('/admin')
    } else if (isOwner || isManager) {
      await router.push('/')
    } else if (isStaff) {
      await router.push('/staff-portal')
    } else {
      // Oddiy foydalanuvchi — biznes yaratish sahifasiga
      await router.push('/onboarding')
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      error.value = t('auth.invalidCredentials')
    } else {
      error.value = e.response?.data?.message || t('auth.serverError')
    }
  } finally {
    loading.value = false
  }
}
</script>