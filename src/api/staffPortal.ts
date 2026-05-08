import apiClient from './client'
import type { StaffMember, Booking, StaffStats } from '@/types'

export const staffPortalApi = {
  myProfile: () => apiClient.get<StaffMember>('/staff/me'),
  myBookings: () => apiClient.get<Booking[]>('/staff/me/bookings'),
  myStats: () => apiClient.get<StaffStats>('/staff/me/stats'),
}
