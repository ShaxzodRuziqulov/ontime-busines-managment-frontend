<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  CalendarCheck, Scissors, Users, Star,
  TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { reviewsApi } from '@/api/reviews'
import { useBusinessStore } from '@/stores/business'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import type { Booking, OfferedService, StaffMember, Review } from '@/types'

const businessStore = useBusinessStore()

const bookings = ref<Booking[]>([])
const services = ref<OfferedService[]>([])
const staff = ref<StaffMember[]>([])
const reviews = ref<Review[]>([])
const loading = ref(true)

const pendingBookings = computed(() => bookings.value.filter(b => b.status === 'PENDING'))
const confirmedBookings = computed(() => bookings.value.filter(b => b.status === 'CONFIRMED'))
const completedBookings = computed(() => bookings.value.filter(b => b.status === 'COMPLETED'))

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

onMounted(async () => {
  const bid = businessStore.business?.id
  try {
    const [b, s, st, r] = await Promise.allSettled([
      bookingsApi.getAll(bid ? { businessId: bid } : {}),
      bid ? servicesApi.getAll(bid) : Promise.resolve({ data: [] }),
      bid ? staffApi.getAll(bid) : Promise.resolve({ data: [] }),
      reviewsApi.getAll(bid),
    ])
    if (b.status === 'fulfilled') bookings.value = b.value.data
    else console.error('Navbatlar yuklanmadi:', b.reason)
    if (s.status === 'fulfilled') services.value = s.value.data
    else console.error('Xizmatlar yuklanmadi:', s.reason)
    if (st.status === 'fulfilled') staff.value = st.value.data
    else console.error('Xodimlar yuklanmadi:', st.reason)
    if (r.status === 'fulfilled') reviews.value = r.value.data
    else console.error('Sharhlar yuklanmadi:', r.reason)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Dashboard</h1>
      <p class="text-slate-500 text-sm mt-1">
        Biznesingizning umumiy ko'rinishi
      </p>
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SkeletonCard v-for="i in 4" :key="i" :lines="1" />
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <SkeletonCard v-for="i in 3" :key="i" :lines="1" />
      </div>
      <SkeletonCard :lines="4" />
    </template>

    <template v-else>
      <!-- Trial info card -->
      <div
        v-if="businessStore.isTrial"
        class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 mb-6 text-white flex items-center justify-between"
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

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in [
            { label: 'Jami navbatlar', value: bookings.length, icon: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
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

      <!-- Booking status row -->
      <div class="grid grid-cols-3 gap-4 mb-6">
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

      <!-- Recent bookings -->
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
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                <CalendarCheck class="w-4 h-4 text-primary-600" />
              </div>
              <div>
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
    </template>
  </div>
</template>
