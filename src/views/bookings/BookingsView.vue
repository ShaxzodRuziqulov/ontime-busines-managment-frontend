<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Search, CalendarCheck, Trash2, Clock } from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { businessHoursApi } from '@/api/businessHours'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import {
  weekdayFromDate, toMinutes, todayIso, isStaffBusy, generatePossibleStarts, minutesToLabel,
} from '@/utils/scheduling'
import type { Booking, BookingStatus, BookingCreateRequest, OfferedService, StaffMember, BusinessHours } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const bookings = ref<Booking[]>([])
const services = ref<OfferedService[]>([])
const staffList = ref<StaffMember[]>([])
const hours = ref<BusinessHours[]>([])
const dayBookings = ref<Booking[]>([])
const slotsLoading = ref(false)
const bookingDate = ref(todayIso())
const selectedStartMin = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const statusFilter = ref<BookingStatus | ''>('')
const showCreateModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const createError = ref('')

const page = ref(0)
const pageSize = 20
const totalPages = ref(0)
const totalElements = ref(0)

const statuses: { label: string; value: BookingStatus | '' }[] = [
  { label: 'Barchasi', value: '' },
  { label: 'Kutilmoqda', value: 'PENDING' },
  { label: 'Tasdiqlangan', value: 'CONFIRMED' },
  { label: 'Jarayonda', value: 'IN_PROGRESS' },
  { label: 'Bajarildi', value: 'COMPLETED' },
  { label: 'Mijoz bekor qildi', value: 'CANCELLED_BY_CUSTOMER' },
  { label: 'Biznes bekor qildi', value: 'CANCELLED_BY_BUSINESS' },
  { label: 'Kelmadi', value: 'NO_SHOW' },
]

const defaultForm = (): BookingCreateRequest => ({
  guestName: '',
  guestPhone: '',
  businessId: businessStore.business?.id ?? '',
  offeredServiceId: '',
  staffId: undefined,
  startAt: '',
  endAt: '',
  customerNote: '',
})

const form = ref<BookingCreateRequest>(defaultForm())

const selectedService = computed(() =>
  services.value.find((s) => s.id === form.value.offeredServiceId)
)

const activeStaffList = computed(() => staffList.value.filter((s) => s.active))

const todaysHoursForBooking = computed(() =>
  hours.value.find((h) => h.weekday === weekdayFromDate(bookingDate.value)) ?? null
)

// Tanlangan xizmat davomiyligiga mos, ish vaqti ichidagi mumkin bo'lgan boshlanish vaqtlari (30 daqiqalik qadam bilan).
const possibleStarts = computed(() => {
  const service = selectedService.value
  const th = todaysHoursForBooking.value
  if (!service || !th || th.closed || !th.opensAt || !th.closesAt) return []
  return generatePossibleStarts(toMinutes(th.opensAt), toMinutes(th.closesAt), service.durationMinutes, 30)
})

function isSlotBusyForSelectedStaff(startMin: number) {
  if (!form.value.staffId || !selectedService.value) return false
  return isStaffBusy(dayBookings.value, form.value.staffId, startMin, startMin + selectedService.value.durationMinutes)
}

function freeSlotCount(staffId: string) {
  if (!selectedService.value) return 0
  return possibleStarts.value.filter(
    (start) => !isStaffBusy(dayBookings.value, staffId, start, start + selectedService.value!.durationMinutes)
  ).length
}

function selectStaff(staffId: string | undefined) {
  form.value.staffId = staffId
  selectedStartMin.value = null
  form.value.startAt = ''
  form.value.endAt = ''
}

function selectSlot(startMin: number) {
  if (!selectedService.value) return
  selectedStartMin.value = startMin
  const [y, mo, d] = bookingDate.value.split('-').map(Number)
  const start = new Date(y, mo - 1, d, Math.floor(startMin / 60), startMin % 60)
  const end = new Date(start.getTime() + selectedService.value.durationMinutes * 60000)
  // Backend `Instant` kutadi — zonasiz mahalliy vaqt emas, to'liq ISO instant kerak.
  form.value.startAt = start.toISOString()
  form.value.endAt = end.toISOString()
}

async function loadDayBookings() {
  const bid = businessStore.business?.id
  if (!bid) return
  slotsLoading.value = true
  try {
    const { data } = await bookingsApi.getAll({ businessId: bid, date: bookingDate.value, size: 200 })
    dayBookings.value = data.content
  } finally {
    slotsLoading.value = false
  }
}

const filtered = computed(() =>
  bookings.value.filter((b) => {
    const matchStatus = !statusFilter.value || b.status === statusFilter.value
    const matchSearch =
      !searchQuery.value ||
      b.customerNote?.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchStatus && matchSearch
  })
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function duration(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return `${diff} daqiqa`
}

function serviceNameById(id: string) {
  return services.value.find((s) => s.id === id)?.name ?? '—'
}

function staffNameById(id: string | null) {
  if (!id) return '—'
  return staffList.value.find((s) => s.id === id)?.displayName ?? '—'
}

async function load() {
  loading.value = true
  try {
    const bid = businessStore.business?.id
    const [b, s, st, h] = await Promise.all([
      bookingsApi.getAll({ ...(bid ? { businessId: bid } : {}), page: page.value, size: pageSize }),
      bid ? servicesApi.getAll(bid) : Promise.resolve({ data: [] as OfferedService[] }),
      bid ? staffApi.getAll(bid) : Promise.resolve({ data: [] as StaffMember[] }),
      bid ? businessHoursApi.getAll(bid) : Promise.resolve({ data: [] as BusinessHours[] }),
    ])
    bookings.value = b.data.content
    totalPages.value = b.data.totalPages
    totalElements.value = b.data.totalElements
    services.value = s.data
    staffList.value = st.data
    hours.value = h.data
  } finally {
    loading.value = false
  }
}

function goToPage(next: number) {
  if (next < 0 || next >= totalPages.value) return
  page.value = next
  load()
}

function openCreate() {
  form.value = defaultForm()
  createError.value = ''
  bookingDate.value = todayIso()
  selectedStartMin.value = null
  showCreateModal.value = true
  loadDayBookings()
}

watch(bookingDate, () => {
  selectedStartMin.value = null
  form.value.startAt = ''
  form.value.endAt = ''
  if (showCreateModal.value) loadDayBookings()
})

watch(() => form.value.offeredServiceId, () => {
  selectedStartMin.value = null
  form.value.startAt = ''
  form.value.endAt = ''
})

function errorMessage(e: unknown, fallback: string) {
  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
  return msg || fallback
}

async function createBooking() {
  createError.value = ''
  if (!form.value.guestName?.trim()) {
    createError.value = 'Mijoz ismini kiriting'
    return
  }
  if (!form.value.offeredServiceId || !form.value.startAt || !form.value.endAt) {
    createError.value = 'Xizmat va vaqtni tanlang'
    return
  }
  if (new Date(form.value.endAt) <= new Date(form.value.startAt)) {
    createError.value = 'Tugash vaqti boshlanish vaqtidan keyin bo\'lishi kerak'
    return
  }
  saving.value = true
  try {
    const payload: BookingCreateRequest = {
      ...form.value,
      startAt: new Date(form.value.startAt).toISOString(),
      endAt: new Date(form.value.endAt).toISOString(),
      staffId: form.value.staffId || undefined,
    }
    await bookingsApi.create(payload)
    showCreateModal.value = false
    toast.success('Navbat yaratildi')
    await load()
  } catch (e) {
    createError.value = errorMessage(e, 'Navbat yaratishda xatolik')
  } finally {
    saving.value = false
  }
}

async function updateStatus(booking: Booking, status: BookingStatus) {
  const previous = booking.status
  try {
    await bookingsApi.update(booking.id, { status })
    booking.status = status
    toast.success('Status yangilandi')
  } catch (e) {
    booking.status = previous
    toast.error(errorMessage(e, 'Statusni yangilashda xatolik'))
  }
}

async function confirmDelete(id: string) {
  try {
    await bookingsApi.delete(id)
    toast.success('Navbat o\'chirildi')
    await load()
  } catch (e) {
    toast.error(errorMessage(e, 'O\'chirishda xatolik yuz berdi'))
  }
  deleteConfirm.value = null
}

onMounted(load)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Navbatlar</h1>
        <p class="text-slate-500 text-sm mt-1">Jami {{ totalElements }} ta navbat</p>
      </div>
      <button
        v-if="!businessStore.isExpired"
        @click="openCreate()"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        Navbat qo'shish
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Izoh bo'yicha qidirish..."
          class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="s in statuses"
          :key="s.value"
          @click="statusFilter = s.value"
          :class="[
            'px-3 py-2 rounded-xl text-xs font-medium transition-all border',
            statusFilter === s.value
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300',
          ]"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :rows="6" :cols="7" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Navbat topilmadi"
        description="Hali hech qanday navbat yo'q yoki filtr natijasida ko'rsatish uchun ma'lumot yo'q"
      >
        <template #icon>
          <CalendarCheck class="w-8 h-8 text-slate-400" />
        </template>
        <template #action>
          <button
            v-if="!businessStore.isExpired"
            @click="openCreate()"
            class="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            Navbat qo'shish
          </button>
        </template>
      </EmptyState>

      <template v-else>
        <!-- Mobile: cards -->
        <div class="sm:hidden space-y-3">
          <div
            v-for="booking in filtered"
            :key="booking.id"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ formatDate(booking.startAt) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ duration(booking.startAt, booking.endAt) }}</p>
              </div>
              <StatusBadge :status="booking.status" />
            </div>
            <p class="text-xs text-slate-500 mb-1">
              <span class="font-medium">Mijoz:</span> {{ booking.customerName || booking.guestName || '—' }}
              <span v-if="booking.guestPhone"> · {{ booking.guestPhone }}</span>
            </p>
            <p class="text-xs text-slate-500 mb-1">
              <span class="font-medium">Xizmat:</span> {{ serviceNameById(booking.offeredServiceId) }}
            </p>
            <p class="text-xs text-slate-500 mb-3">
              <span class="font-medium">Xodim:</span> {{ staffNameById(booking.staffId) }}
            </p>
            <p v-if="booking.customerNote" class="text-xs text-slate-500 mb-3 truncate">{{ booking.customerNote }}</p>
            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <select
                :value="booking.status"
                @change="updateStatus(booking, ($event.target as HTMLSelectElement).value as BookingStatus)"
                class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600"
              >
                <option value="PENDING">Kutilmoqda</option>
                <option value="CONFIRMED">Tasdiqlash</option>
                <option value="IN_PROGRESS">Jarayonda</option>
                <option value="COMPLETED">Bajarildi</option>
                <option value="CANCELLED_BY_CUSTOMER">Mijoz bekor qildi</option>
                <option value="CANCELLED_BY_BUSINESS">Biznes bekor qildi</option>
                <option value="NO_SHOW">Kelmadi</option>
              </select>
              <button
                class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                @click="deleteConfirm = booking.id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop: table -->
        <div class="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Mijoz</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Boshlanish</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Davomiylik</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Xizmat</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Xodim</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Izoh</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Status</th>
                  <th class="text-right px-5 py-3.5 font-semibold text-slate-600">Amal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr
                  v-for="booking in filtered"
                  :key="booking.id"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-5 py-4 text-slate-700">
                    <div>{{ booking.customerName || booking.guestName || '—' }}</div>
                    <div v-if="booking.guestPhone" class="text-xs text-slate-400">{{ booking.guestPhone }}</div>
                  </td>
                  <td class="px-5 py-4 text-slate-700 whitespace-nowrap">{{ formatDate(booking.startAt) }}</td>
                  <td class="px-5 py-4 text-slate-500 whitespace-nowrap">
                    <span class="flex items-center gap-1">
                      <Clock class="w-3.5 h-3.5" />
                      {{ duration(booking.startAt, booking.endAt) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-slate-700">{{ serviceNameById(booking.offeredServiceId) }}</td>
                  <td class="px-5 py-4 text-slate-600">{{ staffNameById(booking.staffId) }}</td>
                  <td class="px-5 py-4 text-slate-600 max-w-xs">
                    <span class="truncate block">{{ booking.customerNote || '—' }}</span>
                  </td>
                  <td class="px-5 py-4">
                    <StatusBadge :status="booking.status" />
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center justify-end gap-1">
                      <select
                        :value="booking.status"
                        @change="updateStatus(booking, ($event.target as HTMLSelectElement).value as BookingStatus)"
                        class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600 cursor-pointer"
                      >
                        <option value="PENDING">Kutilmoqda</option>
                        <option value="CONFIRMED">Tasdiqlash</option>
                        <option value="IN_PROGRESS">Jarayonda</option>
                        <option value="COMPLETED">Bajarildi</option>
                        <option value="CANCELLED_BY_CUSTOMER">Mijoz bekor qildi</option>
                        <option value="CANCELLED_BY_BUSINESS">Biznes bekor qildi</option>
                        <option value="NO_SHOW">Kelmadi</option>
                      </select>
                      <button
                        class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        @click="deleteConfirm = booking.id"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>{{ page + 1 }} / {{ totalPages }} sahifa</span>
          <div class="flex gap-2">
            <button
              :disabled="page === 0"
              @click="goToPage(page - 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Oldingi
            </button>
            <button
              :disabled="page + 1 >= totalPages"
              @click="goToPage(page + 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Keyingi
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- Create booking modal -->
    <AppModal
      v-if="showCreateModal"
      title="Yangi navbat qo'shish"
      @close="showCreateModal = false"
    >
      <form @submit.prevent="createBooking" class="space-y-4">
        <p v-if="createError" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{{ createError }}</p>

        <!-- Guest customer info -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Mijoz ismi *</label>
            <input
              v-model="form.guestName"
              type="text"
              placeholder="Ali Valiyev"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon (ixtiyoriy)</label>
            <input
              v-model="form.guestPhone"
              type="tel"
              placeholder="+998901234567"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <!-- Service -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Xizmat *</label>
          <select
            v-model="form.offeredServiceId"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">— Xizmatni tanlang —</option>
            <option
              v-for="s in services.filter(s => s.active)"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }} ({{ s.durationMinutes }} daqiqa — {{ s.basePrice.toLocaleString() }} so'm)
            </option>
          </select>
        </div>

        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Sana *</label>
          <input
            v-model="bookingDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- Staff -->
        <div v-if="selectedService">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Xodim (ixtiyoriy)</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="selectStaff(undefined)"
              :class="[
                'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                !form.staffId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              Xodim tanlanmagan
            </button>
            <button
              v-for="st in activeStaffList"
              :key="st.id"
              type="button"
              @click="selectStaff(st.id)"
              :class="[
                'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                form.staffId === st.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              <div class="truncate">{{ st.displayName }}</div>
              <div :class="['text-[10px] mt-0.5', form.staffId === st.id ? 'text-white/80' : 'text-slate-400']">
                {{ slotsLoading ? '...' : (freeSlotCount(st.id) > 0 ? `${freeSlotCount(st.id)} ta bo'sh` : "To'liq band") }}
              </div>
            </button>
          </div>
        </div>

        <!-- Time slots -->
        <div v-if="selectedService">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Boshlanish vaqti *
            <span class="text-slate-400 font-normal ml-1">({{ selectedService.durationMinutes }} daqiqa)</span>
          </label>
          <p v-if="!todaysHoursForBooking || todaysHoursForBooking.closed" class="text-xs text-slate-400">
            Bu kunda ish vaqti belgilanmagan yoki dam olish kuni
          </p>
          <p v-else-if="possibleStarts.length === 0" class="text-xs text-slate-400">
            Bu kun uchun bo'sh vaqt yo'q
          </p>
          <div v-else class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            <button
              v-for="start in possibleStarts"
              :key="start"
              type="button"
              :disabled="isSlotBusyForSelectedStaff(start)"
              @click="selectSlot(start)"
              :class="[
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                selectedStartMin === start
                  ? 'bg-primary-600 text-white border-primary-600'
                  : isSlotBusyForSelectedStaff(start)
                    ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed line-through'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300',
              ]"
            >
              {{ minutesToLabel(start) }}
            </button>
          </div>
        </div>

        <!-- Note -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Izoh (ixtiyoriy)</label>
          <textarea
            v-model="form.customerNote"
            rows="2"
            placeholder="Mijoz istaklari..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            @click="showCreateModal = false"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            {{ saving ? 'Saqlanmoqda...' : 'Navbat qo\'shish' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Delete confirmation modal -->
    <AppModal
      v-if="deleteConfirm"
      title="Navbatni o'chirish"
      size="sm"
      @close="deleteConfirm = null"
    >
      <p class="text-slate-600 text-sm mb-5">Ushbu navbatni o'chirishni tasdiqlaysizmi? Bu amalni bekor qilib bo'lmaydi.</p>
      <div class="flex gap-3">
        <button
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          @click="deleteConfirm = null"
        >
          Bekor qilish
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          @click="confirmDelete(deleteConfirm!)"
        >
          O'chirish
        </button>
      </div>
    </AppModal>
  </div>
</template>
