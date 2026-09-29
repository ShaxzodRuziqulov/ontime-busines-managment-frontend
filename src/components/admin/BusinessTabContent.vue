<template>
  <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <!-- Loading -->
    <div v-if="tabLoading" class="flex items-center justify-center py-14">
      <Loader2 class="w-6 h-6 text-primary-500 animate-spin" />
    </div>

    <!-- Services -->
    <template
        v-else-if="activeTab === 'services'"
    >
      <div
          v-if="services.length === 0"
          class="py-14 text-center text-slate-400 text-sm"
      >
        Xizmat yo'q
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
            <th class="px-5 py-3 text-left font-medium">№</th>
            <th class="px-5 py-3 text-left font-medium">Xizmat nomi</th>
            <th class="px-5 py-3 text-left font-medium">Rasm</th>
            <th class="px-5 py-3 text-left font-medium">Narx</th>
            <th class="px-5 py-3 text-left font-medium">Davomiyligi</th>
            <th class="px-5 py-3 text-left font-medium">Holat</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
              v-for="(svc, index) in services"
              :key="svc.id"
              class="hover:bg-slate-50/50"
          >
            <td class="px-5 py-3.5">{{index + 1}}</td>
            <td class="px-5 py-3.5">
              <p class="font-medium text-slate-800">{{ svc.name }}</p>
              <p
                  v-if="svc.description"
                  class="text-xs text-slate-400 mt-0.5 truncate max-w-xs"
              >
                {{ svc.description }}
              </p>
            </td>
            <td class="px-5 py-3 text-left">
              <img v-if="svc.imageUrl" class="w-10 h-10 rounded-md" :src="getAvatarUrl(svc.imageUrl)" alt="">
            </td>
            <td class="px-5 py-3.5 text-slate-700 font-medium">
              {{ svc.basePrice.toLocaleString('uz-UZ') }} so'm
            </td>
            <td class="px-5 py-3.5 text-slate-500">
              {{ svc.durationMinutes }} daqiqa
            </td>
            <td class="px-5 py-3.5">
              <span
                  :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                   svc.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']"
              >
                {{ svc.active ? 'Faol' : "Nofaol" }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Staff -->
    <template
        v-else-if="activeTab === 'staff'"
    >
      <div
          v-if="staff.length === 0"
          class="py-14 text-center text-slate-400 text-sm"
      >
        Xodim yo'q
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
            <th class="px-5 py-3 text-left font-medium">№</th>
            <th class="px-5 py-3 text-left font-medium">Xodim</th>
            <th class="px-5 py-3 text-left font-medium">Tajriba yili</th>
            <th class="px-5 py-3 text-left font-medium">Holat</th>
            <th class="px-5 py-3 text-left font-medium">Qo'shilgan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
              v-for="(s, index) in staff"
              :key="s.id"
              class="hover:bg-slate-50/50"
          >
            <td class="px-5 py-3.5">
              {{index + 1}}
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="flex gap-2 items-center justify-center flex-shrink-0">
                  <img v-if="s.avatarUrl" :src="getAvatarUrl(s.avatarUrl)" class="rounded-full bg-slate-100 w-6 h-6" alt="">
                  <Users v-else class="w-4 h-4 text-slate-400 bg-slate-100 rounded-full" />
                </div>
                <span class="font-medium text-slate-800">
                  {{ personName(s) }}
                  <p v-if="s.avgRating" class="text-[12px] text-yellow-500">⭐{{s.avgRating}}</p>
                </span>
              </div>
            </td>
            <td class="px-5 py-3 text-left font-medium">
              {{s.experienceYears || '---'}}
            </td>
            <td class="px-5 py-3.5">
              <span
                  :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                   s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']"
              >
                {{ s.active ? 'Faol' : 'Nofaol' }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-slate-500 text-xs">
              {{ new Date(s.createdAt).toLocaleDateString('uz-UZ') }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Hours -->
    <template
        v-else-if="activeTab === 'hours'"
    >
      <div
          v-if="sortedHours.length === 0"
          class="py-14 text-center text-slate-400 text-sm"
      >
        Ish soatlari belgilanmagan
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
            <th class="px-5 py-3 text-left font-medium">Kun</th>
            <th class="px-5 py-3 text-left font-medium">Ochilish</th>
            <th class="px-5 py-3 text-left font-medium">Yopilish</th>
            <th class="px-5 py-3 text-left font-medium">Holat</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr
              v-for="h in sortedHours"
              :key="h.id"
              :class="['hover:bg-slate-50/50',
               h.closed && 'opacity-60']"
          >
            <td class="px-5 py-3 font-medium text-slate-800">
              {{ weekdayLabels[h.weekday] ?? h.weekday }}
            </td>
            <td class="px-5 py-3 text-slate-600">
              {{ h.closed ? '—' : h.opensAt }}
            </td>
            <td class="px-5 py-3 text-slate-600">
              {{ h.closed ? '—' : h.closesAt }}
            </td>
            <td class="px-5 py-3">
              <span
                  :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                   h.closed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700']"
              >
                {{ h.closed ? 'Yopiq' : 'Ochiq' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </template>

    <!-- Reviews -->
    <template
        v-else-if="activeTab === 'reviews'"
    >
      <div
          v-if="reviews.length === 0"
          class="py-14 text-center text-slate-400 text-sm"
      >
        Sharh yo'q
      </div>
      <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5"
      >
        <div
            v-for="(r, index) in reviews"
            :key="r.id"
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {{ index + 1 }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">
                  <span v-if="r.customerFirstName">{{ r.customerFirstName }} {{ r.customerLastName }}</span>
                  <span v-else class="text-slate-400 font-normal italic">Mijoz topilmadi</span>
                </p>
                <p class="flex items-center gap-1 text-xs text-slate-400">
                  <Users class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate">{{ r.staffFirstName }}</span>
                </p>
              </div>
            </div>
            <span class="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
              {{ new Date(r.createdAt).toLocaleDateString('uz-UZ') }}
            </span>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <div class="flex gap-0.5">
              <Star
                  v-for="i in 5" :key="i"
                  class="w-3.5 h-3.5"
                  :class="i <= r.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'"
              />
            </div>
            <span class="text-xs font-medium text-slate-500">{{ r.stars }}/5</span>
          </div>

          <p
              v-if="r.comment"
              class="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed"
          >
            {{ r.comment }}
          </p>
          <p
              v-else
              class="text-sm text-slate-400 italic"
          >
            Izoh yo'q
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, Users, Star } from 'lucide-vue-next'
import { personName } from '@/utils/names'
import type { OfferedService, StaffMember, BusinessHours, Review } from '@/types'

const props = defineProps<{
  activeTab: 'services' | 'staff' | 'hours' | 'reviews'
  tabLoading: boolean
  services: OfferedService[]
  staff: StaffMember[]
  hours: BusinessHours[]
  reviews: Review[]
}>()

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string)
    .replace(/\/api\/v1\/?$/, '');

const getAvatarUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("https")) return url;
  return `${BASE_URL}${url}`;
};

const weekdayLabels: Record<string, string> = {
  MONDAY: 'Dushanba', TUESDAY: 'Seshanba', WEDNESDAY: 'Chorshanba',
  THURSDAY: 'Payshanba', FRIDAY: 'Juma', SATURDAY: 'Shanba', SUNDAY: 'Yakshanba',
}

const weekdayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const sortedHours = computed(() =>
    [...props.hours].sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday))
)
</script>