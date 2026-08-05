<script setup lang="ts">
import { AlertTriangle, Clock } from 'lucide-vue-next'
import { useBusinessStore } from '@/stores/business'
import { useAuthStore } from '@/stores/auth'

const businessStore = useBusinessStore()
const authStore = useAuthStore()
</script>

<template>
  <!-- Expired / Read-only Banner: muddat o'tishi bilan darhol ko'rinadi
       (status hali TRIAL bo'lsa ham, accessAllowed=false bo'lsa) -->
  <div
    v-if="!authStore.isAdmin && businessStore.isReadOnly"
    class="bg-red-600 text-white px-6 py-3 flex items-center gap-3 flex-shrink-0"
  >
    <AlertTriangle class="w-5 h-5 flex-shrink-0" />
    <p class="text-sm font-medium">
      Sinov/obuna muddati tugagan. Faqat ko'rish mumkin — obuna sotib oling!
    </p>
  </div>

  <!-- Trial Banner: faqat hali funksional (accessAllowed=true) trial uchun -->
  <div
    v-else-if="!authStore.isAdmin && businessStore.isTrial && businessStore.trialDaysLeft <= 5"
    class="bg-amber-500 text-white px-6 py-3 flex items-center gap-3 flex-shrink-0"
  >
    <Clock class="w-5 h-5 flex-shrink-0" />
    <p class="text-sm font-medium">
      Sinov davridan
      <strong>{{ businessStore.trialDaysLeft }} kun</strong> qoldi.
    </p>
  </div>
</template>
