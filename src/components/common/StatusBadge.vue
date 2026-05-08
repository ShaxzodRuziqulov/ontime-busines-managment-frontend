<script setup lang="ts">
import type { BookingStatus, BusinessStatus } from '@/types'

defineProps<{
  status: BookingStatus | BusinessStatus | string
}>()

const bookingLabels: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  CONFIRMED: 'Tasdiqlangan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Bajarildi',
  CANCELLED_BY_CUSTOMER: 'Mijoz bekor qildi',
  CANCELLED_BY_BUSINESS: 'Biznes bekor qildi',
  NO_SHOW: 'Kelmadi',
}

const businessLabels: Record<string, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  EXPIRED: 'Muddati o\'tgan',
  SUSPENDED: 'To\'xtatilgan',
  DRAFT: 'Qoralama',
  PENDING_REVIEW: 'Moderatsiyada',
}

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
}

function getLabel(status: string) {
  return bookingLabels[status] || businessLabels[status] || status
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
