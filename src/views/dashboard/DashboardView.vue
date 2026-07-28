<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p class="text-slate-500 text-sm mt-1">Biznesingizning umumiy ko'rinishi</p>
      </div>
      <div v-if="!loading" class="flex items-center gap-2">
        <RouterLink
            to="/staff"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <UserPlus class="w-4 h-4" />
          Xodim
        </RouterLink>
        <RouterLink
            to="/bookings"
            class="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus class="w-4 h-4" />
          Yangi navbat
        </RouterLink>
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
          v-if="businessStore.isTrial"
          class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <Clock class="w-6 h-6 flex-shrink-0" />
          <div>
            <p class="font-semibold">Sinov davri faol</p>
            <p class="text-sm text-amber-100">
              {{ businessStore.trialDaysLeft }} kun qoldi — hozir to'liq funksional
            </p>
          </div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold">{{ businessStore.trialDaysLeft }}</div>
          <div class="text-xs text-amber-100">kun</div>
        </div>
      </div>
      <div
          v-else-if="businessStore.isExpired"
          class="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <AlertCircle class="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p class="font-semibold text-red-700">Biznes sinov muddati tugagan yoki to'xtatilgan</p>
            <p class="text-sm text-red-500 mt-0.5">Navbat yaratish uchun obuna faollashtiring</p>
          </div>
        </div>
        <RouterLink to="/business" class="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          Biznesim
        </RouterLink>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
            v-for="stat in [
            { label: 'Jami navbatlar', value: totalBookings, icon: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
            { label: 'Xizmatlar', value: services.length, icon: Scissors, color: 'bg-violet-50 text-violet-600' },
            { label: 'Xodimlar', value: staff.length, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'O\'rtacha reyting', value: avgRating, icon: Star, color: 'bg-amber-50 text-amber-600' },
          ]"
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
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">{{ pendingBookings.length }}</div>
            <div class="text-xs text-slate-500">Kutilmoqda</div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">{{ confirmedBookings.length }}</div>
            <div class="text-xs text-slate-500">Tasdiqlangan</div>
          </div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle2 class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">{{ completedBookings.length }}</div>
            <div class="text-xs text-slate-500">Bajarildi</div>
          </div>
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
              Barchasini ko'rish →
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
  CalendarCheck, Scissors, Users, Star,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, UserPlus, Sun,
} from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { reviewsApi } from '@/api/reviews'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import { todayIso } from '@/utils/scheduling'
import type { Booking, OfferedService, StaffMember, Review } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const bookings = ref<Booking[]>([])
const totalBookings = ref(0)
const services = ref<OfferedService[]>([])
const staff = ref<StaffMember[]>([])
const reviews = ref<Review[]>([])
const loading = ref(true)

const pendingBookings = computed(() => bookings.value.filter(b => b.status === 'PENDING'))
const confirmedBookings = computed(() => bookings.value.filter(b => b.status === 'CONFIRMED'))
const completedBookings = computed(() => bookings.value.filter(b => b.status === 'COMPLETED'))

const todayBookings = computed(() => {
  const today = todayIso()
  return bookings.value
    .filter(b => b.startAt.slice(0, 10) === today && !b.status.startsWith('CANCELLED'))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
})

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((s, r) => s + r.stars, 0) / reviews.value.length).toFixed(1)
})

const recentBookings = computed(() =>
  [...bookings.value]
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 5)
)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  const bid = businessStore.business?.id
  const failures: string[] = []
  try {
    const [b, s, st, r] = await Promise.allSettled([
      bookingsApi.getAll(bid ? { businessId: bid, size: 500 } : { size: 500 }),
      bid ? servicesApi.getAll(bid) : Promise.resolve({ data: [] }),
      bid ? staffApi.getAll(bid) : Promise.resolve({ data: [] }),
      reviewsApi.getAll(bid ? { businessId: bid } : {}),
    ])
    if (b.status === 'fulfilled') {
      bookings.value = b.value.data.content
      totalBookings.value = b.value.data.totalElements
    } else failures.push('navbatlar')
    if (s.status === 'fulfilled') services.value = s.value.data
    else failures.push('xizmatlar')
    if (st.status === 'fulfilled') staff.value = st.value.data
    else failures.push('xodimlar')
    if (r.status === 'fulfilled') reviews.value = r.value.data
    else failures.push('sharhlar')
    if (failures.length > 0) toast.error(`Ba'zi ma'lumotlar yuklanmadi: ${failures.join(', ')}`)
  } finally {
    loading.value = false
  }
})
</script>
