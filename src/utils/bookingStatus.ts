import type { BookingStatus } from '@/types'
import { t, translatedRecord } from '@/i18n'

export const bookingStatusLabels = translatedRecord<BookingStatus>('status.booking')

/** Badge (matn ustida) ranglari — bg-.../text-... */
export const bookingStatusBadgeColors: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-200 text-amber-900',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED_BY_CUSTOMER: 'bg-red-300 text-red-600',
  CANCELLED_BY_BUSINESS: 'bg-red-200 text-red-600',
  NO_SHOW: 'bg-slate-200 text-slate-500',
}

/** To'liq to'ldirilgan blok (masalan jadval katakchasi) uchun fon ranglari. */
export const bookingStatusBlockColors: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-200 text-amber-900',
  CONFIRMED: 'bg-blue-200 text-blue-800',
  IN_PROGRESS: 'bg-indigo-300 text-indigo-800',
  COMPLETED: 'bg-emerald-200 text-emerald-800',
  CANCELLED_BY_CUSTOMER: 'bg-red-300 text-red-800',
  CANCELLED_BY_BUSINESS: 'bg-red-200 text-red-800',
  NO_SHOW: 'bg-slate-200 text-slate-500',
}

/**
 * Backenddagi BookingService.ALLOWED_TRANSITIONS bilan mos — xodim/biznes egasi
 * bosishi mumkin bo'lgan keyingi amallar.
 */
export const nextBookingActions: Record<string, { status: BookingStatus; readonly label: string; cls: string }[]> = {
  PENDING: [
    { status: 'CONFIRMED', get label() { return t('status.action.confirm') }, cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { status: 'CANCELLED_BY_BUSINESS', get label() { return t('status.action.cancel') }, cls: 'bg-red-50 hover:bg-red-100 text-red-600' },
  ],
  CONFIRMED: [
    { status: 'IN_PROGRESS', get label() { return t('status.action.start') }, cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { status: 'NO_SHOW', get label() { return t('status.action.noShow') }, cls: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
    { status: 'CANCELLED_BY_BUSINESS', get label() { return t('status.action.cancel') }, cls: 'bg-red-50 hover:bg-red-100 text-red-600' },
  ],
  IN_PROGRESS: [
    { status: 'COMPLETED', get label() { return t('status.action.complete') }, cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { status: 'NO_SHOW', get label() { return t('status.action.noShow') }, cls: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
  ],
}
