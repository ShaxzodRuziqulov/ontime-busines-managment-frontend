<script setup lang="ts">
import { PackageOpen } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <slot name="icon">
        <PackageOpen class="w-8 h-8 text-slate-400" />
      </slot>
    </div>
    <h3 class="text-base font-semibold text-slate-700 mb-1">{{ title }}</h3>
    <p v-if="description" class="text-sm text-slate-500 max-w-xs">{{ description }}</p>
    <div class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
