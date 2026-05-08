<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Users, Building2, TrendingUp, ShieldCheck,
  CheckCircle2, Clock, XCircle, AlertCircle, PauseCircle, FileEdit,
  ArrowRight, UserX,
} from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { businessesApi } from '@/api/businesses'
import { useAdminStore } from '@/stores/admin'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import MiniBarChart from '@/components/common/MiniBarChart.vue'
import type { User, Business, BusinessStatus } from '@/types'

const adminStore = useAdminStore()

const users = ref<User[]>([])
const businesses = ref<Business[]>([])
const loading = ref(true)

const businessOwners = computed(() => users.value.filter(u => u.businessOwner))
const regularUsers = computed(() => users.value.filter(u => !u.businessOwner && !u.roles?.includes('ROLE_ADMIN')))
const adminUsers = computed(() => users.value.filter(u => u.roles?.includes('ROLE_ADMIN')))
const inactiveUsers = computed(() => users.value.filter(u => !u.active))

const byStatus = computed(() => {
  const map: Record<string, number> = {}
  for (const b of businesses.value) map[b.status] = (map[b.status] ?? 0) + 1
  return map
})

interface StatusCard {
  label: string; value: number; color: string; textColor: string; icon: any; status: BusinessStatus
}

const statusCards = computed<StatusCard[]>(() => [
  { label: 'Faol', value: byStatus.value['ACTIVE'] ?? 0, color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2, status: 'ACTIVE' },
  { label: 'Sinov', value: byStatus.value['TRIAL'] ?? 0, color: 'bg-amber-50', textColor: 'text-amber-600', icon: Clock, status: 'TRIAL' },
  { label: "Muddati o'tgan", value: byStatus.value['EXPIRED'] ?? 0, color: 'bg-red-50', textColor: 'text-red-600', icon: XCircle, status: 'EXPIRED' },
  { label: "To'xtatilgan", value: byStatus.value['SUSPENDED'] ?? 0, color: 'bg-slate-50', textColor: 'text-slate-500', icon: PauseCircle, status: 'SUSPENDED' },
  { label: 'Qoralama', value: byStatus.value['DRAFT'] ?? 0, color: 'bg-blue-50', textColor: 'text-blue-600', icon: FileEdit, status: 'DRAFT' },
  { label: 'Tekshiruvda', value: byStatus.value['PENDING_REVIEW'] ?? 0, color: 'bg-violet-50', textColor: 'text-violet-600', icon: AlertCircle, status: 'PENDING_REVIEW' },
])

const pendingReviewList = computed(() =>
  businesses.value.filter(b => b.status === 'PENDING_REVIEW').slice(0, 5)
)

const recentBusinesses = computed(() =>
  [...businesses.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
)

// Last 7 days registration chart
const registrationChart = computed(() => {
  const days: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    const value = users.value.filter(u => u.createdAt?.slice(0, 10) === key).length
    days.push({ label, value })
  }
  return days
})

const businessChart = computed(() => {
  const days: { label: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    const value = businesses.value.filter(b => b.createdAt?.slice(0, 10) === key).length
    days.push({ label, value })
  }
  return days
})

function statusColor(status: BusinessStatus) {
  const map: Record<BusinessStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    TRIAL: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-slate-100 text-slate-600',
    DRAFT: 'bg-blue-100 text-blue-700',
    PENDING_REVIEW: 'bg-violet-100 text-violet-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

const statusLabels: Record<BusinessStatus, string> = {
  TRIAL: 'Sinov', ACTIVE: 'Faol', EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan", DRAFT: 'Qoralama', PENDING_REVIEW: 'Tekshiruvda',
}

onMounted(async () => {
  try {
    const [u, b] = await Promise.allSettled([usersApi.getAll(), businessesApi.getAll()])
    if (u.status === 'fulfilled') users.value = u.value.data
    if (b.status === 'fulfilled') {
      businesses.value = b.value.data
      adminStore.markLoaded(b.value.data.map(biz => ({ id: biz.id, status: biz.status })))
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
      <p class="text-slate-500 text-sm mt-1">Tizimning umumiy ko'rinishi</p>
    </div>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div v-for="i in 4" :key="i" class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 animate-pulse">
          <div class="h-3 bg-slate-200 rounded w-2/3 mb-4" />
          <div class="h-7 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
      <SkeletonTable :rows="4" :cols="4" />
    </template>

    <template v-else>
      <!-- User stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in [
            { label: 'Jami foydalanuvchilar', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
            { label: 'Biznes egalari', value: businessOwners.length, icon: Building2, color: 'bg-violet-50 text-violet-600' },
            { label: 'Oddiy foydalanuvchilar', value: regularUsers.length, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Adminlar', value: adminUsers.length, icon: ShieldCheck, color: 'bg-red-50 text-red-600' },
          ]"
          :key="stat.label"
          class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ stat.label }}</span>
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', stat.color]">
              <component :is="stat.icon" class="w-5 h-5" />
            </div>
          </div>
          <div class="text-2xl font-bold text-slate-800">{{ stat.value }}</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- User registrations chart -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-slate-800 text-sm">Ro'yxatdan o'tish</h3>
              <p class="text-xs text-slate-400 mt-0.5">Oxirgi 7 kun</p>
            </div>
            <RouterLink to="/admin/users" class="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ko'rish <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>
          <MiniBarChart :data="registrationChart" color="#6366f1" :height="80" />
        </div>

        <!-- Business registrations chart -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-slate-800 text-sm">Yangi bizneslar</h3>
              <p class="text-xs text-slate-400 mt-0.5">Oxirgi 7 kun</p>
            </div>
            <RouterLink to="/admin/businesses" class="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ko'rish <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>
          <MiniBarChart :data="businessChart" color="#10b981" :height="80" />
        </div>
      </div>

      <!-- Inactive users warning -->
      <div
        v-if="inactiveUsers.length > 0"
        class="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4"
      >
        <UserX class="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p class="text-sm text-amber-700">
          <span class="font-semibold">{{ inactiveUsers.length }} ta foydalanuvchi</span> bloklangan holda.
        </p>
        <RouterLink to="/admin/users" class="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1 whitespace-nowrap">
          Ko'rish <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>

      <!-- Business status breakdown -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-slate-800">Bizneslar holati</h2>
            <p class="text-xs text-slate-500 mt-0.5">Jami: {{ businesses.length }} ta biznes</p>
          </div>
          <RouterLink to="/admin/businesses" class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Barchasi <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
        <div class="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <RouterLink
            v-for="card in statusCards" :key="card.status"
            to="/admin/businesses"
            class="rounded-xl p-4 text-center border border-slate-100 hover:shadow-sm transition-all hover:-translate-y-0.5"
            :class="card.color"
          >
            <component :is="card.icon" :class="['w-5 h-5 mx-auto mb-2', card.textColor]" />
            <div class="text-2xl font-bold" :class="card.textColor">{{ card.value }}</div>
            <div class="text-xs mt-1 text-slate-500">{{ card.label }}</div>
          </RouterLink>
        </div>
      </div>

      <!-- Pending review alert -->
      <div v-if="pendingReviewList.length > 0" class="bg-white rounded-2xl border border-violet-200 shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-violet-100 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-violet-500" />
          <h2 class="font-semibold text-slate-800">Tekshiruvni kutayotgan bizneslar</h2>
          <span class="ml-auto px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
            {{ pendingReviewList.length }}
          </span>
        </div>
        <div class="divide-y divide-slate-50">
          <div
            v-for="biz in pendingReviewList" :key="biz.id"
            class="px-6 py-3 flex items-center gap-3 hover:bg-slate-50/50"
          >
            <div class="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 class="w-4 h-4 text-violet-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">{{ biz.name }}</p>
              <p class="text-xs text-slate-400 truncate">{{ biz.city || biz.addressLine || '—' }}</p>
            </div>
            <RouterLink
              :to="`/admin/businesses/${biz.id}`"
              class="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1 whitespace-nowrap"
            >
              Batafsil <ArrowRight class="w-3 h-3" />
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent businesses table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="font-semibold text-slate-800">So'nggi bizneslar</h2>
          <RouterLink to="/admin/businesses" class="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            Barchasini ko'rish <ArrowRight class="w-3.5 h-3.5" />
          </RouterLink>
        </div>

        <div v-if="recentBusinesses.length === 0" class="px-6 py-10 text-center text-slate-500 text-sm">
          Biznes yo'q
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                <th class="px-6 py-3 text-left font-medium">Biznes nomi</th>
                <th class="px-6 py-3 text-left font-medium">Shahar</th>
                <th class="px-6 py-3 text-left font-medium">Holat</th>
                <th class="px-6 py-3 text-left font-medium">Yaratilgan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in recentBusinesses" :key="biz.id"
                class="hover:bg-slate-50/50 transition-colors cursor-pointer"
                @click="$router.push(`/admin/businesses/${biz.id}`)"
              >
                <td class="px-6 py-3 font-medium text-slate-800">{{ biz.name }}</td>
                <td class="px-6 py-3 text-slate-500">{{ biz.city || biz.addressLine || '—' }}</td>
                <td class="px-6 py-3">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', statusColor(biz.status)]">
                    {{ statusLabels[biz.status] }}
                  </span>
                </td>
                <td class="px-6 py-3 text-slate-500 text-xs">
                  {{ new Date(biz.createdAt).toLocaleDateString('uz-UZ') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
