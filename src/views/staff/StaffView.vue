<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Xodimlar</h2>
        <p class="text-slate-500 text-sm mt-1">{{ staff.length }} ta xodim</p>
      </div>
      <button
        v-if="!businessStore.isReadOnly"
        @click="openAdd"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        Xodim qo'shish
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <SkeletonCard v-for="i in 6" :key="i" :lines="2" show-avatar />
    </div>

    <template v-else>
      <EmptyState
        v-if="staff.length === 0"
        title="Xodim yo'q"
        description="Birinchi xodimni qo'shing va ular navbatlar uchun tanlanishi mumkin bo'ladi"
      >
        <template #icon>
          <Users class="w-8 h-8 text-slate-400" />
        </template>
        <template #action>
          <button
            v-if="!businessStore.isReadOnly"
            @click="openAdd"
            class="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700"
          >
            Xodim qo'shish
          </button>
        </template>
      </EmptyState>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="member in staff"
          :key="member.id"
          :class="[
            'bg-white rounded-2xl border shadow-sm p-5 transition-all',
            member.active ? 'border-slate-100' : 'border-slate-200 opacity-60',
          ]"
        >
          <div class="flex items-center gap-4 mb-4">
            <!-- Avatar -->
            <img
                v-if="member.avatarUrl"
                :src="getAvatarUrl(member.avatarUrl)"
                alt="Xodim"
                class="w-12 h-12 rounded-full"
            >
            <div
                v-else
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0',
                getColor(personName(member)),
              ]"
            >
              {{ getInitials(personName(member)) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 truncate">{{ personName(member) }}</h3>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="flex items-center gap-1">
                  <Briefcase class="w-3.5 h-3.5 text-slate-400" />
                  <span class="text-sm text-slate-500">{{
                    member.linkedUserId ? "Bog'langan" : 'Mustaqil'
                  }}</span>
                </div>
                <!-- Avg rating badge -->
                <div
                  v-if="ratings[member.id] > 0"
                  class="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-full"
                >
                  <Star class="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span class="text-xs font-medium text-amber-600">{{
                    ratings[member.id].toFixed(1)
                  }}</span>
                </div>
              </div>
            </div>
            <button
              v-if="!businessStore.isReadOnly"
              @click="toggleActive(member)"
              class="flex-shrink-0"
            >
              <ToggleRight v-if="member.active" class="w-6 h-6 text-emerald-500" />
              <ToggleLeft v-else class="w-6 h-6 text-slate-300" />
            </button>
          </div>

          <div class="mb-4 min-h-8">
            <div v-if="member.serviceIds?.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="serviceId in member.serviceIds.slice(0, 3)"
                :key="serviceId"
                class="max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
              >
                {{ serviceName(serviceId) }}
              </span>
              <span
                v-if="member.serviceIds.length > 3"
                class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500"
              >
                +{{ member.serviceIds.length - 3 }}
              </span>
            </div>
            <p v-else class="text-xs font-medium text-red-500">Xizmat biriktirilmagan</p>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <span
              :class="[
                'text-xs font-medium px-2.5 py-1 rounded-full',
                member.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
              ]"
            >
              {{ member.active ? 'Faol' : 'Nofaol' }}
            </span>
            <div v-if="!businessStore.isReadOnly" class="flex gap-1">
              <button
                class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                @click="openEdit(member)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                @click="deleteConfirm = member.id"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Add/Edit Modal -->
    <AppModal
      v-if="showModal"
      :title="editingStaff ? 'Xodimni tahrirlash' : 'Yangi xodim'"
      size="lg"
      @close="showModal = false"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism *</label>
            <input
              v-model="form.firstName"
              type="text"
              placeholder="Ism kiriting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
            <input
              v-model="form.lastName"
              type="text"
              placeholder="Familiya kiriting"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Qila oladigan xizmatlar
          </label>
          <div v-if="services.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="service in services"
              :key="service.id"
              :class="[
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all',
                form.serviceIds?.includes(service.id)
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              ]"
            >
              <img
                  v-if="service.imageUrl"
                  :src="mediaUrl(service.imageUrl) ?? ''"
                  class="w-12 h-10 rounded-md" alt=""
              >
              <input
                v-model="form.serviceIds"
                type="checkbox"
                :value="service.id"
                class="sr-only"
              />
              <span class="min-w-0 truncate font-medium">{{ service.name }}</span>
              <span class="flex-shrink-0 text-xs text-slate-400">{{ service.durationMinutes }} daq</span>
            </label>
          </div>
          <p v-else class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Avval xizmat qo'shing, keyin xodimni shu xizmatlarga biriktirasiz.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Hisob (portalga kirish)
          </label>

          <!-- Mode tabs -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              @click="setAccountMode('register')"
              :disabled="!!editingStaff?.linkedUserId"
              :title="editingStaff?.linkedUserId ? 'Xodim allaqachon hisobga bog\'langan' : ''"
              :class="[
                'px-3 py-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                accountMode === 'register' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              Yangi hisob yaratish
            </button>
            <button
              type="button"
              @click="setAccountMode('link')"
              :class="[
                'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                accountMode === 'link' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ]"
            >
              Mavjud loginni bog'lash
            </button>
          </div>

          <!-- "register" rejimi: yangi login/parol -->
          <div v-if="accountMode === 'register'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Login *</label>
              <input
                v-model="registerForm.login"
                type="text"
                placeholder="Loginni kiriting"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Parol *</label>
              <input
                v-model="registerForm.password"
                type="text"
                placeholder="Kamida 4 belgi"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div class="contents">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Email (ixtiyoriy)</label>
                <input
                  v-model="registerForm.email"
                  type="email"
                  placeholder="example@gmail.com"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Telefon (ixtiyoriy)</label>
                <input
                  v-model="registerForm.phone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <!-- "link" rejimi: mavjud loginni qidirish -->
          <template v-else-if="accountMode === 'link'">
            <template v-if="linkedUser">
              <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <span class="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 class="w-4 h-4" />
                  {{ personName(linkedUser) }}<template v-if="linkedUser.login"> ({{ linkedUser.login }})</template>
                </span>
                <button type="button" @click="unlinkUser" class="text-emerald-600 hover:text-emerald-800">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>

              <!-- Bog'langan hisobning ma'lumotlarini yangilash (faqat tahrirlashda) -->
              <details v-if="editingStaff" class="group bg-slate-50 rounded-xl mt-3">
                <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-slate-600">
                  Hisob ma'lumotlarini o'zgartirish
                  <span class="text-slate-400 transition-transform group-open:rotate-180">v</span>
                </summary>
                <div class="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
                  <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Ism</label>
                    <input
                      v-model="accountUpdateForm.firstName"
                      type="text"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Familiya</label>
                    <input
                      v-model="accountUpdateForm.lastName"
                      type="text"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      v-model="accountUpdateForm.email"
                      type="email"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
                    <input
                      v-model="accountUpdateForm.phone"
                      type="tel"
                      placeholder="+998901234567"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 mb-1">Yangi parol</label>
                    <input
                      v-model="accountUpdateForm.password"
                      type="text"
                      placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </details>
            </template>
            <div v-else class="flex gap-2">
              <input
                v-model="linkLogin"
                type="text"
                placeholder="Foydalanuvchi login"
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                @keydown.enter.prevent="lookupUser"
              />
              <button
                type="button"
                :disabled="linkLookupLoading || !linkLogin.trim()"
                @click="lookupUser"
                class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                <Search class="w-4 h-4" />
                {{ linkLookupLoading ? 'Qidirilmoqda...' : 'Tekshirish' }}
              </button>
            </div>
            <p v-if="linkLookupError" class="text-xs text-red-600 mt-1.5">{{ linkLookupError }}</p>
            <p class="text-xs text-slate-500 mt-1.5">Xodim avval o'zi ro'yxatdan o'tgan (login yaratgan) bo'lishi kerak.</p>
          </template>
        </div>

        <div class="sticky -bottom-5 -mx-6 flex flex-col gap-3 border-t border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <div
              @click="form.active = !form.active"
              :class="[
                'relative w-11 h-6 rounded-full transition-colors',
                form.active ? 'bg-primary-600' : 'bg-slate-200',
              ]"
            >
              <div
                :class="[
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  form.active ? 'translate-x-5' : '',
                ]"
              />
            </div>
            <span class="text-sm font-medium text-slate-700">Faol holat</span>
          </label>

          <div class="flex gap-3 sm:w-72">
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
        </div>
      </form>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      title="Xodimni o'chirish"
      message="Bu xodimni o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi."
      confirm-label="O'chirish"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Users, Trash2, Edit2, ToggleLeft, ToggleRight, Briefcase, Star, Search, X as XIcon, CheckCircle2 } from 'lucide-vue-next'
import { staffApi } from '@/api/staff'
import { servicesApi } from '@/api/services'
import { reviewsApi } from '@/api/reviews'
import { usersApi, type UserLookup } from '@/api/users'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import { personName } from '@/utils/names'
import { mediaUrl } from '@/utils/media'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { StaffMember, StaffCreateRequest, StaffRegisterRequest, StaffAccountUpdateRequest, OfferedService } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const staff = ref<StaffMember[]>([])
const services = ref<OfferedService[]>([])
const ratings = ref<Record<string, number>>({})
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editingStaff = ref<StaffMember | null>(null)

const defaultForm = (): StaffCreateRequest => ({
  firstName: '',
  lastName: '',
  serviceIds: [],
  active: true,
  linkedUserId: null,
})

const form = ref<StaffCreateRequest>(defaultForm())

// Hisob rejimi: hisobsiz / mavjud loginni bog'lash / yangi hisob yaratish
type AccountMode = 'none' | 'link' | 'register'
const accountMode = ref<AccountMode>('none')

// "link" rejimi uchun
const linkLogin = ref('')
const linkLookupLoading = ref(false)
const linkLookupError = ref('')
const linkedUser = ref<UserLookup | null>(null)

// "register" rejimi uchun
const registerForm = ref({ login: '', password: '', email: '', phone: '' })

// Allaqachon bog'langan hisobni yangilash uchun (tahrirlashda)
const accountUpdateForm = ref({ firstName: '', lastName: '', email: '', phone: '', password: '' })
const originalAccountUpdateForm = ref({ firstName: '', lastName: '', email: '', phone: '', password: '' })

function openAdd() {
  editingStaff.value = null
  form.value = defaultForm()
  accountMode.value = 'register'
  linkLogin.value = ''
  linkedUser.value = null
  linkLookupError.value = ''
  registerForm.value = { login: '', password: '', email: '', phone: '' }
  accountUpdateForm.value = { firstName: '', lastName: '', email: '', phone: '', password: '' }
  originalAccountUpdateForm.value = { firstName: '', lastName: '', email: '', phone: '', password: '' }
  showModal.value = true
}

async function openEdit(member: StaffMember) {
  editingStaff.value = member
  form.value = {
    firstName: member.firstName,
    lastName: member.lastName ?? '',
    serviceIds: [...(member.serviceIds ?? [])],
    active: member.active,
    linkedUserId: member.linkedUserId,
  }
  linkLogin.value = ''
  linkLookupError.value = ''
  registerForm.value = { login: '', password: '', email: '', phone: '' }
  accountUpdateForm.value = { firstName: '', lastName: '', email: '', phone: '', password: '' }
  originalAccountUpdateForm.value = { firstName: '', lastName: '', email: '', phone: '', password: '' }
  if (member.linkedUserId) {
    accountMode.value = 'link'
    linkedUser.value = { id: member.linkedUserId, login: '', firstName: "Bog'langan foydalanuvchi", lastName: null }
    showModal.value = true
    const bid = businessStore.business?.id
    try {
      if (bid) {
        const { data } = await staffApi.getAccount(bid, member.id)
        linkedUser.value = data
        accountUpdateForm.value = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
        }
        originalAccountUpdateForm.value = { ...accountUpdateForm.value }
      }
    } catch {
      toast.error("Bog'langan hisob ma'lumotlarini yuklab bo'lmadi")
    }
  } else {
    accountMode.value = 'none'
    linkedUser.value = null
    showModal.value = true
  }
}

async function lookupUser() {
  if (!linkLogin.value.trim()) return
  linkLookupLoading.value = true
  linkLookupError.value = ''
  try {
    const { data } = await usersApi.lookupByLogin(linkLogin.value.trim())
    linkedUser.value = data
    form.value.linkedUserId = data.id
    form.value.firstName = data.firstName || ''
    form.value.lastName = data.lastName || ''
  } catch {
    linkLookupError.value = 'Bu login bilan foydalanuvchi topilmadi'
    linkedUser.value = null
    form.value.linkedUserId = null
  } finally {
    linkLookupLoading.value = false
  }
}

function unlinkUser() {
  linkedUser.value = null
  linkLogin.value = ''
  form.value.linkedUserId = null
}

function setAccountMode(mode: AccountMode) {
  accountMode.value = mode
  if (mode !== 'link') unlinkUser()
}

function staffPayload(): StaffCreateRequest {
  return {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName?.trim() || null,
    active: form.value.active,
    linkedUserId: form.value.linkedUserId ?? null,
    serviceIds: [...(form.value.serviceIds ?? [])],
  }
}

function staffRegisterPayload(): StaffRegisterRequest {
  return {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName?.trim() || undefined,
    serviceIds: [...(form.value.serviceIds ?? [])],
    login: registerForm.value.login.trim(),
    password: registerForm.value.password,
    email: registerForm.value.email || undefined,
    phone: registerForm.value.phone || undefined,
  }
}

function hasAccountUpdateChanges() {
  const current = accountUpdateForm.value
  const original = originalAccountUpdateForm.value
  return (
      current.password.length > 0 ||
      current.firstName !== original.firstName ||
      current.lastName !== original.lastName ||
      current.email !== original.email ||
      current.phone !== original.phone
  )
}

async function save() {
  const bid = businessStore.business?.id
  if (!bid) return

  if (accountMode.value === 'link' && !linkedUser.value) {
    toast.error('Avval loginni tekshiring')
    return
  }
  if (accountMode.value === 'register') {
    if (!registerForm.value.login || registerForm.value.password.length < 4) {
      toast.error('Login va kamida 4 belgili parol kiriting')
      return
    }
  }
  if (accountUpdateForm.value.password && accountUpdateForm.value.password.length < 4) {
    toast.error('Yangi parol kamida 4 belgidan iborat bo\'lishi kerak')
    return
  }
  if (!form.value.firstName.trim()) {
    toast.error('Ism kiritilishi shart')
    return
  }

  saving.value = true
  try {
    if (editingStaff.value && accountMode.value === 'register') {
      const editingId = editingStaff.value.id
      const payload = staffRegisterPayload()
      const { data } = await staffApi.registerForExisting(bid, editingId, payload)
      const idx = staff.value.findIndex((s) => s.id === editingId)
      if (idx !== -1) staff.value[idx] = data
      toast.success('Xodimga hisob yaratildi')
    } else if (editingStaff.value) {
      const editingId = editingStaff.value.id
      const { data } = await staffApi.update(bid, editingId, staffPayload())
      let finalData = data
      const acc = accountUpdateForm.value
      if (linkedUser.value && hasAccountUpdateChanges()) {
        const payload: StaffAccountUpdateRequest = {
          firstName: acc.firstName || undefined,
          lastName: acc.lastName || undefined,
          email: acc.email || undefined,
          phone: acc.phone || undefined,
          password: acc.password || undefined,
        }
        const { data: accData } = await staffApi.updateAccount(bid, editingId, payload)
        finalData = accData
      }
      const idx = staff.value.findIndex((s) => s.id === editingId)
      if (idx !== -1) staff.value[idx] = finalData
      toast.success('Xodim yangilandi')
    } else if (accountMode.value === 'register') {
      const payload = staffRegisterPayload()
      const { data } = await staffApi.register(bid, payload)
      staff.value.unshift(data)
      ratings.value[data.id] = 0
      toast.success("Yangi xodim va uning hisobi yaratildi")
    } else {
      const { data } = await staffApi.create(bid, staffPayload())
      staff.value.unshift(data)
      ratings.value[data.id] = 0
      toast.success("Yangi xodim qo'shildi")
    }
    showModal.value = false
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function toggleActive(member: StaffMember) {
  if (businessStore.isReadOnly) return
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    const { data } = await staffApi.update(bid, member.id, { active: !member.active })
    const idx = staff.value.findIndex((s) => s.id === member.id)
    if (idx !== -1) staff.value[idx] = data
  } catch {
    toast.error("Holatni o'zgartirishda xatolik")
  }
}

async function confirmDelete(id: string) {
  if (businessStore.isReadOnly) return
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    await staffApi.delete(bid, id)
    staff.value = staff.value.filter((s) => s.id !== id)
    delete ratings.value[id]
    toast.success("Xodim o'chirildi")
  } catch {
    toast.error("O'chirishda xatolik yuz berdi")
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

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function getColor(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length
  return avatarColors[idx]
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const getAvatarUrl = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("https")) return url;
  return `${BASE_URL}${url}`;
};

function serviceName(serviceId: string) {
  return services.value.find((service) => service.id === serviceId)?.name ?? "O'chirilgan xizmat"
}

onMounted(async () => {
  try {
    const bid = businessStore.business?.id
    if (bid) {
      const [{ data: staffData }, { data: serviceData }] = await Promise.all([
        staffApi.getAll(bid),
        servicesApi.getAll(bid),
      ])
      staff.value = staffData
      services.value = serviceData
      // Load avg ratings in parallel
      const ratingResults = await Promise.allSettled(
          staffData.map((m) => reviewsApi.staffAvgRating(m.id)),
      )
      ratingResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          ratings.value[staffData[i].id] = result.value.data ?? 0
        }
      })
    }
  } finally {
    loading.value = false
  }
})
</script>
