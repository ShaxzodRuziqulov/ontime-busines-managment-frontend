<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Building2, Trash2, Settings, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-vue-next'
import { businessesApi } from '@/api/businesses'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { Business, BusinessStatus, BusinessStatusUpdateRequest } from '@/types'

const businesses = ref<Business[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const deleteConfirm = ref<string | null>(null)
const statusModal = ref<Business | null>(null)

const statusForm = ref<BusinessStatusUpdateRequest>({ status: 'ACTIVE', subscriptionEndDate: '' })

const allStatuses: BusinessStatus[] = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'DRAFT', 'PENDING_REVIEW']

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return businesses.value
  return businesses.value.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.addressLine?.toLowerCase().includes(q)
  )
})

function openStatusModal(biz: Business) {
  statusModal.value = biz
  statusForm.value = {
    status: biz.status,
    subscriptionEndDate: biz.subscriptionEndDate ?? '',
  }
}

async function updateStatus() {
  if (!statusModal.value) return
  saving.value = true
  try {
    const payload: BusinessStatusUpdateRequest = { status: statusForm.value.status }
    if (statusForm.value.subscriptionEndDate) {
      payload.subscriptionEndDate = statusForm.value.subscriptionEndDate
    }
    await businessesApi.updateStatus(statusModal.value.id, payload)
    const idx = businesses.value.findIndex(b => b.id === statusModal.value!.id)
    if (idx !== -1) {
      businesses.value[idx] = {
        ...businesses.value[idx],
        status: statusForm.value.status,
        subscriptionEndDate: statusForm.value.subscriptionEndDate || null,
      }
    }
    statusModal.value = null
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  await businessesApi.delete(id)
  businesses.value = businesses.value.filter(b => b.id !== id)
  deleteConfirm.value = null
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

onMounted(async () => {
  try {
    const { data } = await businessesApi.getAll()
    businesses.value = data
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
    </div>

    <!-- Search -->
    <div class="relative mb-5">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Biznes nomi yoki manzil bo'yicha qidirish..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      />
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Biznes topilmadi"
        description="Qidiruv so'zini o'zgartiring"
      >
        <template #icon>
          <Building2 class="w-8 h-8 text-slate-400" />
        </template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Biznes</th>
                <th class="px-5 py-3 text-left font-medium">Telefon</th>
                <th class="px-5 py-3 text-left font-medium">Holat</th>
                <th class="px-5 py-3 text-left font-medium">Trial tugash</th>
                <th class="px-5 py-3 text-left font-medium">Obuna tugash</th>
                <th class="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in filtered"
                :key="biz.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 class="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ biz.name }}</p>
                      <p class="text-xs text-slate-400 mt-0.5">{{ biz.addressLine || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-slate-500">{{ biz.contactPhone || '—' }}</td>
                <td class="px-5 py-3.5">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusColor(biz.status)]">
                    <component :is="statusIcon(biz.status)" class="w-3 h-3" />
                    {{ biz.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-slate-500 text-xs">{{ formatDate(biz.trialEndDate) }}</td>
                <td class="px-5 py-3.5 text-slate-500 text-xs">{{ formatDate(biz.subscriptionEndDate) }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      @click="openStatusModal(biz)"
                      title="Holatni o'zgartirish"
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
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Yangi holat</label>
          <select
            v-model="statusForm.status"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option v-for="s in allStatuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Obuna tugash sanasi</label>
          <input
            v-model="statusForm.subscriptionEndDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p class="text-xs text-slate-400 mt-1">Bo'sh qoldiring — mavjud qiymat o'zgarmaydi</p>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="statusModal = null">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Yangilash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal v-if="deleteConfirm" title="Biznesni o'chirish" size="sm" @close="deleteConfirm = null">
      <p class="text-slate-600 text-sm mb-5">Bu biznesni o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi.</p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="deleteConfirm = null">Bekor</button>
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700" @click="confirmDelete(deleteConfirm!)">O'chirish</button>
      </div>
    </AppModal>
  </div>
</template>
