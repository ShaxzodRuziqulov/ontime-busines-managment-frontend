import type { BookingStatus } from '@/types'

export const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: 'Kutilmoqda',
  CONFIRMED: 'Tasdiqlangan',
  IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Bajarildi',
  CANCELLED_BY_CUSTOMER: 'Bekor (mijoz)',
  CANCELLED_BY_BUSINESS: 'Bekor (xodim)',
  NO_SHOW: 'Kelmadi',
}

/** Badge (matn ustida) ranglari — bg-.../text-... */
export const bookingStatusBadgeColors: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED_BY_CUSTOMER: 'bg-red-100 text-red-600',
  CANCELLED_BY_BUSINESS: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-slate-100 text-slate-500',
}

/** To'liq to'ldirilgan blok (masalan jadval katakchasi) uchun fon ranglari. */
export const bookingStatusBlockColors: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-200 text-amber-800',
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
export const nextBookingActions: Record<string, { status: BookingStatus; label: string; cls: string }[]> = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Tasdiqlash', cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { status: 'CANCELLED_BY_BUSINESS', label: 'Bekor qilish', cls: 'bg-red-50 hover:bg-red-100 text-red-600' },
  ],
  CONFIRMED: [
    { status: 'IN_PROGRESS', label: 'Boshlash', cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { status: 'NO_SHOW', label: 'Kelmadi', cls: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
    { status: 'CANCELLED_BY_BUSINESS', label: 'Bekor qilish', cls: 'bg-red-50 hover:bg-red-100 text-red-600' },
  ],
  IN_PROGRESS: [
    { status: 'COMPLETED', label: 'Yakunlash', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { status: 'NO_SHOW', label: 'Kelmadi', cls: 'bg-slate-100 hover:bg-slate-200 text-slate-600' },
  ],
}
