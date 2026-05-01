<script setup lang="ts">
defineProps<{
  lines?: number
  showAvatar?: boolean
}>()
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
    <div v-if="showAvatar" class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 bg-slate-200 rounded-2xl flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-slate-200 rounded-lg w-3/4" />
        <div class="h-3 bg-slate-100 rounded-lg w-1/2" />
      </div>
    </div>
    <template v-else>
      <div class="h-4 bg-slate-200 rounded-lg w-2/3 mb-3" />
    </template>
    <div class="space-y-2">
      <div
        v-for="i in (lines ?? 2)"
        :key="i"
        :class="['h-3 bg-slate-100 rounded-lg', i % 2 === 0 ? 'w-4/5' : 'w-full']"
      />
    </div>
  </div>
</template>
