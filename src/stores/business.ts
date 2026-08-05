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

  /**
   * Faqat o'qish rejimi: biznes mavjud va backend "accessAllowed=false" degan.
   * Bu real vaqtda hisoblanadi — sinov/obuna muddati o'tishi bilan darhol true bo'ladi,
   * hatto scheduler status'ni EXPIRED ga o'zgartirmasidan oldin ham.
   */
  const isReadOnly = computed(() =>
    business.value != null && business.value.accessAllowed === false
  )

  const trialDaysLeft = computed(() => {
    if (!business.value?.trialEndDate) return 0
    const end = new Date(business.value.trialEndDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  })

  async function fetchMyBusiness() {
    const authStore = useAuthStore()
    if (!authStore.user || authStore.isAdmin) {
      business.value = null
      return
    }
    // Faqat xodim bo'lsa (biznes egasi emas), biznes yuklamaslik
    if (authStore.isStaff && !authStore.isBusinessOwner) {
      business.value = null
      return
    }

    loading.value = true
    try {
      const { data } = await businessesApi.getAll({ ownerId: authStore.user.userId })
      business.value = data.content[0] || null
    } catch (error: any) {
      console.log('Error message:', error.response?.data?.message)
    } finally {
      loading.value = false
    }
  }

  function clear() {
    business.value = null
    loading.value = false
  }

  return { business, loading, isExpired, isTrial, isReadOnly, trialDaysLeft, fetchMyBusiness, clear }
})
