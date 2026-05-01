<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Users, Building2, CheckCircle2, AlertCircle, XCircle, Clock, TrendingUp, ShieldCheck } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { businessesApi } from '@/api/businesses'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { User, Business } from '@/types'

const users = ref<User[]>([])
const businesses = ref<Business[]>([])
const loading = ref(true)

const businessOwners = computed(() => users.value.filter(u => u.businessOwner))
const regularUsers = computed(() => users.value.filter(u => !u.businessOwner))
const adminUsers = computed(() => users.value.filter(u => u.roles?.includes('ROLE_ADMIN')))

const byStatus = computed(() => {
  const map: Record<string, number> = {}
  for (const b of businesses.value) {
    map[b.status] = (map[b.status] ?? 0) + 1
  }
  return map
})

const statusCards = computed(() => [
  { label: 'Faol (ACTIVE)', value: byStatus.value['ACTIVE'] ?? 0, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Sinov (TRIAL)', value: byStatus.value['TRIAL'] ?? 0, color: 'bg-amber-100 text-amber-700' },
  { label: 'Muddati tugagan', value: byStatus.value['EXPIRED'] ?? 0, color: 'bg-red-100 text-red-700' },
  { label: "To'xtatilgan", value: byStatus.value['SUSPENDED'] ?? 0, color: 'bg-slate-100 text-slate-600' },
  { label: 'Qoralama', value: byStatus.value['DRAFT'] ?? 0, color: 'bg-blue-100 text-blue-700' },
  { label: 'Tekshiruvda', value: byStatus.value['PENDING_REVIEW'] ?? 0, color: 'bg-violet-100 text-violet-700' },
])

const recentBusinesses = computed(() =>
  [...businesses.value].slice(0, 6)
)

onMounted(async () => {
  try {
    const [u, b] = await Promise.allSettled([
      usersApi.getAll(),
      businessesApi.getAll(),
    ])
    if (u.status === 'fulfilled') users.value = u.value.data
    if (b.status === 'fulfilled') businesses.value = b.value.data
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

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Main stats -->
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

      <!-- Business status breakdown -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div class="px-6 py-4 border-b border-slate-100">
          <h2 class="font-semibold text-slate-800">Bizneslar holati</h2>
          <p class="text-xs text-slate-500 mt-0.5">Jami: {{ businesses.length }} ta biznes</p>
        </div>
        <div class="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            v-for="card in statusCards"
            :key="card.label"
            class="rounded-xl p-3 text-center"
            :class="card.color.split(' ').map(c => c.replace('text-', 'bg-').replace('700','100').replace('600','100'))[0] + ' border border-slate-100'"
          >
            <div class="text-2xl font-bold" :class="card.color.split(' ')[1]">{{ card.value }}</div>
            <div class="text-xs mt-1 text-slate-600">{{ card.label }}</div>
          </div>
        </div>
      </div>

      <!-- Recent businesses table -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 class="font-semibold text-slate-800">So'nggi bizneslar</h2>
          <RouterLink to="/admin/businesses" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Barchasini ko'rish →
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
                <th class="px-6 py-3 text-left font-medium">Manzil</th>
                <th class="px-6 py-3 text-left font-medium">Holat</th>
                <th class="px-6 py-3 text-left font-medium">Trial tugash</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="biz in recentBusinesses"
                :key="biz.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-3 font-medium text-slate-800">{{ biz.name }}</td>
                <td class="px-6 py-3 text-slate-500">{{ biz.addressLine || '—' }}</td>
                <td class="px-6 py-3">
                  <span :class="[
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    biz.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    biz.status === 'TRIAL' ? 'bg-amber-100 text-amber-700' :
                    biz.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                    biz.status === 'SUSPENDED' ? 'bg-slate-100 text-slate-600' :
                    'bg-blue-100 text-blue-700'
                  ]">{{ biz.status }}</span>
                </td>
                <td class="px-6 py-3 text-slate-500">
                  {{ biz.trialEndDate ? new Date(biz.trialEndDate).toLocaleDateString('uz-UZ') : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
