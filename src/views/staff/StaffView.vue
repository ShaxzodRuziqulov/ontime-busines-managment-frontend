<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Users, Trash2, Edit2, ToggleLeft, ToggleRight, Briefcase } from 'lucide-vue-next'
import { staffApi } from '@/api/staff'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import SkeletonCard from '@/components/common/SkeletonCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { StaffMember, StaffCreateRequest } from '@/types'

const businessStore = useBusinessStore()
const toast = useToast()

const staff = ref<StaffMember[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const deleteConfirm = ref<string | null>(null)
const editingStaff = ref<StaffMember | null>(null)

const defaultForm = (): StaffCreateRequest => ({
  displayName: '',
  active: true,
})

const form = ref<StaffCreateRequest>(defaultForm())

function openAdd() {
  editingStaff.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEdit(member: StaffMember) {
  editingStaff.value = member
  form.value = {
    displayName: member.displayName,
    active: member.active,
  }
  showModal.value = true
}

async function save() {
  if (!form.value.displayName) return
  const bid = businessStore.business?.id
  if (!bid) return
  saving.value = true
  try {
    if (editingStaff.value) {
      const editingId = editingStaff.value.id
      const { data } = await staffApi.update(bid, editingId, form.value)
      const idx = staff.value.findIndex((s) => s.id === editingId)
      if (idx !== -1) staff.value[idx] = data
      toast.success('Xodim yangilandi')
    } else {
      const { data } = await staffApi.create(bid, form.value)
      staff.value.unshift(data)
      toast.success('Yangi xodim qo\'shildi')
    }
    showModal.value = false
  } catch {
    toast.error('Xatolik yuz berdi')
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
    toast.error('Holatni o\'zgartirishda xatolik')
  }
}

async function confirmDelete(id: string) {
  const bid = businessStore.business?.id
  if (!bid) return
  try {
    await staffApi.delete(bid, id)
    staff.value = staff.value.filter((s) => s.id !== id)
    toast.success('Xodim o\'chirildi')
  } catch {
    toast.error('O\'chirishda xatolik yuz berdi')
  }
  deleteConfirm.value = null
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
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
            <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0', getColor(member.displayName)]">
              {{ getInitials(member.displayName) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 truncate">{{ member.displayName }}</h3>
              <div class="flex items-center gap-1 mt-0.5">
                <Briefcase class="w-3.5 h-3.5 text-slate-400" />
                <span class="text-sm text-slate-500">{{ member.linkedUserId ? 'Bog\'langan' : 'Mustaqil xodim' }}</span>
              </div>
            </div>
            <button @click="toggleActive(member)" class="flex-shrink-0">
              <ToggleRight v-if="member.active" class="w-6 h-6 text-emerald-500" />
              <ToggleLeft v-else class="w-6 h-6 text-slate-300" />
            </button>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100">
            <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', member.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
              {{ member.active ? 'Faol' : 'Nofaol' }}
            </span>
            <div class="flex gap-1">
              <button class="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" @click="openEdit(member)">
                <Edit2 class="w-4 h-4" />
              </button>
              <button class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" @click="deleteConfirm = member.id">
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
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
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
          <button type="button" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="showModal = false">Bekor</button>
          <button type="submit" :disabled="saving" class="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
            {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal v-if="deleteConfirm" title="Xodimni o'chirish" size="sm" @close="deleteConfirm = null">
      <p class="text-slate-600 text-sm mb-5">Bu xodimni o'chirishni tasdiqlaysizmi?</p>
      <div class="flex gap-3">
        <button class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm" @click="deleteConfirm = null">Bekor</button>
        <button class="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold" @click="confirmDelete(deleteConfirm!)">O'chirish</button>
      </div>
    </AppModal>
  </div>
</template>
