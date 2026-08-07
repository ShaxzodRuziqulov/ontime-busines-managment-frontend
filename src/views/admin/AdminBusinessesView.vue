<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Search, Building2, Trash2, Settings, CheckCircle2, XCircle, Clock, AlertCircle, Download, ExternalLink, ChevronDown, ChevronLeft, ChevronRight, Tag } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { businessesApi } from '@/api/businesses'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import { businessStatusLabels, businessStatusColor } from '@/utils/businessStatus'
import type { Business, BusinessCategory, BusinessStatus, BusinessStatusUpdateRequest } from '@/types'

const toast = useToast()
const router = useRouter()
const adminStore = useAdminStore()

const businesses = ref<Business[]>([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const statusFilter = ref<BusinessStatus | 'all'>('all')
const categoryFilter = ref<BusinessCategory | 'all'>('all')
const sortFilter = ref('createdAt,desc')
const page = ref(0)
const pageSize = 20
const totalElements = ref(0)
const totalPages = ref(1)
const deleteConfirm = ref<string | null>(null)
const statusModal = ref<Business | null>(null)

// Bulk actions
const selected = ref<Set<string>>(new Set())
const bulkStatusOpen = ref(false)

const allStatuses: BusinessStatus[] = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'DRAFT', 'PENDING_REVIEW']
const categoryOptions: { value: BusinessCategory; label: string }[] = [
  { value: 'BARBER', label: 'Sartarosh' },
  { value: 'BEAUTY', label: "Go'zallik" },
  { value: 'MEDICAL', label: 'Tibbiyot' },
  { value: 'REPAIR', label: "Ta'mirlash" },
  { value: 'CONSULTING', label: 'Konsultatsiya' },
  { value: 'EDUCATION', label: "Ta'lim" },
  { value: 'FITNESS', label: 'Sport' },
  { value: 'AUTO', label: 'Avto xizmat' },
  { value: 'LEGAL', label: 'Yuridik xizmat' },
  { value: 'OTHER', label: 'Boshqa' },
]
const sortOptions = [
  { value: 'createdAt,desc', label: 'Eng yangilar' },
  { value: 'createdAt,asc', label: 'Eng eskilar' },
  { value: 'name,asc', label: 'Nomi A-Z' },
  { value: 'name,desc', label: 'Nomi Z-A' },
  { value: 'rating,desc', label: 'Reyting yuqori' },
  { value: 'reviews,desc', label: "Sharhlar ko'p" },
]

const statusLabels = businessStatusLabels

const statusForm = ref<BusinessStatusUpdateRequest>({ status: 'ACTIVE', subscriptionEndDate: '' })

const filtered = computed(() => businesses.value)

const statusCounts = computed<Record<BusinessStatus | 'all', number>>(() => {
  const counts = Object.fromEntries(allStatuses.map((status) => [status, 0])) as Record<BusinessStatus | 'all', number>
  counts.all = totalElements.value
  for (const business of businesses.value) {
    counts[business.status] += 1
  }
  return counts
})

const pageNumbers = computed(() => {
  const maxButtons = 7
  const total = totalPages.value
  if (total <= maxButtons) return Array.from({ length: total }, (_, index) => index)
  const half = Math.floor(maxButtons / 2)
  const start = Math.min(Math.max(page.value - half, 0), total - maxButtons)
  return Array.from({ length: maxButtons }, (_, index) => start + index)
})

const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(b => selected.value.has(b.id))
)

function toggleAll() {
  if (allSelected.value) filtered.value.forEach(b => selected.value.delete(b.id))
  else filtered.value.forEach(b => selected.value.add(b.id))
}

function toggleOne(id: string) {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
}

function clearSelection() {
  selected.value = new Set()
  bulkStatusOpen.value = false
}

async function bulkUpdateStatus(status: BusinessStatus) {
  loading.value = true
  saving.value = true
  bulkStatusOpen.value = false
  const ids = [...selected.value]
  try {
    const results = await Promise.all(ids.map(id => businessesApi.updateStatus(id, { status })))
    for (const { data } of results) {
      const idx = businesses.value.findIndex(b => b.id === data.id)
      if (idx !== -1) businesses.value[idx] = data
    }
    adminStore.setAll(businesses.value.map(b => ({ id: b.id, status: b.status })))
    clearSelection()
    await loadBusinesses()
    toast.success(`${ids.length} ta biznes holati yangilandi`)
    loading.value = false
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function bulkDelete() {
  saving.value = true
  loading.value = true
  const ids = [...selected.value]
  try {
    await Promise.all(ids.map(id => businessesApi.delete(id)))
    clearSelection()
    await loadBusinesses()
    toast.success(`${ids.length} ta biznes o'chirildi`)
    loading.value = false
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openStatusModal(biz: Business) {
  statusModal.value = biz
  const subscriptionDate = dateInputValue(biz.subscriptionEndDate)
  statusForm.value = {
    status: biz.status,
    subscriptionEndDate: isPastDate(subscriptionDate) ? '' : subscriptionDate,
  }
}

function toEndOfDayInstant(dateStr: string | undefined | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

function dateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

function isPastDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false
  return dateStr < new Date().toISOString().slice(0, 10)
}

function selectStatus(status: BusinessStatus) {
  statusForm.value.status = status
  if (status === 'ACTIVE' && isPastDate(statusForm.value.subscriptionEndDate)) {
    statusForm.value.subscriptionEndDate = ''
  }
}

async function updateStatus() {
  if (!statusModal.value) return
  loading.value = true
  saving.value = true
  try {
    const payload: BusinessStatusUpdateRequest = { status: statusForm.value.status }
    payload.subscriptionEndDate = statusForm.value.subscriptionEndDate
      ? toEndOfDayInstant(statusForm.value.subscriptionEndDate)
      : null
    const { data } = await businessesApi.updateStatus(statusModal.value.id, payload)
    adminStore.upsertOne({ id: data.id, status: data.status })
    await loadBusinesses()
    statusModal.value = null
    toast.success('Holat yangilandi')
    loading.value = false
  } catch (e) {
    const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(message || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  try {
    await businessesApi.delete(id)
    await loadBusinesses()
    deleteConfirm.value = null
    toast.success("O'chirildi")
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

const statusColor = businessStatusColor

function statusIcon(status: BusinessStatus) {
  if (status === 'ACTIVE') return CheckCircle2
  if (status === 'TRIAL') return Clock
  if (status === 'EXPIRED') return XCircle
  return AlertCircle
}

function categoryLabel(category?: BusinessCategory) {
  return categoryOptions.find((item) => item.value === category)?.label ?? 'Boshqa'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ')
}

function exportCsv() {
  const rows = [
    ['ID', 'Nomi', 'Xizmat turi', 'Manzil', 'Shahar', 'Telefon', 'Holat', 'Trial tugash', 'Obuna tugash', 'Yaratilgan'],
    ...filtered.value.map(b => [
      b.id, b.name, categoryLabel(b.category), b.addressLine ?? '', b.city ?? '', b.contactPhone ?? '',
      statusLabels[b.status], formatDate(b.trialEndDate), formatDate(b.subscriptionEndDate),
      new Date(b.createdAt).toLocaleDateString('uz-UZ'),
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bizneslar_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

let searchTimer: ReturnType<typeof setTimeout> | undefined

async function loadBusinesses() {
  loading.value = true
  try {
    const { data } = await businessesApi.getAll({
      page: page.value,
      size: pageSize,
      sort: sortFilter.value,
      q: search.value.trim() || undefined,
      category: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    })
    businesses.value = data.content
    totalElements.value = data.totalElements
    totalPages.value = data.totalPages || 1
    adminStore.setAll(data.content.map(b => ({ id: b.id, status: b.status })))
  } finally {
    loading.value = false
  }
}

function reloadFirstPage() {
  selected.value = new Set()
  if (page.value === 0) loadBusinesses()
  else page.value = 0
}

function goToPage(nextPage: number) {
  if (nextPage < 0 || nextPage >= totalPages.value || nextPage === page.value) return
  page.value = nextPage
}

watch([statusFilter, categoryFilter, sortFilter], reloadFirstPage)
watch(page, loadBusinesses)
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(reloadFirstPage, 350)
})

onMounted(async () => {
  await loadBusinesses()
})
</script>

<template>
  <LoadingSpinner v-if="loading"/>
  <div>
    <!-- Header -->
    <div class="flex items-center flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Bizneslar</h2>
        <p class="text-slate-500 font-semibold text-sm mt-1">{{ totalElements }} ta biznes ro'yxatda</p>
      </div>
      <button
        @click="exportCsv"
        class="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors self-start"
      >
        <Download class="w-4 h-4" />
        CSV yuklab olish
      </button>
    </div>

    <!-- Status filter tabs -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        @click="statusFilter = 'all'"
        :class="[
          'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
          statusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
        ]"
      >
        Barchasi <span class="ml-1 opacity-70">{{ statusCounts['all'] }}</span>
      </button>
      <button
        v-for="s in allStatuses" :key="s"
        @click="statusFilter = s"
        :class="[
          'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
          statusFilter === s ? statusColor(s) + ' border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
        ]"
      >
        {{ statusLabels[s] }}
        <span class="ml-1 opacity-70">{{ statusCounts[s] ?? 0 }}</span>
      </button>
    </div>

    <!-- Search -->
    <div class="grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-3 mb-5">
      <div class="relative">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search" type="text"
          placeholder="Biznes nomi, xizmat turi, manzil yoki shahar bo'yicha qidirish..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <select
        v-model="categoryFilter"
        class="w-full px-4 py-2.5 cursor-pointer rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="all">Barcha xizmat turlari</option>
        <option v-for="category in categoryOptions" :key="category.value" :value="category.value">
          {{ category.label }}
        </option>
      </select>
      <select
        v-model="sortFilter"
        class="w-full px-4 py-2.5 cursor-pointer rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <!-- Bulk action bar -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition-all duration-150"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="selected.size > 0"
        class="mb-4 flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl px-4 py-3"
      >
        <span class="text-sm font-medium text-primary-700">{{ selected.size }} ta tanlandi</span>
        <div class="flex gap-2 ml-auto flex-wrap">
          <!-- Bulk status dropdown -->
          <div class="relative">
            <button
              @click="bulkStatusOpen = !bulkStatusOpen"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-primary-200 text-sm text-primary-700 hover:bg-primary-50 font-medium"
            >
              Holat o'zgartirish
              <ChevronDown class="w-3.5 h-3.5" />
            </button>
            <div
              v-if="bulkStatusOpen"
              class="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20"
              v-click-outside="() => bulkStatusOpen = false"
            >
              <button
                v-for="s in allStatuses" :key="s"
                @click="bulkUpdateStatus(s)"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <component :is="statusIcon(s)" class="w-3.5 h-3.5 flex-shrink-0" :class="statusColor(s).split(' ')[1]" />
                {{ statusLabels[s] }}
              </button>
            </div>
          </div>
          <button
            @click="bulkDelete"
            :disabled="saving"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 hover:bg-red-100 font-medium disabled:opacity-50"
          >
            <Trash2 class="w-3.5 h-3.5" />
            O'chirish
          </button>
          <button @click="clearSelection" class="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-white border border-transparent hover:border-slate-200">
            Bekor
          </button>
        </div>
      </div>
    </Transition>

    <SkeletonTable v-if="loading" :rows="7" :cols="8" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Biznes topilmadi"
        description="Qidiruv so'zini o'zgartiring yoki filterni tozalang"
      >
        <template #icon><Building2 class="w-8 h-8 text-slate-400" /></template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-2">
          {{ totalElements }} ta natija
          <span v-if="statusFilter !== 'all'">
            — <button @click="statusFilter = 'all'" class="text-primary-600 hover:underline">Filterni tozalash</button>
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="pl-5 pr-2 py-3">
                  <input
                    type="checkbox"
                    :checked="allSelected"
                    @change="toggleAll"
                    class="rounded cursor-pointer border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th class="px-3 py-3 text-left font-medium">Biznes</th>
                <th class="px-3 py-3 text-left font-medium">Telefon</th>
                <th class="px-3 py-3 text-left font-medium">Xizmat turi</th>
                <th class="px-3 py-3 text-left font-medium">Holat</th>
                <th class="px-3 py-3 text-left font-medium">Trial</th>
                <th class="px-3 py-3 text-left font-medium">Obuna</th>
                <th class="px-3 py-3 text-right font-medium pr-5">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in filtered" :key="biz.id"
                :class="['hover:bg-slate-50/50 transition-colors', selected.has(biz.id) && 'bg-primary-50/40']"
              >
                <td class="pl-5 pr-2 py-3.5">
                  <input
                    type="checkbox"
                    :checked="selected.has(biz.id)"
                    @change="toggleOne(biz.id)"
                    class="rounded cursor-pointer border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td class="px-3 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 class="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ biz.name }}</p>
                      <p class="text-xs text-slate-400 mt-0.5">{{ [biz.city, biz.addressLine].filter(Boolean).join(', ') || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3.5 text-slate-500">{{ biz.contactPhone || '—' }}</td>
                <td class="px-3 py-3.5">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    <Tag class="w-3 h-3" />
                    {{ categoryLabel(biz.category) }}
                  </span>
                </td>
                <td class="px-3 py-3.5">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusColor(biz.status)]">
                    <component :is="statusIcon(biz.status)" class="w-3 h-3" />
                    {{ statusLabels[biz.status] }}
                  </span>
                </td>
                <td class="px-3 py-3.5 text-slate-500 text-xs">{{ formatDate(biz.trialEndDate) }}</td>
                <td class="px-3 py-3.5 text-slate-500 text-xs">{{ formatDate(biz.subscriptionEndDate) }}</td>
                <td class="px-3 pr-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      @click="router.push(`/admin/businesses/${biz.id}`)"
                      title="Batafsil ko'rish"
                    >
                      <ExternalLink class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      @click="openStatusModal(biz)"
                      title="Holat o'zgartirish"
                    >
                      <Settings class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      @click="deleteConfirm = biz.id"
                      title="O'chirish"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalPages > 1" class="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span class="text-xs text-slate-500">
            {{ page * pageSize + 1 }}â€“{{ Math.min((page + 1) * pageSize, totalElements) }} / {{ totalElements }}
          </span>
          <div class="flex items-center gap-1">
            <button
              :disabled="page === 0"
              @click="goToPage(page - 1)"
              class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Oldingi sahifa"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              @click="goToPage(p)"
              :class="[
                'min-w-9 h-9 px-3 rounded-lg text-xs font-medium transition-colors',
                page === p ? 'bg-primary-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              ]"
            >
              {{ p + 1 }}
            </button>
            <button
              :disabled="page >= totalPages - 1"
              @click="goToPage(page + 1)"
              class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Keyingi sahifa"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Status Update Modal -->
    <AppModal v-if="statusModal" :title="`Holat: ${statusModal.name}`" @close="statusModal = null">
      <form @submit.prevent="updateStatus" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Yangi holat</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="s in allStatuses" :key="s" type="button"
              @click="selectStatus(s)"
              :class="[
                'px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all text-left',
                statusForm.status === s ? statusColor(s) + ' border-current' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              <span class="flex items-center gap-1.5">
                <component :is="statusIcon(s)" class="w-3.5 h-3.5" />
                {{ statusLabels[s] }}
              </span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Obuna tugash sanasi</label>
          <input v-model="statusForm.subscriptionEndDate" type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <p class="text-xs text-slate-400 mt-1">Bo'sh qoldiring — obuna sanasi tozalanadi</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="statusModal = null">Bekor</button>
          <button type="submit" :disabled="saving" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Yangilash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      title="Biznesni o'chirish"
      message="Bu biznesni o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi."
      confirm-label="O'chirish"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
