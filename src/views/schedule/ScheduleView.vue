<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-4 mb-6">
      <div class="flex w-full items-center justify-between">
        <div class="flex flex-col">
          <h2 class="font-bold text-slate-800">Jadval</h2>
<!--          <p class="text-slate-500 text-sm">{{ formatDate() }}</p>-->
        </div>
        <div class="flex items-center gap-2">
          <button @click="shiftDate(-1)" class="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-500">
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
          <button @click="shiftDate(1)" class="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-slate-500">
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
              v-if="!isToday"
              @click="selectedDate = todayIso()"
              class="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-sm text-slate-600"
          >
            Bugun
          </button>
        </div>
      </div>
      <div
          class="flex flex-wrap items-center text-gray-600 text-xs font-semibold gap-1"
      >
        <button
            v-for="tab in filteredButtons"
            :key="tab.value"
            type="button"
            @click="setActiveTab(tab.value)"
            :class="activeFilter === tab.value ? tab.color : 'bg-white'"
            class="flex border border-gray-200 transition-all duration-200 text-slate-700 px-2 py-1 rounded-lg items-center gap-1"
        >
          <span
              v-if="tab.activeColor"
              :class="[
              tab.value === 'all' ? '' : tab.activeColor
              ]" class="w-2 h-2 rounded-full"
          >
          </span>
          {{tab.label}}
        </button>
        <div class="flex text-slate-400 text-sm font-medium ml-2 gap-2">
          Jami:
          <span class="text-slate-700 border-b border-gray-400 inline-block"
          >
            {{ filteredBookings.length }} ta navbat
          </span>
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
        v-else-if="!todayHours || todayHours.closed"
        :title="`${WEEKDAY_LABELS[weekdayForSelectedDate]} kuni ish yo'q`"
        description="Bu kun uchun ish vaqti belgilanmagan yoki dam olish kuni"
    >
      <template #icon><CalendarDays class="w-8 h-8 text-slate-400" /></template>
    </EmptyState>

    <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      <div
          v-if="bookingsLoading"
          class="absolute inset-0 bg-white/60 z-30 flex items-center justify-center text-sm text-slate-400"
      >
        Yuklanmoqda...
      </div>
      <div class="overflow-auto" style="max-height: min(67vh, 620px)">
        <div :style="{ minWidth: `${64 + columns.length * COLUMN_WIDTH}px` }">
          <!-- Header -->
          <div class="flex sticky top-0 z-30 bg-slate-100 border-b border-gray-200">
            <div class="w-16 flex-shrink-0 bg-slate-50 flex items-center justify-center text-xs font-medium border-r border-gray-200 text-slate-600 sticky left-0"
            >
              Vaqt
            </div>
            <div
                v-for="col in columns"
                :key="col.id ?? 'unassigned'"
                class="flex-1 p-2 z-1 border-r border-gray-200  flex items-center gap-2"
                :style="{ minWidth: `${COLUMN_WIDTH}px` }"
            >
              <span
                  class="bg-indigo-200 flex font-semibold items-center justify-center w-6 h-6 text-xs text-indigo-600 rounded-full"
              >
                {{getInitials(col.name)}}
              </span>
              <span class="text-xs font-medium text-slate-700">{{ col.name }}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="flex relative" :style="{ height: `${gridHeight}px` }">
            <div class="w-16 flex-shrink-0 flex items-center border-r border-slate-100 sticky left-0 z-20 bg-slate-100">
              <span
                  v-for="slot in timeSlots"
                  :key="slot.label"
                  class="absolute border-t border-slate-200 pointer-events-none w-full font-bold text-[11px] px-5 py-2 flex items-center justify-center text-slate-400"
                  :style="{ top: `${slot.top}px` }"
              >
                {{ slot.label }}
              </span>
              <div
                  v-if="nowTop !== null"
                  class="absolute left-3 z-40 pointer-events-none"
                  :style="{ top: `${nowTop}px` }"
              >
                <div
                    class="w-16 h-0 flex  justify-center"
                >
                  <div
                      class="relative -translate-y-1/2 flex items-center rounded border
                       border-rose-300
                        bg-rose-300/80 px-1.5 py-1.5 shadow-[0_2px_8px_rgba(244,63,94,0.25)]"
                  >
                  <span
                      class="text-[11px] font-bold leading-none text-red-800 whitespace-nowrap"
                  >
                    {{ formatNowTime }}
                  </span>
                    <span
                        class="absolute -right-1 top-1/2 w-2 h-2 -translate-y-1/2 rotate-45
                        bg-rose-300/80 border-r border-t
                        border-rose-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
                v-for="col in columns"
                :key="col.id ?? 'unassigned'"
                class="flex-1 relative z-10 border-r border-slate-100 duration-200 transition-colors group"
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
              <template
                  v-for="item in layoutForColumn(col.id)"
                  :key="item.kind === 'group' ? item.key : item.booking.id"
              >
                <!-- Oddiy bron (faol yoki yolg'iz bekor/kelmadi) -->
                <button
                    v-if="item.kind === 'single'"
                    class="absolute flex border-t-2 border-gray-100 items-center rounded-md text-left text-xs shadow-sm transition-all overflow-hidden hover:z-30 hover:shadow-md"
                    :class="[bookingStatusBlockColors[item.booking.status], isProblem(item.booking.status) ? 'px-1' : 'px-2']"
                    :style="item.style"
                    :title="isProblem(item.booking.status) ? `${item.booking.customerName || item.booking.guestName || 'Mijoz'} — ${bookingStatusLabels[item.booking.status]}` : ''"
                    @click="selectedBooking = item.booking"
                >
                  <span v-if="!isProblem(item.booking.status)" class="flex w-full flex-col text-xs gap-1">
                    <span class="font-medium break-words">
                      {{ item.booking.customerName || item.booking.guestName || 'Mijoz' }}
                    </span>
                    <span class="flex gap-1 justify-between w-full items-center text-xs">
                      <span v-if="item.booking.offeredServiceName" class="break-all opacity-90 text-xs w-full">
                        {{ item.booking.offeredServiceName }}
                      </span>
                      <span class="text-[12px] w-full justify-end flex">
                        {{ formatTime(item.booking.startAt) }}-{{ formatTime(item.booking.endAt) }}
                      </span>
                    </span>
                  </span>
                  <span v-else class="w-full h-full flex items-center justify-center text-[10px]">✕</span>
                </button>

                <!-- Guruh: bir nechta bekor/kelmadi bitta joyda -->
                <div v-else class="absolute" :style="item.style">
                  <button
                      class="w-full h-full rounded-md flex items-center justify-center text-[11px] font-semibold text-white bg-slate-400 hover:bg-slate-500 shadow-sm transition-colors z-20"
                      :title="`${item.bookings.length} ta bekor/kelmadi`"
                      @click.stop="toggleGroup(item.key)"
                  >
                    {{ item.bookings.length }}✕
                  </button>

                  <Teleport to="body" v-if="openGroupKey === item.key">
                    <div class="fixed inset-0 z-40" @click="openGroupKey = null" />
                    <div
                        class="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-100 w-56 overflow-hidden"
                        :style="{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }"
                    >
                      <div class="px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <p class="text-xs font-medium text-slate-600">Bekor / kelmadi bronlar</p>
                      </div>
                      <div class="max-h-64 overflow-auto divide-y divide-slate-100">
                        <button
                            v-for="b in item.bookings"
                            :key="b.id"
                            class="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between gap-2"
                            @click="openFromGroup(b)"
                        >
                          <span class="flex flex-col">
                            <span class="text-xs font-medium text-slate-700">{{ b.customerName || b.guestName || 'Mijoz' }}</span>
                            <span class="text-[11px] text-slate-400">{{ formatTime(b.startAt) }} - {{ formatTime(b.endAt) }}</span>
                          </span>
                          <span
                              class="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full"
                              :class="bookingStatusBadgeColors[b.status]"
                          >
                            {{ bookingStatusLabels[b.status] }}
                          </span>
                        </button>
                      </div>
                    </div>
                  </Teleport>
                </div>
              </template>
              <div
                  v-if="hoverCol === (col.id ?? '__unassigned__')"
                  class="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-75"
                  :style="{ top: `${hoverY -16}px`, height: '32px' }"
              >
                <div class="flex items-center text-indigo-500 text-xs font-medium px-2 py-1 shadow-lg rounded-full bg-indigo-100"
                >
                  <span class="text-base font-light leading-none"
                  >
                    +
                  </span>
                </div>
              </div>
            </div>

            <div
                v-if="nowTop !== null"
                class="absolute inset-x-0 z-10 pointer-events-none"
                :style="{ top: `${nowTop}px` }"
            >
              <div
                  class="
                  absolute
                  left-16
                  right-0
                  top-0
                  border-t-2
                  border-red-500
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking detail modal -->
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
                  bookingStatusBadgeColors[selectedBooking?.status]]"
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
          <div v-if="nextBookingActions[selectedBooking?.status]?.length"
               class="flex flex-wrap gap-2 px-5 pb-5"
          >
            <button
                v-for="action in nextBookingActions[selectedBooking?.status]"
                :key="action.status"
                :disabled="updatingId === selectedBooking?.id"
                @click="changeStatus(action.status)"
                :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                 action.cls]"
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
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"
             @click="closeQuickCreate"
        />
        <div class="relative text-gray-600 bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 class="font-semibold text-slate-800">Yangi navbat</h3>
              <p
                  class="text-xs text-slate-600 mt-0.5"
              >
                {{ quickCreate.staffName }} - {{ formatDate() }}
              </p>
            </div>
            <button class="p-1.5 border border-gray-200 rounded-lg text-slate-400 hover:bg-slate-100"
                    @click="closeQuickCreate"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="px-5 py-4 space-y-3">
            <div>
              <label
                  class="block text-xs font-medium text-slate-600 mb-1"
              >
                Xizmat *
              </label>
              <select
                  v-model="quickForm.offeredServiceId"
                  class="w-full px-3 py-2 rounded-lg text-gray-600 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="" disabled>Tanlang...</option>
                <option
                    v-for="s in quickAvailableServices"
                    :key="s.id"
                    :value="s.id"
                >
                  {{ s.name }} — ({{ s.durationMinutes }} daq. - {{s.basePrice}} so'm).
                </option>
              </select>
              <p v-if="quickCreate.staffId && quickAvailableServices.length === 0" class="mt-1 text-xs text-red-500">
                Bu xodimga xizmat biriktirilmagan
              </p>
            </div>

            <div v-if="quickSelectedService">
              <label class="block text-xs font-medium text-slate-600 mb-1">Vaqt *</label>
              <div
                  v-if="quickPossibleStarts.length === 0"
                  class="text-xs text-slate-400"
              >
                Bu kunda bo'sh vaqt yo'q
              </div>
              <div v-else class="overflow-y-auto grid grid-cols-5 max-h-60 gap-1.5">
                <button
                    v-for="m in quickPossibleStarts"
                    :key="m"
                    type="button"
                    :disabled="isQuickSlotDisabled(m)"
                    @click="quickForm.startMin = m"
                    :class="[
                    'text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center border transition-colors',
                    quickForm.startMin === m ? 'bg-primary-600 text-white border-primary-600' :
                    isQuickSlotDisabled(m) ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' :
                    'border-slate-200 hover:border-primary-400 text-slate-600',
                  ]"
                >
                  {{ minutesToLabel(m) }}
                </button>
              </div>
            </div>

            <div>
              <label class="block border-t border-gray-200 py-2 text-xs font-medium text-slate-600 mb-1">Mijoz ismi *</label>
              <input
                  v-model="quickForm.guestName"
                  type="text"
                  placeholder="Ism kiriting"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                  class="block text-xs font-medium text-slate-600 mb-1"
              >
                Telefon
              </label>
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
import { personName } from '@/utils/names'
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

function getInitials(name: string) {
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function colorForStaff(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const weekdayForSelectedDate = computed(() => weekdayFromDate(selectedDate.value))

const todayHours = computed(() =>
  hours.value.find((h) => h.weekday === weekdayForSelectedDate.value) ?? null
)

const isToday = computed(() => selectedDate.value === todayIso())

const formatDate = () => {
  if (!selectedDate.value) return '';

  const date = new Date(selectedDate.value);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2,'0');
  return `${year}-${month}-${day}`;
};

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

const activeStaff = computed(() => staffList.value.filter((s) => s.active))

const quickAvailableServices = computed(() => {
  const staffId = quickCreate.value?.staffId
  if (!staffId) return services.value
  const staff = staffList.value.find((s) => s.id === staffId)
  if (!staff) return []
  return services.value.filter((service) => staff.serviceIds?.includes(service.id))
})

// Ustunlar: har bir faol xodim + "Tayinlanmagan" (staffId yo'q bronlar uchun)
const columns = computed(() => [
  ...activeStaff.value.map((s) => ({ id: s.id, name: personName(s), color: colorForStaff(s.id) })),
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
const SLOT_INTERVAL = 15
const COLUMN_WIDTH = 180
// Vaqt yorlig'i chiziq ustida markazlashtirilgani uchun ("-translate-y-1/2"),
// birinchi yorliq tepada kesilib qolmasligi uchun butun panjaraga yuqoridan bo'sh joy qo'shiladi.
const TOP_PAD = 0

const openMinutes = computed(() => (todayHours.value?.opensAt ? toMinutes(todayHours.value.opensAt) : 9 * 60))
const closeMinutes = computed(() => (todayHours.value?.closesAt ? toMinutes(todayHours.value.closesAt) : 18 * 60))
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
  const list = bookingsByStaff.value.get(staffId) ?? []

  if (activeFilter.value === 'all') {
    return list
  }

  return list.filter((booking) => booking.status === activeFilter.value )
}

// Muammoli holatlar: bekor va kelmadi — enum nomlarini o'z faylingizga moslang
// const PROBLEM_STATUSES: BookingStatus[] = [
//   'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'NO_SHOW',
// ] as BookingStatus[]

function isProblem(status: BookingStatus) {
  // return PROBLEM_STATUSES.includes(status)
  return bookingStatusBlockColors.CANCELLED_BY_CUSTOMER.includes(status)
  || bookingStatusBlockColors.CANCELLED_BY_BUSINESS.includes(status)
  || bookingStatusBlockColors.NO_SHOW.includes(status)
}

function overlaps(a: Booking, b: Booking) {
  const aS = minutesOfDay(a.startAt), aE = minutesOfDay(a.endAt)
  const bS = minutesOfDay(b.startAt), bE = minutesOfDay(b.endAt)
  return aS < bE && bS < aE
}

// Umumiy: ro'yxatni bir-biri bilan to'qnashuvchi klasterlarga bo'lish
function clusterOverlaps(list: Booking[]): Booking[][] {
  const sorted = list.slice().sort((a, b) => minutesOfDay(a.startAt) - minutesOfDay(b.startAt))
  const clusters: Booking[][] = []
  let current: Booking[] = []
  let currentEnd = -Infinity
  for (const b of sorted) {
    const start = minutesOfDay(b.startAt)
    if (current.length && start < currentEnd) {
      current.push(b)
      currentEnd = Math.max(currentEnd, minutesOfDay(b.endAt))
    } else {
      if (current.length) clusters.push(current)
      current = [b]
      currentEnd = minutesOfDay(b.endAt)
    }
  }
  if (current.length) clusters.push(current)
  return clusters
}

// Faol bronlar orasidagi to'qnashuvni ustunlarga taqsimlash (Google Calendar uslubi)
function assignColumns(list: Booking[]) {
  const result = new Map<string, { col: number; cols: number }>()
  for (const cluster of clusterOverlaps(list)) {
    const colEnds: number[] = []
    const assigned: { b: Booking; col: number }[] = []
    for (const b of cluster) {
      const start = minutesOfDay(b.startAt)
      let placed = false
      for (let c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= start) {
          colEnds[c] = minutesOfDay(b.endAt)
          assigned.push({ b, col: c })
          placed = true
          break
        }
      }
      if (!placed) {
        colEnds.push(minutesOfDay(b.endAt))
        assigned.push({ b, col: colEnds.length - 1 })
      }
    }
    const cols = colEnds.length
    for (const { b, col } of assigned) result.set(b.id, { col, cols })
  }
  return result
}

type Tabs = 'all' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_BUSINESS' | 'CANCELLED_BY_CUSTOMER' | 'NO_SHOW';

const activeFilter =ref<Tabs>('all')

const filteredButtons: {label: string; value: Tabs; activeColor?: string; color?: string; }[] = [
  {label: 'Hammasi', value: 'all', color: 'bg-gray-600 text-white border-gray-200'},
  {label: 'Mijoz', value: 'PENDING', activeColor: 'bg-amber-500', color: 'bg-amber-100 text-gray-600 border-amber-200'},
  {label: 'Bekor(Mijoz)', value: 'CANCELLED_BY_CUSTOMER', activeColor: 'bg-red-500', color: 'bg-red-100 text-red-600 border-red-500'},
  {label: 'Bekor(Xodim)', value: 'CANCELLED_BY_BUSINESS', activeColor: 'bg-red-400', color: 'bg-red-50 text-red-600 border-red-400'},
  {label: 'Kelmadi', value: 'NO_SHOW', activeColor: 'bg-gray-400', color: 'bg-slate-200 text-slate-500 border-slate-300'},
  {label: 'Tasdiqlandi', value: 'CONFIRMED', activeColor: 'bg-blue-400', color: 'bg-blue-100 text-blue-600 border-blue-300'},
  {label: 'Jarayonda', value: 'IN_PROGRESS', activeColor: 'bg-indigo-500', color: 'bg-indigo-400 text-indigo-500 border-indigo-300'},
  {label: 'Bajarildi', value: 'COMPLETED', activeColor: 'bg-emerald-500', color: 'bg-emerald-100 text-gray-600 border-emerald-500' },
]

const setActiveTab = (tab: Tabs) => {
  activeFilter.value = tab
}

const filteredBookings = computed(() => {
  if (activeFilter.value === 'all') {
    return bookings.value;
  }

  return bookings.value.filter(
      (booking) => booking.status === activeFilter.value
  )
})

type LayoutItem =
    | { kind: 'single'; booking: Booking; style: Record<string, string> }
    | { kind: 'group'; key: string; bookings: Booking[]; style: Record<string, string> }

// Butun ustun uchun tayyor layout
function layoutForColumn(staffId: string | null): LayoutItem[] {
  const list = bookingsForColumn(staffId)
  const active = list.filter((b) => !isProblem(b.status))
  const problem = list.filter((b) => isProblem(b.status))
  const activeLayout = assignColumns(active)

  const items: LayoutItem[] = []

  for (const b of active) {
    const { col, cols } = activeLayout.get(b.id)!
    const widthPct = 100 / cols
    items.push({
      kind: 'single',
      booking: b,
      style: {
        ...blockStyle(b),
        left: `calc(${col * widthPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        right: 'auto',
        zIndex: '20',
      },
    })
  }

  for (const cluster of clusterOverlaps(problem)) {
    const hidden = cluster.some((p) => active.some((a) => overlaps(a, p)))

    if (!hidden) {
      // Faol bron bilan to'qnashmagan — o'z holicha, kerak bo'lsa yonma-yon
      const layout = assignColumns(cluster)
      for (const b of cluster) {
        const { col, cols } = layout.get(b.id)!
        const widthPct = 100 / cols
        items.push({
          kind: 'single',
          booking: b,
          style: {
            ...blockStyle(b),
            left: `calc(${col * widthPct}% + 2px)`,
            width: `calc(${widthPct}% - 4px)`,
            right: 'auto',
            zIndex: '10',
          },
        })
      }
    } else if (cluster.length === 1) {
      // Yolg'iz — ingichka chiziqcha
      items.push({
        kind: 'single',
        booking: cluster[0],
        style: { ...blockStyle(cluster[0]), left: 'auto', right: '2px', width: '28px', zIndex: '15', opacity: '0.75' },
      })
    } else {
      // Bir nechtasi — yagona badge, vertikal oraliq klasterni to'liq qamrab olsin
      const top = Math.min(...cluster.map((b) => minutesOfDay(b.startAt)))
      const bottom = Math.max(...cluster.map((b) => minutesOfDay(b.endAt)))
      const topPx = Math.max((top - openMinutes.value) * PX_PER_MIN, 0) + TOP_PAD
      const heightPx = Math.max((bottom - top) * PX_PER_MIN, 28)
      items.push({
        kind: 'group',
        key: cluster.map((b) => b.id).join('-'),
        bookings: cluster,
        style: { top: `${topPx}px`, height: `${Math.min(heightPx, 32)}px`, right: '2px', left: 'auto', width: '30px', zIndex: '15' },
      })
    }
  }

  return items
}

// Qaysi guruh popoveri ochiq turgani
const openGroupKey = ref<string | null>(null)

function toggleGroup(key: string) {
  openGroupKey.value = openGroupKey.value === key ? null : key
}

function openFromGroup(b: Booking) {
  openGroupKey.value = null
  selectedBooking.value = b
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
  const y = event.clientY - target.getBoundingClientRect().top
  const raw = openMinutes.value + y / PX_PER_MIN
  const snapped = Math.floor(raw / SLOT_INTERVAL) * SLOT_INTERVAL
  const startMin = Math.min(Math.max(snapped, openMinutes.value), Math.max(closeMinutes.value - SLOT_INTERVAL, openMinutes.value))

  quickCreate.value = { staffId, staffName }
  quickForm.value = { offeredServiceId: '', startMin, guestName: '', guestPhone: '', customerNote: '' }
  quickError.value = ''
}

const quickSelectedService = computed(() => services.value.find((s) => s.id === quickForm.value.offeredServiceId))

const quickPossibleStarts = computed(() => {
  const service = quickSelectedService.value
  if (!service || !todayHours.value || todayHours.value.closed || !todayHours.value.opensAt || !todayHours.value.closesAt) return []
  return generatePossibleStarts(toMinutes(todayHours.value.opensAt), toMinutes(todayHours.value.closesAt), service.durationMinutes, SLOT_INTERVAL)
})

function isQuickSlotBusy(startMin: number) {
  if (!quickCreate.value?.staffId || !quickSelectedService.value) return false
  return isStaffBusy(bookings.value, quickCreate.value.staffId, startMin, startMin + quickSelectedService.value.durationMinutes)
}

const isQuickSlotDisabled = (minute: number) => {

  if (isQuickSlotBusy(minute)) return true;

  if (quickForm.value.startMin === null) return false;

  return quickForm.value.startMin !== minute;
};

watch(() => quickForm.value.offeredServiceId, () => {
  // Xizmat almashtirilganda, tanlangan vaqt yangi ro'yxatda mavjud bo'lmasa, eng yaqinini tanlaymiz
  if (quickForm.value.offeredServiceId && !quickAvailableServices.value.some((s) => s.id === quickForm.value.offeredServiceId)) {
    quickForm.value.offeredServiceId = ''
    quickForm.value.startMin = null
    return
  }
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

const formatNowTime = computed(() => {
  const date = new Date(nowTick.value)

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
})

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
  nowTimer = setInterval(() => { nowTick.value = Date.now() }, 10_000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>
