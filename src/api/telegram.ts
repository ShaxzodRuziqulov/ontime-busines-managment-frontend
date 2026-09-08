import apiClient from './client'

export interface TelegramLink {
  url: string
  linked: boolean
}

export const telegramApi = {
  createLink: () => apiClient.post<TelegramLink>('/telegram/link', null, { params: { source: 'BUSINESS_PANEL' } }),
}
