<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  CalendarCheck,
  Scissors,
  Users,
  Building2,
  Star,
  X,
  Clock,
  ShieldCheck,
  AlarmClock,
  ClipboardList,
  UserCircle2,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const businessNavItems = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Navbatlar', to: '/bookings', icon: CalendarCheck },
  { name: 'Xizmatlar', to: '/services', icon: Scissors },
  { name: 'Xodimlar', to: '/staff', icon: Users },
  { name: 'Ish soatlari', to: '/hours', icon: AlarmClock },
  { name: 'Biznesim', to: '/business', icon: Building2 },
  { name: 'Sharhlar', to: '/reviews', icon: Star },
]

const staffNavItems = [
  { name: 'Mening portalim', to: '/staff-portal', icon: UserCircle2 },
]

const adminNavItems = [
  { name: 'Admin Panel', to: '/admin', icon: ShieldCheck, badge: null as null | (() => number) },
  { name: 'Foydalanuvchilar', to: '/admin/users', icon: Users, badge: null },
  {
    name: 'Bizneslar',
    to: '/admin/businesses',
    icon: Building2,
    badge: () => adminStore.pendingReviewCount,
  },
  { name: 'Audit Log', to: '/admin/audit', icon: ClipboardList, badge: null },
]

function isActive(path: string) {
  if (path === '/' || path === '/admin') return route.path === path
  return route.path.startsWith(path)
}

onMounted(() => {
  if (authStore.isAdmin) {
    adminStore.fetchBusinesses()
  }
})
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Clock class="w-4 h-4 text-white" />
        </div>
        <span class="text-white font-semibold text-lg tracking-tight">OnTime</span>
      </div>
      <button
        aria-label="Yopish"
        class="lg:hidden text-slate-400 hover:text-white transition-colors"
        @click="$emit('close')"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <!-- Admin navigation -->
      <template v-if="authStore.isAdmin">
        <div class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Admin</div>
        <RouterLink
          v-for="item in adminNavItems"
          :key="item.to"
          :to="item.to"
          @click="$emit('close')"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive(item.to)
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="flex-1">{{ item.name }}</span>
          <span
            v-if="item.badge && item.badge() > 0"
            class="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {{ item.badge() }}
          </span>
        </RouterLink>
      </template>

      <!-- Staff portal navigation -->
      <template v-else-if="authStore.isStaff && !authStore.isBusinessOwner">
        <div class="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Xodim</div>
        <RouterLink
          v-for="item in staffNavItems"
          :key="item.to"
          :to="item.to"
          @click="$emit('close')"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive(item.to)
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.name }}
        </RouterLink>
      </template>

      <!-- Business owner / manager navigation -->
      <template v-else>
        <RouterLink
          v-for="item in businessNavItems"
          :key="item.to"
          :to="item.to"
          @click="$emit('close')"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive(item.to)
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800',
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.name }}
        </RouterLink>
      </template>
    </nav>

    <!-- Footer -->
    <div class="px-3 py-3 border-t border-slate-700/50">
      <div class="px-3 py-2 text-xs text-slate-500">
        Business Management v1.0
      </div>
    </div>
  </aside>
</template>
