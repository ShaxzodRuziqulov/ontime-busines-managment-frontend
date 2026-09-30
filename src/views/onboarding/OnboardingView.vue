<template>
  <div class="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
    <div class="absolute right-4 top-4 z-10">
      <LanguageSwitcher />
    </div>
    <div class="w-full max-w-lg">
      <!-- Logo -->
      <AppLogo size="md" class="justify-center mb-8" />

      <!-- Success state -->
      <div v-if="step === 'done'" class="bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 class="w-8 h-8 text-emerald-600" />
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">{{ t('onboarding.created') }}</h2>
        <p class="text-slate-500 text-sm">{{ t('onboarding.openingPanel') }}</p>
      </div>

      <!-- Re-login loading state -->
      <div v-else-if="step === 'relogin'" class="bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Loader2 class="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-2">{{ t('onboarding.updatingAccount') }}</h2>
        <p class="text-slate-500 text-sm">{{ t('onboarding.grantingRights') }}</p>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-3xl shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 class="w-7 h-7 text-primary-600" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800">{{ t('onboarding.title') }}</h2>
          <p class="text-slate-500 text-sm mt-1.5">
            {{ t('onboarding.subtitle') }}
          </p>
        </div>

        <!-- Progress -->
        <div class="flex items-center gap-2 mb-8">
          <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <div class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 class="w-3 h-3 text-white" />
            </div>
            {{ t('onboarding.stepRegister') }}
          </div>
          <div class="flex-1 h-px bg-primary-200 mx-1" />
          <div class="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
            <div class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">2</div>
            {{ t('onboarding.stepBusiness') }}
          </div>
        </div>

        <!-- Xodim sifatida taklif qilinganlar uchun eslatma -->
        <div class="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5 text-sm">
          <Info class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div class="text-blue-700">
            <p v-html="t('onboarding.noteOwnerHtml')" />
            <p class="mt-1">
              <span v-html="t('onboarding.noteStaffHtml')" />
              <button type="button" class="underline font-medium hover:text-blue-800" @click="logoutAndWait">
                {{ t('onboarding.relogin') }}
              </button>.
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <form @submit.prevent="handleCreate" class="space-y-4">
          <!-- Business name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('onboarding.name') }} *
            </label>
            <div class="relative">
              <Building2 class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.name"
                type="text"
                :placeholder="t('onboarding.namePlaceholder')"
                autofocus
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <!-- Business category -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('onboarding.category') }} *
            </label>
            <div class="relative">
              <Tag class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                v-model="form.category"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm appearance-none"
              >
                <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('onboarding.description') }}
              <span class="text-slate-400 font-normal">{{ t('onboarding.optional') }}</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <textarea
                v-model="form.description"
                :placeholder="t('onboarding.descriptionPlaceholder')"
                rows="2"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white resize-none text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                {{ t('onboarding.phone') }}
                <span class="text-slate-400 font-normal">{{ t('onboarding.optional') }}</span>
              </label>
              <div class="relative">
                <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                {{ t('onboarding.address') }}
                <span class="text-slate-400 font-normal">{{ t('onboarding.optional') }}</span>
              </label>
              <div class="relative">
                <MapPin class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.address"
                  type="text"
                  :placeholder="t('onboarding.addressPlaceholder')"
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <!-- City -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('onboarding.city') }}
              <span class="text-slate-400 font-normal">{{ t('onboarding.optional') }}</span>
            </label>
            <div class="relative">
              <MapPin class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.city"
                type="text"
                :placeholder="t('onboarding.cityPlaceholder')"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('onboarding.mapLocation') }}
              <span class="text-slate-400 font-normal">{{ t('onboarding.optional') }}</span>
            </label>
            <MapPicker
              v-model="mapPoint"
              :address-line="form.address"
              :city="form.city"
              @address-selected="applyMapAddress"
            />
          </div>

          <!-- Trial info -->
          <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Clock class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700" v-html="t('onboarding.trialInfoHtml')" />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading || !form.name.trim()"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            {{ loading ? t('onboarding.creating') : t('onboarding.create') }}
          </button>
        </form>

        <p class="mt-5 text-center text-xs text-slate-400">
          {{ t('onboarding.laterHint') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Clock, Loader2, AlertCircle, CheckCircle2, MapPin, Phone, FileText, Info, Tag } from 'lucide-vue-next'
import { businessesApi } from '@/api/businesses'
import { useAuthStore } from '@/stores/auth'
import MapPicker from '@/components/common/MapPicker.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'
import type { BusinessCategory } from '@/types'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  category: 'OTHER' as BusinessCategory,
  description: '',
  phone: '',
  address: '',
  city: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
})

const mapPoint = computed({
  get: () => (
    form.latitude != null && form.longitude != null
      ? { lat: form.latitude, lng: form.longitude }
      : null
  ),
  set: (point: { lat: number; lng: number } | null) => {
    form.latitude = point?.lat
    form.longitude = point?.lng
  },
})

function applyMapAddress(address: { addressLine: string; city: string }) {
  if (address.addressLine) form.address = address.addressLine
  if (address.city) form.city = address.city
}

const CATEGORIES: BusinessCategory[] = ['BARBER', 'BEAUTY', 'MEDICAL', 'REPAIR', 'CONSULTING', 'EDUCATION', 'FITNESS', 'AUTO', 'LEGAL', 'OTHER']
const categoryOptions = computed(() => CATEGORIES.map((value) => ({ value, label: t(`category.${value}`) })))

const loading = ref(false)
const error = ref('')
const step = ref<'form' | 'relogin' | 'done'>('form')

function logoutAndWait() {
  authStore.logout()
  router.push('/login')
}

async function handleCreate() {
  if (!form.name.trim()) {
    error.value = t('onboarding.nameRequired')
    return
  }

  loading.value = true
  error.value = ''

  try {
    await businessesApi.create({
      ownerId: authStore.user?.userId,
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      contactPhone: form.phone || undefined,
      addressLine: form.address || undefined,
      city: form.city || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
    })

    step.value = 'relogin'

    // Yangi token olish (businessOwner: true)
    if (authStore.hasPendingCredentials) {
      await authStore.relogin()
      step.value = 'done'
      setTimeout(() => router.push('/'), 1200)
    } else {
      // Sahifa yangilanib kelgan bo'lsa credentials yo'q — login sahifasiga yo'naltir
      step.value = 'done'
      setTimeout(() => {
        authStore.logout()
        router.push('/login')
      }, 2000)
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || t('onboarding.createError')
    step.value = 'form'
  } finally {
    loading.value = false
  }
}
</script>
