<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Clock, Save, CheckCircle2 } from 'lucide-vue-next'
import { businessHoursApi } from '@/api/businessHours'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { BusinessHours, Weekday } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()
const loading = ref(true)
const savingDay = ref<Weekday | null>(null)

const DAYS: { weekday: Weekday; label: string; short: string }[] = [
  { weekday: 'MONDAY', label: 'Dushanba', short: 'Dush' },
  { weekday: 'TUESDAY', label: 'Seshanba', short: 'Sesh' },
  { weekday: 'WEDNESDAY', label: 'Chorshanba', short: 'Chor' },
  { weekday: 'THURSDAY', label: 'Payshanba', short: 'Pay' },
  { weekday: 'FRIDAY', label: 'Juma', short: 'Juma' },
  { weekday: 'SATURDAY', label: 'Shanba', short: 'Shan' },
  { weekday: 'SUNDAY', label: 'Yakshanba', short: 'Yak' },
]

interface DayState {
  id: string | null
  closed: boolean
  opensAt: string
  closesAt: string
  saved: boolean
}

const days = ref<Record<Weekday, DayState>>({
  MONDAY:    { id: null, closed: false, opensAt: '09:00', closesAt: '18:00', saved: false },
  TUESDAY:   { id: null, closed: false, opensAt: '09:00', closesAt: '18:00', saved: false },
  WEDNESDAY: { id: null, closed: false, opensAt: '09:00', closesAt: '18:00', saved: false },
  THURSDAY:  { id: null, closed: false, opensAt: '09:00', closesAt: '18:00', saved: false },
  FRIDAY:    { id: null, closed: false, opensAt: '09:00', closesAt: '18:00', saved: false },
  SATURDAY:  { id: null, closed: true,  opensAt: '10:00', closesAt: '16:00', saved: false },
  SUNDAY:    { id: null, closed: true,  opensAt: '10:00', closesAt: '16:00', saved: false },
})

function applyHours(list: BusinessHours[]) {
  list.forEach((h) => {
    days.value[h.weekday] = {
      id: h.id,
      closed: h.closed,
      opensAt: h.opensAt ? h.opensAt.slice(0, 5) : '09:00',
      closesAt: h.closesAt ? h.closesAt.slice(0, 5) : '18:00',
      saved: false,
    }
  })
}

async function saveDay(weekday: Weekday) {
  const bid = businessStore.business?.id
  if (!bid) return
  const d = days.value[weekday]
  savingDay.value = weekday
  try {
    const payload = {
      weekday,
      closed: d.closed,
      opensAt: d.closed ? undefined : d.opensAt + ':00',
      closesAt: d.closed ? undefined : d.closesAt + ':00',
    }
    if (d.id) {
      const { data } = await businessHoursApi.update(bid, d.id, {
        closed: payload.closed,
        opensAt: payload.opensAt,
        closesAt: payload.closesAt,
      })
      days.value[weekday].id = data.id
    } else {
      const { data } = await businessHoursApi.create(bid, payload)
      days.value[weekday].id = data.id
    }
    days.value[weekday].saved = true
    setTimeout(() => { days.value[weekday].saved = false }, 2000)
    toast.success(`${DAYS.find(d => d.weekday === weekday)?.label} saqlandi`)
  } catch {
    toast.error('Saqlashda xatolik yuz berdi')
  } finally {
    savingDay.value = null
  }
}

async function saveAll() {
  for (const d of DAYS) {
    await saveDay(d.weekday)
  }
}

onMounted(async () => {
  const bid = businessStore.business?.id
  if (bid) {
    try {
      const { data } = await businessHoursApi.getAll(bid)
      applyHours(data)
    } catch {
      toast.error('Ish soatlarini yuklashda xatolik')
    }
  }
  loading.value = false
})
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Ish soatlari</h1>
        <p class="text-slate-500 text-sm mt-1">Har bir kun uchun ochilish va yopilish vaqtlarini belgilang</p>
      </div>
      <button
        @click="saveAll"
        :disabled="savingDay !== null"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Save class="w-4 h-4" />
        Hammasini saqlash
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-3">
      <div
        v-for="day in DAYS"
        :key="day.weekday"
        :class="[
          'bg-white rounded-2xl border shadow-sm p-5 transition-all',
          days[day.weekday].closed ? 'border-slate-100 opacity-70' : 'border-slate-100',
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <!-- Day name + closed toggle -->
          <div class="flex items-center gap-4 sm:w-48 flex-shrink-0">
            <div class="w-12 text-center">
              <div class="text-sm font-bold text-slate-800">{{ day.short }}</div>
              <div class="text-xs text-slate-400">{{ day.label }}</div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div
                @click="days[day.weekday].closed = !days[day.weekday].closed"
                :class="[
                  'relative w-10 h-5 rounded-full transition-colors',
                  !days[day.weekday].closed ? 'bg-primary-600' : 'bg-slate-200',
                ]"
              >
                <div
                  :class="[
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    !days[day.weekday].closed ? 'translate-x-5' : '',
                  ]"
                />
              </div>
              <span :class="['text-sm font-medium', days[day.weekday].closed ? 'text-slate-400' : 'text-slate-700']">
                {{ days[day.weekday].closed ? 'Dam olish' : 'Ish kuni' }}
              </span>
            </label>
          </div>

          <!-- Time inputs -->
          <div
            :class="[
              'flex items-center gap-3 flex-1 transition-opacity',
              days[day.weekday].closed ? 'opacity-30 pointer-events-none' : '',
            ]"
          >
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                v-model="days[day.weekday].opensAt"
                type="time"
                class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
              />
            </div>
            <span class="text-slate-400 text-sm">—</span>
            <div class="flex items-center gap-2">
              <input
                v-model="days[day.weekday].closesAt"
                type="time"
                class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
              />
            </div>
          </div>

          <!-- Save button -->
          <div class="flex items-center gap-2 sm:ml-auto">
            <CheckCircle2
              v-if="days[day.weekday].saved"
              class="w-5 h-5 text-emerald-500 animate-pulse"
            />
            <button
              @click="saveDay(day.weekday)"
              :disabled="savingDay !== null"
              class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 hover:border-primary-300 disabled:opacity-50 transition-all"
            >
              <Save class="w-3.5 h-3.5" />
              {{ savingDay === day.weekday ? 'Saqlanmoqda...' : 'Saqlash' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info note -->
    <div class="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <p class="text-sm text-blue-700">
        <span class="font-semibold">Eslatma:</span>
        Ish soatlari mijozlarga mavjud bron vaqtlarini ko'rsatish uchun ishlatiladi.
        Har bir kunni alohida yoki "Hammasini saqlash" tugmasi orqali bir vaqtda saqlang.
      </p>
    </div>
  </div>
</template>
