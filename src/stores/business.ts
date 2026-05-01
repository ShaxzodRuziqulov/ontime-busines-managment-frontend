import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { businessesApi } from '@/api/businesses'
import { useAuthStore } from './auth'
import type { Business } from '@/types'

export const useBusinessStore = defineStore('business', () => {
  const business = ref<Business | null>(null)
  const loading = ref(false)

  const isExpired = computed(() =>
    business.value?.status === 'EXPIRED' || business.value?.status === 'SUSPENDED'
  )

  const isTrial = computed(() => business.value?.status === 'TRIAL')

  const trialDaysLeft = computed(() => {
    if (!business.value?.trialEndDate) return 0
    const end = new Date(business.value.trialEndDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  })

  async function fetchMyBusiness() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data } = await businessesApi.getAll({ ownerId: authStore.user.userId })
      business.value = data[0] || null
    } finally {
      loading.value = false
    }
  }

  return { business, loading, isExpired, isTrial, trialDaysLeft, fetchMyBusiness }
})
