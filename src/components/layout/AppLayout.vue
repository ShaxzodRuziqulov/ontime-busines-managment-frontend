<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBusinessStore } from '@/stores/business'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import TrialBanner from '@/components/common/TrialBanner.vue'

const businessStore = useBusinessStore()
const sidebarOpen = ref(false)
// Har bir sahifa businessStore.business'ni o'z holicha (mount vaqtida) o'qiydi.
// Agar RouterView business hali yuklanmasdan turib render bo'lsa, o'sha sahifa
// businessId'siz so'rov yuborib bo'sh/xato natija olardi — shu poyga holatini
// (race condition) oldini olish uchun birinchi yuklanish tugaguncha kutamiz.
const ready = ref(false)

onMounted(async () => {
  await businessStore.fetchMyBusiness()
  ready.value = true
})
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <!-- Trial/Expired Banner -->
      <TrialBanner />

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="!ready" class="flex items-center justify-center h-full text-slate-400 text-sm">
          Yuklanmoqda...
        </div>
        <RouterView v-else />
      </main>
    </div>
  </div>
</template>
