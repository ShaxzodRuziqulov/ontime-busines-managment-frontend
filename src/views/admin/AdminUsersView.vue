<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, Trash2, Edit2, Users, ShieldCheck, Building2 } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { User, UserCreateRequest, UserUpdateRequest } from '@/types'

const users = ref<User[]>([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editingUser = ref<User | null>(null)

interface CreateForm extends UserCreateRequest { password: string }

const defaultForm = (): CreateForm => ({
  login: '',
  password: '',
  displayName: '',
  email: '',
  phone: '',
})

const editForm = ref<UserUpdateRequest>({ displayName: '', email: '', phone: '' })
const createForm = ref<CreateForm>(defaultForm())

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.login.toLowerCase().includes(q) ||
    u.displayName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q)
  )
})

function openAdd() {
  editingUser.value = null
  createForm.value = defaultForm()
  showModal.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  editForm.value = { displayName: user.displayName, email: user.email, phone: user.phone }
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    if (editingUser.value) {
      const { data } = await usersApi.update(editingUser.value.id, editForm.value)
      const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
      if (idx !== -1) users.value[idx] = data
    } else {
      const { data } = await usersApi.create(createForm.value)
      users.value.unshift(data)
    }
    showModal.value = false
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  await usersApi.delete(id)
  users.value = users.value.filter(u => u.id !== id)
  deleteConfirm.value = null
}

function roleLabel(user: User) {
  if (user.roles?.includes('ROLE_ADMIN')) return 'Admin'
  if (user.businessOwner) return 'Biznes egasi'
  return 'Foydalanuvchi'
}

function roleColor(user: User) {
  if (user.roles?.includes('ROLE_ADMIN')) return 'bg-red-100 text-red-700'
  if (user.businessOwner) return 'bg-violet-100 text-violet-700'
  return 'bg-slate-100 text-slate-600'
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
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus class="w-4 h-4" />
        Foydalanuvchi qo'shish
      </button>
    </div>

    <!-- Search -->
    <div class="relative mb-5">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="search"
        type="text"
        placeholder="Login, ism yoki email bo'yicha qidirish..."
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
      />
    </div>

    <LoadingSpinner v-if="loading" />

    <template v-else>
      <EmptyState
        v-if="filtered.length === 0"
        title="Foydalanuvchi topilmadi"
        description="Qidiruv so'zini o'zgartiring yoki yangi foydalanuvchi qo'shing"
      >
        <template #icon>
          <Users class="w-8 h-8 text-slate-400" />
        </template>
      </EmptyState>

      <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide bg-slate-50/50">
                <th class="px-5 py-3 text-left font-medium">Foydalanuvchi</th>
                <th class="px-5 py-3 text-left font-medium">Login</th>
                <th class="px-5 py-3 text-left font-medium">Telefon</th>
                <th class="px-5 py-3 text-left font-medium">Rol</th>
                <th class="px-5 py-3 text-right font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="user in filtered"
                :key="user.id"
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck v-if="user.roles?.includes('ROLE_ADMIN')" class="w-4 h-4 text-red-500" />
                      <Building2 v-else-if="user.businessOwner" class="w-4 h-4 text-violet-500" />
                      <Users v-else class="w-4 h-4 text-slate-400" />
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
                  <span :class="['px-2.5 py-1 rounded-full text-xs font-medium', roleColor(user)]">
                    {{ roleLabel(user) }}
                  </span>
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
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Login *</label>
            <input
              v-model="createForm.login"
              type="text"
              placeholder="username"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Parol *</label>
            <input
              v-model="createForm.password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">To'liq ism</label>
          <input
            v-model="createForm.displayName"
            type="text"
            placeholder="Ism Familiya"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="createForm.email"
              type="email"
              placeholder="email@example.com"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
            <input
              v-model="createForm.phone"
              type="tel"
              placeholder="+998901234567"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="showModal = false">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving || !createForm.login || !createForm.password" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-if="showModal && editingUser" :title="`Tahrirlash: ${editingUser.login}`" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">To'liq ism</label>
          <input
            v-model="editForm.displayName"
            type="text"
            placeholder="Ism Familiya"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="editForm.email"
              type="email"
              placeholder="email@example.com"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
            <input
              v-model="editForm.phone"
              type="tel"
              placeholder="+998901234567"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50" @click="showModal = false">
            Bekor qilish
          </button>
          <button type="submit" :disabled="saving" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppModal v-if="deleteConfirm" title="Foydalanuvchini o'chirish" size="sm" @close="deleteConfirm = null">
      <p class="text-slate-600 text-sm mb-5">Bu foydalanuvchini o'chirishni tasdiqlaysizmi? Ushbu amal qaytarib bo'lmaydi.</p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="deleteConfirm = null">Bekor</button>
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700" @click="confirmDelete(deleteConfirm!)">O'chirish</button>
      </div>
    </AppModal>
  </div>
</template>
