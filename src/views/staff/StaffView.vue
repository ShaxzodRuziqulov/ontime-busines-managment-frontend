<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Users, Trash2, Edit2, ToggleLeft, ToggleRight, Briefcase, Star, Search, X as XIcon, CheckCircle2 } from 'lucide-vue-next'
import { staffApi } from '@/api/staff'
import { reviewsApi } from '@/api/reviews'
import { usersApi, type UserLookup } from '@/api/users'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { StaffMember, StaffCreateRequest, StaffRegisterRequest, StaffAccountUpdateRequest } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const staff = ref<StaffMember[]>([])
const ratings = ref<Record<string, number>>({})
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editingStaff = ref<StaffMember | null>(null)

const defaultForm = (): StaffCreateRequest => ({
  displayName: '',
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
const accountUpdateForm = ref({ email: '', phone: '', password: '' })

function openAdd() {
  editingStaff.value = null
  form.value = defaultForm()
  accountMode.value = 'register'
  linkLogin.value = ''
  linkedUser.value = null
  linkLookupError.value = ''
  registerForm.value = { login: '', password: '', email: '', phone: '' }
  showModal.value = true
}

async function openEdit(member: StaffMember) {
  editingStaff.value = member
  form.value = {
    displayName: member.displayName,
    active: member.active,
    linkedUserId: member.linkedUserId,
  }
  linkLogin.value = ''
  linkLookupError.value = ''
  registerForm.value = { login: '', password: '', email: '', phone: '' }
  accountUpdateForm.value = { email: '', phone: '', password: '' }
  if (member.linkedUserId) {
    accountMode.value = 'link'
    linkedUser.value = { id: member.linkedUserId, login: '', displayName: "Bog'langan foydalanuvchi" }
    showModal.value = true
    const bid = businessStore.business?.id
    try {
      if (bid) {
        const { data } = await staffApi.getAccount(bid, member.id)
        linkedUser.value = { id: data.id, login: data.login, displayName: data.displayName }
        accountUpdateForm.value = { email: data.email || '', phone: data.phone || '', password: '' }
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
    form.value.displayName = data.displayName
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
  if (!form.value.displayName) {
    toast.error('Ism familiya kiritilishi shart')
    return
  }

  saving.value = true
  try {
    if (editingStaff.value && accountMode.value === 'register') {
      const editingId = editingStaff.value.id
      const payload: StaffRegisterRequest = {
        displayName: form.value.displayName,
        login: registerForm.value.login.trim(),
        password: registerForm.value.password,
        email: registerForm.value.email || undefined,
        phone: registerForm.value.phone || undefined,
      }
      const { data } = await staffApi.registerForExisting(bid, editingId, payload)
      const idx = staff.value.findIndex((s) => s.id === editingId)
      if (idx !== -1) staff.value[idx] = data
      toast.success('Xodimga hisob yaratildi')
    } else if (editingStaff.value) {
      const editingId = editingStaff.value.id
      const { data } = await staffApi.update(bid, editingId, form.value)
      let finalData = data
      const acc = accountUpdateForm.value
      if (linkedUser.value && (acc.email || acc.phone || acc.password)) {
        const payload: StaffAccountUpdateRequest = {
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
      const payload: StaffRegisterRequest = {
        displayName: form.value.displayName,
        login: registerForm.value.login.trim(),
        password: registerForm.value.password,
        email: registerForm.value.email || undefined,
        phone: registerForm.value.phone || undefined,
      }
      const { data } = await staffApi.register(bid, payload)
      staff.value.unshift(data)
      ratings.value[data.id] = 0
      toast.success("Yangi xodim va uning hisobi yaratildi")
    } else {
      const { data } = await staffApi.create(bid, form.value)
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

onMounted(async () => {
  try {
    const bid = businessStore.business?.id
    if (bid) {
      const { data } = await staffApi.getAll(bid)
      staff.value = data
      // Load avg ratings in parallel
      const ratingResults = await Promise.allSettled(
        data.map((m) => reviewsApi.staffAvgRating(m.id)),
      )
      ratingResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          ratings.value[data[i].id] = result.value.data ?? 0
        }
      })
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
        <h1 class="text-2xl font-bold text-slate-800">Xodimlar</h1>
        <p class="text-slate-500 text-sm mt-1">{{ staff.length }} ta xodim</p>
      </div>
      <button
        v-if="!businessStore.isExpired"
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
            v-if="!businessStore.isExpired"
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
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0',
                getColor(member.displayName),
              ]"
            >
              {{ getInitials(member.displayName) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 truncate">{{ member.displayName }}</h3>
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
            <button @click="toggleActive(member)" class="flex-shrink-0">
              <ToggleRight v-if="member.active" class="w-6 h-6 text-emerald-500" />
              <ToggleLeft v-else class="w-6 h-6 text-slate-300" />
            </button>
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
            <div class="flex gap-1">
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
      @close="showModal = false"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism Familiya *</label>
          <input
            v-model="form.displayName"
            type="text"
            placeholder="Ali Valiyev"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Hisob (portalga kirish)
            <span class="text-slate-400 font-normal">— xodim o'z bandlovlarini ko'rishi uchun</span>
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
          <div v-if="accountMode === 'register'" class="space-y-3 bg-slate-50 rounded-xl p-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Login *</label>
              <input
                v-model="registerForm.login"
                type="text"
                placeholder="ali.valiyev"
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
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Email (ixtiyoriy)</label>
                <input
                  v-model="registerForm.email"
                  type="email"
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
            <p class="text-xs text-slate-500">Bu login/parolni xodimga bering — u shu bilan tizimga kirib, o'z portalidan foydalana oladi.</p>
          </div>

          <!-- "link" rejimi: mavjud loginni qidirish -->
          <template v-else-if="accountMode === 'link'">
            <template v-if="linkedUser">
              <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <span class="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 class="w-4 h-4" />
                  {{ linkedUser.displayName }}<template v-if="linkedUser.login"> ({{ linkedUser.login }})</template>
                </span>
                <button type="button" @click="unlinkUser" class="text-emerald-600 hover:text-emerald-800">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>

              <!-- Bog'langan hisobning ma'lumotlarini yangilash (faqat tahrirlashda) -->
              <div v-if="editingStaff" class="space-y-3 bg-slate-50 rounded-xl p-4 mt-3">
                <p class="text-xs font-medium text-slate-600">Hisob ma'lumotlarini yangilash <span class="font-normal text-slate-400">(faqat to'ldirilgan maydonlar o'zgaradi)</span></p>
                <div class="grid grid-cols-2 gap-3">
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
