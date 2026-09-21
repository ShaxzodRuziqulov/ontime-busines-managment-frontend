<template>
  <nav
      class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
  >
    <div
        class="grid h-20 items-center pb-6"
        :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }"
    >
      <RouterLink
          v-for="item in mainItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
          :class="isActive(item.to) ? 'text-primary-600' : 'text-slate-400'"
      >
        <component
            :is="item.icon"
            class="w-5 h-5"
            :class="isActive(item.to) ? 'text-primary-600' : 'text-slate-400'"
        />
        <span class="leading-none">{{ item.label }}</span>
      </RouterLink>

      <button
          v-if="showMore"
          type="button"
          class="flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
          :class="moreOpen || isMoreActive ? 'text-primary-600' : 'text-slate-400'"
          @click="moreOpen = !moreOpen"
      >
        <MoreHorizontal
            class="w-5 h-5"
            :class="moreOpen || isMoreActive ? 'text-primary-600' : 'text-slate-400'"
        />
        <span class="leading-none">Yana</span>
      </button>
    </div>

    <div
        v-if="moreOpen"
        class="fixed inset-0 z-10 transition-all duration-300 bg-black/30"
        @click="moreOpen = false"
    />

    <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
    >
      <div
          v-if="moreOpen"
          class="absolute bottom-20 z-20 inset-x-0 max-h-[70vh] overflow-y-auto bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] rounded-t-2xl"
      >
        <RouterLink
            v-for="item in moreItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
            active-class="text-primary-600 bg-primary-50"
            @click="moreOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </RouterLink>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  ShieldCheck,
  Users,
  Building2,
  ClipboardList,
  HelpCircle,
  MoreHorizontal,
  LifeBuoy,
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Briefcase,
  UserRound,
  AlarmClock,
  Star,
  House, Clock, CircleHelp,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const moreOpen = ref(false)

interface NavItem {
  label: string
  to: string
  icon: any
}

/* ------------------------------------------------------------- Admin */
const adminMain: NavItem[] = [
  { label: 'Boshqaruv', to: '/admin', icon: ShieldCheck },
  { label: 'Foydalanuvchilar', to: '/admin/users', icon: Users },
  { label: 'Bizneslar', to: '/admin/businesses', icon: Building2 },
  { label: 'Audit', to: '/admin/audit', icon: ClipboardList },
  { label: 'Support', to: '/admin/support', icon: LifeBuoy },

]
const adminMore: NavItem[] = [
  // { label: 'Yordam', to: '/help', icon: HelpCircle },
]

/* ---------------------------------------------------------- Business */
const businessMain: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Navbatlar', to: '/bookings', icon: CalendarCheck },
  { label: 'Jadval', to: '/schedule', icon: CalendarDays },
  { label: 'Xizmatlar', to: '/services', icon: Briefcase },
]
const businessMore: NavItem[] = [
  { label: 'Xodimlar', to: '/staff', icon: Users },
  { label: 'Mijozlar', to: '/customers', icon: UserRound },
  { label: 'Ish vaqti', to: '/hours', icon: AlarmClock },
  { label: 'Biznesim', to: '/business', icon: Building2 },
  { label: 'Sharhlar', to: '/reviews', icon: Star },
  { label: 'Yordam', to: '/help', icon: CircleHelp },
]

/* ------------------------------------------------------------- Staff */
const staffMain: NavItem[] = [
  { label: 'Bosh sahifa', to: '/staff-portal', icon: House },
  { label: 'Jadval', to: '/staff-portal/schedule', icon: CalendarDays },
  { label: 'Yordam', to: '/help', icon: CircleHelp },

]
const staffMore: NavItem[] = []

/* ------------------------------------------------------ Rolga qarab tanlash */
const mainItems = computed<NavItem[]>(() => {
  if (authStore.isAdmin) return adminMain
  if (authStore.isStaff && !authStore.canManageBusiness) return staffMain
  return businessMain
})

const moreItems = computed<NavItem[]>(() => {
  if (authStore.isAdmin) return adminMore
  if (authStore.isStaff && !authStore.canManageBusiness) return staffMore
  return businessMore
})

const showMore = computed(() => moreItems.value.length > 0)

// Ustunlar soni: asosiy bandlar + ("Yana" bo'lsa 1 ta qo'shiladi)
// 5 tadan oshsa ham grid 5 ustunda qoladi — bottom nav uchun UX chegarasi
const columnCount = computed(() =>
    Math.min(mainItems.value.length + (showMore.value ? 1 : 0), 5)
)

const isMoreActive = computed(() =>
    moreItems.value.some((item) => isActive(item.to))
)

function isActive(path: string) {
  if (path === '/' || path === '/admin' || path === '/staff-portal') {
    return route.path === path
  }
  return route.path.startsWith(path)
}
</script>