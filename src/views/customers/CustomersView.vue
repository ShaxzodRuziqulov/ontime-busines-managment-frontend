<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Mijozlar</h2>
        <p class="text-slate-500 text-sm mt-1">{{ totalElements }} ta mijoz</p>
      </div>
      <button
        v-if="!businessStore.isReadOnly"
        @click="openAdd"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        Mijoz qo'shish
      </button>
    </div>

    <!-- Qidiruv -->
    <div class="relative mb-5">
      <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
        <Search class="w-4 h-4" />
      </span>
      <input
        v-model="search"
        type="text"
        placeholder="Ism yoki telefon bo'yicha qidirish..."
        class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <SkeletonCard v-for="i in 6" :key="i" :lines="2" show-avatar />
    </div>

    <template v-else>
      <EmptyState
        v-if="customers.length === 0"
        :title="search ? 'Hech narsa topilmadi' : 'Mijoz yo\'q'"
        :description="search
          ? 'Qidiruv bo\'yicha mijoz topilmadi'
          : 'Telefon bilan navbat qo\'shsangiz, mijozlar shu yerga avtomatik yig\'iladi'"
      >
        <template #icon>
          <Users class="w-8 h-8 text-slate-400" />
        </template>
        <template #action>
          <button
            v-if="!businessStore.isReadOnly && !search"
            @click="openAdd"
            class="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            Mijoz qo'shish
          </button>
        </template>
      </EmptyState>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="c in customers"
          :key="c.id"
          :class="[
            'bg-white rounded-2xl border shadow-sm p-5 transition-all',
            c.active ? 'border-slate-100' : 'border-slate-200 opacity-60',
          ]"
        >
          <div class="flex items-center gap-4 mb-3">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0',
                getColor(customerName(c)),
              ]"
            >
              {{ getInitials(customerName(c)) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 truncate">{{ customerName(c) }}</h3>
              <div v-if="c.visitCount > 0" class="flex items-center gap-1 mt-0.5">
                <Repeat class="w-3.5 h-3.5 text-emerald-500" />
                <span class="text-xs font-medium text-emerald-600">{{ c.visitCount }} marta tashrif</span>
              </div>
            </div>
          </div>

          <div class="space-y-1.5 text-sm text-slate-600">
            <div v-if="c.phone" class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span class="truncate">{{ c.phone }}</span>
            </div>
            <div v-if="c.email" class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span class="truncate">{{ c.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-400">
              <CalendarClock class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="text-xs">Oxirgi tashrif: {{ formatDate(c.lastVisitAt) }}</span>
            </div>
          </div>

          <p v-if="c.note" class="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
            {{ c.note }}
          </p>

          <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <span
              :class="[
                'text-xs font-medium px-2.5 py-1 rounded-full',
                c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
              ]"
            >
              {{ c.active ? 'Faol' : 'Nofaol' }}
            </span>
            <div v-if="!businessStore.isReadOnly" class="flex gap-1">
              <button
                class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                @click="openEdit(c)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                @click="deleteConfirm = c.id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sahifalash -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
        <button
          v-for="p in totalPages"
          :key="p"
          @click="page = p - 1"
          :class="[
            'w-9 h-9 rounded-lg text-sm font-semibold transition',
            page === p - 1
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
          ]"
        >
          {{ p }}
        </button>
      </div>
    </template>

    <!-- Add/Edit Modal -->
    <AppModal
      v-if="showModal"
      :title="editing ? 'Mijozni tahrirlash' : 'Yangi mijoz'"
      @close="showModal = false"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism *</label>
          <input
            v-model="form.firstName"
            type="text"
            placeholder="Ismni kiriting"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
            <input
              v-model="form.lastName"
              type="text"
              placeholder="Familiyani kiriting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Otasining ismi</label>
            <input
              v-model="form.middleName"
              type="text"
              placeholder="Otasining ismini kiriting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="+998901234567"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="mijoz@mail.com"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Eslatma <span class="text-slate-400 font-normal">— ixtiyoriy</span>
          </label>
          <textarea
            v-model="form.note"
            rows="2"
            placeholder="Masalan: VIP mijoz, qisqa soch yoqtiradi..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <label v-if="editing" class="flex items-center gap-3 cursor-pointer select-none">
          <span
            @click="form.active = !form.active"
            :class="[
              'relative w-11 h-6 rounded-full transition-colors',
              form.active ? 'bg-primary-600' : 'bg-slate-200',
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                form.active ? 'translate-x-5' : '',
              ]"
            />
          </span>
          <span class="text-sm font-medium text-slate-700">Faol holat</span>
        </label>

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      title="Mijozni o'chirish"
      message="Bu mijozni o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi."
      confirm-label="O'chirish"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus, Users, Trash2, Edit2, Search, Phone, Mail, CalendarClock, Repeat } from 'lucide-vue-next'
import { customersApi } from '@/api/customers'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { Customer, CustomerCreateRequest } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const customers = ref<Customer[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editing = ref<Customer | null>(null)

const search = ref('')
const page = ref(0)
const totalPages = ref(1)
const totalElements = ref(0)
const PAGE_SIZE = 12

const defaultForm = (): CustomerCreateRequest & { active: boolean } => ({
  firstName: '',
  lastName: '',
  middleName: '',
  phone: '',
  email: '',
  note: '',
  active: true,
})
const form = ref(defaultForm())

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 0
    load()
  }, 350)
})
watch(page, load)

async function load() {
  const bid = businessStore.business?.id
  if (!bid) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const { data } = await customersApi.getAll(bid, {
      search: search.value.trim() || undefined,
      page: page.value,
      size: PAGE_SIZE,
    })
    customers.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
  } catch {
    toast.error("Mijozlar ro'yxatini yuklab bo'lmadi")
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editing.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEdit(c: Customer) {
  editing.value = c
  form.value = {
    firstName: c.firstName,
    lastName: c.lastName || '',
    middleName: c.middleName || '',
    phone: c.phone || '',
    email: c.email || '',
    note: c.note || '',
    active: c.active,
  }
  showModal.value = true
}

async function save() {
  const bid = businessStore.business?.id
  if (!bid) return
  if (!form.value.firstName.trim()) {
    toast.error('Ism kiritilishi shart')
    return
  }
  saving.value = true
  try {
    const payload = {
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName?.trim() || (editing.value ? '' : undefined),
      middleName: form.value.middleName?.trim() || (editing.value ? '' : undefined),
      phone: form.value.phone?.trim() || undefined,
      email: form.value.email?.trim() || undefined,
      note: form.value.note?.trim() || undefined,
    }
    if (editing.value) {
      const { data } = await customersApi.update(bid, editing.value.id, {
        ...payload,
        active: form.value.active,
      })
      const idx = customers.value.findIndex((c) => c.id === data.id)
      if (idx !== -1) customers.value[idx] = data
      toast.success('Mijoz yangilandi')
    } else {
      const { data } = await customersApi.create(bid, payload)
      customers.value.unshift(data)
      totalElements.value++
      toast.success("Mijoz qo'shildi")
    }
    showModal.value = false
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    await customersApi.delete(bid, id)
    customers.value = customers.value.filter((c) => c.id !== id)
    totalElements.value = Math.max(0, totalElements.value - 1)
    toast.success("Mijoz o'chirildi")
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || "O'chirishda xatolik yuz berdi")
  }
  deleteConfirm.value = null
}

function getInitials(name: string) {
  return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

function customerName(customer: Customer) {
  return [customer.firstName, customer.lastName, customer.middleName]
      .filter(Boolean)
      .join(' ')
      .trim()
}

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]
function getColor(name: string) {
  return avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length]
}

function formatDate(iso: string | null) {
  if (!iso) return '—'

  const date = new Date(iso)

  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const time = `${hour}:${minute}`.padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().padStart(2, '0')
  return `${year}-${month}-${day}. ${time}`
}

onMounted(load)
</script>
