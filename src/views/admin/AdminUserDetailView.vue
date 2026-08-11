<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, UserRound, ShieldCheck, Building2, Mail, Phone, CalendarDays,
  ToggleLeft, ToggleRight, Briefcase, ArrowRight, Loader2, LogIn, MapPin,
} from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { businessesApi } from '@/api/businesses'
import { mediaUrl } from '@/utils/media'
import { personName } from '@/utils/names'
import { businessStatusLabels, businessStatusColor } from '@/utils/businessStatus'
import type { User, Business } from '@/types'

const route = useRoute()
const router = useRouter()

const id = route.params.id as string
const user = ref<User | null>(null)
const businesses = ref<Business[]>([])
const loading = ref(true)

const isAdmin = computed(() => user.value?.roles?.includes('ROLE_ADMIN') ?? false)
const roleNames: Record<string, string> = {
  ROLE_ADMIN: 'Admin',
  ROLE_BUSINESS_OWNER: 'Biznes egasi',
  ROLE_MANAGER: 'Menejer',
  ROLE_STAFF: 'Xodim',
  ROLE_USER: 'Foydalanuvchi',
}

const roleLabels = computed(() => {
  const roles = user.value?.roles ?? []
  if (roles.length === 0) return ['Foydalanuvchi']
  return roles.map((role) => roleNames[role] ?? role)
})

function formatDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('uz-UZ')
}

function subscriptionLabel(biz: Business) {
  if (biz.subscriptionEndDate) return formatShortDate(biz.subscriptionEndDate)
  if (biz.status === 'TRIAL') return 'Trial rejimida'
  if (biz.status === 'ACTIVE') return 'Cheksiz'
  return 'Belgilanmagan'
}

function statusColor(status: Business['status']) {
  return businessStatusColor(status)
}

onMounted(async () => {
  try {
    const userRes = await usersApi.getById(id)
    user.value = userRes.data
    const businessRes = await businessesApi.getAll({ ownerId: id, size: 20, sort: 'createdAt,desc' })
    businesses.value = businessRes.data.content
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <button
      type="button"
      class="mb-6 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
      @click="router.push('/admin/users')"
    >
      <ArrowLeft class="h-4 w-4" />
      Foydalanuvchilar ro'yxatiga qaytish
    </button>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="user">
      <div class="mb-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <div class="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
              <img
                v-if="mediaUrl(user.avatarUrl)"
                :src="mediaUrl(user.avatarUrl)!"
                class="h-full w-full object-cover"
                :alt="personName(user, user.login)"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <ShieldCheck v-if="isAdmin" class="h-7 w-7 text-red-500" />
                <Building2 v-else-if="user.businessOwner" class="h-7 w-7 text-violet-500" />
                <UserRound v-else class="h-7 w-7 text-slate-400" />
              </div>
            </div>
            <div class="min-w-0">
              <h1 class="truncate text-2xl font-bold text-slate-800">{{ personName(user, user.login) }}</h1>
              <p class="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <LogIn class="h-4 w-4" />
                {{ user.login }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="role in roleLabels"
              :key="role"
              class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {{ role }}
            </span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
              ]"
            >
              <ToggleRight v-if="user.active" class="h-3.5 w-3.5" />
              <ToggleLeft v-else class="h-3.5 w-3.5" />
              {{ user.active ? 'Aktiv' : 'Bloklangan' }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid items-start gap-5 xl:grid-cols-[420px_1fr]">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 class="mb-4 font-semibold text-slate-800">Kontakt</h2>
            <div class="space-y-4 text-sm">
              <div>
                <span class="mb-1 flex items-center gap-2 text-slate-500"><Mail class="h-4 w-4" /> Email</span>
                <span class="block truncate font-medium text-slate-800">{{ user.email || '-' }}</span>
              </div>
              <div>
                <span class="mb-1 flex items-center gap-2 text-slate-500"><Phone class="h-4 w-4" /> Telefon</span>
                <span class="block font-medium text-slate-800">{{ user.phone || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 class="mb-4 font-semibold text-slate-800">Hisob</h2>
            <div class="space-y-4 text-sm">
              <div>
                <span class="mb-1 flex items-center gap-2 text-slate-500"><CalendarDays class="h-4 w-4" /> Yaratilgan</span>
                <span class="block font-medium text-slate-800">{{ formatDate(user.createdAt) }}</span>
              </div>
              <div>
                <span class="mb-1 flex items-center gap-2 text-slate-500"><CalendarDays class="h-4 w-4" /> Yangilangan</span>
                <span class="block font-medium text-slate-800">{{ formatDate(user.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 class="font-semibold text-slate-800">Bizneslari</h2>
              <p class="mt-0.5 text-xs text-slate-500">{{ businesses.length }} ta biznes</p>
            </div>
            <Building2 class="h-5 w-5 text-slate-400" />
          </div>

          <div v-if="businesses.length === 0" class="px-5 py-12 text-center text-sm text-slate-500">
            Bu foydalanuvchiga biriktirilgan biznes yo'q
          </div>

          <div v-else class="grid gap-4 p-4 sm:grid-cols-[repeat(auto-fill,minmax(340px,380px))]">
            <button
              v-for="biz in businesses"
              :key="biz.id"
              type="button"
              class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary-100 hover:bg-white hover:shadow-sm"
              @click="router.push(`/admin/businesses/${biz.id}`)"
            >
              <div class="mb-3 flex items-start justify-between gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Briefcase class="h-4 w-4" />
                </div>
                <span :class="['inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold', statusColor(biz.status)]">
                  {{ businessStatusLabels[biz.status] }}
                </span>
              </div>

              <p class="truncate text-sm font-semibold text-slate-800">{{ biz.name }}</p>
              <p class="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                <MapPin class="h-3.5 w-3.5 flex-shrink-0" />
                {{ [biz.city, biz.addressLine].filter(Boolean).join(', ') || '-' }}
              </p>

              <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-xl bg-white px-3 py-2">
                  <p class="text-slate-400">Trial</p>
                  <p class="mt-0.5 font-semibold text-slate-700">{{ formatShortDate(biz.trialEndDate) }}</p>
                </div>
                <div class="rounded-xl bg-white px-3 py-2">
                  <p class="text-slate-400">Obuna</p>
                  <p class="mt-0.5 truncate font-semibold text-slate-700">{{ subscriptionLabel(biz) }}</p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3">
                <span class="text-xs font-semibold text-primary-600">Batafsil</span>
                <ArrowRight class="h-4 w-4 text-primary-500" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
