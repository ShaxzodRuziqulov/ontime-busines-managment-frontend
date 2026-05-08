<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Plus, Scissors, Trash2, Edit2, Clock, Banknote,
  ToggleLeft, ToggleRight, ImagePlus, X as XIcon,
} from 'lucide-vue-next'
import { servicesApi } from '@/api/services'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { OfferedService, ServiceCreateRequest } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? ''

const businessStore = useBusinessStore()
const toast = useToast()

const services = ref<OfferedService[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editingService = ref<OfferedService | null>(null)

// Image upload state
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const imageUploading = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)

const defaultForm = (): ServiceCreateRequest => ({
  name: '',
  description: '',
  basePrice: 0,
  durationMinutes: 30,
  active: true,
})

const form = ref<ServiceCreateRequest>(defaultForm())

function openAdd() {
  editingService.value = null
  form.value = defaultForm()
  imageFile.value = null
  imagePreview.value = null
  showModal.value = true
}

function openEdit(service: OfferedService) {
  editingService.value = service
  form.value = {
    name: service.name,
    description: service.description,
    basePrice: service.basePrice,
    durationMinutes: service.durationMinutes,
    active: service.active,
  }
  imageFile.value = null
  imagePreview.value = service.imageUrl ? `${BASE_URL}${service.imageUrl}` : null
  showModal.value = true
}

function onImagePick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

function removeImage() {
  imageFile.value = null
  imagePreview.value = null
  if (imageInput.value) imageInput.value.value = ''
}

async function save() {
  if (!form.value.name || form.value.basePrice < 0) return
  const bid = businessStore.business?.id
  if (!bid) return
  saving.value = true
  try {
    let saved: OfferedService
    if (editingService.value) {
      const editingId = editingService.value.id
      const { data } = await servicesApi.update(bid, editingId, form.value)
      saved = data
      // Upload new image if chosen
      if (imageFile.value) {
        imageUploading.value = true
        const { data: withImg } = await servicesApi.uploadImage(bid, editingId, imageFile.value)
        saved = withImg
        imageUploading.value = false
      } else if (editingService.value.imageUrl && !imagePreview.value) {
        // User removed image
        const { data: noImg } = await servicesApi.deleteImage(bid, editingId)
        saved = noImg
      }
      const idx = services.value.findIndex((s) => s.id === editingId)
      if (idx !== -1) services.value[idx] = saved
      toast.success('Xizmat yangilandi')
    } else {
      const { data } = await servicesApi.create(bid, form.value)
      saved = data
      if (imageFile.value) {
        imageUploading.value = true
        const { data: withImg } = await servicesApi.uploadImage(bid, saved.id, imageFile.value)
        saved = withImg
        imageUploading.value = false
      }
      services.value.unshift(saved)
      toast.success("Yangi xizmat qo'shildi")
    }
    showModal.value = false
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
    imageUploading.value = false
  }
}

async function toggleActive(service: OfferedService) {
  const bid = businessStore.business?.id
  if (!bid) return
  const { data } = await servicesApi.update(bid, service.id, { active: !service.active })
  const idx = services.value.findIndex((s) => s.id === service.id)
  if (idx !== -1) services.value[idx] = data
}

async function confirmDelete(id: string) {
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    await servicesApi.delete(bid, id)
    services.value = services.value.filter((s) => s.id !== id)
    toast.success("Xizmat o'chirildi")
  } catch {
    toast.error("O'chirishda xatolik yuz berdi")
  }
  deleteConfirm.value = null
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('uz-UZ').format(price) + " so'm"
}

function imgUrl(url: string | null) {
  if (!url) return null
  return url.startsWith('http') ? url : `${BASE_URL}${url}`
}

onMounted(async () => {
  try {
    const bid = businessStore.business?.id
    if (bid) {
      const { data } = await servicesApi.getAll(bid)
      services.value = data
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Xizmatlar</h1>
        <p class="text-slate-500 text-sm mt-1">{{ services.length }} ta xizmat</p>
      </div>
      <button
        v-if="!businessStore.isExpired"
        @click="openAdd"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        Xizmat qo'shish
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <SkeletonCard v-for="i in 6" :key="i" :lines="3" />
    </div>

    <template v-else>
      <EmptyState
        v-if="services.length === 0"
        title="Xizmat yo'q"
        description="Birinchi xizmatni qo'shing va mijozlar uni tanlashi mumkin bo'ladi"
      >
        <template #icon>
          <Scissors class="w-8 h-8 text-slate-400" />
        </template>
        <template #action>
          <button
            v-if="!businessStore.isExpired"
            @click="openAdd"
            class="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            Xizmat qo'shish
          </button>
        </template>
      </EmptyState>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="service in services"
          :key="service.id"
          :class="[
            'bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all',
            service.active ? 'border-slate-100' : 'border-slate-200 opacity-60',
          ]"
        >
          <!-- Service image banner -->
          <div v-if="service.imageUrl" class="relative h-36 overflow-hidden">
            <img
              :src="imgUrl(service.imageUrl)!"
              :alt="service.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          <!-- Card body -->
          <div class="p-5 flex flex-col gap-3 flex-1">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-800 truncate">{{ service.name }}</h3>
                <p v-if="service.description" class="text-sm text-slate-500 mt-0.5 line-clamp-2">
                  {{ service.description }}
                </p>
              </div>
              <button
                @click="toggleActive(service)"
                class="ml-2 flex-shrink-0 transition-colors"
                :title="service.active ? 'O\'chirish' : 'Yoqish'"
              >
                <ToggleRight v-if="service.active" class="w-6 h-6 text-emerald-500" />
                <ToggleLeft v-else class="w-6 h-6 text-slate-300" />
              </button>
            </div>

            <!-- Price & duration -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5 text-sm text-slate-600">
                <Banknote class="w-4 h-4 text-slate-400" />
                <span class="font-semibold text-slate-800">{{ formatPrice(service.basePrice) }}</span>
              </div>
              <div class="flex items-center gap-1.5 text-sm text-slate-500">
                <Clock class="w-4 h-4 text-slate-400" />
                {{ service.durationMinutes }} daqiqa
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
              <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', service.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                {{ service.active ? 'Faol' : 'Nofaol' }}
              </span>
              <div class="flex gap-1">
                <button
                  class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  @click="openEdit(service)"
                >
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  @click="deleteConfirm = service.id"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Add/Edit Modal -->
    <AppModal
      v-if="showModal"
      :title="editingService ? 'Xizmatni tahrirlash' : 'Yangi xizmat'"
      @close="showModal = false"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Xizmat nomi *</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Soch kesish"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Tavsif</label>
          <textarea
            v-model="form.description"
            placeholder="Xizmat haqida qisqacha..."
            rows="2"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Narx (so'm) *</label>
            <input
              v-model.number="form.basePrice"
              type="number"
              min="0"
              placeholder="50000"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Davomiylik (daqiqa) *</label>
            <input
              v-model.number="form.durationMinutes"
              type="number"
              min="5"
              placeholder="30"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Image upload -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Reklama rasmi (ixtiyoriy)</label>

          <!-- Preview -->
          <div v-if="imagePreview" class="relative rounded-xl overflow-hidden mb-2 h-32">
            <img :src="imagePreview" alt="preview" class="w-full h-full object-cover" />
            <button
              type="button"
              @click="removeImage"
              class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Upload area -->
          <label
            v-else
            class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
          >
            <ImagePlus class="w-6 h-6 text-slate-400" />
            <span class="text-sm text-slate-500">Rasm yuklash uchun bosing</span>
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onImagePick"
            />
          </label>
        </div>

        <label class="flex items-center gap-3 cursor-pointer select-none">
          <div
            @click="form.active = !form.active"
            :class="['relative w-11 h-6 rounded-full transition-colors', form.active ? 'bg-primary-600' : 'bg-slate-200']"
          >
            <div :class="['absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.active ? 'translate-x-5' : '']" />
          </div>
          <span class="text-sm font-medium text-slate-700">Faol holat</span>
        </label>

        <div class="flex gap-3 pt-2">
          <button type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving || imageUploading"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {{ saving || imageUploading ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      title="Xizmatni o'chirish"
      message="Bu xizmatni o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi."
      confirm-label="O'chirish"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
