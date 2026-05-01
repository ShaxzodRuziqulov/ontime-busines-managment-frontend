<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Building2, Save, Phone, MapPin, FileText, Clock, Calendar } from 'lucide-vue-next'
import { businessesApi } from '@/api/businesses'
import { useBusinessStore } from '@/stores/business'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const businessStore = useBusinessStore()
const saving = ref(false)
const saved = ref(false)

const form = ref({
  name: '',
  description: '',
  addressLine: '',
  city: '',
  contactPhone: '',
})

watch(
  () => businessStore.business,
  (biz) => {
    if (biz) {
      form.value.name = biz.name
      form.value.description = biz.description
      form.value.contactPhone = biz.contactPhone || ''
      form.value.addressLine = biz.addressLine || ''
      form.value.city = biz.city || ''
    }
  },
  { immediate: true }
)

async function saveChanges() {
  if (!businessStore.business) return
  saving.value = true
  try {
    await businessesApi.update(businessStore.business.id, form.value)
    await businessStore.fetchMyBusiness()
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } finally {
    saving.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Biznesim</h1>
      <p class="text-slate-500 text-sm mt-1">Biznes ma'lumotlarini boshqaring</p>
    </div>

    <LoadingSpinner v-if="businessStore.loading" />

    <div v-else-if="!businessStore.business" class="bg-white rounded-2xl p-10 text-center border border-slate-100">
      <Building2 class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-slate-500">Biznes topilmadi</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- Info sidebar -->
      <div class="space-y-4">
        <!-- Status card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Holat</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Status</span>
              <StatusBadge :status="businessStore.business.status" />
            </div>
            <div v-if="businessStore.business.trialEndDate" class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Trial tugashi</span>
              <span class="text-sm font-medium text-slate-800">{{ formatDate(businessStore.business.trialEndDate) }}</span>
            </div>
            <div v-if="businessStore.business.subscriptionEndDate" class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Obuna tugashi</span>
              <span class="text-sm font-medium text-slate-800">{{ formatDate(businessStore.business.subscriptionEndDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Trial days progress -->
        <div
          v-if="businessStore.isTrial"
          class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5"
        >
          <div class="flex items-center gap-2 mb-3">
            <Clock class="w-5 h-5 text-amber-600" />
            <span class="font-semibold text-amber-800">Sinov davri</span>
          </div>
          <div class="text-3xl font-bold text-amber-700 mb-1">{{ businessStore.trialDaysLeft }}</div>
          <div class="text-sm text-amber-600 mb-3">kun qoldi</div>
          <div class="w-full bg-amber-200 rounded-full h-2">
            <div
              class="bg-amber-500 h-2 rounded-full transition-all"
              :style="{ width: `${Math.min(100, (businessStore.trialDaysLeft / 14) * 100)}%` }"
            />
          </div>
        </div>

        <!-- Expired card -->
        <div
          v-else-if="businessStore.isExpired"
          class="bg-red-50 border border-red-200 rounded-2xl p-5"
        >
          <p class="text-sm font-semibold text-red-700 mb-1">Obuna kerak</p>
          <p class="text-xs text-red-600">Operatsiyalar bloklangan. Obuna sotib oling!</p>
        </div>
      </div>

      <!-- Edit form -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 class="font-semibold text-slate-800 mb-5">Ma'lumotlarni tahrirlash</h2>

          <form @submit.prevent="saveChanges" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 class="w-4 h-4 inline mr-1.5" />
                Biznes nomi
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <FileText class="w-4 h-4 inline mr-1.5" />
                Tavsif
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  <Phone class="w-4 h-4 inline mr-1.5" />
                  Telefon
                </label>
                <input
                  v-model="form.contactPhone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  <MapPin class="w-4 h-4 inline mr-1.5" />
                  Shahar
                </label>
                <input
                  v-model="form.city"
                  type="text"
                  placeholder="Toshkent"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin class="w-4 h-4 inline mr-1.5" />
                Manzil
              </label>
              <input
                v-model="form.addressLine"
                type="text"
                placeholder="Ko'cha nomi, uy raqami"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                :disabled="saving"
                class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Save class="w-4 h-4" />
                {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>

              <span
                v-if="saved"
                class="text-sm text-emerald-600 font-medium animate-pulse"
              >
                ✓ Saqlandi!
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
