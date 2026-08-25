<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Biznesim</h2>
      <p class="text-slate-500 text-sm mt-1">Biznes ma'lumotlarini boshqaring</p>
    </div>

    <LoadingSpinner v-if="businessStore.loading" />

    <div v-else-if="!businessStore.business" class="bg-white rounded-2xl p-10 text-center border border-slate-100">
      <Building2 class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-slate-500">Biznes topilmadi</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="space-y-4">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Holat</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-600">Status</span>
              <StatusBadge :status="businessStore.business.status" />
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-600">Xizmat turi</span>
              <span class="text-sm font-medium text-slate-800 text-right">{{ categoryLabel(businessStore.business.category) }}</span>
            </div>
            <div v-if="businessStore.business.trialEndDate" class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-600">Sinov tugashi</span>
              <span class="text-sm font-medium text-slate-800">{{ formatDate(businessStore.business.trialEndDate) }}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-slate-600">Obuna</span>
              <span class="text-sm font-medium text-slate-800 text-right">{{ subscriptionLabel }}</span>
            </div>
          </div>
        </div>

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

        <div
          v-else-if="businessStore.isExpired"
          class="bg-red-50 border border-red-200 rounded-2xl p-5"
        >
          <p class="text-sm font-semibold text-red-700 mb-1">Obuna kerak</p>
          <p class="text-xs text-red-600">Amallar bloklangan. Obunani faollashtiring.</p>
        </div>
      </div>

      <div class="lg:col-span-2">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="font-semibold text-slate-800">Bo'limlar</h2>
              <p class="text-xs text-slate-500 mt-1">Kerakli sahifaga tez o'tish</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <RouterLink
              v-for="section in profileSections"
              :key="section.to"
              :to="section.to"
              class="group rounded-xl border border-slate-100 p-4 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0">
                  <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', section.color]">
                    <component :is="section.icon" class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-800">{{ section.label }}</p>
                    <p class="text-xs text-slate-500 mt-1 leading-5">{{ section.description }}</p>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-primary-500 mt-1 flex-shrink-0" />
              </div>

              <div class="mt-4 flex items-end gap-1">
                <span class="text-2xl font-bold text-slate-900">{{ section.value }}</span>
                <span class="text-xs text-slate-400 mb-1">{{ section.suffix }}</span>
              </div>
            </RouterLink>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 class="font-semibold text-slate-800">Ma'lumotlarni tahrirlash</h2>
            <span v-if="saved" class="text-sm text-emerald-600 font-medium">Saqlandi</span>
          </div>

          <div
            v-if="readOnlyNotice"
            class="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{{ readOnlyNotice }}</span>
          </div>

          <form @submit.prevent="saveChanges" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <Building2 class="w-4 h-4 inline mr-1.5" />
                Biznes nomi
              </label>
              <input
                v-model="form.name"
                type="text"
                :disabled="businessStore.isReadOnly"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <Tag class="w-4 h-4 inline mr-1.5" />
                Xizmat turi
              </label>
              <select
                v-model="form.category"
                :disabled="businessStore.isReadOnly"
                class="w-full px-4 py-2.5 rounded-xl text-gray-600 cursor-pointer border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
                  {{ category.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <FileText class="w-4 h-4 inline mr-1.5" />
                Tavsif
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                :disabled="businessStore.isReadOnly"
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
                  :disabled="businessStore.isReadOnly"
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
                  :disabled="businessStore.isReadOnly"
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
                :disabled="businessStore.isReadOnly"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin class="w-4 h-4 inline mr-1.5" />
                Xaritadagi joylashuv
              </label>
              <MapPicker
                v-model="mapPoint"
                :address-line="form.addressLine"
                :city="form.city"
                :disabled="businessStore.isReadOnly"
                @address-selected="applyMapAddress"
              />
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                :disabled="saving || businessStore.isReadOnly"
                class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Save class="w-4 h-4" />
                {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  AlarmClock,
  AlertCircle,
  Building2,
  CalendarCheck,
  ChevronRight,
  Save,
  Phone,
  MapPin,
  FileText,
  Clock,
  Star,
  Tag,
  UserRound,
  Users,
} from 'lucide-vue-next'
import { businessesApi } from '@/api/businesses'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { customersApi } from '@/api/customers'
import { businessHoursApi } from '@/api/businessHours'
import { reviewsApi } from '@/api/reviews'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MapPicker from '@/components/common/MapPicker.vue'
import type { BusinessCategory } from '@/types'

const toast = useToast()
const businessStore = useBusinessStore()
const saving = ref(false)
const saved = ref(false)
const sectionCounts = ref({
  bookings: 0,
  services: 0,
  staff: 0,
  customers: 0,
  openDays: 0,
  reviews: 0,
})

const form = ref({
  name: '',
  category: 'OTHER' as BusinessCategory,
  description: '',
  addressLine: '',
  city: '',
  contactPhone: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
})

const mapPoint = computed({
  get: () => (
    form.value.latitude != null && form.value.longitude != null
      ? { lat: form.value.latitude, lng: form.value.longitude }
      : null
  ),
  set: (point: { lat: number; lng: number } | null) => {
    form.value.latitude = point?.lat
    form.value.longitude = point?.lng
  },
})

function applyMapAddress(address: { addressLine: string; city: string }) {
  if (address.addressLine) form.value.addressLine = address.addressLine
  if (address.city) form.value.city = address.city
}

const categoryOptions: { value: BusinessCategory; label: string }[] = [
  { value: 'BARBER', label: 'Sartarosh' },
  { value: 'BEAUTY', label: "Go'zallik" },
  { value: 'MEDICAL', label: 'Tibbiyot' },
  { value: 'REPAIR', label: "Ta'mirlash" },
  { value: 'CONSULTING', label: 'Konsultatsiya' },
  { value: 'EDUCATION', label: "Ta'lim" },
  { value: 'FITNESS', label: 'Sport' },
  { value: 'AUTO', label: 'Avto xizmat' },
  { value: 'LEGAL', label: 'Yuridik xizmat' },
  { value: 'OTHER', label: 'Boshqa' },
]

function categoryLabel(category?: BusinessCategory) {
  return categoryOptions.find((item) => item.value === category)?.label ?? 'Boshqa'
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const subscriptionLabel = computed(() => {
  const business = businessStore.business
  if (!business) return ''
  if (business.subscriptionEndDate) return formatDate(business.subscriptionEndDate)
  if (business.status === 'ACTIVE') return 'Cheksiz'
  if (business.status === 'TRIAL') return 'Sinov rejimida'
  if (business.status === 'EXPIRED') return 'Muddati tugagan'
  if (business.status === 'SUSPENDED') return "To'xtatilgan"
  return 'Belgilanmagan'
})

const readOnlyNotice = computed(() => {
  if (!businessStore.isReadOnly) return ''
  if (businessStore.isTrial) return "Sinov muddati tugagan. Hozir faqat ko'rish mumkin."
  return "Obuna faol emas. Hozir faqat ko'rish mumkin."
})

const profileSections = computed(() => [
  {
    label: 'Navbatlar',
    description: 'Mijoz navbatlari va statuslar',
    value: sectionCounts.value.bookings,
    suffix: 'ta',
    to: '/bookings',
    icon: CalendarCheck,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Xizmatlar',
    description: 'Narx va davomiylik sozlamalari',
    value: sectionCounts.value.services,
    suffix: 'ta',
    to: '/services',
    icon: Building2,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    label: 'Xodimlar',
    description: 'Jamoa va ishchi profillari',
    value: sectionCounts.value.staff,
    suffix: 'ta',
    to: '/staff',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    label: 'Mijozlar',
    description: 'Kontaktlar va mijoz bazasi',
    value: sectionCounts.value.customers,
    suffix: 'ta',
    to: '/customers',
    icon: UserRound,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    label: 'Ish soatlari',
    description: 'Haftalik ochiq kunlar',
    value: sectionCounts.value.openDays,
    suffix: 'kun',
    to: '/hours',
    icon: AlarmClock,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Sharhlar',
    description: 'Mijoz baholari va fikrlar',
    value: sectionCounts.value.reviews,
    suffix: 'ta',
    to: '/reviews',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-700',
  },
])

watch(
    () => businessStore.business,
    (biz) => {
      if (biz) {
        form.value.name = biz.name
        form.value.category = biz.category ?? 'OTHER'
        form.value.description = biz.description
        form.value.contactPhone = biz.contactPhone || ''
        form.value.addressLine = biz.addressLine || ''
        form.value.city = biz.city || ''
        form.value.latitude = biz.latitude
        form.value.longitude = biz.longitude
      }
    },
    { immediate: true }
)

async function saveChanges() {
  if (!businessStore.business || businessStore.isReadOnly) return
  saving.value = true
  try {
    await businessesApi.update(businessStore.business.id, {
      ...form.value,
      latitude: form.value.latitude,
      longitude: form.value.longitude,
    })
    await businessStore.fetchMyBusiness()
    saved.value = true
    setTimeout(() => (saved.value = false), 2500)
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Saqlashda xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const bid = businessStore.business?.id
  if (!bid) return

  const [bookings, services, staff, customers, hours, reviews] = await Promise.allSettled([
    bookingsApi.getAll({ businessId: bid, size: 1 }),
    servicesApi.getAll(bid),
    staffApi.getAll(bid),
    customersApi.getAll(bid, { size: 1 }),
    businessHoursApi.getAll(bid),
    reviewsApi.getAll({ businessId: bid }),
  ])

  if (bookings.status === 'fulfilled') sectionCounts.value.bookings = bookings.value.data.totalElements
  if (services.status === 'fulfilled') sectionCounts.value.services = services.value.data.length
  if (staff.status === 'fulfilled') sectionCounts.value.staff = staff.value.data.length
  if (customers.status === 'fulfilled') sectionCounts.value.customers = customers.value.data.totalElements
  if (hours.status === 'fulfilled') {
    sectionCounts.value.openDays = hours.value.data.filter((item) => !item.closed && item.opensAt && item.closesAt).length
  }
  if (reviews.status === 'fulfilled') sectionCounts.value.reviews = reviews.value.data.length
})
</script>
