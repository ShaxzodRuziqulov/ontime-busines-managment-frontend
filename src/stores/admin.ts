import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { businessesApi } from '@/api/businesses'

export const useAdminStore = defineStore('admin', () => {
  const businesses = ref<{ id: string; status: string }[]>([])
  const loaded = ref(false)

  const pendingReviewCount = computed(
    () => businesses.value.filter(b => b.status === 'PENDING_REVIEW').length
  )

  async function fetchBusinesses() {
    if (loaded.value) return
    try {
      const { data } = await businessesApi.getAll()
      businesses.value = data.map(b => ({ id: b.id, status: b.status }))
      loaded.value = true
    } catch {
      // sidebar badge uchun kritik emas
    }
  }

  function markLoaded(list: { id: string; status: string }[]) {
    businesses.value = list
    loaded.value = true
  }

  return { pendingReviewCount, fetchBusinesses, markLoaded }
})
