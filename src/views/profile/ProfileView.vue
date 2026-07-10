<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { User as UserIcon, Camera } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { mediaUrl } from '@/utils/media'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { User } from '@/types'

const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const uploadingAvatar = ref(false)
const profile = ref<User | null>(null)

const form = reactive({
  displayName: '',
  email: '',
  phone: '',
  password: '',
})

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function applyProfile(data: User) {
  profile.value = data
  form.displayName = data.displayName ?? ''
  form.email = data.email ?? ''
  form.phone = data.phone ?? ''
  form.password = ''
}

onMounted(async () => {
  const userId = authStore.user?.userId
  if (!userId) {
    loading.value = false
    return
  }
  try {
    const { data } = await usersApi.getById(userId)
    applyProfile(data)
  } catch {
    toast.error("Profil ma'lumotlarini yuklashda xatolik")
  } finally {
    loading.value = false
  }
})

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !profile.value) return
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    toast.error('Faqat JPEG, PNG yoki WEBP formatidagi rasm yuklang')
    input.value = ''
    return
  }
  if (file.size > MAX_AVATAR_SIZE) {
    toast.error('Rasm hajmi 5MB dan oshmasligi kerak')
    input.value = ''
    return
  }
  uploadingAvatar.value = true
  try {
    const { data } = await usersApi.uploadAvatar(profile.value.id, file)
    applyProfile(data)
    authStore.updateProfile({ avatarUrl: data.avatarUrl })
    toast.success('Rasm yangilandi')
  } catch {
    toast.error('Rasmni yuklashda xatolik')
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

async function save() {
  if (!profile.value) return
  if (!form.displayName.trim()) {
    toast.error('Ism familiya kiritilishi shart')
    return
  }
  if (form.password && form.password.length < 4) {
    toast.error("Yangi parol kamida 4 belgidan iborat bo'lishi kerak")
    return
  }
  saving.value = true
  try {
    const { data } = await usersApi.update(profile.value.id, {
      displayName: form.displayName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      password: form.password || undefined,
    })
    applyProfile(data)
    authStore.updateProfile({ displayName: data.displayName })
    toast.success('Profil yangilandi')
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Saqlashda xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Mening profilim</h1>
      <p class="text-slate-500 text-sm mt-1">Shaxsiy ma'lumotlaringizni bu yerdan yangilashingiz mumkin</p>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="profile" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <div class="relative w-20 h-20 flex-shrink-0">
          <div class="w-20 h-20 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
            <img v-if="mediaUrl(profile.avatarUrl)" :src="mediaUrl(profile.avatarUrl)!" class="w-full h-full object-cover" alt="avatar" />
            <UserIcon v-else class="w-8 h-8 text-primary-400" />
          </div>
          <label
            class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center cursor-pointer shadow-sm transition-colors"
            :class="{ 'opacity-60 pointer-events-none': uploadingAvatar }"
          >
            <Camera class="w-3.5 h-3.5 text-white" />
            <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
          </label>
        </div>
        <div>
          <p class="font-semibold text-slate-800">{{ profile.displayName || profile.login }}</p>
          <p class="text-sm text-slate-400">@{{ profile.login }}</p>
        </div>
      </div>

      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Ism Familiya *</label>
          <input
            v-model="form.displayName"
            type="text"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
            <input
              v-model="form.phone"
              type="tel"
              placeholder="+998901234567"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Yangi parol</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
        </button>
      </form>
    </div>
  </div>
</template>
