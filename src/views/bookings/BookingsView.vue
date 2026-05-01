<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, CalendarCheck, Trash2, Edit2, Filter } from 'lucide-vue-next'
import { bookingsApi } from '@/api/bookings'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { Booking, BookingStatus } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const bookings = ref<Booking[]>([])
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref<BookingStatus | ''>('')
const showModal = ref(false)
const editingBooking = ref<Booking | null>(null)
const deleteConfirm = ref<string | null>(null)

const statuses: { label: string; value: BookingStatus | '' }[] = [
  { label: 'Barchasi', value: '' },
  { label: 'Kutilmoqda', value: 'PENDING' },
  { label: 'Tasdiqlangan', value: 'CONFIRMED' },
  { label: 'Bajarildi', value: 'COMPLETED' },
  { label: 'Bekor qilindi', value: 'CANCELLED' },
]

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

async function load() {
  loading.value = true
  try {
    const bid = businessStore.business?.id
    const { data } = await bookingsApi.getAll(bid ? { businessId: bid } : {})
    bookings.value = data
  } finally {
    loading.value = false
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

function openEdit(booking: Booking) {
  editingBooking.value = { ...booking }
  showModal.value = true
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

    <SkeletonTable v-if="loading" :rows="6" :cols="5" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Navbat topilmadi"
        description="Hali hech qanday navbat yo'q yoki filtr natijasida ko'rsatish uchun ma'lumot yo'q"
      >
        <template #icon>
          <CalendarCheck class="w-8 h-8 text-slate-400" />
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
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="text-sm font-semibold text-slate-800">{{ formatDate(booking.startAt) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ duration(booking.startAt, booking.endAt) }}</p>
              </div>
              <StatusBadge :status="booking.status" />
            </div>
            <p v-if="booking.customerNote" class="text-xs text-slate-500 mb-3 truncate">{{ booking.customerNote }}</p>
            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <select
                :value="booking.status"
                @change="updateStatus(booking, ($event.target as HTMLSelectElement).value as BookingStatus)"
                class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600"
              >
                <option value="PENDING">Kutilmoqda</option>
                <option value="CONFIRMED">Tasdiqlash</option>
                <option value="COMPLETED">Bajarildi</option>
                <option value="CANCELLED">Bekor qilish</option>
                <option value="NO_SHOW">Kelmadi</option>
              </select>
              <button
                class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                @click="deleteConfirm = booking.id"
                aria-label="O'chirish"
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
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Tugash</th>
                  <th class="text-left px-5 py-3.5 font-semibold text-slate-600">Davomiylik</th>
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
                  <td class="px-5 py-4 text-slate-700">{{ formatDate(booking.startAt) }}</td>
                  <td class="px-5 py-4 text-slate-700">{{ formatDate(booking.endAt) }}</td>
                  <td class="px-5 py-4 text-slate-500">{{ duration(booking.startAt, booking.endAt) }}</td>
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
                        class="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white text-slate-600 cursor-pointer mr-1"
                      >
                        <option value="PENDING">Kutilmoqda</option>
                        <option value="CONFIRMED">Tasdiqlash</option>
                        <option value="COMPLETED">Bajarildi</option>
                        <option value="CANCELLED">Bekor qilish</option>
                        <option value="NO_SHOW">Kelmadi</option>
                      </select>
                      <button
                        class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        @click="deleteConfirm = booking.id"
                        aria-label="O'chirish"
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
