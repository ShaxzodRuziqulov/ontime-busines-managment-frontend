<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'light' | 'dark'
  showText?: boolean
}>(), {
  label: 'OnTime Business',
  size: 'md',
  tone: 'light',
  showText: true,
})

const sizes = {
  sm: {
    mark: 'w-8 h-8 rounded-lg',
    text: 'text-lg',
  },
  md: {
    mark: 'w-10 h-10 rounded-xl',
    text: 'text-xl',
  },
  lg: {
    mark: 'w-12 h-12 rounded-2xl',
    text: 'text-2xl',
  },
}
</script>

<template>
  <div class="flex items-center gap-2.5">
    <span
      :class="[
        'inline-flex flex-shrink-0 items-center justify-center overflow-hidden shadow-lg shadow-primary-900/20',
        sizes[props.size].mark,
      ]"
    >
      <img
        src="/app-logo.png"
        alt=""
        class="h-full w-full object-cover"
        aria-hidden="true"
      />
    </span>
    <span
      v-if="props.showText"
      :class="[
        'font-bold tracking-tight',
        sizes[props.size].text,
        props.tone === 'dark' ? 'text-slate-900' : 'text-white',
      ]"
    >
      {{ props.label }}
    </span>
  </div>
</template>
