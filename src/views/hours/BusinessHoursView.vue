<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Clock, Save, CheckCircle2, Copy, AlertCircle } from 'lucide-vue-next'
import { businessHoursApi } from '@/api/businessHours'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { BusinessHours, Weekday } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()
const loading = ref(true)
const savingDay = ref<Weekday | null>(null)
const savingAll = ref(false)

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

function defaultDay(closed: boolean): DayState {
  return { id: null, closed, opensAt: '09:00', closesAt: '18:00', saved: false }
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

// Oxirgi saqlangan holat — o'zgarishlarni (dirty) aniqlash uchun
const savedSnapshot = ref<Record<Weekday, Omit<DayState, 'saved'>>>(
  Object.fromEntries(DAYS.map((d) => [d.weekday, { id: null, closed: days.value[d.weekday].closed, opensAt: '09:00', closesAt: '18:00' }])) as Record<Weekday, Omit<DayState, 'saved'>>
)

function snapshotOf(weekday: Weekday) {
  const d = days.value[weekday]
  return { id: d.id, closed: d.closed, opensAt: d.opensAt, closesAt: d.closesAt }
}

function isDirty(weekday: Weekday) {
  const cur = snapshotOf(weekday)
  const saved = savedSnapshot.value[weekday]
  return cur.closed !== saved.closed || cur.opensAt !== saved.opensAt || cur.closesAt !== saved.closesAt
}

function isInvalid(weekday: Weekday) {
  const d = days.value[weekday]
  return !d.closed && d.opensAt >= d.closesAt
}

const anyDirty = computed(() => DAYS.some((d) => isDirty(d.weekday)))
const anyInvalid = computed(() => DAYS.some((d) => isInvalid(d.weekday)))

function applyHours(list: BusinessHours[]) {
  list.forEach((h) => {
    const state: DayState = {
      id: h.id,
      closed: h.closed,
      opensAt: h.opensAt ? h.opensAt.slice(0, 5) : '09:00',
      closesAt: h.closesAt ? h.closesAt.slice(0, 5) : '18:00',
      saved: false,
    }
    days.value[h.weekday] = state
    savedSnapshot.value[h.weekday] = { id: state.id, closed: state.closed, opensAt: state.opensAt, closesAt: state.closesAt }
  })
}

function copyToAllDays(source: Weekday) {
  const src = days.value[source]
  DAYS.forEach((d) => {
    if (d.weekday === source) return
    days.value[d.weekday] = { ...days.value[d.weekday], closed: src.closed, opensAt: src.opensAt, closesAt: src.closesAt }
  })
  toast.success('Boshqa kunlarga nusxalandi — saqlashni unutmang')
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
    savedSnapshot.value[weekday] = { id: data.id, closed: d.closed, opensAt: d.opensAt, closesAt: d.closesAt }
    days.value[weekday].saved = true
    setTimeout(() => { days.value[weekday].saved = false }, 2000)
    return true
  } catch {
    return false
  }
}

async function saveDay(weekday: Weekday) {
  if (isInvalid(weekday)) {
    toast.error('Yopilish vaqti ochilish vaqtidan keyin bo\'lishi kerak')
    return
  }
  savingDay.value = weekday
  const ok = await persistDay(weekday)
  savingDay.value = null
  if (ok) toast.success(`${DAYS.find((d) => d.weekday === weekday)?.label} saqlandi`)
  else toast.error('Saqlashda xatolik yuz berdi')
}

async function saveAll() {
  if (anyInvalid.value) {
    toast.error('Ba\'zi kunlarda yopilish vaqti ochilishdan oldin turibdi — avval to\'g\'rilang')
    return
  }
  const dirtyDays = DAYS.filter((d) => isDirty(d.weekday))
  if (dirtyDays.length === 0) {
    toast.success('O\'zgarish yo\'q')
    return
  }
  savingAll.value = true
  try {
    const results = await Promise.all(dirtyDays.map((d) => persistDay(d.weekday)))
    const failed = results.filter((ok) => !ok).length
    if (failed === 0) toast.success('Barcha o\'zgarishlar saqlandi')
    else toast.error(`${failed} ta kunni saqlashda xatolik yuz berdi`)
  } finally {
    savingAll.value = false
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
        :disabled="savingAll || savingDay !== null || !anyDirty"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Save class="w-4 h-4" />
        {{ savingAll ? 'Saqlanmoqda...' : anyDirty ? 'O\'zgarishlarni saqlash' : 'Saqlangan' }}
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-3">
      <div
        v-for="day in DAYS"
        :key="day.weekday"
        :class="[
          'bg-white rounded-2xl border shadow-sm p-5 transition-all',
          isInvalid(day.weekday) ? 'border-red-200' : days[day.weekday].closed ? 'border-slate-100 opacity-70' : 'border-slate-100',
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <!-- Day name + closed toggle -->
          <div class="flex items-center gap-4 sm:w-48 flex-shrink-0">
            <div class="w-12 text-center relative">
              <div class="text-sm font-bold text-slate-800">{{ day.short }}</div>
              <div class="text-xs text-slate-400">{{ day.label }}</div>
              <span
                v-if="isDirty(day.weekday) && !isInvalid(day.weekday)"
                class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
                title="Saqlanmagan o'zgarish"
              />
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
                :class="[
                  'px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 w-32',
                  isInvalid(day.weekday) ? 'border-red-300 focus:ring-red-400' : 'border-slate-200 focus:ring-primary-500',
                ]"
              />
            </div>
            <span v-if="isInvalid(day.weekday)" class="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
              Yopilish ochilishdan keyin bo'lsin
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 sm:ml-auto">
            <CheckCircle2
              v-if="days[day.weekday].saved"
              class="w-5 h-5 text-emerald-500 animate-pulse"
            />
            <button
              @click="copyToAllDays(day.weekday)"
              title="Bu vaqtni barcha kunlarga nusxalash"
              class="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
            <button
              @click="saveDay(day.weekday)"
              :disabled="savingDay !== null || savingAll || !isDirty(day.weekday) || isInvalid(day.weekday)"
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
        Ish soatlari navbatlarni yaratish va jadvalni ko'rsatish uchun ishlatiladi.
        <Copy class="w-3.5 h-3.5 inline align-text-top" /> tugmasi bosilgan kunning vaqtini barcha kunlarga nusxalaydi — keyin faqat dam kunlarini belgilab, bir marta saqlasangiz bo'ldi.
      </p>
    </div>
  </div>
</template>
