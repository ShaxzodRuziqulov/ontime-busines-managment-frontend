<template>
  <div class="space-y-4 lg:p-0 p-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('adminDash.title') }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ t('adminDash.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        @click="router.push('/admin/businesses')"
      >
        <Search class="h-4 w-4" />
        {{ t('adminDash.searchBusiness') }}
      </button>
    </div>

    <template v-if="loading">
      <div class="grid grid-cols-3 gap-2 sm:gap-4">
        <div
            v-for="i in 3"
            :key="i"
            class="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white"
        />
      </div>
      <SkeletonTable :rows="4" :cols="4" />
    </template>

    <template v-else>
      <div class="grid gap-4 md:grid-cols-3">
        <RouterLink
          v-for="item in priorityItems"
          :key="item.label"
          :to="item.to"
          :class="[
              'rounded-2xl group relative border p-3 transition hover:-translate-y-0.5 hover:shadow-sm hover:z-20 sm:p-5',
               item.tone
               ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold leading-4 sm:text-sm">
                {{ item.label }}
              </p>
              <p class="mt-1.5 text-2xl font-bold sm:mt-2 sm:text-3xl">
                {{ item.value }}
              </p>
            </div>
            <component :is="item.icon" class="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
          </div>
          <div class="css-hover-tooltip opacity-0 invisible
                 group-hover:opacity-100
                 group-hover:visible">
            <span>{{ t('adminDash.goToPage') }}</span>
          </div>
        </RouterLink>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ t('adminDash.users') }}
            </span>
            <Users class="h-5 w-5 text-blue-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">
            {{ users.length }}
          </div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ t('adminDash.businesses') }}
            </span>
            <Building2 class="h-5 w-5 text-emerald-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">
            {{ totalBusinesses }}
          </div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ t('adminDash.owners') }}
            </span>
            <Building2 class="h-5 w-5 text-violet-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">
            {{ businessOwners.length }}
          </div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ t('adminDash.admins') }}
            </span>
            <ShieldCheck class="h-5 w-5 text-slate-600" />
          </div>
          <div class="mt-3 text-2xl font-bold text-slate-800">
            {{ adminUsers.length }}
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 class="font-semibold text-slate-800">
              {{ t('adminDash.businessStatus') }}
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ t('adminDash.businessStatusDesc') }}
            </p>
          </div>
          <RouterLink to="/admin/businesses" class="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            {{ t('adminDash.all') }}
            <ArrowRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
          <RouterLink
            v-for="card in statusCards"
            :key="card.status"
            :to="{ name: 'admin-businesses', query: { status: card.status } }"
            class="rounded-xl group relative border border-slate-100 p-3 transition hover:-translate-y-0.5 hover:shadow-sm hover:z-20 sm:p-4"
            :class="card.color"
          >
            <div class="flex items-center mb-2 gap-2">
              <component
                  :is="card.icon"
                  :class="['h-5 w-5', card.textColor]"
              />
              <div class="text-xs font-medium text-slate-600">
                {{ card.label }}
              </div>
            </div>
            <div class="text-2xl font-bold" :class="card.textColor">
              {{ card.value }}
            </div>
            <div class="css-hover-tooltip opacity-0 invisible
                 group-hover:opacity-100
                 group-hover:visible">
              <span>{{ t('adminDash.goToBusinesses') }}</span>
            </div>
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div class="rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-violet-100 px-5 py-4">
            <h2 class="font-semibold text-slate-800">
              {{ t('adminDash.pendingReview') }}
            </h2>
            <RouterLink
                :to="{ name: 'admin-businesses', query: { status: 'PENDING_REVIEW' } }"
                class="text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              {{ t('adminDash.view') }}
            </RouterLink>
          </div>
          <div
              v-if="pendingReviewList.length === 0"
              class="px-5 py-10 text-center text-sm text-slate-500"
          >
            {{ t('adminDash.noPending') }}
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
            <h2 class="font-semibold text-slate-800">{{ t('adminDash.trialsEnding') }}</h2>
            <RouterLink
                :to="{ name: 'admin-businesses', query: { status: 'TRIAL' } }"
                class="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              {{ t('adminDash.view') }}
            </RouterLink>
          </div>
          <div
              v-if="trialsEndingSoon.length === 0"
              class="px-5 py-10 text-center text-sm text-slate-500"
          >
            {{ t('adminDash.noTrialsEnding') }}
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
                <p class="truncate text-sm font-semibold text-slate-800">
                  {{ biz.name }}
                </p>
                <p class="truncate text-xs text-slate-500">
                  {{ businessLocation(biz) }}
                </p>
              </div>
              <span class="whitespace-nowrap text-xs font-semibold text-amber-600">
                {{ t('adminDash.daysCount', { n: trialDaysLeft(biz.trialEndDate!) }) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold text-slate-800">{{ t('adminDash.recentBusinesses') }}</h2>
          <RouterLink
              to="/admin/businesses"
              class="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            {{ t('adminDash.all') }} <ArrowRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>

        <div v-if="recentBusinesses.length === 0" class="px-5 py-10 text-center text-sm text-slate-500">
          {{ t('adminDash.noBusinesses') }}
        </div>

        <div v-else class="divide-y divide-slate-50 sm:hidden">
          <button
              v-for="biz in recentBusinesses"
              :key="biz.id"
              class="flex w-full items-center gap-3 px-4 py-3 text-left"
              @click="router.push(`/admin/businesses/${biz.id}`)"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-800">
                {{ biz.name }}
              </p>
              <p class="mt-1 truncate text-xs text-slate-500">
                {{ businessLocation(biz) }}
              </p>
            </div>
            <div
                class="shrink-0 text-right"
            >
              <span
                  :class="['rounded-full px-2 py-1 text-[11px] font-semibold',
                   statusColor(biz.status)]">{{ statusLabels[biz.status] }}
              </span>
              <p class="mt-1 text-[11px] text-slate-400">
                {{ new Date(biz.createdAt).toLocaleDateString(dateLocale()) }}
              </p>
            </div>
          </button>
        </div>
        <div class="hidden overflow-x-auto min-h-0 sm:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th class="px-5 py-3 text-left font-medium">{{ t('adminDash.colBusiness') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminDash.colAddress') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminDash.colStatus') }}</th>
                <th class="px-5 py-3 text-left font-medium">{{ t('adminDash.colCreated') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in recentBusinesses"
                :key="biz.id"
                class="cursor-pointer group relative transition hover:bg-slate-50"
                @click="router.push(`/admin/businesses/${biz.id}`)"
              >
                <td class="px-5 py-3 font-semibold text-slate-800">
                  {{ biz.name }}</td>
                <td class="px-5 py-3 text-slate-500">
                  {{ businessLocation(biz) }}</td>
                <td class="px-5 py-3">
                  <span
                      :class="['rounded-full px-2.5 py-1 text-xs font-semibold',
                       statusColor(biz.status)]"
                  >
                    {{ statusLabels[biz.status] }}
                  </span>
                </td>
                <td class="px-5 py-3 text-xs text-slate-500">
                  {{ new Date(biz.createdAt).toLocaleDateString(dateLocale()) }}
                </td>
                <td>
                  <div class="css-hover-tooltip opacity-0 invisible
                     group-hover:opacity-100
                     group-hover:visible">
                    <span>{{ t('adminDash.viewBusinessStatus') }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

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
import { useI18n } from 'vue-i18n'
import { dateLocale } from '@/i18n'

const adminStore = useAdminStore()
const router = useRouter()
const { t } = useI18n()

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
  { label: t('status.business.ACTIVE'), value: statusCounts.value.ACTIVE ?? 0, color: 'bg-emerald-50', textColor: 'text-emerald-600', icon: CheckCircle2, status: 'ACTIVE' },
  { label: t('status.business.TRIAL'), value: statusCounts.value.TRIAL ?? 0, color: 'bg-amber-50', textColor: 'text-amber-600', icon: Clock, status: 'TRIAL' },
  { label: t('status.business.EXPIRED'), value: statusCounts.value.EXPIRED ?? 0, color: 'bg-red-50', textColor: 'text-red-600', icon: XCircle, status: 'EXPIRED' },
  { label: t('status.business.SUSPENDED'), value: statusCounts.value.SUSPENDED ?? 0, color: 'bg-slate-50', textColor: 'text-slate-500', icon: PauseCircle, status: 'SUSPENDED' },
  { label: t('status.business.DRAFT'), value: statusCounts.value.DRAFT ?? 0, color: 'bg-blue-50', textColor: 'text-blue-600', icon: FileEdit, status: 'DRAFT' },
  { label: t('status.business.PENDING_REVIEW'), value: pendingReviewCount.value, color: 'bg-violet-50', textColor: 'text-violet-600', icon: AlertCircle, status: 'PENDING_REVIEW' },
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
    label: t('adminDash.awaitingReview'),
    value: pendingReviewCount.value,
    icon: ClipboardList,
    to: { name: 'admin-businesses', query: { status: 'PENDING_REVIEW' } },
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    label: t('adminDash.trialEnding'),
    value: trialsEndingSoon.value.length,
    icon: TimerReset,
    to: { name: 'admin-businesses', query: { status: 'TRIAL' } },
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    label: t('adminDash.blockedUsers'),
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
  return biz.city || biz.addressLine || t('adminDash.noAddress')
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
<style scoped>
.css-hover-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  margin-top: 8px;
  background: #1e293b;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  text-align: center;
  max-width: 280px;
  width: max-content;
  white-space: normal;
  word-break: break-word;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  z-index: 30;

  &::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent #1e293b transparent;
  }
}
</style>