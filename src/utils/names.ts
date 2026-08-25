export interface PersonName {
  firstName?: string | null
  lastName?: string | null
  login?: string | null
}

export interface BookingName {
  customerFirstName?: string | null
  customerLastName?: string | null
  staffFirstName?: string | null
  staffLastName?: string | null
}

export interface ReviewName {
  customerFirstName?: string | null
  customerLastName?: string | null
  staffFirstName?: string | null
  staffLastName?: string | null
}

export function personName(person: PersonName | null | undefined, fallback = '—') {
  if (!person) return fallback
  const name = [person.firstName, person.lastName]
    .filter((part) => !!part?.trim())
    .map((part) => part!.trim())
    .join(' ')
  return name || person.login || fallback
}

export function bookingCustomerName(booking: BookingName, fallback = 'Mijoz') {
  const name = [booking.customerFirstName, booking.customerLastName]
    .filter((part) => !!part?.trim())
    .map((part) => part!.trim())
    .join(' ')
  return name || fallback
}

export function bookingStaffName(booking: BookingName, fallback = '—') {
  const name = [booking.staffFirstName, booking.staffLastName]
    .filter((part) => !!part?.trim())
    .map((part) => part!.trim())
    .join(' ')
  return name || fallback
}

export function reviewCustomerName(review: ReviewName, fallback = 'Mijoz') {
  return bookingCustomerName(review, fallback)
}

export function reviewStaffName(review: ReviewName, fallback = '—') {
  return bookingStaffName(review, fallback)
}
