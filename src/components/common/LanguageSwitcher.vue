<template>
  <div class="relative language-switcher">
    <button
      type="button"
      :aria-label="t('language.label')"
      :title="t('language.label')"
      class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors text-sm font-medium"
      @click="open = !open"
    >
      <Globe class="w-5 h-5" />
      <span class="hidden sm:inline">{{ currentLabel }}</span>
      <ChevronDown class="w-3.5 h-3.5 opacity-70" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50"
    >
      <button
        v-for="loc in SUPPORTED_LOCALES"
        :key="loc.code"
        type="button"
        class="w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
        @click="select(loc.code)"
      >
        <span>{{ loc.label }}</span>
        <Check v-if="loc.code === locale" class="w-4 h-4 text-primary-600" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Globe, ChevronDown, Check } from 'lucide-vue-next'
import { SUPPORTED_LOCALES, setLocale, type SupportedLocale } from '@/i18n'

const { t, locale } = useI18n()
const open = ref(false)

const currentLabel = computed(() => {
  const code = locale.value as SupportedLocale
  if (code === 'uz-Cyrl') return 'ЎЗ'
  return code.toUpperCase()
})

function select(code: SupportedLocale) {
  setLocale(code)
  open.value = false
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.language-switcher')) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>
