import apiClient from './client'
import type { Page } from '@/types'
export type SupportStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED'
export type SupportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export interface SupportMessage { id: string; sender: 'USER' | 'OPERATOR'; content: string; mediaType: string | null; createdAt: string }
export interface SupportTicket { id: string; requesterName: string; requesterLogin: string | null; subject: string; status: SupportStatus; priority: SupportPriority; createdAt: string; updatedAt: string; messages: SupportMessage[] }
export const supportApi = {
  mine: () => apiClient.get<Page<SupportTicket>>('/support/tickets'),
  mineGet: (id: string) => apiClient.get<SupportTicket>(`/support/tickets/${id}`),
  adminList: (params: { status?: string; q?: string }) => apiClient.get<Page<SupportTicket>>('/admin/support-tickets', { params }),
  adminGet: (id: string) => apiClient.get<SupportTicket>(`/admin/support-tickets/${id}`),
  update: (id: string, data: { status?: string; priority?: string }) => apiClient.patch<SupportTicket>(`/admin/support-tickets/${id}`, data),
  reply: (id: string, content: string) => apiClient.post<SupportTicket>(`/admin/support-tickets/${id}/messages`, { content }),
}
