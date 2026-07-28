<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Save, Clock, AlertCircle } from 'lucide-vue-next'
import { businessHoursApi } from '@/api/businessHours'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { BusinessHours, Weekday } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)

const DAYS: { weekday: Weekday; label: string; short: string }[] = [
  { weekday: 'MONDAY', label: 'Dushanba', short: 'D' },
  { weekday: 'TUESDAY', label: 'Seshanba', short: 'S' },
  { weekday: 'WEDNESDAY', label: 'Chorshanba', short: 'C' },
  { weekday: 'THURSDAY', label: 'Payshanba', short: 'P' },
  { weekday: 'FRIDAY', label: 'Juma', short: 'J' },
  { weekday: 'SATURDAY', label: 'Shanba', short: 'Sh' },
  { weekday: 'SUNDAY', label: 'Yakshanba', short: 'Y' },
]

interface DayState {
  id: string | null
  closed: boolean
  opensAt: string
  closesAt: string
}

function defaultDay(closed: boolean): DayState {
  return { id: null, closed, opensAt: '09:00', closesAt: '18:00' }
}

const days = ref<Record<Weekday, DayState>>({
  MONDAY: defaultDay(false),
  TUESDAY: defaultDay(false),
  WEDNESDAY: defaultDay(false),
  THURSDAY: defaultDay(false),
  FRIDAY: defaultDay(false),
  SATURDAY: defaultDay(true),
  SUNDAY: defaultDay(true),
})

const savedSnapshot = ref<Record<Weekday, DayState>>(
  Object.fromEntries(DAYS.map((d) => [d.weekday, { ...days.value[d.weekday] }])) as Record<Weekday, DayState>
)

function isDirty(weekday: Weekday) {
  const cur = days.value[weekday]
  // Bazada bu kun uchun hali yozuv yo'q — demak hech qachon saqlanmagan, har doim "saqlash kerak" hisoblanadi
  if (cur.id === null) return true
  const saved = savedSnapshot.value[weekday]
  return cur.closed !== saved.closed || cur.opensAt !== saved.opensAt || cur.closesAt !== saved.closesAt
}

function isInvalid(weekday: Weekday) {
  const d = days.value[weekday]
  return !d.closed && d.opensAt >= d.closesAt
}

const dirtyCount = computed(() => DAYS.filter((d) => isDirty(d.weekday)).length)
const anyInvalid = computed(() => DAYS.some((d) => isInvalid(d.weekday)))

// Barcha ish kunlari bir xil vaqtga egami — bo'lsa "hammasiga" ko'rinishi ko'rsatiladi
const uniformHours = computed(() => {
  const open = DAYS.filter((d) => !days.value[d.weekday].closed)
  if (open.length === 0) return null
  const first = days.value[open[0].weekday]
  const same = open.every((d) => days.value[d.weekday].opensAt === first.opensAt && days.value[d.weekday].closesAt === first.closesAt)
  return same ? { opensAt: first.opensAt, closesAt: first.closesAt } : null
})

function applyToWorkingDays(opensAt: string, closesAt: string) {
  DAYS.forEach((d) => {
    if (!days.value[d.weekday].closed) {
      days.value[d.weekday] = { ...days.value[d.weekday], opensAt, closesAt }
    }
  })
}

function applyHours(list: BusinessHours[]) {
  list.forEach((h) => {
    const state: DayState = {
      id: h.id,
      closed: h.closed,
      opensAt: h.opensAt ? h.opensAt.slice(0, 5) : '09:00',
      closesAt: h.closesAt ? h.closesAt.slice(0, 5) : '18:00',
    }
    days.value[h.weekday] = state
    savedSnapshot.value[h.weekday] = { ...state }
  })
}

async function persistDay(weekday: Weekday): Promise<boolean> {
  const bid = businessStore.business?.id
  if (!bid) return false
  const d = days.value[weekday]
  if (isInvalid(weekday)) return false
  try {
    const payload = {
      weekday,
      closed: d.closed,
      opensAt: d.closed ? undefined : d.opensAt + ':00',
      closesAt: d.closed ? undefined : d.closesAt + ':00',
    }
    const { data } = d.id
      ? await businessHoursApi.update(bid, d.id, { closed: payload.closed, opensAt: payload.opensAt, closesAt: payload.closesAt })
      : await businessHoursApi.create(bid, payload)
    days.value[weekday].id = data.id
    savedSnapshot.value[weekday] = { ...days.value[weekday] }
    return true
  } catch {
    return false
  }
}

async function save() {
  if (anyInvalid.value) {
    toast.error('Yopilish vaqti ochilishdan keyin bo\'lsin')
    return
  }
  const dirtyDays = DAYS.filter((d) => isDirty(d.weekday))
  if (dirtyDays.length === 0) return
  saving.value = true
  try {
    const results = await Promise.all(dirtyDays.map((d) => persistDay(d.weekday)))
    const failed = results.filter((ok) => !ok).length
    if (failed === 0) toast.success('Saqlandi')
    else toast.error(`${failed} ta kunni saqlashda xatolik yuz berdi`)
  } finally {
    saving.value = false
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
        <h2 class="text-2xl font-bold text-slate-800">Ish soatlari</h2>
        <p class="text-slate-500 text-sm mt-1">Navbatlar va jadval shu vaqtlarga qarab hisoblanadi</p>
      </div>
      <button
        @click="save"
        :disabled="saving || anyInvalid || dirtyCount === 0"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Save class="w-4 h-4" />
        {{ saving ? 'Saqlanmoqda...' : dirtyCount > 0 ? `Saqlash (${dirtyCount})` : "O'zgarish yo'q" }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <!-- Bir xil vaqtni barcha ish kunlariga tez qo'llash -->
      <div v-if="uniformHours" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-medium text-slate-600">Ish kunlari:</span>
        <div class="flex items-center gap-2">
          <input
            :value="uniformHours.opensAt"
            @change="applyToWorkingDays(($event.target as HTMLInputElement).value, uniformHours!.closesAt)"
            type="time"
            class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
          />
          <span class="text-slate-400 text-sm">—</span>
          <input
            :value="uniformHours.closesAt"
            @change="applyToWorkingDays(uniformHours!.opensAt, ($event.target as HTMLInputElement).value)"
            type="time"
            class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
          />
        </div>
        <span class="text-xs text-slate-400">barcha ish kunlariga birdek qo'llanadi</span>
      </div>

      <!-- Kunlar ro'yxati -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        <div
          v-for="day in DAYS"
          :key="day.weekday"
          :class="['flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4', isInvalid(day.weekday) ? 'bg-red-50/40' : '']"
        >
          <div class="flex items-center gap-3 sm:w-44 flex-shrink-0">
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
              <span class="text-sm font-medium text-slate-700">{{ day.label }}</span>
            </label>
            <span v-if="isDirty(day.weekday)" class="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Saqlanmagan o'zgarish" />
          </div>

          <div
            :class="['flex items-center gap-2 flex-1 transition-opacity', days[day.weekday].closed ? 'opacity-30 pointer-events-none' : '']"
          >
            <Clock class="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              v-model="days[day.weekday].opensAt"
              type="time"
              class="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
            />
            <span class="text-slate-400 text-sm">—</span>
            <input
              v-model="days[day.weekday].closesAt"
              :class="[
                'px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 w-32',
                isInvalid(day.weekday) ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-primary-500',
              ]"
              type="time"
            />
            <span v-if="isInvalid(day.weekday)" class="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
              Yopilish ochilishdan keyin bo'lsin
            </span>
          </div>

          <span :class="['text-xs font-medium sm:w-20 sm:text-right flex-shrink-0', days[day.weekday].closed ? 'text-slate-400' : 'text-emerald-600']">
            {{ days[day.weekday].closed ? 'Dam olish' : 'Ish kuni' }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
