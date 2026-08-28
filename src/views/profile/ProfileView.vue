<template>
  <div class="max-w-5xl">
    <div class="mb-5">
      <h2 class="text-xl font-bold text-slate-800">Mening profilim</h2>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="profile" class="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4">
      <aside class="bg-white rounded-xl border border-slate-100 shadow-sm p-5 h-fit">
        <div class="flex lg:flex-col items-center lg:text-center gap-4">
          <div class="relative w-[72px] h-[72px] flex-shrink-0">
            <div class="w-[72px] h-[72px] rounded-full overflow-hidden bg-primary-100 flex items-center justify-center ring-4 ring-slate-50">
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
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 truncate">{{ personName(profile, profile.login) }}</p>
            <p class="text-sm text-slate-400 truncate">@{{ profile.login }}</p>
            <div class="flex flex-wrap lg:justify-center items-center gap-2 mt-3">
              <span
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                :class="profile.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
              >
                <CheckCircle v-if="profile.active" class="w-3.5 h-3.5" />
                {{ profile.active ? 'Faol' : 'Faol emas' }}
              </span>
              <span v-if="profile.businessOwner" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium">
                <Shield class="w-3.5 h-3.5" />
                Egasi
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-5 border-t border-slate-100 space-y-3 text-sm">
          <div>
            <p class="text-xs text-slate-400 mb-1">Email</p>
            <p class="text-slate-700 truncate">{{ profile.email || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Telefon</p>
            <p class="text-slate-700 truncate">{{ profile.phone || '-' }}</p>
          </div>
        </div>
      </aside>

      <div class="space-y-4">
        <form @submit.prevent="save" class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-sm font-semibold text-slate-800">Shaxsiy ma'lumotlar</h3>
            <span class="text-xs text-slate-400">Profil</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Ism *</label>
              <input
                v-model="form.firstName"
                type="text"
                autocomplete="given-name"
                placeholder="Masalan: Shaxzod"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Familiya</label>
              <input
                v-model="form.lastName"
                type="text"
                autocomplete="family-name"
                placeholder="Masalan: Ruziqulov"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
              <input
                v-model="displayPhone"
                inputmode="numeric"
                type="tel"
                maxlength="17"
                required
                placeholder="+99890 123 45 67"
                class="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                @input="onPhoneInput"
                @keydown="onPhoneKeydown"
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              type="submit"
              :disabled="saving"
              class="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {{ saving ? 'Saqlanmoqda...' : "Ma'lumotlarni saqlash" }}
            </button>
          </div>
        </form>

        <form @submit.prevent="changePassword" class="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h3 class="text-sm font-semibold text-slate-800">Parolni o'zgartirish</h3>
            <span class="text-xs text-slate-400">Xavfsizlik</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Joriy parol</label>
              <div class="relative">
                <input
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Joriy parol"
                  class="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  @click="showCurrentPassword = !showCurrentPassword"
                  :aria-label="showCurrentPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'"
                >
                  <EyeOff v-if="showCurrentPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Yangi parol</label>
              <div class="relative">
                <input
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Kamida 4 belgi"
                  class="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  @click="showNewPassword = !showNewPassword"
                  :aria-label="showNewPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'"
                >
                  <EyeOff v-if="showNewPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Tasdiqlash</label>
              <div class="relative">
                <input
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Yangi parolni qayta kiriting"
                  class="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'"
                >
                  <EyeOff v-if="showConfirmPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              type="submit"
              :disabled="passwordSaving"
              class="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {{ passwordSaving ? "O'zgartirilmoqda..." : 'Parolni saqlash' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { User as UserIcon, Camera, CheckCircle, Eye, EyeOff, Shield } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { mediaUrl } from '@/utils/media'
import { personName } from '@/utils/names'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { User } from '@/types'

const authStore = useAuthStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const passwordSaving = ref(false)
const uploadingAvatar = ref(false)
const profile = ref<User | null>(null)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const digits = ref('')

// Foydalanuvchiga ko'rinadigan, formatlangan qiymat: +998 90 123 45 67
const displayPhone = computed({
  get(): string {
    let result = '+998';
    const d = digits.value;
    if (d.length > 0) result += ' ' + d.slice(0, 2);
    if (d.length > 2) result += ' ' + d.slice(2, 5);
    if (d.length > 5) result += ' ' + d.slice(5, 7);
    if (d.length > 7) result += ' ' + d.slice(7, 9);
    return result;
  },
  set(val: string) {
    let raw = val.replace(/\D/g, '');
    if (raw.startsWith('998')) raw = raw.slice(3);
    digits.value = raw.slice(0, 9);
  },
});

const phone = computed(() => `+998${digits.value}`);
const isPhoneComplete = computed(() => digits.value.length === 9);

function onPhoneInput(e: Event) {
  const input = e.target as HTMLInputElement
  // Faqat raqamlarni ajratib olamiz, "998" prefiksini (agar kiritilgan bo'lsa) olib tashlaymiz
  let raw = input.value.replace(/\D/g, '')
  if (raw.startsWith('998')) raw = raw.slice(3)
  digits.value = raw.slice(0, 9)
  // Kursorni oxiriga qo'yish uchun keyingi tikda qayta render bo'ladi
  input.value = displayPhone.value
}

function onPhoneKeydown(e: KeyboardEvent) {
  // Backspace bosilganda, agar oxirgi belgi bo'shliq bo'lsa, undan oldingi raqamni ham o'chirish
  if (e.key === 'Backspace' && digits.value.length > 0) {
    const cursorAtEnd = (e.target as HTMLInputElement).selectionStart === displayPhone.value.length
    if (cursorAtEnd) {
      e.preventDefault()
      digits.value = digits.value.slice(0, -1)
    }
  }
}

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function applyProfile(data: User) {
  profile.value = data
  form.firstName = data.firstName ?? ''
  form.lastName = data.lastName ?? ''
  form.email = data.email ?? ''
  const raw = (data.phone ?? '').replace(/\D/g, '')
  digits.value = raw.startsWith('998') ? raw.slice(3, 12) : raw.slice(0, 9)
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
  if (!form.firstName.trim()) {
    toast.error('Ism kiritilishi shart')
    return
  }
  if (!isPhoneComplete.value) {
    toast.error("Telefon raqamni to'liq kiriting");
    return;
  }
  saving.value = true
  try {
    const { data } = await usersApi.update(profile.value.id, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: phone.value,
    })
    applyProfile(data)
    authStore.updateProfile({ firstName: data.firstName, lastName: data.lastName })
    toast.success('Profil yangilandi')
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Saqlashda xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    toast.error('Joriy parol va yangi parolni kiriting')
    return
  }
  if (passwordForm.newPassword.length < 4) {
    toast.error("Yangi parol kamida 4 belgidan iborat bo'lishi kerak")
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('Yangi parollar mos kelmadi')
    return
  }
  passwordSaving.value = true
  try {
    await usersApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    toast.success("Parol o'zgartirildi")
  } catch (e) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || "Parolni o'zgartirishda xatolik yuz berdi")
  } finally {
    passwordSaving.value = false
  }
}
</script>
