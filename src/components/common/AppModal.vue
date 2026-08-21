<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm"
        @click="$emit('close')"
      />
      <div
        :class="[
          'relative bg-white rounded-2xl shadow-2xl w-full z-10 flex flex-col max-h-[90vh]',
          size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg',
        ]"
      >
        <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 flex-shrink-0">
          <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
          <button
            class="p-1 border border-gray-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="$emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="px-3 py-2 overflow-y-auto">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  title: string
  size?: 'sm' | 'md' | 'lg'
}>()

defineEmits<{ close: [] }>()
</script>