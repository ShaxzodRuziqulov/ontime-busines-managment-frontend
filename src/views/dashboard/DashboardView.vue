<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p class="text-slate-500 text-sm mt-1">Biznesingizning umumiy ko'rinishi</p>
      </div>
      <div v-if="!loading" class="flex items-center gap-2">
        <RouterLink
          v-if="!businessStore.isReadOnly"
          to="/staff"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <UserPlus class="w-4 h-4" />
          Xodim
        </RouterLink>
        <span
          v-else
          title="Muddat tugagan - obuna sotib oling"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-400 text-sm font-medium opacity-60 cursor-not-allowed select-none"
        >
          <UserPlus class="w-4 h-4" />
          Xodim
        </span>
        <RouterLink
          v-if="!businessStore.isReadOnly"
          to="/bookings"
          class="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus class="w-4 h-4" />
          Yangi navbat
        </RouterLink>
        <span
          v-else
          title="Muddat tugagan - obuna sotib oling"
          class="flex items-center gap-1.5 bg-slate-300 text-white px-3.5 py-2 rounded-xl text-sm font-semibold opacity-60 cursor-not-allowed select-none"
        >
          <Plus class="w-4 h-4" />
          Yangi navbat
        </span>
      </div>
    </div>

    <template v-if="loading">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard v-for="i in 4" :key="i" :lines="1" />
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <SkeletonCard v-for="i in 3" :key="i" :lines="1" />
      </div>
      <SkeletonCard :lines="4" />
    </template>

    <template v-else>
      <div
        v-if="businessStore.isTrial && !businessStore.isReadOnly"
        class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <Clock class="w-6 h-6 flex-shrink-0" />
          <div>
            <p class="font-semibold">Sinov davri faol</p>
            <p class="text-sm text-amber-100">
              {{ businessStore.trialDaysLeft }} kun qoldi - hozir to'liq funksional
            </p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold">{{ businessStore.trialDaysLeft }}</div>
          <div class="text-xs text-amber-100">kun</div>
        </div>
      </div>

      <div
        v-else-if="businessStore.isReadOnly"
        class="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <AlertCircle class="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p class="font-semibold text-red-700">Sinov/obuna muddati tugagan</p>
            <p class="text-sm text-red-500 mt-0.5">Faqat ko'rish mumkin - navbat va boshqa amallar uchun obuna faollashtiring</p>
          </div>
        </div>
        <RouterLink to="/business" class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          Biznesim
        </RouterLink>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="stat in mainStats"
          :key="stat.label"
          class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ stat.label }}</span>
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', stat.color]">
              <component :is="stat.icon" class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800">{{ stat.value }}</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <div class="flex flex-col lg:flex-row lg:items-center gap-5">
          <div class="lg:w-52 flex-shrink-0">
            <h2 class="font-semibold text-slate-800">Navbatlar holati</h2>
            <p class="text-xs text-slate-500 mt-1">Joriy navbatlar bo'yicha tezkor ko'rinish</p>
          </div>

          <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <RouterLink
              v-for="stat in bookingStats"
              :key="stat.label"
              to="/bookings"
              class="group rounded-xl bg-slate-50 px-4 py-3 hover:bg-primary-50 transition-colors"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs text-slate-500">{{ stat.label }}</p>
                  <p class="text-xl font-bold text-slate-900 mt-1">{{ stat.value }}</p>
                </div>
                <div :class="['w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', stat.iconClass]">
                  <component :is="stat.icon" class="w-4 h-4" />
                </div>
              </div>
              <div class="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
                <div
                  :class="['h-full rounded-full', stat.barClass]"
                  :style="{ width: `${bookingPercent(stat.value)}%` }"
                />
              </div>
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-slate-800">Biznes tayyorligi</h2>
            <p class="text-xs text-slate-500 mt-0.5">Mijozlar navbat olishi uchun asosiy sozlamalar</p>
          </div>
          <span
            :class="[
              'text-xs font-semibold px-2.5 py-1 rounded-full',
              setupDoneCount === setupSteps.length ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            ]"
          >
            {{ setupDoneCount }}/{{ setupSteps.length }}
          </span>
        </div>

        <div class="divide-y divide-slate-100">
          <RouterLink
            v-for="step in setupSteps"
            :key="step.label"
            :to="step.to"
            class="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-primary-50/40 transition-colors"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  step.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                ]"
              >
                <component :is="step.done ? CheckCircle2 : step.icon" class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800">{{ step.label }}</p>
                <p class="text-xs text-slate-500 mt-1 leading-5">{{ step.description }}</p>
              </div>
            </div>
            <span class="text-xs font-medium text-primary-600 flex-shrink-0">Ochish</span>
          </RouterLink>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 flex items-center gap-2">
              <Sun class="w-4 h-4 text-amber-500" />
              Bugungi navbatlar
            </h2>
            <span class="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{{ todayBookings.length }}</span>
          </div>

          <div v-if="todayBookings.length === 0" class="px-6 py-10 text-center text-slate-500 text-sm">
            Bugun uchun navbat yo'q
          </div>

          <div v-else class="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            <div
              v-for="booking in todayBookings"
              :key="booking.id"
              class="px-6 py-3.5 flex items-center justify-between"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-sm font-semibold text-slate-800 w-12 flex-shrink-0">{{ formatTime(booking.startAt) }}</span>
                <span class="text-sm text-slate-600 truncate">{{ booking.customerName || booking.guestName || 'Mijoz' }}</span>
              </div>
              <StatusBadge :status="booking.status" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800">So'nggi navbatlar</h2>
            <RouterLink to="/bookings" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Barchasini ko'rish
            </RouterLink>
          </div>

          <div v-if="recentBookings.length === 0" class="px-6 py-10 text-center text-slate-500 text-sm">
            Hali navbat yo'q
          </div>

          <div v-else class="divide-y divide-slate-50">
            <div
              v-for="booking in recentBookings"
              :key="booking.id"
              class="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CalendarCheck class="w-4 h-4 text-primary-600" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-700">{{ formatDateTime(booking.startAt) }}</p>
                  <p v-if="booking.customerNote" class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                    {{ booking.customerNote }}
                  </p>
                </div>
              </div>
              <StatusBadge :status="booking.status" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  CalendarCheck, Users, Star,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, UserPlus, Sun, Briefcase,
} from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { reviewsApi } from '@/api/reviews'
import { businessHoursApi } from '@/api/businessHours'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import { todayIso } from '@/utils/scheduling'
import type { Booking, OfferedService, StaffMember, Review, BusinessHours } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const bookings = ref<Booking[]>([])
const totalBookings = ref(0)
const services = ref<OfferedService[]>([])
const staff = ref<StaffMember[]>([])
const reviews = ref<Review[]>([])
const hours = ref<BusinessHours[]>([])
const loading = ref(true)

const pendingBookings = computed(() => bookings.value.filter((b) => b.status === 'PENDING'))
const confirmedBookings = computed(() => bookings.value.filter((b) => b.status === 'CONFIRMED'))
const completedBookings = computed(() => bookings.value.filter((b) => b.status === 'COMPLETED'))
const cancelledBookings = computed(() => bookings.value.filter((b) => b.status.startsWith('CANCELLED')))
const visibleBookingStatusTotal = computed(() =>
  pendingBookings.value.length + confirmedBookings.value.length + completedBookings.value.length
)

const todayBookings = computed(() => {
  const today = todayIso()
  return bookings.value
    .filter((b) => b.startAt.slice(0, 10) === today && !b.status.startsWith('CANCELLED'))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
})

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((sum, review) => sum + review.stars, 0) / reviews.value.length).toFixed(1)
})

const recentBookings = computed(() =>
  [...bookings.value]
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 5)
)

const activeHours = computed(() => hours.value.filter((item) => !item.closed && item.opensAt && item.closesAt))

const mainStats = computed(() => [
  { label: 'Jami navbatlar', value: totalBookings.value, icon: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
  { label: 'Bugungi navbatlar', value: todayBookings.value.length, icon: Sun, color: 'bg-orange-50 text-orange-600' },
  { label: 'Bekor qilingan', value: cancelledBookings.value.length, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  { label: "O'rtacha reyting", value: avgRating.value, icon: Star, color: 'bg-amber-50 text-amber-600' },
])

const bookingStats = computed(() => [
  { label: 'Kutilmoqda', value: pendingBookings.value.length, icon: AlertCircle, iconClass: 'bg-amber-100 text-amber-600', barClass: 'bg-amber-400' },
  { label: 'Tasdiqlangan', value: confirmedBookings.value.length, icon: TrendingUp, iconClass: 'bg-blue-100 text-blue-600', barClass: 'bg-blue-500' },
  { label: 'Bajarildi', value: completedBookings.value.length, icon: CheckCircle2, iconClass: 'bg-emerald-100 text-emerald-600', barClass: 'bg-emerald-500' },
])

const setupSteps = computed(() => {
  const business = businessStore.business
  return [
    {
      label: "Biznes ma'lumoti",
      description: business?.name && business?.contactPhone && business?.city
        ? 'Nomi, telefon va shahar kiritilgan'
        : "Nom, telefon va shaharni to'ldiring",
      done: Boolean(business?.name && business?.contactPhone && business?.city),
      to: '/business',
      icon: Briefcase,
    },
    {
      label: 'Xizmatlar',
      description: services.value.length ? `${services.value.length} ta xizmat bor` : "Mijoz tanlaydigan xizmat qo'shing",
      done: services.value.length > 0,
      to: '/services',
      icon: Briefcase,
    },
    {
      label: 'Xodimlar',
      description: staff.value.length ? `${staff.value.length} ta xodim bor` : "Navbat qabul qiladigan xodim qo'shing",
      done: staff.value.length > 0,
      to: '/staff',
      icon: Users,
    },
    {
      label: 'Ish vaqti',
      description: activeHours.value.length ? `${activeHours.value.length} kun ochiq` : 'Haftalik ish vaqtini belgilang',
      done: activeHours.value.length > 0,
      to: '/hours',
      icon: Clock,
    },
  ]
})

const setupDoneCount = computed(() => setupSteps.value.filter((step) => step.done).length)

function bookingPercent(value: number) {
  if (!visibleBookingStatusTotal.value) return 0
  return Math.max(6, Math.round((value / visibleBookingStatusTotal.value) * 100))
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  const bid = businessStore.business?.id
  const failures: string[] = []
  try {
    const [bookingsResult, servicesResult, staffResult, hoursResult, reviewsResult] = await Promise.allSettled([
      bookingsApi.getAll(bid ? { businessId: bid, size: 500 } : { size: 500 }),
      bid ? servicesApi.getAll(bid) : Promise.resolve({ data: [] as OfferedService[] }),
      bid ? staffApi.getAll(bid) : Promise.resolve({ data: [] as StaffMember[] }),
      bid ? businessHoursApi.getAll(bid) : Promise.resolve({ data: [] as BusinessHours[] }),
      reviewsApi.getAll(bid ? { businessId: bid } : {}),
    ])

    if (bookingsResult.status === 'fulfilled') {
      bookings.value = bookingsResult.value.data.content
      totalBookings.value = bookingsResult.value.data.totalElements
    } else failures.push('navbatlar')
    if (servicesResult.status === 'fulfilled') services.value = servicesResult.value.data
    else failures.push('xizmatlar')
    if (staffResult.status === 'fulfilled') staff.value = staffResult.value.data
    else failures.push('xodimlar')
    if (hoursResult.status === 'fulfilled') hours.value = hoursResult.value.data
    else failures.push('ish vaqti')
    if (reviewsResult.status === 'fulfilled') reviews.value = reviewsResult.value.data
    else failures.push('sharhlar')

    if (failures.length > 0) toast.error(`Ba'zi ma'lumotlar yuklanmadi: ${failures.join(', ')}`)
  } finally {
    loading.value = false
  }
})
</script>
