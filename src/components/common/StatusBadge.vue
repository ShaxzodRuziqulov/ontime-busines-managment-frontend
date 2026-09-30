<script setup lang="ts">
import type { BookingStatus, BusinessStatus } from '@/types'
import { useI18n } from 'vue-i18n'

const { t, te } = useI18n()

defineProps<{
  status: BookingStatus | BusinessStatus | string
}>()

const colorMap: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 ring-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-700 ring-slate-200',
  CANCELLED_BY_CUSTOMER: 'bg-red-100 text-red-700 ring-red-200',
  CANCELLED_BY_BUSINESS: 'bg-orange-100 text-orange-700 ring-orange-200',
  NO_SHOW: 'bg-slate-100 text-slate-500 ring-slate-200',
  TRIAL: 'bg-amber-100 text-amber-700 ring-amber-200',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  EXPIRED: 'bg-red-100 text-red-700 ring-red-200',
  SUSPENDED: 'bg-red-100 text-red-700 ring-red-200',
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  PENDING_REVIEW: 'bg-blue-100 text-blue-700 ring-blue-200',
  NEW: 'bg-amber-100 text-amber-700 ring-amber-200',
  WAITING_USER: 'bg-violet-100 text-violet-700 ring-violet-200',
  RESOLVED: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const dotMap: Record<string, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-slate-400',
  CANCELLED_BY_CUSTOMER: 'bg-red-500',
  CANCELLED_BY_BUSINESS: 'bg-orange-500',
  NO_SHOW: 'bg-slate-400',
  TRIAL: 'bg-amber-500',
  ACTIVE: 'bg-emerald-500',
  EXPIRED: 'bg-red-500',
  SUSPENDED: 'bg-red-500',
  DRAFT: 'bg-slate-400',
  PENDING_REVIEW: 'bg-blue-500',
  NEW: 'bg-amber-500',
  WAITING_USER: 'bg-violet-500',
  RESOLVED: 'bg-emerald-500',
  CLOSED: 'bg-slate-400',
}

function getLabel(status: string) {
  for (const group of ['status.bookingLong', 'status.booking', 'status.business', 'status.ticket']) {
    if (te(`${group}.${status}`)) return t(`${group}.${status}`)
  }
  return status
}

function getColor(status: string) {
  return colorMap[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
}

function getDot(status: string) {
  return dotMap[status] || 'bg-slate-400'
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1',
      getColor(status),
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', getDot(status)]" aria-hidden="true" />
    {{ getLabel(status) }}
  </span>
</template>
