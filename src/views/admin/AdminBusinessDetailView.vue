<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Building2, Phone, MapPin, Star, Users, Scissors, Clock, Settings,
  CheckCircle2, XCircle, AlertCircle, Loader2, ThumbsUp, ThumbsDown, ShieldCheck,
} from 'lucide-vue-next'
import { businessesApi, type BusinessReviewRequest } from '@/api/businesses'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { businessHoursApi } from '@/api/businessHours'
import { reviewsApi } from '@/api/reviews'
import { useAdminStore } from '@/stores/admin'
import AppModal from '@/components/common/AppModal.vue'
import { useToast } from '@/composables/useToast'
import type { Business, BusinessStatus, BusinessStatusUpdateRequest, OfferedService, StaffMember, BusinessHours, Review } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const adminStore = useAdminStore()

const id = route.params.id as string
const activeTab = ref<'services' | 'staff' | 'hours' | 'reviews'>('services')

const business = ref<Business | null>(null)
const services = ref<OfferedService[]>([])
const staff = ref<StaffMember[]>([])
const hours = ref<BusinessHours[]>([])
const reviews = ref<Review[]>([])

const loading = ref(true)
const tabLoading = ref(false)
const saving = ref(false)
const statusModal = ref(false)
const reviewModal = ref(false)
const reviewForm = ref<BusinessReviewRequest>({ action: 'APPROVE', note: '', subscriptionEndDate: '' })

const allStatuses: BusinessStatus[] = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'DRAFT', 'PENDING_REVIEW']
const statusLabels: Record<BusinessStatus, string> = {
  TRIAL: 'Sinov',
  ACTIVE: 'Faol',
  EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan",
  DRAFT: 'Qoralama',
  PENDING_REVIEW: 'Tekshiruvda',
}

const statusForm = ref<BusinessStatusUpdateRequest>({ status: 'ACTIVE', subscriptionEndDate: '' })

const avgRating = computed(() => {
  if (!reviews.value.length) return null
  return (reviews.value.reduce((s, r) => s + r.stars, 0) / reviews.value.length).toFixed(1)
})

const weekdayLabels: Record<string, string> = {
  MONDAY: 'Dushanba', TUESDAY: 'Seshanba', WEDNESDAY: 'Chorshanba',
  THURSDAY: 'Payshanba', FRIDAY: 'Juma', SATURDAY: 'Shanba', SUNDAY: 'Yakshanba',
}

const weekdayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const sortedHours = computed(() =>
  [...hours.value].sort((a, b) => weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday))
)

const tabs = computed(() => [
  { key: 'services', label: 'Xizmatlar', count: services.value.length, icon: Scissors },
  { key: 'staff', label: 'Xodimlar', count: staff.value.length, icon: Users },
  { key: 'hours', label: 'Ish soatlari', count: hours.value.length, icon: Clock },
  { key: 'reviews', label: 'Sharhlar', count: reviews.value.length, icon: Star },
])

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

function statusIcon(status: BusinessStatus) {
  if (status === 'ACTIVE') return CheckCircle2
  if (status === 'TRIAL' || status === 'PENDING_REVIEW') return AlertCircle
  return XCircle
}

function openStatusModal() {
  if (!business.value) return
  statusForm.value = { status: business.value.status, subscriptionEndDate: business.value.subscriptionEndDate ?? '' }
  statusModal.value = true
}

function toInstant(dateStr: string | undefined | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(dateStr).toISOString()
}

async function updateStatus() {
  if (!business.value) return
  saving.value = true
  try {
    const payload: BusinessStatusUpdateRequest = { status: statusForm.value.status }
    if (statusForm.value.subscriptionEndDate) payload.subscriptionEndDate = toInstant(statusForm.value.subscriptionEndDate)
    const { data } = await businessesApi.updateStatus(business.value.id, payload)
    business.value = data
    adminStore.markLoaded([{ id: data.id, status: data.status }])
    statusModal.value = false
    toast.success('Holat yangilandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function submitReview() {
  if (!business.value) return
  if (reviewForm.value.action === 'REJECT' && !reviewForm.value.note?.trim()) {
    toast.error("Rad etish sababi majburiy")
    return
  }
  saving.value = true
  try {
    const payload: BusinessReviewRequest = {
      action: reviewForm.value.action,
      note: reviewForm.value.note || undefined,
      subscriptionEndDate: toInstant(reviewForm.value.subscriptionEndDate),
    }
    const { data } = await businessesApi.review(business.value.id, payload)
    business.value = data
    adminStore.markLoaded([{ id: data.id, status: data.status }])
    reviewModal.value = false
    toast.success(reviewForm.value.action === 'APPROVE' ? 'Biznes tasdiqlandi' : 'Biznes rad etildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function loadTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  tabLoading.value = true
  try {
    if (tab === 'services' && !services.value.length) {
      const { data } = await servicesApi.getAll(id)
      services.value = data
    } else if (tab === 'staff' && !staff.value.length) {
      const { data } = await staffApi.getAll(id)
      staff.value = data
    } else if (tab === 'hours' && !hours.value.length) {
      const { data } = await businessHoursApi.getAll(id)
      hours.value = data
    } else if (tab === 'reviews' && !reviews.value.length) {
      const { data } = await reviewsApi.getAll(id)
      reviews.value = data
    }
  } catch {
    // tab data yuklashda xato — jadval bo'sh qoladi
  } finally {
    tabLoading.value = false
  }
}

onMounted(async () => {
  try {
    const [bizRes, svcRes] = await Promise.allSettled([
      businessesApi.getById(id),
      servicesApi.getAll(id),
    ])
    if (bizRes.status === 'fulfilled') business.value = bizRes.value.data
    else { router.push('/admin/businesses'); return }
    if (svcRes.status === 'fulfilled') services.value = svcRes.value.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Back -->
    <button
      @click="router.push('/admin/businesses')"
      class="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      Bizneslar ro'yxatiga qaytish
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
    </div>

    <template v-else-if="business">
      <!-- Business header card -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-start gap-4">
            <!-- Icon -->
            <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 class="w-7 h-7 text-primary-600" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="text-xl font-bold text-slate-800">{{ business.name }}</h1>
                <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', statusColor(business.status)]">
                  <component :is="statusIcon(business.status)" class="w-3.5 h-3.5" />
                  {{ statusLabels[business.status] }}
                </span>
              </div>
              <p v-if="business.description" class="text-slate-500 text-sm mb-3">{{ business.description }}</p>
              <div class="flex flex-wrap gap-4 text-sm text-slate-500">
                <span v-if="business.contactPhone" class="flex items-center gap-1.5">
                  <Phone class="w-3.5 h-3.5" />{{ business.contactPhone }}
                </span>
                <span v-if="business.addressLine || business.city" class="flex items-center gap-1.5">
                  <MapPin class="w-3.5 h-3.5" />{{ [business.city, business.addressLine].filter(Boolean).join(', ') }}
                </span>
                <span v-if="avgRating" class="flex items-center gap-1.5">
                  <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{{ avgRating }} / 5
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 sm:items-end">
              <!-- PENDING_REVIEW: alohida approve/reject tugmalar -->
              <template v-if="business.status === 'PENDING_REVIEW'">
                <button
                  @click="reviewForm = { action: 'APPROVE', note: '', subscriptionEndDate: '' }; reviewModal = true"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  <ThumbsUp class="w-4 h-4" />
                  Tasdiqlash
                </button>
                <button
                  @click="reviewForm = { action: 'REJECT', note: '', subscriptionEndDate: '' }; reviewModal = true"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <ThumbsDown class="w-4 h-4" />
                  Rad etish
                </button>
              </template>
              <button
                @click="openStatusModal"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                <Settings class="w-4 h-4" />
                Holat o'zgartirish
              </button>
              <div v-if="business.trialEndDate" class="text-xs text-slate-400 text-right">
                Trial: {{ new Date(business.trialEndDate).toLocaleDateString('uz-UZ') }}
              </div>
              <div v-if="business.subscriptionEndDate" class="text-xs text-slate-400 text-right">
                Obuna: {{ new Date(business.subscriptionEndDate).toLocaleDateString('uz-UZ') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100">
          <div v-for="tab in tabs" :key="tab.key" class="px-5 py-4">
            <div class="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <component :is="tab.icon" class="w-3.5 h-3.5" />
              {{ tab.label }}
            </div>
            <div class="text-xl font-bold text-slate-800">{{ tab.count }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
        <button
          v-for="tab in tabs" :key="tab.key"
          @click="loadTab(tab.key as any)"
          :class="[
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <!-- Loading -->
        <div v-if="tabLoading" class="flex items-center justify-center py-14">
          <Loader2 class="w-6 h-6 text-primary-500 animate-spin" />
        </div>

        <!-- Services -->
        <template v-else-if="activeTab === 'services'">
          <div v-if="services.length === 0" class="py-14 text-center text-slate-400 text-sm">Xizmat yo'q</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Xizmat nomi</th>
                <th class="px-5 py-3 text-left font-medium">Narx</th>
                <th class="px-5 py-3 text-left font-medium">Davomiyligi</th>
                <th class="px-5 py-3 text-left font-medium">Holat</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="svc in services" :key="svc.id" class="hover:bg-slate-50/50">
                <td class="px-5 py-3.5">
                  <p class="font-medium text-slate-800">{{ svc.name }}</p>
                  <p v-if="svc.description" class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{{ svc.description }}</p>
                </td>
                <td class="px-5 py-3.5 text-slate-700 font-medium">
                  {{ svc.basePrice.toLocaleString('uz-UZ') }} so'm
                </td>
                <td class="px-5 py-3.5 text-slate-500">{{ svc.durationMinutes }} daqiqa</td>
                <td class="px-5 py-3.5">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', svc.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                    {{ svc.active ? 'Faol' : "Nofaol" }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- Staff -->
        <template v-else-if="activeTab === 'staff'">
          <div v-if="staff.length === 0" class="py-14 text-center text-slate-400 text-sm">Xodim yo'q</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Xodim</th>
                <th class="px-5 py-3 text-left font-medium">Holat</th>
                <th class="px-5 py-3 text-left font-medium">Qo'shilgan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-for="s in staff" :key="s.id" class="hover:bg-slate-50/50">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users class="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span class="font-medium text-slate-800">{{ s.displayName }}</span>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
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
        <template v-else-if="activeTab === 'hours'">
          <div v-if="sortedHours.length === 0" class="py-14 text-center text-slate-400 text-sm">Ish soatlari belgilanmagan</div>
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
              <tr v-for="h in sortedHours" :key="h.id" :class="['hover:bg-slate-50/50', h.closed && 'opacity-60']">
                <td class="px-5 py-3 font-medium text-slate-800">{{ weekdayLabels[h.weekday] ?? h.weekday }}</td>
                <td class="px-5 py-3 text-slate-600">{{ h.closed ? '—' : h.opensAt }}</td>
                <td class="px-5 py-3 text-slate-600">{{ h.closed ? '—' : h.closesAt }}</td>
                <td class="px-5 py-3">
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', h.closed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700']">
                    {{ h.closed ? 'Yopiq' : 'Ochiq' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- Reviews -->
        <template v-else-if="activeTab === 'reviews'">
          <div v-if="reviews.length === 0" class="py-14 text-center text-slate-400 text-sm">Sharh yo'q</div>
          <div v-else class="divide-y divide-slate-50">
            <div v-for="r in reviews" :key="r.id" class="px-5 py-4">
              <div class="flex items-center gap-2 mb-1">
                <div class="flex gap-0.5">
                  <Star
                    v-for="i in 5" :key="i"
                    class="w-3.5 h-3.5"
                    :class="i <= r.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'"
                  />
                </div>
                <span class="text-xs text-slate-400">{{ new Date(r.createdAt).toLocaleDateString('uz-UZ') }}</span>
              </div>
              <p v-if="r.comment" class="text-sm text-slate-600">{{ r.comment }}</p>
              <p v-else class="text-sm text-slate-400 italic">Izoh yo'q</p>
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Review info banner (already reviewed) -->
    <div
      v-if="business && business.reviewedBy && business.status !== 'PENDING_REVIEW'"
      class="mt-4 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4"
    >
      <ShieldCheck class="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
      <div class="text-sm text-slate-600">
        <span class="font-medium">{{ business.reviewedBy }}</span> tomonidan ko'rib chiqildi
        <span v-if="business.reviewedAt"> — {{ new Date(business.reviewedAt).toLocaleDateString('uz-UZ') }}</span>
        <p v-if="business.reviewNote" class="mt-1 text-slate-500 italic">{{ business.reviewNote }}</p>
      </div>
    </div>

    <!-- Review Modal -->
    <AppModal
      v-if="reviewModal && business"
      :title="reviewForm.action === 'APPROVE' ? 'Biznesni tasdiqlash' : 'Biznesni rad etish'"
      @close="reviewModal = false"
    >
      <form @submit.prevent="submitReview" class="space-y-4">
        <div v-if="reviewForm.action === 'APPROVE'" class="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <ThumbsUp class="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p class="text-sm text-emerald-700">Biznes ACTIVE holatga o'tadi va egasiga kirish ochiladi.</p>
        </div>
        <div v-else class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <ThumbsDown class="w-4 h-4 text-red-600 flex-shrink-0" />
          <p class="text-sm text-red-700">Biznes DRAFT holatga qaytadi. Sabab ko'rsatish majburiy.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ reviewForm.action === 'REJECT' ? 'Rad etish sababi *' : "Izoh (ixtiyoriy)" }}
          </label>
          <textarea
            v-model="reviewForm.note"
            rows="3"
            :placeholder="reviewForm.action === 'REJECT' ? 'Nima sababdan rad etilmoqda...' : 'Tasdiqlash izohi...'"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div v-if="reviewForm.action === 'APPROVE'">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Obuna tugash sanasi (ixtiyoriy)</label>
          <input
            v-model="reviewForm.subscriptionEndDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="reviewModal = false">Bekor</button>
          <button
            type="submit"
            :disabled="saving"
            :class="[
              'flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors',
              reviewForm.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
            ]"
          >
            {{ saving ? 'Saqlanmoqda...' : (reviewForm.action === 'APPROVE' ? 'Tasdiqlash' : 'Rad etish') }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Status Modal -->
    <AppModal v-if="statusModal && business" :title="`Holat: ${business.name}`" @close="statusModal = false">
      <form @submit.prevent="updateStatus" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Yangi holat</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="s in allStatuses" :key="s" type="button"
              @click="statusForm.status = s"
              :class="[
                'px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all',
                statusForm.status === s ? statusColor(s) + ' border-current' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              <div class="flex items-center gap-1.5">
                <component :is="statusIcon(s)" class="w-3.5 h-3.5" />
                {{ statusLabels[s] }}
              </div>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Obuna tugash sanasi</label>
          <input v-model="statusForm.subscriptionEndDate" type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="statusModal = false">Bekor</button>
          <button type="submit" :disabled="saving" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Yangilash' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
