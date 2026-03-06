/**
 * Shared TypeScript types for the Plumbing Operations Platform.
 * These extend/re-export Prisma types with application-level convenience types.
 */

export type {
  User,
  Customer,
  Lead,
  Job,
  JobNote,
  JobPhoto,
  JobPart,
  LaborEntry,
  InventoryItem,
  InventoryLocation,
  InventoryBalance,
  Invoice,
  InvoiceLineItem,
  Message,
  Notification,
  Role,
  LeadSource,
  LeadStatus,
  JobStatus,
  LocationType,
  InvoiceStatus,
  LineItemType,
  MessageDir,
  MessageChannel,
  NotificationType,
} from '@prisma/client'

// ─────────────────────────────────────────────
// API response shapes
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─────────────────────────────────────────────
// Rich / expanded types used by the UI
// ─────────────────────────────────────────────

import type {
  Job,
  Customer,
  Lead,
  User,
  JobNote,
  JobPhoto,
  JobPart,
  LaborEntry,
  Invoice,
  InventoryItem,
  InventoryLocation,
} from '@prisma/client'

export type JobWithRelations = Job & {
  customer: Customer
  technician: User | null
  lead: Lead | null
  notes: (JobNote & { author: Pick<User, 'id' | 'name'> })[]
  photos: JobPhoto[]
  parts: (JobPart & { item: InventoryItem; sourceLocation: InventoryLocation | null })[]
  laborEntries: LaborEntry[]
  invoice: Invoice | null
}

export type LeadWithCustomer = Lead & {
  customer: Customer | null
}

export type InventoryBalanceWithItem = {
  item: InventoryItem
  quantity: number
  locationId: string
}

// ─────────────────────────────────────────────
// Request body types for API routes
// ─────────────────────────────────────────────

export interface CreateLeadBody {
  name: string
  phone: string
  address?: string
  description: string
  preferredTime?: string
  source?: 'PHONE' | 'SMS' | 'MANUAL'
  customerId?: string
}

export interface UpdateLeadBody {
  name?: string
  phone?: string
  address?: string
  description?: string
  preferredTime?: string
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'
}

export interface ConvertLeadBody {
  address: string
  scheduledTime?: string
  technicianId?: string
}

export interface CreateJobBody {
  customerId: string
  address: string
  problemDescription: string
  technicianId?: string
  scheduledTime?: string
  scheduledEndTime?: string
  leadId?: string
}

export interface UpdateJobBody {
  address?: string
  problemDescription?: string
  technicianId?: string
  scheduledTime?: string
  scheduledEndTime?: string
}

export interface UpdateJobStatusBody {
  status: 'JOB_REQUESTED' | 'SCHEDULED' | 'TECHNICIAN_ASSIGNED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'INVOICED' | 'PAID'
}

export interface AddJobPartBody {
  itemId: string
  quantity: number
  unitPrice: number
  sourceLocationId?: string
}

export interface AddLaborEntryBody {
  description: string
  amount: number
}

export interface AddJobNoteBody {
  content: string
}

export interface CreateInventoryItemBody {
  sku: string
  name: string
  category?: string
  cost: number
  defaultPrice?: number
}

export interface AdjustBalanceBody {
  itemId: string
  quantity: number // delta — positive adds, negative subtracts
}

export interface CreateInvoiceBody {
  jobId: string
  serviceCallAmount?: number
}

export interface UpdateInvoiceStatusBody {
  status: 'UNSENT' | 'SENT' | 'PAID'
}

export interface LoginBody {
  email: string
  password: string
}

export interface CreateUserBody {
  name: string
  email: string
  phone?: string
  password: string
  role: 'OWNER' | 'DISPATCHER' | 'TECHNICIAN'
}
