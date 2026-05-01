<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Clock, Loader2, AlertCircle, CheckCircle2, MapPin, Phone, FileText } from 'lucide-vue-next'
import { businessesApi } from '@/api/businesses'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  description: '',
  phone: '',
  address: '',
})

const loading = ref(false)
const error = ref('')
const step = ref<'form' | 'relogin' | 'done'>('form')

async function handleCreate() {
  if (!form.name.trim()) {
    error.value = 'Biznes nomi kiritilishi shart'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await businessesApi.create({
      ownerId: authStore.user?.userId,
      name: form.name,
      description: form.description || undefined,
      contactPhone: form.phone || undefined,
      addressLine: form.address || undefined,
    })

    step.value = 'relogin'

    // Yangi token olish (businessOwner: true)
    if (authStore.hasPendingCredentials) {
      await authStore.relogin()
      step.value = 'done'
      setTimeout(() => router.push('/'), 1200)
    } else {
      // Sahifa yangilanib kelgan bo'lsa credentials yo'q — login sahifasiga yo'naltir
      step.value = 'done'
      setTimeout(() => {
        authStore.logout()
        router.push('/login')
      }, 2000)
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Biznes yaratishda xatolik yuz berdi'
    step.value = 'form'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
    <div class="w-full max-w-lg">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-2.5 mb-8">
        <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
          <Clock class="w-5 h-5 text-white" />
        </div>
        <span class="text-xl font-bold text-white tracking-tight">OnTime Business</span>
      </div>

      <!-- Success state -->
      <div v-if="step === 'done'" class="bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 class="w-8 h-8 text-emerald-600" />
        </div>
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Biznes yaratildi!</h2>
        <p class="text-slate-500 text-sm">Panel ochilmoqda...</p>
      </div>

      <!-- Re-login loading state -->
      <div v-else-if="step === 'relogin'" class="bg-white rounded-3xl shadow-2xl p-10 text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Loader2 class="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-2">Hisob yangilanmoqda...</h2>
        <p class="text-slate-500 text-sm">Biznes egasi huquqlari berilmoqda</p>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-3xl shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 class="w-7 h-7 text-primary-600" />
          </div>
          <h2 class="text-2xl font-bold text-slate-800">Biznesingizni yarating</h2>
          <p class="text-slate-500 text-sm mt-1.5">
            Ma'lumotlarni kiriting — 14 kun bepul sinov boshlanadi
          </p>
        </div>

        <!-- Progress -->
        <div class="flex items-center gap-2 mb-8">
          <div class="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <div class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 class="w-3 h-3 text-white" />
            </div>
            Ro'yxatdan o'tish
          </div>
          <div class="flex-1 h-px bg-primary-200 mx-1" />
          <div class="flex items-center gap-1.5 text-xs text-primary-600 font-medium">
            <div class="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">2</div>
            Biznes ma'lumotlari
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ error }}
        </div>

        <form @submit.prevent="handleCreate" class="space-y-4">
          <!-- Business name -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Biznes nomi *
            </label>
            <div class="relative">
              <Building2 class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="form.name"
                type="text"
                placeholder="Masalan: Salim Sartaroshxonasi"
                autofocus
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Tavsif
              <span class="text-slate-400 font-normal">(ixtiyoriy)</span>
            </label>
            <div class="relative">
              <FileText class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <textarea
                v-model="form.description"
                placeholder="Biznesingiz haqida qisqacha..."
                rows="2"
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white resize-none text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Telefon
                <span class="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <div class="relative">
                <Phone class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="+998901234567"
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
            </div>

            <!-- Address -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                Manzil
                <span class="text-slate-400 font-normal">(ixtiyoriy)</span>
              </label>
              <div class="relative">
                <MapPin class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.address"
                  type="text"
                  placeholder="Toshkent, Chilonzor"
                  class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Trial info -->
          <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Clock class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700">
              Biznes yaratilgandan so'ng <strong>14 kunlik bepul sinov</strong> davri boshlanadi. Karta ma'lumotlari talab qilinmaydi.
            </p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading || !form.name.trim()"
            class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            {{ loading ? 'Yaratilmoqda...' : 'Biznes yaratish' }}
          </button>
        </form>

        <p class="mt-5 text-center text-xs text-slate-400">
          Keyinroq to'ldirish mumkin — biznes yaratilgandan keyin sozlamalar sahifasida tahrirlash imkoni bor
        </p>
      </div>
    </div>
  </div>
</template>
