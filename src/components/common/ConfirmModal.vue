<script setup lang="ts">
import { AlertTriangle, Trash2, ShieldOff, ToggleLeft, ToggleRight } from 'lucide-vue-next'
import AppModal from './AppModal.vue'

const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'success'
  icon?: 'trash' | 'shield' | 'toggle-off' | 'toggle-on' | 'warning'
}>(), {
  confirmLabel: 'Tasdiqlash',
  cancelLabel: 'Bekor qilish',
  variant: 'danger',
  icon: 'warning',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const variantClasses: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700',
  warning: 'bg-amber-600 hover:bg-amber-700',
  success: 'bg-emerald-600 hover:bg-emerald-700',
}

const iconBgClasses: Record<string, string> = {
  danger: 'bg-red-100',
  warning: 'bg-amber-100',
  success: 'bg-emerald-100',
}

const iconColorClasses: Record<string, string> = {
  danger: 'text-red-600',
  warning: 'text-amber-600',
  success: 'text-emerald-600',
}
</script>

<template>
  <AppModal :title="title" size="sm" @close="emit('cancel')">
    <div class="flex flex-col items-center text-center gap-4 pb-2">
      <!-- Icon -->
      <div :class="['w-12 h-12 rounded-full flex items-center justify-center', iconBgClasses[variant]]">
        <Trash2 v-if="icon === 'trash'" :class="['w-5 h-5', iconColorClasses[variant]]" />
        <ShieldOff v-else-if="icon === 'shield'" :class="['w-5 h-5', iconColorClasses[variant]]" />
        <ToggleLeft v-else-if="icon === 'toggle-off'" :class="['w-5 h-5', iconColorClasses[variant]]" />
        <ToggleRight v-else-if="icon === 'toggle-on'" :class="['w-5 h-5', iconColorClasses[variant]]" />
        <AlertTriangle v-else :class="['w-5 h-5', iconColorClasses[variant]]" />
      </div>

      <!-- Message -->
      <p class="text-slate-600 text-sm leading-relaxed">{{ message }}</p>
    </div>

    <div class="flex gap-3 mt-4">
      <button
        class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        :class="['flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors', variantClasses[variant]]"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </AppModal>
</template>
