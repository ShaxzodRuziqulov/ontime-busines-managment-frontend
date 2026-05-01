<script setup lang="ts">
defineProps<{ rows?: number; cols?: number }>()
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
    <!-- Header -->
    <div class="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex gap-4">
      <div v-for="i in (cols ?? 5)" :key="i" class="h-3 bg-slate-200 rounded-lg flex-1" />
    </div>
    <!-- Rows -->
    <div class="divide-y divide-slate-50">
      <div
        v-for="r in (rows ?? 5)"
        :key="r"
        class="px-5 py-4 flex gap-4 items-center"
      >
        <div v-for="c in (cols ?? 5)" :key="c" :class="['h-3 rounded-lg flex-1', c === 1 ? 'bg-slate-200' : 'bg-slate-100']" />
      </div>
    </div>
  </div>
</template>
