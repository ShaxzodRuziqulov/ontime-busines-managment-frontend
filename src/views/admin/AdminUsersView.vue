<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Trash2, Edit2, Users, ShieldCheck, Building2, ToggleLeft, ToggleRight, Download, Camera } from 'lucide-vue-next'
import { mediaUrl } from '@/utils/media'
import { usersApi } from '@/api/users'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SkeletonTable from '@/components/common/SkeletonTable.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type { User, UserCreateRequest, UserUpdateRequest } from '@/types'

const toast = useToast()
const authStore = useAuthStore()

const users = ref<User[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const roleFilter = ref<'all' | 'admin' | 'owner' | 'user'>('all')
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const adminConfirm = ref<{ user: User; wasAdmin: boolean } | null>(null)
const activeConfirm = ref<User | null>(null)
const editingUser = ref<User | null>(null)
const togglingId = ref<string | null>(null)

interface CreateForm extends UserCreateRequest {
  password: string
  firstName?: string
  lastName?: string
}

const defaultForm = (): CreateForm => ({
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
})

const editForm = ref<UserUpdateRequest>({ firstName: '', lastName: '', displayName: '', email: '', phone: '', password: '' })
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const createForm = ref<CreateForm>(defaultForm())

const filtered = computed(() => {
  let list = users.value
  if (roleFilter.value === 'admin') list = list.filter(u => u.roles?.includes('ROLE_ADMIN'))
  else if (roleFilter.value === 'owner') list = list.filter(u => u.businessOwner && !u.roles?.includes('ROLE_ADMIN'))
  else if (roleFilter.value === 'user') list = list.filter(u => !u.businessOwner && !u.roles?.includes('ROLE_ADMIN'))
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(u =>
    u.login.toLowerCase().includes(q) ||
    u.displayName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q)
  )
})

const filterTabs: { key: typeof roleFilter.value; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'admin', label: 'Adminlar' },
  { key: 'owner', label: 'Biznes egalari' },
  { key: 'user', label: 'Foydalanuvchilar' },
]

function openAdd() {
  editingUser.value = null
  createForm.value = defaultForm()
  showModal.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  // firstName/lastName null bo'lsa displayName dan avtomatik ajratib olish
  const parts = (user.displayName ?? '').trim().split(/\s+/)
  editForm.value = {
    firstName: user.firstName ?? parts[0] ?? '',
    lastName: user.lastName ?? parts.slice(1).join(' ') ?? '',
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    password: '',
  }
  avatarFile.value = null
  avatarPreview.value = mediaUrl(user.avatarUrl)
  showModal.value = true
}

function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function save() {
  saving.value = true
  try {
    if (editingUser.value) {
      const payload = { ...editForm.value }
      if (!payload.password) delete payload.password
      let { data } = await usersApi.update(editingUser.value.id, payload)
      if (avatarFile.value) {
        const res = await usersApi.uploadAvatar(editingUser.value.id, avatarFile.value)
        data = res.data
        // O'zining avatarini yangilagan bo'lsa header ham yangilansin
        if (editingUser.value.id === authStore.user?.userId) {
          authStore.updateAvatar(data.avatarUrl ?? null)
        }
      }
      const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
      if (idx !== -1) users.value[idx] = data
    } else {
      const payload = { ...createForm.value }
      // displayName bo'sh bo'lsa firstName + lastName dan yasash
      if (!payload.displayName?.trim()) {
        payload.displayName = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.login
      }
      const { data } = await usersApi.create(payload)
      users.value.unshift(data)
    }
    showModal.value = false
    toast.success('Saqlandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function confirmToggleActive() {
  const user = activeConfirm.value
  if (!user) return
  activeConfirm.value = null
  togglingId.value = user.id
  try {
    const { data } = await usersApi.update(user.id, { active: !user.active })
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = data
    toast.success(data.active ? 'Aktivlashtirildi' : 'Bloklandi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    togglingId.value = null
  }
}

async function confirmToggleAdmin() {
  const item = adminConfirm.value
  if (!item) return
  adminConfirm.value = null
  const { user, wasAdmin } = item
  togglingId.value = user.id
  try {
    const newRoles = wasAdmin
      ? (user.roles ?? []).filter(r => r !== 'ROLE_ADMIN')
      : [...(user.roles ?? []), 'ROLE_ADMIN']
    const { data } = await usersApi.update(user.id, { roles: newRoles })
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = data
    toast.success(wasAdmin ? 'Admin huquqi olindi' : 'Admin huquqi berildi')
  } catch {
    toast.error('Xatolik yuz berdi')
  } finally {
    togglingId.value = null
  }
}

async function confirmDelete(id: string) {
  try {
    await usersApi.delete(id)
    users.value = users.value.filter(u => u.id !== id)
    deleteConfirm.value = null
    toast.success("O'chirildi")
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function isAdmin(user: User) {
  return user.roles?.includes('ROLE_ADMIN') ?? false
}

function roleLabel(user: User) {
  if (isAdmin(user)) return 'Admin'
  if (user.roles?.includes('ROLE_BUSINESS_OWNER') || user.businessOwner) return 'Biznes egasi'
  if (user.roles?.includes('ROLE_MANAGER')) return 'Menejer'
  return 'Foydalanuvchi'
}

function roleColor(user: User) {
  if (isAdmin(user)) return 'bg-red-100 text-red-700'
  if (user.roles?.includes('ROLE_BUSINESS_OWNER') || user.businessOwner) return 'bg-violet-100 text-violet-700'
  if (user.roles?.includes('ROLE_MANAGER')) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

function exportCsv() {
  const rows = [
    ['ID', 'Login', 'Ism', 'Email', 'Telefon', 'Rol', 'Aktiv', "Ro'yxatdan o'tgan"],
    ...filtered.value.map(u => [
      u.id,
      u.login,
      u.displayName ?? '',
      u.email ?? '',
      u.phone ?? '',
      roleLabel(u),
      u.active ? 'Ha' : "Yo'q",
      new Date(u.createdAt).toLocaleDateString('uz-UZ'),
    ]),
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `foydalanuvchilar_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  try {
    const { data } = await usersApi.getAll()
    users.value = data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Foydalanuvchilar</h1>
        <p class="text-slate-500 text-sm mt-1">{{ users.length }} ta foydalanuvchi</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="exportCsv"
          class="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Download class="w-4 h-4" />
          CSV
        </button>
        <button
          @click="openAdd"
          class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus class="w-4 h-4" />
          Qo'shish
        </button>
      </div>
    </div>

    <!-- Search + Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Login, ism yoki email bo'yicha qidirish..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      </div>
      <div class="flex gap-1 bg-slate-100 rounded-xl p-1 self-start">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          @click="roleFilter = tab.key"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            roleFilter === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="loading" :rows="6" :cols="6" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Foydalanuvchi topilmadi"
        description="Qidiruv so'zini o'zgartiring yoki yangi foydalanuvchi qo'shing"
      >
        <template #icon><Users class="w-8 h-8 text-slate-400" /></template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 text-xs text-slate-500">
          {{ filtered.length }} ta natija
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Foydalanuvchi</th>
                <th class="px-5 py-3 text-left font-medium">Login</th>
                <th class="px-5 py-3 text-left font-medium">Telefon</th>
                <th class="px-5 py-3 text-left font-medium">Rol</th>
                <th class="px-5 py-3 text-center font-medium">Aktiv</th>
                <th class="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="user in filtered"
                :key="user.id"
                :class="['hover:bg-slate-50/50 transition-colors', !user.active && 'opacity-60']"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img
                        v-if="mediaUrl(user.avatarUrl)"
                        :src="mediaUrl(user.avatarUrl)!"
                        class="w-full h-full object-cover"
                        :alt="user.displayName"
                      />
                      <template v-else>
                        <ShieldCheck v-if="isAdmin(user)" class="w-4 h-4 text-red-500" />
                        <Building2 v-else-if="user.businessOwner" class="w-4 h-4 text-violet-500" />
                        <Users v-else class="w-4 h-4 text-slate-400" />
                      </template>
                    </div>
                    <div>
                      <p class="font-medium text-slate-800">{{ user.displayName || '—' }}</p>
                      <p class="text-xs text-slate-400">{{ user.email || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-slate-600 font-mono text-xs">{{ user.login }}</td>
                <td class="px-5 py-3.5 text-slate-500">{{ user.phone || '—' }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', roleColor(user)]">
                      {{ roleLabel(user) }}
                    </span>
                    <button
                      v-if="!isAdmin(user)"
                      :disabled="togglingId === user.id"
                      @click="adminConfirm = { user, wasAdmin: false }"
                      title="Admin qilish"
                      class="text-xs px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      +Admin
                    </button>
                    <button
                      v-else
                      :disabled="togglingId === user.id"
                      @click="adminConfirm = { user, wasAdmin: true }"
                      title="Admin huquqini olish"
                      class="text-xs px-2 py-0.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      −Admin
                    </button>
                  </div>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <button
                    :disabled="togglingId === user.id"
                    @click="activeConfirm = user"
                    :title="user.active ? 'Bloklash' : 'Aktivlashtirish'"
                    class="inline-flex items-center justify-center transition-opacity disabled:opacity-40"
                  >
                    <ToggleRight v-if="user.active" class="w-7 h-7 text-emerald-500" />
                    <ToggleLeft v-else class="w-7 h-7 text-slate-300" />
                  </button>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      @click="openEdit(user)"
                      title="Tahrirlash"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      @click="deleteConfirm = user.id"
                      title="O'chirish"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Add Modal -->
    <AppModal v-if="showModal && !editingUser" title="Yangi foydalanuvchi" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-4">

        <!-- Login + Parol -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Login *</label>
            <input v-model="createForm.login" type="text" placeholder="username"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Parol *</label>
            <input v-model="createForm.password" type="password" placeholder="Kamida 8 belgi"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <!-- Ism + Familiya -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Ism</label>
            <input v-model="createForm.firstName" type="text" placeholder="Ism"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Familiya</label>
            <input v-model="createForm.lastName" type="text" placeholder="Familiya"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <!-- Ko'rsatish nomi -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">
            Ko'rsatish nomi
            <span class="text-slate-400 font-normal">(bo'sh qoldirsangiz ism+familiyadan yasaladi)</span>
          </label>
          <input v-model="createForm.displayName" type="text" placeholder="Ism Familiya"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>

        <!-- Email + Telefon -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input v-model="createForm.email" type="email" placeholder="email@example.com"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
            <input v-model="createForm.phone" type="tel" placeholder="+998901234567"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving || !createForm.login || !createForm.password"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-if="showModal && editingUser" :title="`Tahrirlash: ${editingUser.login}`" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-4">

        <!-- Avatar -->
        <div class="flex items-center gap-4 pb-2 border-b border-slate-100">
          <div class="relative w-16 h-16 flex-shrink-0">
            <img v-if="avatarPreview" :src="avatarPreview"
              class="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            <div v-else class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
              <Users class="w-7 h-7 text-slate-400" />
            </div>
            <label class="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera class="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
            </label>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-700">{{ editingUser.displayName || '—' }}</p>
            <p class="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP · max 5MB</p>
          </div>
        </div>

        <!-- Ism Familiya -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Ism</label>
            <input v-model="editForm.firstName" type="text" placeholder="Ism"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Familiya</label>
            <input v-model="editForm.lastName" type="text" placeholder="Familiya"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <!-- Ko'rsatish nomi -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Ko'rsatish nomi</label>
          <input v-model="editForm.displayName" type="text" placeholder="Ism Familiya"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>

        <!-- Email + Telefon -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input v-model="editForm.email" type="email" placeholder="email@example.com"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
            <input v-model="editForm.phone" type="tel" placeholder="+998901234567"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>

        <!-- Yangi parol -->
        <div>
          <label class="block text-xs font-medium text-slate-500 mb-1">Yangi parol <span class="text-slate-400 font-normal">(o'zgartirmasangiz bo'sh qoldiring)</span></label>
          <input v-model="editForm.password" type="password" placeholder="Kamida 8 belgi"
            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>

        <div class="flex gap-3 pt-1">
          <button type="button"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            @click="showModal = false">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving"
            class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors">
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Admin toggle Confirm -->
    <AppModal
      v-if="adminConfirm"
      :title="adminConfirm.wasAdmin ? 'Admin huquqini olish' : 'Admin huquqi berish'"
      size="sm"
      @close="adminConfirm = null"
    >
      <p class="text-slate-600 text-sm mb-5">
        <template v-if="adminConfirm.wasAdmin">
          <span class="font-semibold">{{ adminConfirm.user.displayName || adminConfirm.user.login }}</span>
          foydalanuvchidan admin huquqini olmoqchisiz. Tasdiqlaysizmi?
        </template>
        <template v-else>
          <span class="font-semibold">{{ adminConfirm.user.displayName || adminConfirm.user.login }}</span>
          foydalanuvchiga admin huquqi bermoqchisiz. Tasdiqlaysizmi?
        </template>
      </p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="adminConfirm = null">Bekor</button>
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700" @click="confirmToggleAdmin">
          {{ adminConfirm.wasAdmin ? 'Olish' : 'Berish' }}
        </button>
      </div>
    </AppModal>

    <!-- Active toggle Confirm -->
    <AppModal
      v-if="activeConfirm"
      :title="activeConfirm.active ? 'Foydalanuvchini bloklash' : 'Foydalanuvchini aktivlashtirish'"
      size="sm"
      @close="activeConfirm = null"
    >
      <p class="text-slate-600 text-sm mb-5">
        <span class="font-semibold">{{ activeConfirm.displayName || activeConfirm.login }}</span>
        foydalanuvchini
        <span class="font-semibold">{{ activeConfirm.active ? 'bloklashni' : 'aktivlashtirishni' }}</span>
        tasdiqlaysizmi?
      </p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="activeConfirm = null">Bekor</button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          :class="activeConfirm.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'"
          @click="confirmToggleActive"
        >
          {{ activeConfirm.active ? 'Bloklash' : 'Aktivlashtirish' }}
        </button>
      </div>
    </AppModal>

    <ConfirmModal
      v-if="deleteConfirm"
      title="Foydalanuvchini o'chirish"
      message="Bu foydalanuvchini o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi."
      confirm-label="O'chirish"
      icon="trash"
      variant="danger"
      @confirm="confirmDelete(deleteConfirm!)"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
