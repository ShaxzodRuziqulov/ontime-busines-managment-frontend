<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-4 mb-6">
      <div class="flex w-full items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-800">Jadval</h1>
<!--        <p class="text-slate-500 text-sm mt-1">{{ dateLabel }}</p>-->
        <div class="flex items-center gap-2">
          <button @click="shiftDate(-1)" class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <div class="relative">
            <CalendarDays class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
                v-model="selectedDate"
                type="date"
                class="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
          <button @click="shiftDate(1)" class="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500">
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
              v-if="!isToday"
              @click="selectedDate = todayIso()"
              class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm text-slate-600"
          >
            Bugun
          </button>
        </div>
      </div>
      <div
          class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 items-center text-gray-600 text-sm font-medium gap-2"
      >
        <div class="flex bg-slate-200 px-2 py-1 rounded items-center gap-1">
          <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
          Bajarilgan
        </div>
        <div class="flex bg-slate-200 px-2 py-1 rounded items-center gap-1">
          <span class="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          Bekor
        </div>
        <div class="flex bg-slate-200 px-2 py-1 rounded items-center gap-1">
          <span class="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
          Tasdiqlandi
        </div>
        <div class="flex bg-slate-200 px-2 py-1 rounded items-center gap-1">
          <span class="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
          Jarayonda
        </div>
        <div class="flex bg-slate-200 px-2 py-1 rounded items-center gap-1">
          <span class="w-2.5 h-2.5 bg-gray-400 rounded-full"></span>
          Kelmadi
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
      Yuklanmoqda...
    </div>

    <EmptyState
        v-else-if="activeStaff.length === 0"
        title="Faol xodim yo'q"
        description="Jadvalni ko'rish uchun avval faol xodim qo'shing"
    >
      <template #icon><CalendarDays class="w-8 h-8 text-slate-400" /></template>
    </EmptyState>

    <EmptyState
        v-else-if="!todaysHours || todaysHours.closed"
        :title="`${WEEKDAY_LABELS[weekdayForSelectedDate]} kuni ish yo'q`"
        description="Bu kun uchun ish vaqti belgilanmagan yoki dam olish kuni"
    >
      <template #icon><CalendarDays class="w-8 h-8 text-slate-400" /></template>
    </EmptyState>

    <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      <div v-if="bookingsLoading" class="absolute inset-0 bg-white/60 z-30 flex items-center justify-center text-sm text-slate-400">
        Yuklanmoqda...
      </div>
      <div class="overflow-auto" style="max-height: min(65vh, 620px)">
        <div :style="{ minWidth: `${64 + columns.length * COLUMN_WIDTH}px` }">
          <!-- Header -->
          <div class="flex sticky top-0 z-30 bg-slate-100 border-b border-gray-200">
            <div class="w-16 flex-shrink-0 bg-slate-50 flex items-center justify-center text-sm font-medium border-r border-gray-200 text-slate-600 sticky left-0"
            >
              Vaqt
            </div>
            <div
                v-for="col in columns"
                :key="col.id ?? 'unassigned'"
                class="flex-1 p-2 z-1 border-r border-gray-200  flex items-center gap-2"
                :style="{ minWidth: `${COLUMN_WIDTH}px` }"
            >
              <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: col.color }" />
              <span class="text-sm font-medium text-slate-700 truncate">{{ col.name }}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="flex relative" :style="{ height: `${gridHeight}px` }">
            <div class="w-16 flex-shrink-0 flex items-center border-r border-slate-100 sticky left-0 z-20 bg-white">
              <span
                  v-for="slot in timeSlots"
                  :key="slot.label"
                  class="absolute border-t border-gray-100 pointer-events-none w-full text-[11px] px-5 py-3 text-slate-400"
                  :style="{ top: `${slot.top}px` }"
              >
                {{ slot.label }}
              </span>
            </div>

            <div
                v-for="col in columns"
                :key="col.id ?? 'unassigned'"
                class="flex-1 relative border-r border-slate-100 duration-200 transition-colors group"
                :style="{ minWidth: `${COLUMN_WIDTH}px` }"
                title="Yangi navbat qo'shish uchun bosing"
                @click.self="onColumnClick($event, col.id, col.name)"
                @mousemove="onColumnMouseMove($event, col.id)"
                @mouseleave="onColumnMouseLeave"
            >
              <div
                  v-for="slot in timeSlots"
                  :key="slot.label"
                  class="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                  :style="{ top: `${slot.top}px` }"
              />
              <button
                  v-for="b in bookingsForColumn(col.id)"
                  :key="b.id"
                  class="absolute left-1 right-1 rounded-lg px-2 text-left overflow-hidden text-white text-xs shadow-sm hover:brightness-95 transition-all z-10"
                  :class="bookingStatusBlockColors[b.status]"
                  :style="blockStyle(b)"
                  @click="selectedBooking = b"
              >
                <span class="flex flex-col text-xs gap-1">
                  <span class="font-medium break-words">{{ b.customerName || b.guestName || 'Mijoz' }}</span>
                  <span
                      class="flex flex-1 gap-1 justify-between w-full items-center text-xs"
                  >
                    <span v-if="b.offeredServiceName" class="break-words opacity-90 leading-tight">{{ b.offeredServiceName }}</span>
                    <span>
                      {{formatTime(b.startAt)}} - {{formatTime(b.endAt)}}
                    </span>
                  </span>
                </span>
              </button>
              <div
                  v-if="hoverCol === (col.id ?? '__unassigned__')"
                  class="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-75"
                  :style="{ top: `${hoverY -16}px`, height: '32px' }"
              >
                <div class="flex items-center
                text-indigo-500 text-xs font-medium px-2 py-1 shadow-lg rounded-full bg-indigo-100">
                  <span class="text-base font-light leading-none">+</span>
                </div>
              </div>
            </div>

            <div
                v-if="nowTop !== null"
                class="absolute left-16 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                :style="{ top: `${nowTop}px` }"
            >
              <span class="absolute -left-0.4 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking detail modal -->
    <Teleport to="body" v-if="selectedBooking">
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="selectedBooking = null" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">{{ selectedBooking.customerName || selectedBooking.guestName || 'Mijoz' }}</h3>
            <button class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" @click="selectedBooking = null">
              <XIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="px-5 py-4 space-y-2 text-sm">
            <p v-if="selectedBooking.guestPhone" class="text-slate-500">{{ selectedBooking.guestPhone }}</p>
            <p class="text-slate-700">{{ selectedBooking.offeredServiceName || '—' }}</p>
            <p class="text-slate-500">{{ formatTime(selectedBooking.startAt) }} — {{ formatTime(selectedBooking.endAt) }}</p>
            <span :class="['inline-block text-xs font-medium px-2.5 py-1 rounded-full', bookingStatusBadgeColors[selectedBooking.status]]">
              {{ bookingStatusLabels[selectedBooking.status] }}
            </span>
          </div>
          <div v-if="nextBookingActions[selectedBooking.status]?.length" class="flex flex-wrap gap-2 px-5 pb-5">
            <button
                v-for="action in nextBookingActions[selectedBooking.status]"
                :key="action.status"
                :disabled="updatingId === selectedBooking.id"
                @click="changeStatus(action.status)"
                :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50', action.cls]"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tezkor navbat yaratish -->
    <Teleport to="body" v-if="quickCreate">
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeQuickCreate" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 class="font-semibold text-slate-800">Yangi navbat</h3>
              <p class="text-xs text-slate-400 mt-0.5">{{ quickCreate.staffName }} · {{ dateLabel }}</p>
            </div>
            <button class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" @click="closeQuickCreate">
              <XIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="px-5 py-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Xizmat *</label>
              <select
                  v-model="quickForm.offeredServiceId"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="" disabled>Tanlang...</option>
                <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }} — {{ s.durationMinutes }} daq.</option>
              </select>
            </div>

            <div v-if="quickSelectedService">
              <label class="block text-xs font-medium text-slate-600 mb-1">Vaqt *</label>
              <div v-if="quickPossibleStarts.length === 0" class="text-xs text-slate-400">Bu kunda bo'sh vaqt yo'q</div>
              <div v-else class="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                <button
                    v-for="m in quickPossibleStarts"
                    :key="m"
                    type="button"
                    :disabled="isQuickSlotBusy(m)"
                    @click="quickForm.startMin = m"
                    :class="[
                    'text-xs font-medium py-1.5 rounded-lg border transition-colors',
                    quickForm.startMin === m ? 'bg-primary-600 text-white border-primary-600' :
                    isQuickSlotBusy(m) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' :
                    'border-slate-200 hover:border-primary-400 text-slate-600',
                  ]"
                >
                  {{ minutesToLabel(m) }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Mijoz ismi *</label>
              <input
                  v-model="quickForm.guestName"
                  type="text"
                  placeholder="Ali Valiyev"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
              <input
                  v-model="quickForm.guestPhone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <p v-if="quickError" class="text-xs text-red-600">{{ quickError }}</p>
          </div>

          <div class="flex gap-3 px-5 pb-5">
            <button
                type="button"
                @click="closeQuickCreate"
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
                type="button"
                :disabled="quickSaving || !quickSelectedService || quickForm.startMin === null"
                @click="submitQuickCreate"
                class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {{ quickSaving ? 'Saqlanmoqda...' : 'Yaratish' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight, CalendarDays, X as XIcon } from 'lucide-vue-next'
import { staffApi } from '@/api/staff'
import { businessHoursApi } from '@/api/businessHours'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  bookingStatusLabels,
  bookingStatusBadgeColors,
  bookingStatusBlockColors,
  nextBookingActions,
} from '@/utils/bookingStatus'
import {
  weekdayFromDate, toMinutes, minutesOfDay, todayIso, isStaffBusy, generatePossibleStarts, minutesToLabel,
} from '@/utils/scheduling'
import type { StaffMember, BusinessHours, Booking, BookingStatus, OfferedService, BookingCreateRequest } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const staffList = ref<StaffMember[]>([])
const hours = ref<BusinessHours[]>([])
const bookings = ref<Booking[]>([])
const services = ref<OfferedService[]>([])
const loading = ref(true)
const bookingsLoading = ref(false)
const selectedBooking = ref<Booking | null>(null)
const updatingId = ref<string | null>(null)

// Bo'sh joyga bosib tezkor navbat yaratish
const quickCreate = ref<{ staffId: string | null; staffName: string } | null>(null)
const quickForm = ref({ offeredServiceId: '', startMin: null as number | null, guestName: '', guestPhone: '', customerNote: '' })
const quickSaving = ref(false)
const quickError = ref('')

const selectedDate = ref(todayIso())

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: 'Dushanba', TUESDAY: 'Seshanba', WEDNESDAY: 'Chorshanba',
  THURSDAY: 'Payshanba', FRIDAY: 'Juma', SATURDAY: 'Shanba', SUNDAY: 'Yakshanba',
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function colorForStaff(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const weekdayForSelectedDate = computed(() => weekdayFromDate(selectedDate.value))

const todaysHours = computed(() =>
  hours.value.find((h) => h.weekday === weekdayForSelectedDate.value) ?? null
)

const isToday = computed(() => selectedDate.value === todayIso())

const dateLabel = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00')
  const formatted = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
  return `${WEEKDAY_LABELS[weekdayForSelectedDate.value]}, ${formatted}`
})

const activeStaff = computed(() => staffList.value.filter((s) => s.active))

// Ustunlar: har bir faol xodim + "Tayinlanmagan" (staffId yo'q bronlar uchun)
const columns = computed(() => [
  ...activeStaff.value.map((s) => ({ id: s.id, name: s.displayName, color: colorForStaff(s.id) })),
  // { id: null, name: 'Tayinlanmagan', color: '#94a3b8' },
])

// Hover tracking
const hoverCol = ref<string | null>(null)
const hoverY = ref(0)

function onColumnMouseMove(event: MouseEvent, staffId: string | null) {
  const target = event.currentTarget as HTMLElement
  hoverCol.value = staffId ?? '__unassigned__'
  hoverY.value = event.clientY - target.getBoundingClientRect().top
}

function onColumnMouseLeave() {
  hoverCol.value = null
}

const PX_PER_MIN = 2
const SLOT_INTERVAL = 30
const COLUMN_WIDTH = 180
// Vaqt yorlig'i chiziq ustida markazlashtirilgani uchun ("-translate-y-1/2"),
// birinchi yorliq tepada kesilib qolmasligi uchun butun panjaraga yuqoridan bo'sh joy qo'shiladi.
const TOP_PAD = 0

const openMinutes = computed(() => (todaysHours.value?.opensAt ? toMinutes(todaysHours.value.opensAt) : 9 * 60))
const closeMinutes = computed(() => (todaysHours.value?.closesAt ? toMinutes(todaysHours.value.closesAt) : 18 * 60))
const gridHeight = computed(() => Math.max((closeMinutes.value - openMinutes.value) * PX_PER_MIN, 100))

const timeSlots = computed(() => {
  const slots: { label: string; top: number }[] = []
  for (let m = openMinutes.value; m <= closeMinutes.value; m += SLOT_INTERVAL) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    slots.push({ label: `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, top: (m - openMinutes.value) * PX_PER_MIN + TOP_PAD })
  }
  return slots
})

function blockStyle(booking: Booking) {
  const start = minutesOfDay(booking.startAt)
  const end = minutesOfDay(booking.endAt)
  const top = Math.max((start - openMinutes.value) * PX_PER_MIN, 0) + TOP_PAD
  const height = Math.max((end - start) * PX_PER_MIN, 36)
  return { top: `${top}px`, height: `${height}px` }
}

const bookingsByStaff = computed(() => {
  const map = new Map<string | null, Booking[]>()
  for (const b of bookings.value) {
    const key = b.staffId ?? null
    const list = map.get(key)
    if (list) list.push(b)
    else map.set(key, [b])
  }
  return map
})

function bookingsForColumn(staffId: string | null) {
  return bookingsByStaff.value.get(staffId) ?? []
}

const nowTick = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

const nowTop = computed(() => {
  if (!isToday.value) return null
  const now = new Date(nowTick.value)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  if (nowMin < openMinutes.value || nowMin > closeMinutes.value) return null
  return (nowMin - openMinutes.value) * PX_PER_MIN + TOP_PAD
})

function onColumnClick(event: MouseEvent, staffId: string | null, staffName: string) {
  const target = event.currentTarget as HTMLElement
  const y = event.clientY - target.getBoundingClientRect().top - TOP_PAD
  const raw = openMinutes.value + y / PX_PER_MIN
  const snapped = Math.round(raw / SLOT_INTERVAL) * SLOT_INTERVAL
  const startMin = Math.min(Math.max(snapped, openMinutes.value), Math.max(closeMinutes.value - SLOT_INTERVAL, openMinutes.value))

  quickCreate.value = { staffId, staffName }
  quickForm.value = { offeredServiceId: '', startMin, guestName: '', guestPhone: '', customerNote: '' }
  quickError.value = ''
}

const quickSelectedService = computed(() => services.value.find((s) => s.id === quickForm.value.offeredServiceId))

const quickPossibleStarts = computed(() => {
  const service = quickSelectedService.value
  if (!service || !todaysHours.value || todaysHours.value.closed || !todaysHours.value.opensAt || !todaysHours.value.closesAt) return []
  return generatePossibleStarts(toMinutes(todaysHours.value.opensAt), toMinutes(todaysHours.value.closesAt), service.durationMinutes, SLOT_INTERVAL)
})

function isQuickSlotBusy(startMin: number) {
  if (!quickCreate.value?.staffId || !quickSelectedService.value) return false
  return isStaffBusy(bookings.value, quickCreate.value.staffId, startMin, startMin + quickSelectedService.value.durationMinutes)
}

watch(() => quickForm.value.offeredServiceId, () => {
  // Xizmat almashtirilganda, tanlangan vaqt yangi ro'yxatda mavjud bo'lmasa, eng yaqinini tanlaymiz
  const starts = quickPossibleStarts.value
  if (starts.length === 0) return
  const current = quickForm.value.startMin
  if (current === null || !starts.includes(current)) {
    quickForm.value.startMin = starts.reduce((closest, m) =>
      Math.abs(m - (current ?? m)) < Math.abs(closest - (current ?? m)) ? m : closest, starts[0])
  }
})

function closeQuickCreate() {
  quickCreate.value = null
}

async function submitQuickCreate() {
  const bid = businessStore.business?.id
  const service = quickSelectedService.value
  if (!bid || !quickCreate.value || !service || quickForm.value.startMin === null) return
  if (!quickForm.value.guestName.trim()) {
    quickError.value = 'Mijoz ismini kiriting'
    return
  }
  quickSaving.value = true
  quickError.value = ''
  try {
    const [y, mo, d] = selectedDate.value.split('-').map(Number)
    const startMin = quickForm.value.startMin
    const start = new Date(y, mo - 1, d, Math.floor(startMin / 60), startMin % 60)
    const end = new Date(start.getTime() + service.durationMinutes * 60000)
    const payload: BookingCreateRequest = {
      businessId: bid,
      offeredServiceId: service.id,
      staffId: quickCreate.value.staffId ?? undefined,
      // Backend `Instant` kutadi — zonasiz mahalliy vaqt emas, to'liq ISO instant kerak.
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      guestName: quickForm.value.guestName.trim(),
      guestPhone: quickForm.value.guestPhone.trim() || undefined,
      customerNote: quickForm.value.customerNote.trim() || undefined,
    }
    await bookingsApi.create(payload)
    toast.success('Navbat yaratildi')
    quickCreate.value = null
    await loadBookings()
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    quickError.value = msg || 'Navbat yaratishda xatolik'
  } finally {
    quickSaving.value = false
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

async function loadStaticData() {
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    const [st, h, sv] = await Promise.all([staffApi.getAll(bid), businessHoursApi.getAll(bid), servicesApi.getAll(bid)])
    staffList.value = st.data
    hours.value = h.data
    services.value = sv.data.filter((s) => s.active)
  } finally {
    loading.value = false
  }
}

async function loadBookings() {
  const bid = businessStore.business?.id
  if (!bid) return
  bookingsLoading.value = true
  try {
    const { data } = await bookingsApi.getAll({ businessId: bid, date: selectedDate.value, size: 200 })
    bookings.value = data.content
  } finally {
    bookingsLoading.value = false
  }
}

function shiftDate(days: number) {
  const d = new Date(selectedDate.value + 'T00:00:00')
  d.setDate(d.getDate() + days)
  selectedDate.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(selectedDate, loadBookings)

async function changeStatus(status: BookingStatus) {
  if (!selectedBooking.value) return
  const booking = selectedBooking.value
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

onMounted(async () => {
  await loadStaticData()
  await loadBookings()
  nowTimer = setInterval(() => { nowTick.value = Date.now() }, 60_000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>
