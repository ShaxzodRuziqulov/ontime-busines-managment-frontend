<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Building2, Trash2, Settings, CheckCircle2, XCircle, Clock, AlertCircle, Download, ExternalLink, ChevronDown } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { businessesApi } from '@/api/businesses'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import type { Business, BusinessStatus, BusinessStatusUpdateRequest } from '@/types'

const toast = useToast()
const router = useRouter()
const adminStore = useAdminStore()

const businesses = ref<Business[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const statusFilter = ref<BusinessStatus | 'all'>('all')
const deleteConfirm = ref<string | null>(null)
const statusModal = ref<Business | null>(null)

// Bulk actions
const selected = ref<Set<string>>(new Set())
const bulkStatusOpen = ref(false)

const allStatuses: BusinessStatus[] = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'DRAFT', 'PENDING_REVIEW']

const statusLabels: Record<BusinessStatus, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan",
  DRAFT: 'Qoralama',
  PENDING_REVIEW: 'Tekshiruvda',
}

const statusForm = ref<BusinessStatusUpdateRequest>({ status: 'ACTIVE', subscriptionEndDate: '' })

const statusCounts = computed(() => {
  const map: Record<string, number> = { all: businesses.value.length }
  for (const b of businesses.value) map[b.status] = (map[b.status] ?? 0) + 1
  return map
})

const filtered = computed(() => {
  let list = businesses.value
  if (statusFilter.value !== 'all') list = list.filter(b => b.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.addressLine?.toLowerCase().includes(q) ||
    b.city?.toLowerCase().includes(q)
  )
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
  saving.value = true
  bulkStatusOpen.value = false
  const ids = [...selected.value]
  try {
    await Promise.all(ids.map(id => businessesApi.updateStatus(id, { status })))
    for (const id of ids) {
      const idx = businesses.value.findIndex(b => b.id === id)
      if (idx !== -1) businesses.value[idx] = { ...businesses.value[idx], status }
    }
    adminStore.markLoaded(businesses.value.map(b => ({ id: b.id, status: b.status })))
    clearSelection()
    toast.success(`${ids.length} ta biznes holati yangilandi`)
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function bulkDelete() {
  saving.value = true
  const ids = [...selected.value]
  try {
    await Promise.all(ids.map(id => businessesApi.delete(id)))
    businesses.value = businesses.value.filter(b => !ids.includes(b.id))
    adminStore.markLoaded(businesses.value.map(b => ({ id: b.id, status: b.status })))
    clearSelection()
    toast.success(`${ids.length} ta biznes o'chirildi`)
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openStatusModal(biz: Business) {
  statusModal.value = biz
  statusForm.value = { status: biz.status, subscriptionEndDate: biz.subscriptionEndDate ?? '' }
}

function toInstant(dateStr: string | undefined | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(dateStr).toISOString()
}

async function updateStatus() {
  if (!statusModal.value) return
  saving.value = true
  try {
    const payload: BusinessStatusUpdateRequest = { status: statusForm.value.status }
    if (statusForm.value.subscriptionEndDate) payload.subscriptionEndDate = toInstant(statusForm.value.subscriptionEndDate)
    await businessesApi.updateStatus(statusModal.value.id, payload)
    const idx = businesses.value.findIndex(b => b.id === statusModal.value!.id)
    if (idx !== -1) {
      businesses.value[idx] = {
        ...businesses.value[idx],
        status: statusForm.value.status,
        subscriptionEndDate: statusForm.value.subscriptionEndDate || null,
      }
    }
    adminStore.markLoaded(businesses.value.map(b => ({ id: b.id, status: b.status })))
    statusModal.value = null
    toast.success('Holat yangilandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  try {
    await businessesApi.delete(id)
    businesses.value = businesses.value.filter(b => b.id !== id)
    adminStore.markLoaded(businesses.value.map(b => ({ id: b.id, status: b.status })))
    deleteConfirm.value = null
    toast.success("O'chirildi")
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function statusColor(status: BusinessStatus) {
  const map: Record<BusinessStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    TRIAL: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-slate-100 text-slate-600',
    DRAFT: 'bg-blue-100 text-blue-700',
    PENDING_REVIEW: 'bg-violet-100 text-violet-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

function statusIcon(status: BusinessStatus) {
  if (status === 'ACTIVE') return CheckCircle2
  if (status === 'TRIAL') return Clock
  if (status === 'EXPIRED') return XCircle
  return AlertCircle
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uz-UZ')
}

function exportCsv() {
  const rows = [
    ['ID', 'Nomi', 'Manzil', 'Shahar', 'Telefon', 'Holat', 'Trial tugash', 'Obuna tugash', 'Yaratilgan'],
    ...filtered.value.map(b => [
      b.id, b.name, b.addressLine ?? '', b.city ?? '', b.contactPhone ?? '',
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

onMounted(async () => {
  try {
    const { data } = await businessesApi.getAll()
    businesses.value = data
    adminStore.markLoaded(data.map(b => ({ id: b.id, status: b.status })))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Bizneslar</h1>
        <p class="text-slate-500 text-sm mt-1">{{ businesses.length }} ta biznes ro'yxatda</p>
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
    <div class="relative mb-5">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="search" type="text"
        placeholder="Biznes nomi, manzil yoki shahar bo'yicha qidirish..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      />
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

    <SkeletonTable v-if="loading" :rows="7" :cols="6" />

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
          {{ filtered.length }} ta natija
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
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th class="px-3 py-3 text-left font-medium">Biznes</th>
                <th class="px-3 py-3 text-left font-medium">Telefon</th>
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
                    class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
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
              @click="statusForm.status = s"
              :class="[
                'px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all text-left',
                statusForm.status === s ? statusColor(s) + ' border-current' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              <div class="flex items-center gap-1.5">
                <component :is="statusIcon(s)" class="w-3.5 h-3.5" />
                {{ statusLabels[s] }}
              </div>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Obuna tugash sanasi</label>
          <input v-model="statusForm.subscriptionEndDate" type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <p class="text-xs text-slate-400 mt-1">Bo'sh qoldiring — mavjud qiymat o'zgarmaydi</p>
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
