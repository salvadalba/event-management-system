export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'event_manager' | 'checkin_staff'
  phone?: string
  avatarUrl?: string
  isActive: boolean
  emailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'event_manager' | 'checkin_staff'
  phone?: string
}

export interface Event {
  id: string
  title: string
  description?: string
  shortDescription?: string
  organizer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  venue: {
    name: string
    address: string
    city: string
    state?: string
    country: string
    postalCode?: string
  }
  startDate: string
  endDate: string
  timezone?: string
  maxAttendees?: number
  currentAttendees: number
  status: 'draft' | 'published' | 'canceled' | 'completed'
  isFeatured: boolean
  featuredImageUrl?: string
  agenda?: any
  tags?: string[]
  customFields?: any
  registrationDeadline?: string
  checkinEnabled: boolean
  requiresApproval: boolean
  socialLinks?: any
  contactEmail?: string
  contactPhone?: string
  tickets?: Ticket[]
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: string
  name: string
  description?: string
  type: 'general' | 'vip' | 'early_bird' | 'student' | 'group' | 'sponsor'
  price: number
  currency: string
  quantityAvailable?: number
  quantitySold: number
  salesStart: string
  salesEnd?: string
  minPurchase: number
  maxPurchase: number
  requiresApproval: boolean
  benefits?: string[]
}

export interface Registration {
  id: string
  event: {
    id: string
    title: string
    startDate: string
  }
  ticket: {
    id: string
    name: string
    type: string
    price: number
  }
  attendee: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    jobTitle?: string
    dietaryRestrictions?: string
    specialRequirements?: string
  }
  quantity: number
  totalAmount: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted' | 'checked_in'
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  paymentId?: string
  registrationCode: string
  qrCodeUrl?: string
  ticketUrl?: string
  checkedInAt?: string
  checkedInBy?: string
  customFieldValues?: any
  referralSource?: string
  marketingConsent: boolean
  emailNotifications: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Communication {
  id: string
  event?: {
    id: string
    title: string
  }
  sender: {
    id: string
    firstName: string
    lastName: string
  }
  recipientType: 'all' | 'ticket_type' | 'specific' | 'waitlist'
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  scheduledAt?: string
  sentAt?: string
  recipientCount: number
  sentCount: number
  openCount: number
  clickCount: number
  campaignName?: string
  tags?: string[]
  createdAt: string
}

export interface CheckinRecord {
  id: string
  registration: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  ticket: {
    id: string
    name: string
    type: string
  }
  checkedInBy: string
  checkinTime: string
  checkinMethod: 'qr_code' | 'manual' | 'search' | 'walk_in'
  deviceId?: string
  location?: string
  notes?: string
  badgePrinted: boolean
  badgePrintedAt?: string
}

export interface AnalyticsData {
  summary: {
    totalRegistrations: number
    confirmedRegistrations: number
    cancelledRegistrations: number
    waitlistedRegistrations: number
    totalRevenue: number
    paidCount: number
    pendingCount: number
    totalCheckins: number
    attendanceRate: number
  }
  ticketTypes: Array<{
    type: string
    registrations: number
    revenue: number
  }>
  trends: Array<{
    date: string
    registrations: number
  }>
  trafficSources: Array<{
    source: string
    count: number
  }>
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any
}

export interface ApiError {
  success: false
  error: string
  details?: any
}