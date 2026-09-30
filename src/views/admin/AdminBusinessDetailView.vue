<template>
  <div>
    <!-- Back -->
    <button
      @click="router.push('/admin/businesses')"
      class="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
    >
      <ArrowLeft class="w-4 h-4" />
      {{ t('bizDetail.back') }}
    </button>

    <!-- Loading -->
    <div
        v-if="loading"
        class="flex items-center justify-center py-20"
    >
      <Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
    </div>

    <template
        v-else-if="business"
    >
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
                <h1 class="text-xl font-bold text-slate-800">
                  {{ business.name }}
                </h1>
                <span
                    :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                     statusColor(business.status)]"
                >
                  <component
                      :is="statusIcon(business.status)"
                      class="w-3.5 h-3.5"
                  />
                  {{ statusLabels[business.status] }}
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  <Tag class="w-3.5 h-3.5" />
                  {{ categoryLabel(business.category) }}
                </span>
              </div>
              <p
                  v-if="business.description"
                  class="text-slate-500 text-sm mb-3"
              >
                {{ business.description }}
              </p>
              <div class="flex flex-wrap gap-4 text-sm text-slate-500">
                <span
                    v-if="business.contactPhone"
                    class="flex items-center gap-1.5"
                >
                  <Phone class="w-3.5 h-3.5" />{{ business.contactPhone }}
                </span>
                <span
                    v-if="business.addressLine || business.city"
                    class="flex items-center gap-1.5"
                >
                  <MapPin class="w-3.5 h-3.5" />
                  {{ [business.city, business.addressLine].filter(Boolean).join(', ') }}
                </span>
                <span
                    v-if="avgRating"
                    class="flex items-center gap-1.5"
                >
                  <Star class="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{{ avgRating }} / 5
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-2 sm:items-end">
              <!-- PENDING_REVIEW: alohida approve/reject tugmalar -->
              <template
                  v-if="business.status === 'PENDING_REVIEW'"
              >
                <button
                  @click="reviewForm = { action: 'APPROVE', note: '', subscriptionEndDate: '' };
                  reviewModal = true"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                >
                  <ThumbsUp class="w-4 h-4" />
                  {{ t('bizDetail.approve') }}
                </button>
                <button
                  @click="reviewForm = { action: 'REJECT', note: '', subscriptionEndDate: '' };
                  reviewModal = true"
                  class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                >
                  <ThumbsDown class="w-4 h-4" />
                  {{ t('bizDetail.reject') }}
                </button>
              </template>
              <button
                @click="openStatusModal"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium transition-colors"
              >
                <Settings class="w-4 h-4" />
                {{ t('bizDetail.changeStatus') }}
              </button>
              <div
                  v-if="business.trialEndDate"
                  class="text-xs text-slate-400 text-right"
              >
                {{ t('bizDetail.trialUntil', { date: new Date(business.trialEndDate).toLocaleDateString(dateLocale()) }) }}
              </div>
              <div
                  v-if="business.subscriptionEndDate"
                  class="text-xs text-slate-400 text-right"
              >
                {{ t('bizDetail.subscriptionUntil', { date: new Date(business.subscriptionEndDate).toLocaleDateString(dateLocale()) }) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100">
          <div
              v-for="tab in tabs"
              :key="tab.key"
              class="px-5 py-4"
          >
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
          v-for="tab in tabs"
          :key="tab.key"
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
      <BusinessTabContent
        :active-tab="activeTab"
        :tab-loading="tabLoading"
        :services="services"
        :staff="staff"
        :hours="hours"
        :reviews="reviews"
      />
    </template>

    <!-- Review info banner (already reviewed) -->
    <div
      v-if="business && business.reviewedBy && business.status !== 'PENDING_REVIEW'"
      class="mt-4 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4"
    >
      <ShieldCheck class="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
      <div class="text-sm text-slate-600">
        <span class="font-medium">
          {{ business.reviewedBy }}
        </span>
        {{ t('bizDetail.reviewedBy') }}
        <span v-if="business.reviewedAt">
          — {{ new Date(business.reviewedAt).toLocaleDateString(dateLocale()) }}
        </span>
        <p
            v-if="business.reviewNote"
            class="mt-1 text-slate-500 italic"
        >
          {{ business.reviewNote }}
        </p>
      </div>
    </div>

    <!-- Review Modal -->
    <AppModal
      v-if="reviewModal && business"
      :title="reviewForm.action === 'APPROVE' ? t('bizDetail.approveTitle') : t('bizDetail.rejectTitle')"
      @close="reviewModal = false"
    >
      <form
          @submit.prevent="submitReview"
          class="space-y-4"
      >
        <div
            v-if="reviewForm.action === 'APPROVE'"
            class="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
        >
          <ThumbsUp class="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p class="text-sm text-emerald-700">
            {{ t('bizDetail.approveInfo') }}
          </p>
        </div>
        <div v-else class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <ThumbsDown class="w-4 h-4 text-red-600 flex-shrink-0" />
          <p class="text-sm text-red-700">
            {{ t('bizDetail.rejectInfo') }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ reviewForm.action === 'REJECT' ? t('bizDetail.rejectReason') : t('bizDetail.noteOptional') }}
          </label>
          <textarea
            v-model="reviewForm.note"
            rows="3"
            :placeholder="reviewForm.action === 'REJECT' ? t('bizDetail.rejectPlaceholder') : t('bizDetail.approvePlaceholder')"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div v-if="reviewForm.action === 'APPROVE'">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('bizDetail.subEndOptional') }}
          </label>
          <input
            v-model="reviewForm.subscriptionEndDate"
            type="date"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              @click="reviewModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="saving"
            :class="[
              'flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors',
              reviewForm.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
            ]"
          >
            {{ saving ? t('common.saving') : (reviewForm.action === 'APPROVE' ? t('bizDetail.approve') : t('bizDetail.reject')) }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Status Modal -->
    <AppModal
        v-if="statusModal && business"
        :title="t('bizDetail.statusTitle', { name: business.name })"
        @close="statusModal = false"
    >
      <form
          @submit.prevent="updateStatus"
          class="space-y-4"
      >
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            {{ t('bizDetail.newStatus') }}
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="s in allStatuses" :key="s" type="button"
              @click="selectStatus(s)"
              :class="[
                'px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all',
                statusForm.status === s ? statusColor(s) + ' border-current' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              <span class="flex items-center gap-1.5">
                <component
                    :is="statusIcon(s)"
                    class="w-3.5 h-3.5"
                />
                {{ statusLabels[s] }}
              </span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ t('bizDetail.subEnd') }}
          </label>
          <input
              v-model="statusForm.subscriptionEndDate"
              type="date"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p class="text-xs text-slate-400 mt-1">
            {{ t('bizDetail.subEndHint') }}
          </p>
        </div>
        <div class="flex gap-3 pt-2">
          <button
              type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              @click="statusModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
              type="submit"
              :disabled="saving"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
          >
            {{ saving ? t('common.saving') : t('bizDetail.update') }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Building2, Phone, MapPin, Star, Users, Clock, Settings,
  CheckCircle2, XCircle, AlertCircle, Loader2, ThumbsUp, ThumbsDown, ShieldCheck,
  Tag, Briefcase
} from 'lucide-vue-next'
import { businessesApi, type BusinessReviewRequest } from '@/api/businesses'
import { servicesApi } from '@/api/services'
import { staffApi } from '@/api/staff'
import { businessHoursApi } from '@/api/businessHours'
import { reviewsApi } from '@/api/reviews'
import { useAdminStore } from '@/stores/admin'
import AppModal from '@/components/common/AppModal.vue'
import BusinessTabContent from '@/components/admin/BusinessTabContent.vue'
import { useToast } from '@/composables/useToast'
import { businessStatusLabels, businessStatusColor } from '@/utils/businessStatus'
import type { Business, BusinessCategory, BusinessStatus, BusinessStatusUpdateRequest, OfferedService, StaffMember, BusinessHours, Review } from '@/types'
import { useI18n } from 'vue-i18n'
import { dateLocale } from '@/i18n'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()
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
const statusLabels = businessStatusLabels

const statusForm = ref<BusinessStatusUpdateRequest>({ status: 'ACTIVE', subscriptionEndDate: '' })

const avgRating = computed(() => {
  if (!reviews.value.length) return null
  return (reviews.value.reduce((s, r) => s + r.stars, 0) / reviews.value.length).toFixed(1)
})

const tabs = computed(() => [
  { key: 'services', label: t('bizDetail.tabServices'), count: services.value.length, icon: Briefcase },
  { key: 'staff', label: t('bizDetail.tabStaff'), count: staff.value.length, icon: Users },
  { key: 'hours', label: t('bizDetail.tabHours'), count: hours.value.length, icon: Clock },
  { key: 'reviews', label: t('bizDetail.tabReviews'), count: reviews.value.length, icon: Star },
])

const statusColor = businessStatusColor

function statusIcon(status: BusinessStatus) {
  if (status === 'ACTIVE') return CheckCircle2
  if (status === 'TRIAL' || status === 'PENDING_REVIEW') return AlertCircle
  return XCircle
}

function categoryLabel(category?: BusinessCategory) {
  return t(`category.${category ?? 'OTHER'}`)
}

function openStatusModal() {
  if (!business.value) return
  const subscriptionDate = dateInputValue(business.value.subscriptionEndDate)
  statusForm.value = {
    status: business.value.status,
    subscriptionEndDate: isPastDate(subscriptionDate) ? '' : subscriptionDate,
  }
  statusModal.value = true
}

function toEndOfDayInstant(dateStr: string | undefined | null): string | undefined {
  if (!dateStr) return undefined
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

function dateInputValue(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

function isPastDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false
  return dateStr < new Date().toISOString().slice(0, 10)
}

function selectStatus(status: BusinessStatus) {
  statusForm.value.status = status
  if (status === 'ACTIVE' && isPastDate(statusForm.value.subscriptionEndDate)) {
    statusForm.value.subscriptionEndDate = ''
  }
}

async function updateStatus() {
  if (!business.value) return
  saving.value = true
  try {
    const payload: BusinessStatusUpdateRequest = { status: statusForm.value.status }
    payload.subscriptionEndDate = statusForm.value.subscriptionEndDate
        ? toEndOfDayInstant(statusForm.value.subscriptionEndDate)
        : null
    const { data } = await businessesApi.updateStatus(business.value.id, payload)
    business.value = data
    adminStore.upsertOne({ id: data.id, status: data.status })
    statusModal.value = false
    toast.success(t('bizDetail.statusUpdated'))
  } catch (e) {
    const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(message || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function submitReview() {
  if (!business.value) return
  if (reviewForm.value.action === 'REJECT' && !reviewForm.value.note?.trim()) {
    toast.error(t('bizDetail.rejectReasonRequired'))
    return
  }
  saving.value = true
  try {
    const payload: BusinessReviewRequest = {
      action: reviewForm.value.action,
      note: reviewForm.value.note || undefined,
      subscriptionEndDate: toEndOfDayInstant(reviewForm.value.subscriptionEndDate),
    }
    const { data } = await businessesApi.review(business.value.id, payload)
    business.value = data
    adminStore.upsertOne({ id: data.id, status: data.status })
    reviewModal.value = false
    toast.success(reviewForm.value.action === 'APPROVE' ? t('bizDetail.approved') : t('bizDetail.rejected'))
  } catch {
    toast.error(t('common.error'))
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
      const { data } = await reviewsApi.getAll({ businessId: id })
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
    else {
      await router.push('/admin/businesses');
      return
    }
    if (svcRes.status === 'fulfilled') services.value = svcRes.value.data
  } finally {
    loading.value = false
  }
})
</script>
