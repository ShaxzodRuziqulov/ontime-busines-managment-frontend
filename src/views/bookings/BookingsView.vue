<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, CalendarCheck, Trash2, Clock } from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { useBusinessStore } from '@/stores/business'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { Booking, BookingStatus, BookingCreateRequest, OfferedService, StaffMember } from '@/types'

const businessStore = useBusinessStore()
const authStore = useAuthStore()
const toast = useToast()

const bookings = ref<Booking[]>([])
const services = ref<OfferedService[]>([])
const staffList = ref<StaffMember[]>([])
const loading = ref(true)
const saving = ref(false)
const searchQuery = ref('')
const statusFilter = ref<BookingStatus | ''>('')
const showCreateModal = ref(false)
const deleteConfirm = ref<string | null>(null)

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
  customerId: authStore.user?.userId ?? '',
  businessId: businessStore.business?.id ?? '',
  offeredServiceId: '',
  staffId: undefined,
  startAt: '',
  endAt: '',
  status: 'PENDING',
  customerNote: '',
})

const form = ref<BookingCreateRequest>(defaultForm())

const selectedService = computed(() =>
  services.value.find((s) => s.id === form.value.offeredServiceId)
)

function onServiceChange() {
  recalcEndAt()
}

function onStartAtChange() {
  recalcEndAt()
}

function recalcEndAt() {
  if (!form.value.startAt || !selectedService.value) return
  const start = new Date(form.value.startAt)
  start.setMinutes(start.getMinutes() + selectedService.value.durationMinutes)
  form.value.endAt = start.toISOString().slice(0, 16)
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
    const [b, s, st] = await Promise.all([
      bookingsApi.getAll(bid ? { businessId: bid } : {}),
      bid ? servicesApi.getAll(bid) : Promise.resolve({ data: [] as OfferedService[] }),
      bid ? staffApi.getAll(bid) : Promise.resolve({ data: [] as StaffMember[] }),
    ])
    bookings.value = b.data
    services.value = s.data
    staffList.value = st.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = defaultForm()
  showCreateModal.value = true
}

async function createBooking() {
  if (!form.value.offeredServiceId || !form.value.startAt || !form.value.endAt) {
    toast.error('Xizmat va vaqtni tanlang')
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
    const { data } = await bookingsApi.create(payload)
    bookings.value.unshift(data)
    showCreateModal.value = false
    toast.success('Navbat yaratildi')
  } catch {
    toast.error('Navbat yaratishda xatolik')
  } finally {
    saving.value = false
  }
}

async function updateStatus(booking: Booking, status: BookingStatus) {
  try {
    await bookingsApi.update(booking.id, { status })
    booking.status = status
    toast.success('Status yangilandi')
  } catch {
    toast.error('Statusni yangilashda xatolik')
  }
}

async function confirmDelete(id: string) {
  try {
    await bookingsApi.delete(id)
    bookings.value = bookings.value.filter((b) => b.id !== id)
    toast.success('Navbat o\'chirildi')
  } catch {
    toast.error('O\'chirishda xatolik yuz berdi')
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
        <p class="text-slate-500 text-sm mt-1">Jami {{ bookings.length }} ta navbat</p>
      </div>
      <button
        v-if="!businessStore.isExpired"
        @click="openCreate"
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

    <SkeletonTable v-if="loading" :rows="6" :cols="6" />

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
            @click="openCreate"
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
      </template>
    </template>

    <!-- Create booking modal -->
    <AppModal
      v-if="showCreateModal"
      title="Yangi navbat qo'shish"
      @close="showCreateModal = false"
    >
      <form @submit.prevent="createBooking" class="space-y-4">
        <!-- Service -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Xizmat *</label>
          <select
            v-model="form.offeredServiceId"
            @change="onServiceChange"
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

        <!-- Staff -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Xodim (ixtiyoriy)</label>
          <select
            v-model="form.staffId"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option :value="undefined">— Xodim tanlanmagan —</option>
            <option
              v-for="st in staffList.filter(s => s.active)"
              :key="st.id"
              :value="st.id"
            >
              {{ st.displayName }}
            </option>
          </select>
        </div>

        <!-- Start time -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Boshlanish vaqti *</label>
          <input
            v-model="form.startAt"
            type="datetime-local"
            @change="onStartAtChange"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <!-- End time -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Tugash vaqti *
            <span v-if="selectedService" class="text-slate-400 font-normal ml-1">
              ({{ selectedService.durationMinutes }} daqiqa avtomatik hisoblanadi)
            </span>
          </label>
          <input
            v-model="form.endAt"
            type="datetime-local"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
