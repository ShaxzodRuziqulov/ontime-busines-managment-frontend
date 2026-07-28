<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  CalendarCheck,
  Star,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  TrendingUp,
} from 'lucide-vue-next'
import { staffPortalApi } from '@/api/staffPortal'
import { bookingsApi } from '@/api/bookings'
import { useToast } from '@/composables/useToast'
import { bookingStatusLabels, bookingStatusBadgeColors, nextBookingActions } from '@/utils/bookingStatus'
import { todayIso } from '@/utils/scheduling'
import type { StaffMember, Booking, BookingStatus, StaffStats } from '@/types'

const toast = useToast()

const profile = ref<StaffMember | null>(null)
const bookings = ref<Booking[]>([])
const stats = ref<StaffStats | null>(null)
const loading = ref(true)
const activeTab = ref<'overview' | 'bookings'>('overview')
const updatingId = ref<string | null>(null)

const nextActions = nextBookingActions

async function changeStatus(booking: Booking, status: BookingStatus) {
  updatingId.value = booking.id
  try {
    await bookingsApi.update(booking.id, { status })
    booking.status = status
    toast.success('Holat yangilandi')
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Holatni yangilashda xatolik')
  } finally {
    updatingId.value = null
  }
}

const upcomingBookings = computed(() =>
  bookings.value
    .filter((b) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
)

function isToday(iso: string) {
  return iso.slice(0, 10) === todayIso()
}

const recentBookings = computed(() =>
  bookings.value
    .filter((b) => ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'NO_SHOW'].includes(b.status))
    .slice(0, 10),
)

const formatDate = (dateString: string) => {

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2,'0');
  return `${year}-${month}-${day}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

function renderStars(avg: number) {
  return Math.round(avg)
}

onMounted(async () => {
  try {
    const [profileRes, bookingsRes, statsRes] = await Promise.allSettled([
      staffPortalApi.myProfile(),
      staffPortalApi.myBookings(),
      staffPortalApi.myStats(),
    ])
    if (profileRes.status === 'fulfilled') profile.value = profileRes.value.data
    if (bookingsRes.status === 'fulfilled') bookings.value = bookingsRes.value.data
    if (statsRes.status === 'fulfilled') stats.value = statsRes.value.data
  } catch {
    toast.error('Ma\'lumotlarni yuklashda xatolik')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
        <User class="w-7 h-7" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-800">
          Salom, {{ profile?.displayName ?? '...' }}!
        </h2>
        <p class="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
          <Briefcase class="w-3.5 h-3.5" />
          Xodim portali
        </p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
        <div class="h-4 bg-slate-100 rounded mb-3 w-2/3"></div>
        <div class="h-8 bg-slate-100 rounded w-1/2"></div>
      </div>
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <CalendarCheck class="w-4 h-4 text-primary-500" />
            Jami bronlar
          </div>
          <p class="text-3xl font-bold text-slate-800">{{ stats?.totalBookings ?? 0 }}</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-500" />
            Bajarilgan
          </div>
          <p class="text-3xl font-bold text-slate-800">{{ stats?.completedBookings ?? 0 }}</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Clock class="w-4 h-4 text-amber-500" />
            Kutilmoqda
          </div>
          <p class="text-3xl font-bold text-slate-800">{{ stats?.pendingBookings ?? 0 }}</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Star class="w-4 h-4 text-amber-400" />
            O'rtacha reyting
          </div>
          <div class="flex items-end gap-2">
            <p class="text-3xl font-bold text-slate-800">
              {{ stats?.avgRating ? stats.avgRating.toFixed(1) : '—' }}
            </p>
            <div v-if="stats?.avgRating" class="flex items-center gap-0.5 pb-1">
              <Star
                v-for="n in 5"
                :key="n"
                :class="['w-3.5 h-3.5', n <= renderStars(stats.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200']"
              />
            </div>
          </div>
          <p v-if="stats?.reviewCount" class="text-xs text-slate-500 mt-1">
            {{ stats.reviewCount }} ta sharh
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-slate-200">
        <div class="flex gap-1">
          <button
            @click="activeTab = 'overview'"
            :class="[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            ]"
          >
            <span class="flex items-center gap-2">
              <TrendingUp class="w-4 h-4" />
              Joriy bronlar
            </span>
          </button>
          <button
            @click="activeTab = 'bookings'"
            :class="[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            ]"
          >
            <span class="flex items-center gap-2">
              <CalendarCheck class="w-4 h-4" />
              Barcha bronlar
              <span v-if="bookings.length" class="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
                {{ bookings.length }}
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- Overview tab: upcoming -->
      <div v-if="activeTab === 'overview'">
        <div v-if="upcomingBookings.length === 0" class="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <CalendarCheck class="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p class="text-slate-500 text-sm">Hozircha faol bron yo'q</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="booking in upcomingBookings"
            :key="booking.id"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CalendarCheck class="w-5 h-5 text-primary-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 text-sm flex items-center gap-2">
                  {{ booking.customerName || booking.guestName || 'Mijoz' }}
                  <span v-if="isToday(booking.startAt)" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">BUGUN</span>
                </p>
                <p class="text-xs text-slate-500 mt-0.5 truncate">
                  {{ formatDate(booking.startAt) }}<span v-if="booking.guestPhone"> · {{ booking.guestPhone }}</span>
                </p>
              </div>
              <span :class="['text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0', bookingStatusBadgeColors[booking.status] ?? 'bg-slate-100 text-slate-500']">
                {{ bookingStatusLabels[booking.status] ?? booking.status }}
              </span>
            </div>
            <div v-if="nextActions[booking.status]?.length" class="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                v-for="action in nextActions[booking.status]"
                :key="action.status"
                :disabled="updatingId === booking.id"
                @click="changeStatus(booking, action.status)"
                :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50', action.cls]"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bookings tab: all -->
      <div v-else>
        <div v-if="bookings.length === 0" class="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <CalendarCheck class="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p class="text-slate-500 text-sm">Bronlar mavjud emas</p>
        </div>

        <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="border-b border-slate-100 bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mijoz</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Boshlanish</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tugash</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Holat</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 text-slate-700">{{ booking.customerName || booking.guestName || '—' }}</td>
                <td class="px-4 py-3 text-slate-700">{{ formatDate(booking.startAt) }}</td>
                <td class="px-4 py-3 text-slate-500">{{ formatDate(booking.endAt) }}</td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', bookingStatusBadgeColors[booking.status] ?? 'bg-slate-100 text-slate-500']">
                    {{ bookingStatusLabels[booking.status] ?? booking.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-1.5 flex-wrap">
                    <button
                      v-for="action in nextActions[booking.status] ?? []"
                      :key="action.status"
                      :disabled="updatingId === booking.id"
                      @click="changeStatus(booking, action.status)"
                      :class="['px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50', action.cls]"
                    >
                      {{ action.label }}
                    </button>
                    <span v-if="!nextActions[booking.status]?.length" class="text-xs text-slate-300">—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent completed -->
      <template v-if="activeTab === 'overview' && recentBookings.length > 0">
        <h2 class="text-base font-semibold text-slate-700 mt-2">So'nggi bajarilgan bronlar</h2>
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="border-b border-slate-100 bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sana</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Holat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="booking in recentBookings" :key="booking.id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 text-slate-700">{{ formatDate(booking.startAt) }}</td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', bookingStatusBadgeColors[booking.status] ?? 'bg-slate-100 text-slate-500']">
                    {{ bookingStatusLabels[booking.status] ?? booking.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>
