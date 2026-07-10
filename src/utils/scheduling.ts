import type { Weekday, Booking, BookingStatus } from '@/types'

export const WEEKDAY_ORDER: Weekday[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export function weekdayFromDate(dateStr: string): Weekday {
  const d = new Date(dateStr + 'T00:00:00')
  return WEEKDAY_ORDER[d.getDay()]
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesOfDay(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const NON_BLOCKING_STATUSES: BookingStatus[] = ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_BUSINESS', 'NO_SHOW']

/** Berilgan xodim uchun [startMin,endMin) oralig'i mavjud bronlar bilan to'qnashadimi. */
export function isStaffBusy(bookings: Booking[], staffId: string, startMin: number, endMin: number, excludeId?: string): boolean {
  return bookings.some((b) => {
    if (b.id === excludeId) return false
    if (b.staffId !== staffId) return false
    if (NON_BLOCKING_STATUSES.includes(b.status)) return false
    const bStart = minutesOfDay(b.startAt)
    const bEnd = minutesOfDay(b.endAt)
    return bStart < endMin && bEnd > startMin
  })
}

/** SLOT_INTERVAL oralig'ida, [openMin,closeMin) ichida durationMin uzunlikdagi barcha mumkin bo'lgan boshlanish vaqtlari. */
export function generatePossibleStarts(openMin: number, closeMin: number, durationMin: number, interval: number): number[] {
  const starts: number[] = []
  for (let m = openMin; m + durationMin <= closeMin; m += interval) {
    starts.push(m)
  }
  return starts
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
