export interface LoginRequest {
  login: string
  password: string
}

export interface RegisterRequest {
  login: string
  password: string
  displayName: string
  email: string
  phone: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  userId: string
  login: string
  displayName: string | null
  avatarUrl: string | null
  businessOwner: boolean
  admin: boolean
  roles: string[]
}

export type BusinessStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'DRAFT' | 'PENDING_REVIEW'

export interface Business {
  id: string
  ownerId: string
  name: string
  description: string
  status: BusinessStatus
  trialEndDate: string | null
  subscriptionEndDate: string | null
  contactPhone: string
  addressLine: string
  city: string
  latitude?: number
  longitude?: number
  accessAllowed: boolean
  createdAt: string
  updatedAt: string
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export interface BusinessUpdateRequest {
  name?: string
  description?: string
  addressLine?: string
  city?: string
  contactPhone?: string
  latitude?: number
  longitude?: number
}

export interface BusinessStatusUpdateRequest {
  status: BusinessStatus
  subscriptionEndDate?: string  // ISO-8601 format (toISOString() bilan yuboriladi)
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_BUSINESS'
  | 'NO_SHOW'

export interface Booking {
  id: string
  customerId: string
  businessId: string
  offeredServiceId: string
  staffId: string | null
  startAt: string
  endAt: string
  status: BookingStatus
  customerNote: string
  createdAt: string
  updatedAt: string
}

export interface BookingCreateRequest {
  customerId: string
  businessId: string
  offeredServiceId: string
  staffId?: string
  startAt: string
  endAt: string
  status?: BookingStatus
  customerNote?: string
}

export interface BookingUpdateRequest {
  staffId?: string
  startAt?: string
  endAt?: string
  status?: BookingStatus
  customerNote?: string
}

export interface OfferedService {
  id: string
  businessId: string
  name: string
  description: string
  basePrice: number
  durationMinutes: number
  active: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceCreateRequest {
  name: string
  description: string
  basePrice: number
  durationMinutes: number
  active: boolean
}

export interface StaffMember {
  id: string
  businessId: string
  linkedUserId: string | null
  displayName: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface StaffCreateRequest {
  linkedUserId?: string | null
  displayName: string
  active: boolean
}

export interface Review {
  id: string
  bookingId: string
  businessId: string | null
  staffId: string | null
  staffName: string | null
  stars: number
  comment: string
  createdAt: string
}

export interface StaffStats {
  totalBookings: number
  completedBookings: number
  pendingBookings: number
  cancelledBookings: number
  avgRating: number
  reviewCount: number
}

export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface BusinessHours {
  id: string
  businessId: string
  weekday: Weekday
  closed: boolean
  opensAt: string | null
  closesAt: string | null
}

export interface BusinessHoursCreateRequest {
  weekday: Weekday
  closed: boolean
  opensAt?: string
  closesAt?: string
}

export interface BusinessHoursUpdateRequest {
  closed?: boolean
  opensAt?: string
  closesAt?: string
}

export interface User {
  id: string
  login: string
  firstName: string | null
  lastName: string | null
  displayName: string
  email: string
  phone: string
  avatarUrl: string | null
  active: boolean
  roles: string[]
  businessOwner: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCreateRequest {
  login: string
  password: string
  firstName?: string
  lastName?: string
  displayName: string
  email: string
  phone: string
  avatarUrl?: string | null
  active?: boolean
}

export interface UserUpdateRequest {
  password?: string
  displayName?: string
  email?: string
  phone?: string
  avatarUrl?: string | null
  active?: boolean
  roles?: string[]
}

export interface ApiError {
  status: number
  message: string
}
