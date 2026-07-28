<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, CheckCircle2, UserPlus, Loader2, CalendarX } from 'lucide-vue-next'
import AppModal from '@/components/common/AppModal.vue'
import { servicesApi } from '@/api/services'
import { businessHoursApi } from '@/api/businessHours'
import { usersApi, type UserLookup } from '@/api/users'
import { bookingsApi } from '@/api/bookings'
import { useToast } from '@/composables/useToast'
import {
  todayIso,
  weekdayFromDate,
  toMinutes,
  isStaffBusy,
  generatePossibleStarts,
  minutesToLabel,
} from '@/utils/scheduling'
import type { OfferedService, Booking, BusinessHours } from '@/types'

const props = defineProps<{
  businessId: string
  staffId: string
  bookings: Booking[]
}>()

const emit = defineEmits<{
  close: []
  created: [booking: Booking]
}>()

const toast = useToast()

const SLOT_INTERVAL = 30

// ── Xizmatlar + ish soatlari ────────────────────────────────
const services = ref<OfferedService[]>([])
const hours = ref<BusinessHours[]>([])
const serviceId = ref<string>('')
const selectedService = computed(() => services.value.find((s) => s.id === serviceId.value) ?? null)

// ── Mijoz (telefon orqali aniqlash) ─────────────────────────
const phone = ref('')
const guestName = ref('')
const matched = ref<UserLookup | null>(null)
const candidates = ref<UserLookup[]>([])
const searching = ref(false)

const phoneDigits = computed(() => phone.value.replace(/\D/g, ''))

async function searchPhone() {
  matched.value = null
  candidates.value = []
  if (phoneDigits.value.length < 7) return
  searching.value = true
  try {
    const { data } = await usersApi.lookupByPhone(phone.value)
    if (data.length === 1) selectCustomer(data[0])
    else if (data.length > 1) candidates.value = data
    // 0 ta → mehmon: guestName qo'lda kiritiladi
  } catch {
    // qidiruv xatosi bron qilishga to'sqinlik qilmasin
  } finally {
    searching.value = false
  }
}

function selectCustomer(u: UserLookup) {
  matched.value = u
  candidates.value = []
  guestName.value = u.displayName
}

function resetCustomer() {
  matched.value = null
  candidates.value = []
}

// ── Sana + bo'sh vaqt slotlari ──────────────────────────────
const date = ref(todayIso())
const selectedStartMin = ref<number | null>(null)

// Toshkent vaqti bo'yicha hozirgi sana va daqiqa (o'tib ketgan slotlarni bloklash uchun)
function tashkentNow(): { dateIso: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return { dateIso: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}
const now = tashkentNow()

// Bugungi kun uchun hozirgi vaqtdan oldingi slot o'tib ketgan
function slotPast(startMin: number): boolean {
  return date.value === now.dateIso && startMin <= now.minutes
}

const dayHours = computed(() => {
  const wd = weekdayFromDate(date.value)
  return hours.value.find((h) => h.weekday === wd) ?? null
})

const dayClosed = computed(() => dayHours.value?.closed === true)

// Tanlangan sanadagi shu xodimning bronlari (band vaqtlarni aniqlash uchun)
const bookingsOnDate = computed(() =>
  props.bookings.filter((b) => b.staffId === props.staffId && b.startAt.slice(0, 10) === date.value),
)

const possibleStarts = computed(() => {
  const s = selectedService.value
  const h = dayHours.value
  if (!s) return []
  const openMin = h?.opensAt ? toMinutes(h.opensAt) : 9 * 60
  const closeMin = h?.closesAt ? toMinutes(h.closesAt) : 18 * 60
  if (dayClosed.value) return []
  return generatePossibleStarts(openMin, closeMin, s.durationMinutes, SLOT_INTERVAL)
})

function slotBusy(startMin: number): boolean {
  const s = selectedService.value
  if (!s) return false
  return isStaffBusy(bookingsOnDate.value, props.staffId, startMin, startMin + s.durationMinutes)
}

// Slot band yoki o'tib ketgan bo'lsa — tanlab bo'lmaydi
function slotDisabled(startMin: number): boolean {
  return slotBusy(startMin) || slotPast(startMin)
}

// Sana yoki xizmat o'zgarsa, tanlangan slot endi mos kelmasligi mumkin — tozalaymiz
watch([date, serviceId], () => {
  selectedStartMin.value = null
})

// ── Yuborish ────────────────────────────────────────────────
const note = ref('')
const saving = ref(false)

// O'zbekiston UTC+5 (DST yo'q) — tanlangan mahalliy vaqtni aniq instantga aylantiramiz
function toInstant(d: string, minutes: number): string {
  return new Date(`${d}T${minutesToLabel(minutes)}:00+05:00`).toISOString()
}

const canSubmit = computed(() =>
  !!serviceId.value &&
  selectedStartMin.value !== null &&
  (!!matched.value || guestName.value.trim().length > 0),
)

async function submit() {
  if (!canSubmit.value || !selectedService.value || selectedStartMin.value === null) return
  saving.value = true
  try {
    const startAt = toInstant(date.value, selectedStartMin.value)
    const endAt = new Date(
      new Date(startAt).getTime() + selectedService.value.durationMinutes * 60_000,
    ).toISOString()

    const { data } = await bookingsApi.create({
      businessId: props.businessId,
      offeredServiceId: serviceId.value,
      staffId: props.staffId,
      startAt,
      endAt,
      customerNote: note.value.trim() || undefined,
      ...(matched.value
        ? { customerId: matched.value.id }
        : { guestName: guestName.value.trim(), guestPhone: phone.value.trim() || undefined }),
    })

    toast.success('Bron yaratildi')
    emit('created', data)
    emit('close')
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Bron yaratishda xatolik')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [servicesRes, hoursRes] = await Promise.all([
      servicesApi.getAll(props.businessId),
      businessHoursApi.getAll(props.businessId),
    ])
    services.value = servicesRes.data.filter((s) => s.active)
    hours.value = hoursRes.data
    if (services.value.length === 1) serviceId.value = services.value[0].id
  } catch {
    toast.error('Ma\'lumotlarni yuklashda xatolik')
  }
})
</script>

<template>
  <AppModal title="Yangi bron" size="md" @close="emit('close')">
    <div class="space-y-4">
      <!-- Telefon -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Mijoz telefoni</label>
        <div class="flex gap-2">
          <input
            v-model="phone"
            type="tel"
            inputmode="tel"
            placeholder="+998 90 123 45 67"
            class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            @blur="searchPhone"
            @input="resetCustomer"
            @keyup.enter="searchPhone"
          />
          <button
            type="button"
            :disabled="searching || phoneDigits.length < 7"
            class="px-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            @click="searchPhone"
          >
            <Loader2 v-if="searching" class="w-4 h-4 animate-spin" />
            <Search v-else class="w-4 h-4" />
          </button>
        </div>

        <div
          v-if="matched"
          class="mt-2 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2"
        >
          <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
          <span>Ro'yxatdagi mijoz: <b>{{ matched.displayName }}</b></span>
        </div>

        <div v-else-if="candidates.length" class="mt-2 space-y-1.5">
          <p class="text-xs text-slate-500">Bir nechta mijoz topildi — birini tanlang:</p>
          <button
            v-for="c in candidates"
            :key="c.id"
            type="button"
            class="w-full text-left px-3 py-2 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50/40 transition-colors text-sm"
            @click="selectCustomer(c)"
          >
            <span class="font-medium text-slate-700">{{ c.displayName }}</span>
            <span class="text-slate-400"> · {{ c.phone || c.login }}</span>
          </button>
        </div>
      </div>

      <!-- Ism (mehmon yoki topilmagan) -->
      <div v-if="!matched">
        <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
          <UserPlus class="w-3.5 h-3.5 text-slate-400" />
          Mijoz ismi
        </label>
        <input
          v-model="guestName"
          type="text"
          placeholder="Ism familiya"
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      <!-- Xizmat -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Xizmat</label>
        <select
          v-model="serviceId"
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 bg-white"
        >
          <option value="" disabled>Xizmatni tanlang</option>
          <option v-for="s in services" :key="s.id" :value="s.id">
            {{ s.name }} · {{ s.durationMinutes }} daq · {{ s.basePrice.toLocaleString('uz-UZ') }} so'm
          </option>
        </select>
      </div>

      <!-- Sana -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Sana</label>
        <input
          v-model="date"
          type="date"
          :min="todayIso()"
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>

      <!-- Bo'sh vaqt slotlari -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Bo'sh vaqt</label>

        <p v-if="!serviceId" class="text-sm text-slate-400 py-2">Avval xizmatni tanlang</p>

        <div v-else-if="dayClosed" class="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
          <CalendarX class="w-4 h-4" />
          Bu kun biznes ishlamaydi
        </div>

        <p v-else-if="possibleStarts.length === 0" class="text-sm text-slate-400 py-2">Bu kun uchun vaqt yo'q</p>

        <div v-else class="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto pr-1">
          <button
            v-for="min in possibleStarts"
            :key="min"
            type="button"
            :disabled="slotDisabled(min)"
            @click="selectedStartMin = min"
            :class="[
              'px-2 py-2 rounded-lg text-sm font-medium border transition-colors',
              slotDisabled(min)
                ? 'border-slate-100 text-slate-300 line-through cursor-not-allowed'
                : selectedStartMin === min
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-slate-200 text-slate-700 hover:border-primary-400 hover:bg-primary-50/40',
            ]"
          >
            {{ minutesToLabel(min) }}
          </button>
        </div>
      </div>

      <!-- Izoh -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Izoh <span class="text-slate-400 font-normal">(ixtiyoriy)</span></label>
        <textarea
          v-model="note"
          rows="2"
          placeholder="Qo'shimcha ma'lumot"
          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
        />
      </div>
    </div>

    <!-- Amallar -->
    <div class="flex gap-3 mt-6">
      <button
        type="button"
        class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        @click="emit('close')"
      >
        Bekor qilish
      </button>
      <button
        type="button"
        :disabled="!canSubmit || saving"
        class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        @click="submit"
      >
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        {{ saving ? 'Saqlanmoqda...' : 'Bron qilish' }}
      </button>
    </div>
  </AppModal>
</template>
