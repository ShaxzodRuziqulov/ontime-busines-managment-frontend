import type { BusinessStatus } from '@/types'

export const businessStatusLabels: Record<BusinessStatus, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan",
  DRAFT: 'Qoralama',
  PENDING_REVIEW: 'Tekshiruvda',
}

const businessStatusColors: Record<BusinessStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  TRIAL: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-slate-100 text-slate-600',
  DRAFT: 'bg-blue-100 text-blue-700',
  PENDING_REVIEW: 'bg-violet-100 text-violet-700',
}

export function businessStatusColor(status: BusinessStatus): string {
  return businessStatusColors[status] ?? 'bg-slate-100 text-slate-600'
}
