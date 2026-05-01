<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBusinessStore } from '@/stores/business'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import TrialBanner from '@/components/common/TrialBanner.vue'

const businessStore = useBusinessStore()
const sidebarOpen = ref(false)

onMounted(() => {
  businessStore.fetchMyBusiness()
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
        <RouterView />
      </main>
    </div>
  </div>
</template>
