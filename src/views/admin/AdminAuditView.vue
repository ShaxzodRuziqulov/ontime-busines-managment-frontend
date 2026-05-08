<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Search, ShieldCheck, Building2, Users, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-vue-next'
import { auditApi, type AuditLog } from '@/api/audit'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const totalPages = ref(0)
const totalElements = ref(0)
const page = ref(0)
const PAGE_SIZE = 50

const filterEntityType = ref('')
const filterAction = ref('')
const filterAdmin = ref('')

const actionLabels: Record<string, string> = {
  BUSINESS_STATUS_CHANGED: 'Holat o\'zgartirildi',
  BUSINESS_REVIEWED:       'Biznes ko\'rib chiqildi',
  BUSINESS_DELETED:        'Biznes o\'chirildi',
  USER_CREATED:            'Foydalanuvchi yaratildi',
  USER_UPDATED:            'Foydalanuvchi yangilandi',
  USER_ACTIVATED:          'Foydalanuvchi aktivlashtirildi',
  USER_DEACTIVATED:        'Foydalanuvchi bloklandi',
  USER_ROLE_CHANGED:       'Rol o\'zgartirildi',
  USER_DELETED:            'Foydalanuvchi o\'chirildi',
}

const actionColors: Record<string, string> = {
  BUSINESS_STATUS_CHANGED: 'bg-blue-100 text-blue-700',
  BUSINESS_REVIEWED:       'bg-violet-100 text-violet-700',
  BUSINESS_DELETED:        'bg-red-100 text-red-700',
  USER_CREATED:            'bg-emerald-100 text-emerald-700',
  USER_UPDATED:            'bg-slate-100 text-slate-600',
  USER_ACTIVATED:          'bg-emerald-100 text-emerald-700',
  USER_DEACTIVATED:        'bg-amber-100 text-amber-700',
  USER_ROLE_CHANGED:       'bg-indigo-100 text-indigo-700',
  USER_DELETED:            'bg-red-100 text-red-700',
}

const allActions = Object.keys(actionLabels)
const entityTypes = ['BUSINESS', 'USER']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('uz-UZ') + ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  try {
    const { data } = await auditApi.getAll({
      entityType: filterEntityType.value || undefined,
      action: filterAction.value || undefined,
      adminLogin: filterAdmin.value || undefined,
      page: page.value,
      size: PAGE_SIZE,
    })
    logs.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterEntityType.value = ''
  filterAction.value = ''
  filterAdmin.value = ''
  page.value = 0
}

watch([filterEntityType, filterAction], () => {
  page.value = 0
  load()
})

let searchTimeout: ReturnType<typeof setTimeout>
watch(filterAdmin, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 0
    load()
  }, 400)
})

watch(page, load)

function exportCsv() {
  const rows = [
    ['Vaqt', 'Admin', 'Harakat', 'Entity', 'Entity ID', 'Tafsilot'],
    ...logs.value.map(l => [
      formatDate(l.createdAt),
      l.adminLogin,
      actionLabels[l.action] ?? l.action,
      l.entityType,
      l.entityId,
      l.details ?? '',
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Audit Log</h1>
        <p class="text-slate-500 text-sm mt-1">Barcha admin harakatlari tarixi</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="exportCsv"
          class="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Download class="w-4 h-4" />
          CSV
        </button>
        <button
          @click="load"
          :class="['flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors', loading && 'opacity-60 pointer-events-none']"
        >
          <RefreshCw class="w-4 h-4" :class="loading && 'animate-spin'" />
          Yangilash
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-5">
      <!-- Admin login search -->
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="filterAdmin"
          type="text"
          placeholder="Admin logini..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>

      <!-- Entity type -->
      <select
        v-model="filterEntityType"
        class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700"
      >
        <option value="">Barcha turlar</option>
        <option v-for="t in entityTypes" :key="t" :value="t">{{ t }}</option>
      </select>

      <!-- Action -->
      <select
        v-model="filterAction"
        class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-700 max-w-56"
      >
        <option value="">Barcha harakatlar</option>
        <option v-for="a in allActions" :key="a" :value="a">{{ actionLabels[a] }}</option>
      </select>

      <button
        v-if="filterEntityType || filterAction || filterAdmin"
        @click="resetFilters"
        class="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
      >
        Tozalash
      </button>
    </div>

    <!-- Stats -->
    <div class="text-xs text-slate-500 mb-3">
      Jami {{ totalElements }} ta yozuv
    </div>

    <SkeletonTable v-if="loading" :rows="8" :cols="5" />

    <template v-else>
      <EmptyState
        v-if="logs.length === 0"
        title="Yozuv topilmadi"
        description="Filtrlarni o'zgartirib ko'ring"
      >
        <template #icon><ShieldCheck class="w-8 h-8 text-slate-400" /></template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Vaqt</th>
                <th class="px-5 py-3 text-left font-medium">Admin</th>
                <th class="px-5 py-3 text-left font-medium">Harakat</th>
                <th class="px-5 py-3 text-left font-medium">Entity</th>
                <th class="px-5 py-3 text-left font-medium">Tafsilot</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="log in logs"
                :key="log.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {{ formatDate(log.createdAt) }}
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck class="w-3 h-3 text-red-600" />
                    </div>
                    <span class="font-mono text-xs text-slate-700">{{ log.adminLogin }}</span>
                  </div>
                </td>
                <td class="px-5 py-3">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', actionColors[log.action] ?? 'bg-slate-100 text-slate-600']">
                    {{ actionLabels[log.action] ?? log.action }}
                  </span>
                </td>
                <td class="px-5 py-3">
                  <div class="flex items-center gap-1.5">
                    <Building2 v-if="log.entityType === 'BUSINESS'" class="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                    <Users v-else class="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    <span class="text-xs text-slate-500 font-mono truncate max-w-[120px]" :title="log.entityId">
                      {{ log.entityId.slice(0, 8) }}…
                    </span>
                  </div>
                </td>
                <td class="px-5 py-3 text-slate-500 text-xs max-w-xs truncate" :title="log.details ?? ''">
                  {{ log.details || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500">
            {{ page * PAGE_SIZE + 1 }}–{{ Math.min((page + 1) * PAGE_SIZE, totalElements) }} / {{ totalElements }}
          </span>
          <div class="flex gap-1">
            <button
              :disabled="page === 0"
              @click="page--"
              class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              v-for="p in Math.min(totalPages, 7)"
              :key="p - 1"
              @click="page = p - 1"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                page === p - 1 ? 'bg-primary-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              ]"
            >
              {{ p }}
            </button>
            <button
              :disabled="page >= totalPages - 1"
              @click="page++"
              class="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
