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
      const { data } = await businessesApi.getAll({ size: 1000 })
      businesses.value = data.content.map(b => ({ id: b.id, status: b.status }))
      loaded.value = true
    } catch {
      // sidebar badge uchun kritik emas
    }
  }

  /** To'liq ro'yxat qayta yuklanganda (masalan bizneslar sahifasida) butun keshni almashtiradi. */
  function setAll(list: { id: string; status: string }[]) {
    businesses.value = list
    loaded.value = true
  }

  /** Bitta biznesning holati o'zgarganda (masalan review/status update) faqat o'shani yangilaydi — qolganlarini yo'qotmaydi. */
  function upsertOne(item: { id: string; status: string }) {
    const idx = businesses.value.findIndex((b) => b.id === item.id)
    if (idx !== -1) businesses.value[idx] = item
    else businesses.value.push(item)
  }

  return { pendingReviewCount, fetchBusinesses, setAll, upsertOne }
})
