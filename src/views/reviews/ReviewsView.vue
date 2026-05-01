<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Star, MessageSquare } from 'lucide-vue-next'
import { reviewsApi } from '@/api/reviews'
import { useBusinessStore } from '@/stores/business'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Review } from '@/types'

const businessStore = useBusinessStore()
const reviews = ref<Review[]>([])
const loading = ref(true)

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return (reviews.value.reduce((s, r) => s + r.stars, 0) / reviews.value.length)
})

const ratingDistribution = computed(() => {
  const dist = [0, 0, 0, 0, 0]
  reviews.value.forEach((r) => {
    if (r.stars >= 1 && r.stars <= 5) dist[r.stars - 1]++
  })
  return dist.reverse()
})

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

onMounted(async () => {
  try {
    const { data } = await reviewsApi.getAll(businessStore.business?.id)
    reviews.value = data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Sharhlar</h1>
      <p class="text-slate-500 text-sm mt-1">Mijozlar fikrlari</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Rating overview -->
      <div v-if="reviews.length > 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
        <div class="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
          <!-- Big rating -->
          <div class="text-center flex-shrink-0">
            <div class="text-5xl font-bold text-slate-800">{{ avgRating.toFixed(1) }}</div>
            <div class="flex items-center justify-center gap-0.5 mt-2">
              <Star
                v-for="i in 5"
                :key="i"
                :class="['w-5 h-5', i <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200']"
              />
            </div>
            <div class="text-sm text-slate-500 mt-1">{{ reviews.length }} ta sharh</div>
          </div>

          <!-- Distribution -->
          <div class="flex-1 w-full space-y-1.5">
            <div
              v-for="(count, idx) in ratingDistribution"
              :key="idx"
              class="flex items-center gap-3"
            >
              <span class="text-xs text-slate-500 w-6 text-right">{{ 5 - idx }}</span>
              <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
              <div class="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  class="bg-amber-400 h-2 rounded-full transition-all"
                  :style="{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }"
                />
              </div>
              <span class="text-xs text-slate-500 w-6">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="reviews.length === 0"
        title="Hali sharh yo'q"
        description="Mijozlar xizmatdan keyin sharh qoldirishadi"
      >
        <template #icon>
          <MessageSquare class="w-8 h-8 text-slate-400" />
        </template>
      </EmptyState>

      <!-- Reviews list -->
      <div v-else class="space-y-3">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
                M
              </div>
              <div>
                <p class="text-sm font-medium text-slate-700">Mijoz</p>
                <p class="text-xs text-slate-400">{{ formatDate(review.createdAt) }}</p>
              </div>
            </div>

            <!-- Stars -->
            <div class="flex items-center gap-0.5">
              <Star
                v-for="i in 5"
                :key="i"
                :class="['w-4 h-4', i <= review.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200']"
              />
            </div>
          </div>

          <p v-if="review.comment" class="text-sm text-slate-600 leading-relaxed">
            "{{ review.comment }}"
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
