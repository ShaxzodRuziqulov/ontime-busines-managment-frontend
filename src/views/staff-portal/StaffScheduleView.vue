<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, CalendarX, User, XIcon } from 'lucide-vue-next'
import { staffPortalApi } from '@/api/staffPortal'
import { businessHoursApi } from '@/api/businessHours'
import { useToast } from '@/composables/useToast'
import { bookingStatusLabels, bookingStatusBadgeColors } from '@/utils/bookingStatus'
import { todayIso, weekdayFromDate, toMinutes, minutesOfDay } from '@/utils/scheduling'
import NewBookingModal from './NewBookingModal.vue'
import type { StaffMember, Booking, BusinessHours } from '@/types'

const toast = useToast()

const profile = ref<StaffMember | null>(null)
const bookings = ref<Booking[]>([])
const selectedBooking = ref<Booking | null>(null)
const hours = ref<BusinessHours[]>([])
const loading = ref(true)
const selectedDate = ref(todayIso())
const showNewBooking = ref(false)

const PX_PER_MIN = 2
const SLOT_INTERVAL = 30

const dayHours = computed(() => {
  const wd = weekdayFromDate(selectedDate.value)
  return hours.value.find((h) => h.weekday === wd) ?? null
})
const dayClosed = computed(() => dayHours.value?.closed === true)

const openMinutes = computed(() => (dayHours.value?.opensAt ? toMinutes(dayHours.value.opensAt) : 9 * 60))
const closeMinutes = computed(() => (dayHours.value?.closesAt ? toMinutes(dayHours.value.closesAt) : 18 * 60))
const gridHeight = computed(() => Math.max((closeMinutes.value - openMinutes.value) * PX_PER_MIN, 100))

const timeSlots = computed(() => {
  const slots: { label: string; top: number }[] = []
  for (let m = openMinutes.value; m <= closeMinutes.value; m += SLOT_INTERVAL) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    slots.push({ label: `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, top: (m - openMinutes.value) * PX_PER_MIN })
  }
  return slots
})

const dayBookings = computed(() =>
  bookings.value.filter(
    (b) =>
      b.startAt.slice(0, 10) === selectedDate.value,
            // &&
            // !['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS'].includes(b.status)
  ),
)

function getInitials(name: string) {
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

const createdDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const hour = date.getHours().toString().padStart(2, '0');
  const time = `${hour}:${date.getMinutes().toString().padStart(2, '0')}`
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${year}.${month}.${day}, ${time}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

function blockStyle(booking: Booking) {
  const start = minutesOfDay(booking.startAt)
  const end = minutesOfDay(booking.endAt)
  const top = Math.max((start - openMinutes.value) * PX_PER_MIN, 0)
  const height = Math.max((end - start) * PX_PER_MIN, 34)
  return { top: `${top}px`, height: `${height}px` }
}

// ── Hozirgi vaqt chizig'i ───────────────────────────────────
const nowTick = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined
const isToday = computed(() => selectedDate.value === todayIso())
const nowTop = computed(() => {
  if (!isToday.value) return null
  const now = new Date(nowTick.value)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin < openMinutes.value || nowMin > closeMinutes.value) return null
  return (nowMin - openMinutes.value) * PX_PER_MIN
})

// ── Sana navigatsiyasi ──────────────────────────────────────
function shiftDay(delta: number) {
  const d = new Date(selectedDate.value + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  selectedDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const isPastDay = computed(() => selectedDate.value < todayIso())

const dateLabel = () => {
  if (!selectedDate.value) return '';

  const date = new Date(selectedDate.value);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2,'0');
  return `${year}-${month}-${day}`;
};

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

async function reloadBookings() {
  try {
    const { data } = await staffPortalApi.myBookings()
    bookings.value = data
  } catch {
    /* jim */
  }
}

onMounted(async () => {
  try {
    const profileRes = await staffPortalApi.myProfile()
    profile.value = profileRes.data
    const [bookingsRes, hoursRes] = await Promise.all([
      staffPortalApi.myBookings(),
      businessHoursApi.getAll(profileRes.data.businessId),
    ])
    bookings.value = bookingsRes.data
    hours.value = hoursRes.data
  } catch {
    toast.error('Ma\'lumotlarni yuklashda xatolik')
  } finally {
    loading.value = false
  }
  nowTimer = setInterval(() => (nowTick.value = Date.now()), 60_000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
        <CalendarDays class="w-5 h-5" />
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Jadval</h2>
        <p class="text-slate-500 text-sm flex items-center gap-1.5">
          <User class="w-3.5 h-3.5" />
          {{ profile?.displayName ?? '...' }}
        </p>
      </div>
      <button
        v-if="profile"
        class="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors flex-shrink-0"
        @click="showNewBooking = true"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">Yangi bron</span>
      </button>
    </div>
    <div class="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
      <button
        class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        @click="shiftDay(-1)"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-2">
        <p class="text-sm font-semibold text-slate-800 capitalize">{{ dateLabel() }}</p>
        <button
          v-if="!isToday"
          class="text-xs text-white px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 hover:underline mt-0.5"
          @click="selectedDate = todayIso()"
        >
          Bugunga qaytish
        </button>
        <span v-else class="text-xs text-slate-400">Bugun</span>
      </div>

      <button
        class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        @click="shiftDay(1)"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 p-10 text-center">
      <div class="animate-pulse text-slate-300">Yuklanmoqda...</div>
    </div>

    <div v-else-if="dayClosed" class="bg-white rounded-2xl border border-slate-100 p-10 text-center">
      <CalendarX class="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p class="text-slate-500 text-sm">Bu kun biznes ishlamaydi</p>
    </div>
    <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div class="relative" :style="{ height: gridHeight + 'px' }">
        <div
          v-for="slot in timeSlots"
          :key="slot.label"
          class="absolute border-t px-2.5 pt-5 border-slate-100 left-0 right-0 flex items-center gap-2"
          :style="{ top: slot.top + 'px' }"
        >
          <span class="text-[11px] border-r border-slate-100 text-slate-400 w-10 flex-shrink-0 -mt-2">{{ slot.label }}</span>
        </div>
        <div class="absolute left-12 right-0 top-0 bottom-0">
          <div
            v-for="booking in dayBookings"
            :key="booking.id"
            class="absolute left-0 border-t-2 border-gray-100 right-2 rounded-lg border px-2.5 py-1.5 overflow-hidden shadow-sm"
            :class="bookingStatusBadgeColors[booking.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'"
            :style="blockStyle(booking)"
            @click="selectedBooking = booking"
          >
            <p class="text-xs font-semibold truncate leading-tight">
              {{ booking.customerName || booking.guestName || 'Mijoz' }}
            </p>
            <p class="text-[10px] opacity-80 truncate leading-tight">
              {{ timeLabel(booking.startAt) }}–{{ timeLabel(booking.endAt) }}
              <span v-if="booking.offeredServiceName"> · {{ booking.offeredServiceName }}</span>
            </p>
          </div>
          <div
            v-if="nowTop !== null"
            class="absolute left-0 right-0 border-t-2 border-red-400 z-10 pointer-events-none"
            :style="{ top: nowTop + 'px' }"
          >
            <span class="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400"></span>
          </div>
        </div>
      </div>

      <div v-if="dayBookings.length === 0" class="text-center py-6 text-sm text-slate-400">
        Bu kun uchun bron yo'q
      </div>
    </div>
    <Teleport to="body" v-if="selectedBooking">
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"
             @click="selectedBooking = null"
        />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 class="text-slate-800 flex items-center gap-2">
              <span
                  class="bg-indigo-200 flex font-semibold items-center justify-center w-10 h-10 text-indigo-600 rounded-full"
              >
                {{getInitials(selectedBooking.customerName || selectedBooking.guestName || 'Mijoz')}}
              </span>
              <span class="flex flex-col">
                <span class="font-semibold">
                {{ selectedBooking.customerName || selectedBooking.guestName || 'Mijoz' }}
                </span>
                <span
                    class="text-gray-400 text-xs"
                >
                  {{createdDate(selectedBooking.createdAt)}}
                </span>
              </span>
            </h3>
            <button
                class="p-1.5 border border-gray-200 rounded-lg text-slate-400 hover:bg-slate-100"
                @click="selectedBooking = null"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="px-5 py-4 space-y-2 text-sm">
            <p class="flex items-center justify-between border-b border-dashed border-slate-300 pb-1">
              <span>Xodim:</span>
              {{selectedBooking.staffName}}
            </p>
            <p
                class="text-slate-600 border-b border-dashed border-slate-300 pb-1 flex items-center justify-between"
            >
              Telefon
              <span>{{ selectedBooking.guestPhone }}</span>
            </p>
            <p
                class="flex items-center justify-between border-b border-dashed border-slate-300 pb-1 text-slate-700"
            >
              Xizmat
              <span>{{ selectedBooking.offeredServiceName || '—' }}</span>
            </p>
            <p
                class="text-gray-600 border-b border-dashed border-slate-300 pb-1 flex items-center justify-between"
            >
              <span>Vaqt</span>
              <span>
                {{ formatTime(selectedBooking.startAt) }} — {{ formatTime(selectedBooking.endAt) }}
              </span>
            </p>
            <p
                class="flex text-gray-600 items-center justify-between border-b border-dashed border-slate-300 pb-1"
            >
              <span>Holat</span>
              <span
                  :class="['inline-block text-xs font-medium px-2.5 py-1 rounded-full',
                  bookingStatusBadgeColors[selectedBooking.status]]"
              >
              {{ bookingStatusLabels[selectedBooking.status] }}
              </span>
            </p>
            <p
                class="flex text-gray-600 items-center justify-between border-b border-dashed border-slate-300 pb-1"
            >
              <span>Izoh:</span>
              {{selectedBooking.customerNote}}
            </p>
          </div>
<!--          <div v-if="nextBookingActions[selectedBooking.status]?.length"-->
<!--               class="flex flex-wrap gap-2 px-5 pb-5"-->
<!--          >-->
<!--            <button-->
<!--                v-for="action in nextBookingActions[selectedBooking.status]"-->
<!--                :key="action.status"-->
<!--                :disabled="updatingId === selectedBooking.id"-->
<!--                @click="changeStatus(action.status)"-->
<!--                :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',-->
<!--                 action.cls]"-->
<!--            >-->
<!--              {{ action.label }}-->
<!--            </button>-->
<!--          </div>-->
        </div>
      </div>
    </Teleport>

    <NewBookingModal
      v-if="showNewBooking && profile"
      :business-id="profile.businessId"
      :staff-id="profile.id"
      :bookings="bookings"
      :initial-date="isPastDay ? todayIso() : selectedDate"
      @close="showNewBooking = false"
      @created="reloadBookings"
    />
  </div>
</template>
