<script setup lang="ts">
import { AlertTriangle, Clock } from 'lucide-vue-next'
import { useBusinessStore } from '@/stores/business'

const businessStore = useBusinessStore()
</script>

<template>
  <!-- Expired Banner -->
  <div
    v-if="businessStore.business?.status === 'EXPIRED'"
    class="bg-red-600 text-white px-6 py-3 flex items-center gap-3 flex-shrink-0"
  >
    <AlertTriangle class="w-5 h-5 flex-shrink-0" />
    <p class="text-sm font-medium">
      Sinov muddat tugagan. Xizmatlar cheklangan. Obuna sotib oling!
    </p>
  </div>

  <!-- Trial Banner -->
  <div
    v-else-if="businessStore.business?.status === 'TRIAL' && businessStore.trialDaysLeft <= 5"
    class="bg-amber-500 text-white px-6 py-3 flex items-center gap-3 flex-shrink-0"
  >
    <Clock class="w-5 h-5 flex-shrink-0" />
    <p class="text-sm font-medium">
      Sinov davridan
      <strong>{{ businessStore.trialDaysLeft }} kun</strong> qoldi.
    </p>
  </div>
</template>
