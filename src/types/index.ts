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
}

export interface BusinessUpdateRequest {
  name?: string
  description?: string
  addressLine?: string
  city?: string
  contactPhone?: string
}

export interface BusinessStatusUpdateRequest {
  status: BusinessStatus
  subscriptionEndDate?: string
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'

export interface Booking {
  id: string
  customerId: string
  businessId: string
  offeredServiceId: string
  staffId: string
  startAt: string
  endAt: string
  status: BookingStatus
  customerNote: string
}

export interface BookingCreateRequest {
  customerId: string
  businessId: string
  offeredServiceId: string
  staffId?: string
  startAt: string
  endAt: string
  status: BookingStatus
  customerNote: string
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
}

export interface StaffCreateRequest {
  linkedUserId?: string | null
  displayName: string
  active: boolean
}

export interface Review {
  id: string
  bookingId: string
  stars: number
  comment: string
  createdAt?: string
}

export interface User {
  id: string
  login: string
  displayName: string
  email: string
  phone: string
  roles: string[]
  businessOwner: boolean
}

export interface UserCreateRequest {
  login: string
  password: string
  displayName: string
  email: string
  phone: string
}

export interface UserUpdateRequest {
  displayName?: string
  email?: string
  phone?: string
}

export interface ApiError {
  status: number
  message: string
}
