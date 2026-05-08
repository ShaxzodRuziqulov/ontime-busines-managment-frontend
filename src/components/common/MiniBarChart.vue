<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: { label: string; value: number }[]
  height?: number
  color?: string
}>()

const H = computed(() => props.height ?? 80)
const BAR_W = 20
const GAP = 8
const total = computed(() => props.data.length)
const width = computed(() => total.value * (BAR_W + GAP) - GAP)
const maxVal = computed(() => Math.max(...props.data.map(d => d.value), 1))

const bars = computed(() =>
  props.data.map((d, i) => {
    const barH = Math.max((d.value / maxVal.value) * H.value, d.value > 0 ? 4 : 0)
    return {
      ...d,
      x: i * (BAR_W + GAP),
      y: H.value - barH,
      h: barH,
    }
  })
)

const fill = computed(() => props.color ?? '#6366f1')
</script>

<template>
  <div class="overflow-x-auto">
    <svg
      :width="width"
      :height="H + 20"
      class="overflow-visible"
    >
      <!-- Bars -->
      <g v-for="bar in bars" :key="bar.label">
        <rect
          :x="bar.x"
          :y="bar.y"
          :width="BAR_W"
          :height="bar.h"
          :fill="fill"
          rx="4"
          class="transition-all duration-300"
          opacity="0.85"
        />
        <!-- Value label on hover via title -->
        <title>{{ bar.label }}: {{ bar.value }}</title>
        <!-- Bottom label -->
        <text
          :x="bar.x + BAR_W / 2"
          :y="H + 14"
          text-anchor="middle"
          class="text-[9px]"
          font-size="9"
          fill="#94a3b8"
        >{{ bar.label }}</text>
      </g>
    </svg>
  </div>
</template>
