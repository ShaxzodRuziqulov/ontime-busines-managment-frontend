<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between lg:p-0 p-4 gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">
          {{ t('nav.bookings') }}
        </h2>
        <p class="text-slate-500 text-sm mt-1">
          {{ t('bookings.total', { n: totalElements }) }}
        </p>
      </div>
      <button
        v-if="!businessStore.isReadOnly"
        @click="openCreate()"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        {{ t('bookings.add') }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 lg:p-0 p-4 mb-5">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('bookings.searchPlaceholder')"
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
        :title="t('bookings.emptyTitle')"
        :description="t('bookings.emptyDesc')"
      >
        <template #icon>
          <CalendarCheck class="w-8 h-8 text-slate-400" />
        </template>
        <template #action>
          <button
            v-if="!businessStore.isReadOnly"
            @click="openCreate()"
            class="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            {{ t('bookings.add') }}
          </button>
        </template>
      </EmptyState>

      <template v-else>
        <!-- Mobile: cards -->
        <div class="sm:hidden space-y-3 lg:p-0 p-4">
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
              <span class="font-medium">{{ t('bookings.customerLabel') }}</span> {{ bookingCustomerName(booking, '—') }}
              <span v-if="booking.customerPhone"> · {{ booking.customerPhone }}</span>
            </p>
            <p class="text-xs text-slate-500 mb-1">
              <span class="font-medium">{{ t('bookings.serviceLabel') }}</span> {{ serviceNameById(booking.offeredServiceId) }}
            </p>
            <p class="text-xs text-slate-500 mb-3">
              <span class="font-medium">{{ t('bookings.staffLabel') }}</span> {{ staffNameById(booking.staffId) }}
            </p>
            <p
                v-if="booking.customerNote"
                class="text-xs text-slate-500 mb-3 truncate"
            >
              {{ booking.customerNote }}
            </p>
            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <select
                :value="booking.status"
                @change="updateStatus(booking, ($event.target as HTMLSelectElement).value as BookingStatus)"
                class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600"
              >
                <option value="PENDING">{{ t('status.booking.PENDING') }}</option>
                <option value="CONFIRMED">{{ t('status.booking.CONFIRMED') }}</option>
                <option value="IN_PROGRESS">{{ t('status.booking.IN_PROGRESS') }}</option>
                <option value="COMPLETED">{{ t('status.booking.COMPLETED') }}</option>
                <option value="CANCELLED_BY_CUSTOMER">{{ t('status.bookingLong.CANCELLED_BY_CUSTOMER') }}</option>
                <option value="CANCELLED_BY_BUSINESS">{{ t('status.bookingLong.CANCELLED_BY_BUSINESS') }}</option>
                <option value="NO_SHOW">{{ t('status.booking.NO_SHOW') }}</option>
              </select>
              <div class="flex items-center gap-1">
                <button
                    :disabled="disabledItems(booking.status)"
                    class="p-2 rounded-lg cursor-pointer transition-colors"
                    :class="
                            disabledItems(booking.status)
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-blue-500 hover:bg-blue-100'
                            "
                    @click="editForm(booking)"
                >
                  <Pencil class="w-4 h-4"/>
                </button>
                <button
                    class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    @click="deleteConfirm = booking.id"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop: table -->
        <div class="hidden sm:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">№</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colCustomer') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colStart') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colDuration') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colService') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colStaff') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colNote') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colStatus') }}</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">{{ t('bookings.colActions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="(booking, index) in filtered"
                  :key="booking.id"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-5 py-4 text-slate-700">{{index + 1}}</td>
                  <td class="px-5 py-4 text-slate-700">
                    <div>{{ bookingCustomerName(booking, '—') }}</div>
                    <div
                        v-if="booking.customerPhone"
                        class="text-xs text-slate-400"
                    >
                      {{ booking.customerPhone }}
                    </div>
                  </td>
                  <td class="px-5 py-4 text-slate-700 whitespace-nowrap">
                    {{ formatDate(booking.startAt) }}
                  </td>
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
                    <div class="flex items-center justify-between gap-1">
                      <select
                        :disabled="disabledItems(booking.status)"
                        :value="booking.status"
                        @change="updateStatus(booking, ($event.target as HTMLSelectElement).value as BookingStatus)"
                        class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600 cursor-pointer"
                      >
                        <option value="PENDING">{{ t('status.booking.PENDING') }}</option>
                        <option value="CONFIRMED">{{ t('status.booking.CONFIRMED') }}</option>
                        <option value="IN_PROGRESS">{{ t('status.booking.IN_PROGRESS') }}</option>
                        <option value="COMPLETED">{{ t('status.booking.COMPLETED') }}</option>
                        <option value="CANCELLED_BY_CUSTOMER">{{ t('status.bookingLong.CANCELLED_BY_CUSTOMER') }}</option>
                        <option value="CANCELLED_BY_BUSINESS">{{ t('status.bookingLong.CANCELLED_BY_BUSINESS') }}</option>
                        <option value="NO_SHOW">{{ t('status.booking.NO_SHOW') }}</option>
                      </select>
                      <div class="flex items-center gap-1">
                        <button
                            :disabled="disabledItems(booking.status)"
                            class="p-2 rounded-lg cursor-pointer transition-colors"
                            :class="
                            disabledItems(booking.status)
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-400 hover:text-blue-500 hover:bg-blue-100'
                            "
                            @click="editForm(booking)"
                        >
                          <Pencil class="w-4 h-4"/>
                        </button>
                        <button
                            class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            @click="deleteConfirm = booking.id"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>{{ t('bookings.pageOf', { page: page + 1, total: totalPages }) }}</span>
          <div class="flex gap-2">
            <button
              :disabled="page === 0"
              @click="goToPage(page - 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              {{ t('bookings.prev') }}
            </button>
            <button
              :disabled="page + 1 >= totalPages"
              @click="goToPage(page + 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              {{ t('bookings.next') }}
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- Create booking modal -->
    <AppModal
      v-if="showCreateModal"
      :title="editingBookingId ? t('bookings.editTitle') : t('bookings.newTitle')"
      @close="showCreateModal = false"
    >
      <form
          @submit.prevent="saveBooking"
          class="space-y-4 text-gray-600"
      >
        <p
            v-if="createError"
            class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
        >
          {{ createError }}
        </p>
        <div class="flex flex-col p-4 gap-3 overflow-y-auto max-h-[68vh]">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                {{ t('bookings.customerNameReq') }}
              </label>
              <input
                  v-model="form.customerFirstName"
                  type="text"
                  :placeholder="t('bookings.namePlaceholder')"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                {{ t('bookings.phoneOptional') }}
              </label>
              <input
                  v-model="form.customerPhone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('bookings.serviceReq') }}
            </label>
            <select
                v-model="form.offeredServiceId"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">{{ t('bookings.selectServiceOption') }}</option>
              <option
                  v-for="s in services.filter(s => s.active)"
                  :key="s.id"
                  :value="s.id"
              >
                {{ s.name }} ({{ s.durationMinutes }} {{ t('common.minutes') }} — {{ s.basePrice.toLocaleString(dateLocale()) }} {{ t('common.currency') }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('bookings.dateReq') }}
            </label>
            <input
                v-model="bookingDate"
                type="date"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div v-if="selectedService">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('bookings.staffOptional') }}
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                  type="button"
                  @click="selectStaff(undefined)"
                  :class="[
                'px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all',
                !form.staffId ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
              >
                {{ t('bookings.noStaffSelected') }}
              </button>
              <button
                  v-for="st in activeStaffList"
                  :key="st.id"
                  type="button"
                  @click="selectStaff(st.id)"
                  :class="[
                'px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-medium border text-left transition-all',
                form.staffId === st.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
              >
                <span class="">{{ personName(st) }}</span>
                <span
                    :class="['text-[10px] mt-0.5',
                     form.staffId === st.id ? 'text-white/80' : 'text-slate-400']"
                >
                {{ slotsLoading ? '...' : (freeSlotCount(st.id) > 0 ? t('bookings.freeSlots', { n: freeSlotCount(st.id) }) : t('bookings.fullyBooked')) }}
              </span>
              </button>
            </div>
          </div>
          <div v-if="selectedService">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('bookings.startTimeReq') }}
              <span
                  class="text-slate-400 font-normal ml-1"
              >
                ({{ t('bookings.minutes', { n: selectedService.durationMinutes }) }})
              </span>
            </label>
            <p
                v-if="!todaysHoursForBooking || todaysHoursForBooking.closed"
                class="text-xs text-slate-400"
            >
              {{ t('bookings.noHours') }}
            </p>
            <p
                v-else-if="possibleStarts.length === 0"
                class="text-xs text-slate-400"
            >
              {{ t('bookings.noFreeTime') }}
            </p>
            <div
                v-else
                class="grid grid-cols-5 gap-1.5 shadow max-h-60 overflow-y-auto"
            >
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
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              {{ t('bookings.noteOptional') }}
            </label>
            <textarea
                v-model="form.customerNote"
                rows="2"
                :placeholder="t('bookings.notePlaceholder')"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            @click="showCreateModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            {{ saving
              ? t('common.saving')
              : editingBookingId
              ? t('bookings.update')
              : t('bookings.add') }}
          </button>
        </div>
      </form>
    </AppModal>
    <AppModal
      v-if="deleteConfirm"
      :title="t('bookings.deleteTitle')"
      size="sm"
      @close="deleteConfirm = null"
    >
      <p class="text-slate-600 flex items-center justify-center text-sm mb-5">
        {{ t('bookings.deleteMessage') }}
      </p>
      <div class="flex gap-3">
        <button
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
          @click="deleteConfirm = null"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          @click="confirmDelete(deleteConfirm!)"
        >
          {{ t('common.delete') }}
        </button>
      </div>
    </AppModal>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Search, CalendarCheck, Trash2, Clock, Pencil } from 'lucide-vue-next'
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
import { bookingCustomerName, personName } from '@/utils/names'
import type { Booking, BookingStatus, BookingCreateRequest, OfferedService, StaffMember, BusinessHours } from '@/types'
import { useI18n } from 'vue-i18n'
import { dateLocale } from '@/i18n'

const businessStore = useBusinessStore()
const toast = useToast()
const { t } = useI18n()

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
const editingBookingId = ref<string | null>(null)
const editingServiceId = ref<string | null>(null)
const deleteConfirm = ref<string | null>(null)
const createError = ref('')

const page = ref(0)
const pageSize = 20
const totalPages = ref(0)
const totalElements = ref(0)

const statuses = computed<{ label: string; value: BookingStatus | '' }[]>(() => [
  { label: t('bookings.all'), value: '' },
  { label: t('status.booking.PENDING'), value: 'PENDING' },
  { label: t('status.booking.CONFIRMED'), value: 'CONFIRMED' },
  { label: t('status.booking.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('status.booking.COMPLETED'), value: 'COMPLETED' },
  { label: t('status.bookingLong.CANCELLED_BY_CUSTOMER'), value: 'CANCELLED_BY_CUSTOMER' },
  { label: t('status.bookingLong.CANCELLED_BY_BUSINESS'), value: 'CANCELLED_BY_BUSINESS' },
  { label: t('status.booking.NO_SHOW'), value: 'NO_SHOW' },
])

const defaultForm = (): BookingCreateRequest => ({
  customerFirstName: '',
  customerPhone: '',
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

const activeStaffList = computed(() =>
    staffList.value.filter((s) => {
      if (!s.active) return false
      if (!form.value.offeredServiceId) return true
      return s.serviceIds?.includes(form.value.offeredServiceId)
    })
)

const todaysHoursForBooking = computed(() =>
    hours.value.find((h) => h.weekday === weekdayFromDate(bookingDate.value)) ?? null
)

// Tanlangan xizmat davomiyligiga mos, ish vaqti ichidagi mumkin bo'lgan boshlanish vaqtlari (30 daqiqalik qadam bilan).
const possibleStarts = computed(() => {
  const service = selectedService.value
  const th = todaysHoursForBooking.value
  if (!service || !th || th.closed || !th.opensAt || !th.closesAt) return []
  return generatePossibleStarts(toMinutes(th.opensAt),
      toMinutes(th.closesAt),
      service.durationMinutes,
      15
  )
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
  if (form.value.staffId === staffId) {
    form.value.staffId = ''
    selectedStartMin.value = null
    form.value.startAt = ''
    form.value.endAt = ''
  } else {
    form.value.staffId = staffId
    selectedStartMin.value = null
    form.value.startAt = ''
    form.value.endAt = ''
  }
}

function selectSlot(startMin: number) {
  if (!selectedService.value) return

  const [y, mo, d] = bookingDate.value.split('-').map(Number)
  const start = new Date(y, mo - 1, d, Math.floor(startMin / 60), startMin % 60)
  const end = new Date(start.getTime() + selectedService.value.durationMinutes * 60000)

  if (selectedStartMin.value === startMin) {
    selectedStartMin.value = null
    form.value.startAt = ''
    form.value.endAt = ''
  } else {
    selectedStartMin.value = startMin
    form.value.startAt = start.toISOString()
    form.value.endAt = end.toISOString()
  }
  // Backend `Instant` kutadi — zonasiz mahalliy vaqt emas, to'liq ISO instant kerak.

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

const filtered = computed(() => bookings.value)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(dateLocale(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function duration(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return t('bookings.minutes', { n: diff })
}

function serviceNameById(id: string) {
  return services.value.find((s) => s.id === id)?.name ?? '—'
}

function staffNameById(id: string | null) {
  if (!id) return '—'
  return personName(staffList.value.find((s) => s.id === id))
}

async function load() {
  loading.value = true
  try {
    const bid = businessStore.business?.id
    const q = searchQuery.value.trim()
    const [b, s, st, h] = await Promise.all([
      bookingsApi.getAll({
        ...(bid ? { businessId: bid } : {}),
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
        ...(q ? { q } : {}),
        page: page.value,
        size: pageSize,
      }),
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

watch([statusFilter, searchQuery], () => {
  page.value = 0
  load()
})

function goToPage(next: number) {
  if (next < 0 || next >= totalPages.value) return
  page.value = next
  load()
}

function openCreate() {
  editingBookingId.value = null
  editingServiceId.value = null

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

watch(() => form.value.offeredServiceId, (newServiceId, oldServiceId) => {
  if (newServiceId === oldServiceId) return

  selectedStartMin.value = null
  form.value.startAt = ''
  form.value.endAt = ''

  if (
      form.value.staffId &&
      !activeStaffList.value.some((staff) => staff.id === form.value.staffId)
  ) {
    form.value.staffId = undefined
  }
})

function errorMessage(e: unknown, fallback: string) {
  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
  return msg || fallback
}

const disabledItems = (status: BookingStatus) => {
  if (status === 'COMPLETED') {
    return status === 'COMPLETED'
  }
  if (status === 'CANCELLED_BY_BUSINESS') {
    return status === 'CANCELLED_BY_BUSINESS'
  }
  if (status === 'CANCELLED_BY_CUSTOMER') {
    return status === 'CANCELLED_BY_CUSTOMER'
  }
  if (status === 'NO_SHOW') {
    return status === 'NO_SHOW'
  }
  return ;
}

const editForm = (booking: Booking) => {
  showCreateModal.value = true


  editingBookingId.value = booking.id
  editingServiceId.value = booking.offeredServiceId
  createError.value = ''

  form.value = {
    businessId: businessStore.business?.id ?? '',
    customerId: booking.customerId ?? undefined,
    customerFirstName: bookingCustomerName(booking, '') ?? '',
    customerPhone: booking.customerPhone ?? '',
    offeredServiceId: booking.offeredServiceId ?? '',
    staffId: booking.staffId ?? undefined,
    startAt: booking.startAt ?? '',
    endAt: booking.endAt ?? '',
    customerNote: booking.customerNote ?? '',
  }

  const date = new Date(booking.startAt)

  bookingDate.value =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2, '0')}`

  selectedStartMin.value = date.getHours() * 60 + date.getMinutes()

  loadDayBookings()
}

async function saveBooking() {
  createError.value = ''
  if (!form.value.customerId && !form.value.customerFirstName?.trim()) {
    createError.value = t('bookings.enterCustomerName')
    return
  }
  if (!form.value.offeredServiceId) {
    createError.value = t('bookings.selectService')
    return
  }
  if (!form.value.staffId) {
    createError.value = t('bookings.selectStaff')
    return
  }

  if (!editingBookingId.value) {
    if (!form.value.startAt || !form.value.endAt) {
      createError.value = t('bookings.selectDateTime')
      return
    }
  }

  if (form.value.startAt && form.value.endAt) {
    const startAt = new Date(form.value.startAt)
    const endAt = new Date(form.value.endAt)

    if (endAt <= startAt) {
      createError.value = t('bookings.endAfterStart')
      return
    }
  }
  saving.value = true

  try {
    const payload: BookingCreateRequest = {
      ...form.value,
      customerFirstName: form.value.customerFirstName?.trim() || undefined,
      customerPhone: form.value.customerPhone?.trim() || undefined,
      startAt: form.value.startAt
          ? new Date(form.value.startAt).toISOString()
          : '',
      endAt: form.value.endAt
          ? new Date(form.value.endAt).toISOString()
          : '',
      staffId: form.value.staffId || undefined,
    }

    if (editingBookingId.value) {
      await bookingsApi.update(editingBookingId.value, payload)

      toast.success(t('bookings.updated'))
    } else {
      await bookingsApi.create(payload)
      toast.success(t('bookings.created'))
    }

    showCreateModal.value = false
    editingBookingId.value = null

    await load()
  } catch (e) {
    createError.value = errorMessage(
        e,
        editingBookingId.value
            ? t('bookings.updateError')
            : t('bookings.createError')
    )
  } finally {
    saving.value = false
  }
}

async function updateStatus(booking: Booking, status: BookingStatus) {
  const previous = booking.status
  try {
    await bookingsApi.update(booking.id, { status })
    booking.status = status
    toast.success(t('bookings.statusUpdated'))
  } catch (e) {
    booking.status = previous
    toast.error(errorMessage(e, t('bookings.statusUpdateError')))
  }
}

async function confirmDelete(id: string) {
  try {
    await bookingsApi.delete(id)
    toast.success(t('bookings.deleted'))
    await load()
  } catch (e) {
    toast.error(errorMessage(e, t('common.deleteError')))
  }
  deleteConfirm.value = null
}

onMounted(load)
</script>
