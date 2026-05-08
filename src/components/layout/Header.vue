<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, LogOut, ChevronDown, User, Search } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useBusinessStore } from '@/stores/business'
import GlobalSearch from '@/components/common/GlobalSearch.vue'
import { mediaUrl } from '@/utils/media'

defineEmits<{ toggleSidebar: [] }>()

const router = useRouter()
const authStore = useAuthStore()
const businessStore = useBusinessStore()
const dropdownOpen = ref(false)
const searchOpen = ref(false)

function logout() {
  authStore.logout()
  router.push('/login')
}

const statusLabels: Record<string, string> = {
  TRIAL: 'Sinov davri',
  ACTIVE: 'Faol',
  EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan",
  DRAFT: 'Qoralama',
  PENDING_REVIEW: 'Moderatsiyada',
}

const statusColors: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_REVIEW: 'bg-blue-100 text-blue-700',
}

function getStatusLabel(status: string) {
  return statusLabels[status] || status
}

function getStatusColor(status: string) {
  return statusColors[status] || 'bg-slate-100 text-slate-600'
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (authStore.isAdmin) searchOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
    <!-- Left -->
    <div class="flex items-center gap-3">
      <button
        aria-label="Menyu"
        class="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        @click="$emit('toggleSidebar')"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Business badge (non-admin) -->
      <div v-if="!authStore.isAdmin && businessStore.business" class="flex items-center gap-2">
        <span class="font-semibold text-slate-800 text-sm hidden sm:block">
          {{ businessStore.business.name }}
        </span>
        <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(businessStore.business.status)]">
          {{ getStatusLabel(businessStore.business.status) }}
        </span>
      </div>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-2">
      <!-- Global search trigger (admin only) -->
      <button
        v-if="authStore.isAdmin"
        @click="searchOpen = true"
        class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors text-sm bg-white"
      >
        <Search class="w-4 h-4" />
        <span>Qidirish</span>
        <kbd class="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>
      <!-- Mobile search icon -->
      <button
        v-if="authStore.isAdmin"
        @click="searchOpen = true"
        class="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Search class="w-5 h-5" />
      </button>

      <!-- User dropdown -->
      <div class="relative">
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          @click="dropdownOpen = !dropdownOpen"
        >
          <div class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
            <img
              v-if="mediaUrl(authStore.user?.avatarUrl)"
              :src="mediaUrl(authStore.user?.avatarUrl)!"
              class="w-full h-full object-cover"
              alt="avatar"
            />
            <div v-else class="w-full h-full bg-primary-600 flex items-center justify-center">
              <User class="w-4 h-4 text-white" />
            </div>
          </div>
          <span class="text-sm font-medium text-slate-700 hidden sm:block">
            {{ authStore.user?.displayName || authStore.user?.login }}
          </span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>

        <div
          v-if="dropdownOpen"
          class="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50"
          @click.outside="dropdownOpen = false"
        >
          <button
            class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            @click="dropdownOpen = false; logout()"
          >
            <LogOut class="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Global Search -->
  <GlobalSearch v-if="searchOpen" @close="searchOpen = false" />
</template>
