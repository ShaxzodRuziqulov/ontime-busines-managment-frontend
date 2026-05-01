<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' }>()
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <div
      :class="[
        'animate-spin rounded-full border-2 border-slate-200 border-t-primary-600',
        size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8',
      ]"
    />
  </div>
</template>
