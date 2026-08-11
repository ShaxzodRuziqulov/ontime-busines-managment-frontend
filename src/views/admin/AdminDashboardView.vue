<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users, Building2, ShieldCheck, CheckCircle2, Clock, XCircle, AlertCircle,
  PauseCircle, FileEdit, ArrowRight, UserX, TimerReset, Search, ClipboardList,
} from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { businessesApi } from '@/api/businesses'
import { useAdminStore } from '@/stores/admin'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import { businessStatusLabels, businessStatusColor } from '@/utils/businessStatus'
import type { User, Business, BusinessStatus } from '@/types'

const adminStore = useAdminStore()
const router = useRouter()

const users = ref<User[]>([])
const businesses = ref<Business[]>([])
const statusCounts = ref<Record<string, number>>({})
const loading = ref(true)

const businessOwners = computed(() => users.value.filter(u => u.businessOwner))
const adminUsers = computed(() => users.value.filter(u => u.roles?.includes('ROLE_ADMIN')))
const inactiveUsers = computed(() => users.value.filter(u => !u.active))
const pendingReviewCount = computed(() => statusCounts.value.PENDING_REVIEW ?? 0)

const totalBusinesses = computed(() =>
  Object.values(statusCounts.value).reduce((sum, count) => sum + count, 0)
)

interface StatusCard {
  label: string
  value: number
  color: string
  textColor: string
  icon: any
  status: BusinessStatus
}

const statusCards = computed<StatusCard[]>(() => [
  { label: 'Faol', value: statusCounts.value.ACTIVE ?? 0, color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2, status: 'ACTIVE' },
  { label: 'Sinov', value: statusCounts.value.TRIAL ?? 0, color: 'bg-amber-50', textColor: 'text-amber-600', icon: Clock, status: 'TRIAL' },
  { label: "Muddati o'tgan", value: statusCounts.value.EXPIRED ?? 0, color: 'bg-red-50', textColor: 'text-red-600', icon: XCircle, status: 'EXPIRED' },
  { label: "To'xtatilgan", value: statusCounts.value.SUSPENDED ?? 0, color: 'bg-slate-50', textColor: 'text-slate-500', icon: PauseCircle, status: 'SUSPENDED' },
  { label: 'Qoralama', value: statusCounts.value.DRAFT ?? 0, color: 'bg-blue-50', textColor: 'text-blue-600', icon: FileEdit, status: 'DRAFT' },
  { label: 'Tekshiruvda', value: pendingReviewCount.value, color: 'bg-violet-50', textColor: 'text-violet-600', icon: AlertCircle, status: 'PENDING_REVIEW' },
])

const pendingReviewList = computed(() =>
  businesses.value.filter(b => b.status === 'PENDING_REVIEW').slice(0, 5)
)

const trialsEndingSoon = computed(() => {
  const now = Date.now()
  const in3Days = now + 3 * 24 * 60 * 60 * 1000
  return businesses.value
    .filter(b => b.status === 'TRIAL' && b.trialEndDate && new Date(b.trialEndDate).getTime() <= in3Days)
    .sort((a, b) => new Date(a.trialEndDate!).getTime() - new Date(b.trialEndDate!).getTime())
    .slice(0, 5)
})

const recentBusinesses = computed(() =>
  [...businesses.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
)

const priorityItems = computed(() => [
  {
    label: 'Tekshiruv kutmoqda',
    value: pendingReviewCount.value,
    icon: ClipboardList,
    to: { name: 'admin-businesses', query: { status: 'PENDING_REVIEW' } },
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    label: 'Trial tugayapti',
    value: trialsEndingSoon.value.length,
    icon: TimerReset,
    to: { name: 'admin-businesses', query: { status: 'TRIAL' } },
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    label: 'Bloklangan foydalanuvchi',
    value: inactiveUsers.value.length,
    icon: UserX,
    to: { name: 'admin-users' },
    tone: 'bg-red-50 text-red-700 border-red-200',
  },
])

function trialDaysLeft(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function businessLocation(biz: Business) {
  return biz.city || biz.addressLine || 'Manzil kiritilmagan'
}

const statusColor = businessStatusColor
const statusLabels = businessStatusLabels

onMounted(async () => {
  try {
    const [u, recent, pending, trial, counts] = await Promise.allSettled([
      usersApi.getAll(),
      businessesApi.getAll({ size: 6, sort: 'createdAt,desc' }),
      businessesApi.getAll({ size: 5, status: 'PENDING_REVIEW', sort: 'createdAt,desc' }),
      businessesApi.getAll({ size: 20, status: 'TRIAL', sort: 'trialEndDate,asc' }),
      businessesApi.statusCounts(),
    ])
    if (u.status === 'fulfilled') users.value = u.value.data
    if (counts.status === 'fulfilled') {
      statusCounts.value = counts.value.data
      adminStore.setCounts(counts.value.data)
    }

    const map = new Map<string, Business>()
    if (recent.status === 'fulfilled') recent.value.data.content.forEach((biz) => map.set(biz.id, biz))
    if (pending.status === 'fulfilled') pending.value.data.content.forEach((biz) => map.set(biz.id, biz))
    if (trial.status === 'fulfilled') trial.value.data.content.forEach((biz) => map.set(biz.id, biz))
    businesses.value = [...map.values()]
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Admin Panel</h1>
        <p class="mt-1 text-sm text-slate-500">Tekshiruv, biznes statuslari va foydalanuvchilar nazorati.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        @click="router.push('/admin/businesses')"
      >
        <Search class="h-4 w-4" />
        Biznes qidirish
      </button>
    </div>

    <template v-if="loading">
      <div class="grid gap-4 md:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />
      </div>
      <SkeletonTable :rows="4" :cols="4" />
    </template>

    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <RouterLink
          v-for="item in priorityItems"
          :key="item.label"
          :to="item.to"
          :class="['rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm', item.tone]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold">{{ item.label }}</p>
              <p class="mt-2 text-3xl font-bold">{{ item.value }}</p>
            </div>
            <component :is="item.icon" class="h-6 w-6" />
          </div>
        </RouterLink>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Foydalanuvchilar</span>
            <Users class="h-5 w-5 text-blue-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">{{ users.length }}</div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Bizneslar</span>
            <Building2 class="h-5 w-5 text-emerald-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">{{ totalBusinesses }}</div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Biznes egalari</span>
            <Building2 class="h-5 w-5 text-violet-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">{{ businessOwners.length }}</div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Adminlar</span>
            <ShieldCheck class="h-5 w-5 text-slate-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">{{ adminUsers.length }}</div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 class="font-semibold text-slate-800">Bizneslar holati</h2>
            <p class="mt-0.5 text-xs text-slate-500">Kartani bosish ro'yxatni shu status bo'yicha ochadi.</p>
          </div>
          <RouterLink to="/admin/businesses" class="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Barchasi <ArrowRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
        <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <RouterLink
            v-for="card in statusCards"
            :key="card.status"
            :to="{ name: 'admin-businesses', query: { status: card.status } }"
            class="rounded-xl border border-slate-100 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
            :class="card.color"
          >
            <component :is="card.icon" :class="['mb-3 h-5 w-5', card.textColor]" />
            <div class="text-2xl font-bold" :class="card.textColor">{{ card.value }}</div>
            <div class="mt-1 text-xs font-medium text-slate-600">{{ card.label }}</div>
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div class="rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-violet-100 px-5 py-4">
            <h2 class="font-semibold text-slate-800">Tekshiruv kutayotgan bizneslar</h2>
            <RouterLink :to="{ name: 'admin-businesses', query: { status: 'PENDING_REVIEW' } }" class="text-sm font-semibold text-violet-600 hover:text-violet-700">
              Ko'rish
            </RouterLink>
          </div>
          <div v-if="pendingReviewList.length === 0" class="px-5 py-10 text-center text-sm text-slate-500">
            Tekshiruv kutayotgan biznes yo'q
          </div>
          <div v-else class="divide-y divide-slate-50">
            <button
              v-for="biz in pendingReviewList"
              :key="biz.id"
              type="button"
              class="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
              @click="router.push(`/admin/businesses/${biz.id}`)"
            >
              <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Building2 class="h-4 w-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-800">{{ biz.name }}</p>
                <p class="truncate text-xs text-slate-500">{{ businessLocation(biz) }}</p>
              </div>
              <ArrowRight class="h-4 w-4 flex-shrink-0 text-slate-300" />
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-amber-100 px-5 py-4">
            <h2 class="font-semibold text-slate-800">Trial muddati tugayotganlar</h2>
            <RouterLink :to="{ name: 'admin-businesses', query: { status: 'TRIAL' } }" class="text-sm font-semibold text-amber-600 hover:text-amber-700">
              Ko'rish
            </RouterLink>
          </div>
          <div v-if="trialsEndingSoon.length === 0" class="px-5 py-10 text-center text-sm text-slate-500">
            Yaqin 3 kunda tugaydigan trial yo'q
          </div>
          <div v-else class="divide-y divide-slate-50">
            <button
              v-for="biz in trialsEndingSoon"
              :key="biz.id"
              type="button"
              class="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50"
              @click="router.push(`/admin/businesses/${biz.id}`)"
            >
              <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TimerReset class="h-4 w-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-800">{{ biz.name }}</p>
                <p class="truncate text-xs text-slate-500">{{ businessLocation(biz) }}</p>
              </div>
              <span class="whitespace-nowrap text-xs font-semibold text-amber-600">{{ trialDaysLeft(biz.trialEndDate!) }} kun</span>
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-800">So'nggi bizneslar</h2>
          <RouterLink to="/admin/businesses" class="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Barchasi <ArrowRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>

        <div v-if="recentBusinesses.length === 0" class="px-5 py-10 text-center text-sm text-slate-500">
          Biznes yo'q
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th class="px-5 py-3 text-left font-medium">Biznes</th>
                <th class="px-5 py-3 text-left font-medium">Manzil</th>
                <th class="px-5 py-3 text-left font-medium">Holat</th>
                <th class="px-5 py-3 text-left font-medium">Yaratilgan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in recentBusinesses"
                :key="biz.id"
                class="cursor-pointer transition hover:bg-slate-50"
                @click="router.push(`/admin/businesses/${biz.id}`)"
              >
                <td class="px-5 py-3 font-semibold text-slate-800">{{ biz.name }}</td>
                <td class="px-5 py-3 text-slate-500">{{ businessLocation(biz) }}</td>
                <td class="px-5 py-3">
                  <span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusColor(biz.status)]">
                    {{ statusLabels[biz.status] }}
                  </span>
                </td>
                <td class="px-5 py-3 text-xs text-slate-500">
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
