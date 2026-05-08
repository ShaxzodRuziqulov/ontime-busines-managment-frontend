const BASE = (import.meta.env.VITE_API_BASE_URL as string || '')
  .replace(/\/api\/v1\/?$/, '')

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BASE + path
}
