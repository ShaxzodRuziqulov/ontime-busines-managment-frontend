<template>
  <div class="relative flex min-h-screen overflow-hidden bg-[#081120] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(37,99,235,.22),transparent_27%),radial-gradient(circle_at_72%_78%,rgba(20,184,166,.16),transparent_25%)]" />
    <div class="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:42px_42px]" />

    <section class="relative hidden min-h-screen flex-1 lg:flex lg:max-w-[58%] lg:flex-col lg:justify-between lg:px-16 lg:py-12 xl:px-24">
      <AppLogo size="lg" />

      <div class="max-w-xl">
        <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/25 bg-primary-500/10 px-3 py-1.5 text-xs font-bold text-primary-200">Yangi biznesingizni bugun boshlang</div>
        <h1 class="text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">Bir necha daqiqada<br /><span class="bg-gradient-to-r from-primary-300 to-teal-300 bg-clip-text text-transparent">ishga tayyor</span> bo‘ling.</h1>
        <p class="mt-6 max-w-lg text-lg leading-8 text-slate-300">Biznesingiz, jamoangiz va navbatlaringizni bitta tizimdan boshqaring. Dastlabki 14 kun bepul.</p>
      </div>

      <div class="grid max-w-2xl grid-cols-3 gap-3">
        <div
            v-for="step in [
            { num: '1', text: 'Hisob yarating' },
            { num: '2', text: 'Biznesingizni sozlang' },
            { num: '3', text: 'Bepul sinab ko‘ring' },
          ]"
            :key="step.num"
            class="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500/20 text-sm font-black text-primary-200">
            {{ step.num }}
          </div>
          <p class="mt-3 text-sm font-bold text-slate-200">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <section class="relative flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:border-l lg:border-white/[.06]">
      <div class="w-full max-w-md">
        <AppLogo size="md" class="mb-10 lg:hidden" />

        <div class="rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div class="mb-8">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/20">
              <UserPlus class="w-6 h-6 text-primary-300" />
            </div>
            <p class="text-sm font-bold text-primary-300">OnTime Business</p>
            <h2 class="mt-2 text-3xl font-black tracking-tight">Ro'yxatdan o'tish</h2>
            <p class="mt-2 text-sm leading-6 text-slate-400">Hisob yarating va biznesingizni boshqarishni boshlang.</p>
          </div>

          <!-- Error -->
          <div
              v-if="error"
              class="mb-6 flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0" />
            {{ error }}
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-sm font-bold text-slate-200">Ism *</label>
              <input
                  v-model="form.firstName"
                  type="text"
                  placeholder="Ism"
                  autocomplete="given-name"
                  @blur="validateFirstName"
                  :class="[
                  'w-full rounded-xl border bg-white/[.045] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30',
                  fieldErrors.firstName
                  ? 'border-red-400/60'
                  : 'border-white/10 focus:border-primary-400',
                ]"
              />
              <p
                  v-if="fieldErrors.firstName"
                  class="mt-1 text-xs text-red-300"
              >
                {{ fieldErrors.firstName }}
              </p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-bold text-slate-200">Familiya</label>
              <input
                  v-model="form.lastName"
                  type="text"
                  placeholder="Familiya"
                  autocomplete="family-name"
                  class="w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-primary-400 focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <!-- Login -->
            <div>
              <label for="reg-username" class="mb-1.5 block text-sm font-bold text-slate-200">Login *</label>
              <input
                  id="reg-username"
                  v-model="form.login"
                  type="text"
                  placeholder="username"
                  autocomplete="username"
                  @blur="validateLogin"
                  :class="[
                  'w-full rounded-xl border bg-white/[.045] px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30',
                  fieldErrors.login
                  ? 'border-red-400/60'
                  : 'border-white/10 focus:border-primary-400',
                ]"
              />
              <p
                  v-if="fieldErrors.login"
                  class="mt-1 text-xs text-red-300"
              >
                {{ fieldErrors.login }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <label for="reg-password" class="mb-1.5 block text-sm font-bold text-slate-200">Parol *</label>
              <div class="relative">
                <input
                    id="reg-password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    autocomplete="new-password"
                    @blur="validatePassword"
                    :class="[
                    'w-full rounded-xl border bg-white/[.045] px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30',
                    fieldErrors.password ? 'border-red-400/60' : 'border-white/10 focus:border-primary-400',
                  ]"
                />
                <button
                    type="button"
                    :aria-label="showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-white"
                    @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
              <p
                  v-if="fieldErrors.password"
                  class="mt-1 text-xs text-red-300"
              >
                {{ fieldErrors.password }}
              </p>
            </div>

            <!-- Email & Phone -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="reg-email" class="mb-1.5 block text-sm font-bold text-slate-200">Email</label>
                <input
                    id="reg-email"
                    v-model="form.email"
                    type="email"
                    placeholder="email@example.com"
                    autocomplete="email"
                    class="w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-primary-400 focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label for="reg-phone" class="mb-1.5 block text-sm font-bold text-slate-200">Telefon</label>
                <input
                    id="reg-phone"
                    v-model="displayPhone"
                    inputmode="numeric"
                    required
                    type="tel"
                    placeholder="+99890 123 45 67"
                    autocomplete="tel"
                    class="w-full rounded-xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-primary-400 focus:bg-white/[.075] focus:ring-2 focus:ring-primary-500/30"
                    @input="onPhoneInput"
                    @keydown="onPhoneKeydown"
                />
              </div>
            </div>

            <!-- Submit -->
            <button
                type="submit"
                :disabled="loading"
                class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 font-bold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              {{ loading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Davom etish' }}
            </button>
          </form>

          <p class="mt-7 text-center text-sm text-slate-400">
            Hisobingiz bormi?
            <RouterLink :to="{ name: 'login' }" class="font-bold text-primary-300 transition hover:text-primary-200">
              Kirish
            </RouterLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader2, AlertCircle, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/common/AppLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

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
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
})


const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({ firstName: '', login: '', password: '' })

function validateFirstName() {
  fieldErrors.firstName = form.firstName.length < 2 ? 'Ism kamida 2 ta belgi bo\'lishi kerak' : ''
}
function validateLogin() {
  fieldErrors.login = form.login.length < 3 ? 'Login kamida 3 ta belgi bo\'lishi kerak' : ''
}
function validatePassword() {
  fieldErrors.password = form.password.length < 4 ? 'Parol kamida 4 ta belgi bo\'lishi kerak' : ''
}

async function handleRegister() {
  if (!form.login || !form.firstName) {
    error.value = 'Login va ism kiritilishi shart'
    return
  }
  if (form.password.length < 4) {
    error.value = 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak'
    return
  }

  if (!isPhoneComplete.value) {
    error.value = "Telefon raqamni to'liq kiriting";
    return;
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register({
      ...form,
      phone: phone.value
    })
    await router.push('/onboarding')
  } catch (e: any) {
    if (e.response?.status === 409) {
      error.value = 'Bu login allaqachon band'
    } else if (e.response?.status === 400) {
      error.value = e.response.data?.message || 'Ma\'lumotlar noto\'g\'ri'
    } else {
      error.value = 'Serverga ulanishda xatolik'
    }
  } finally {
    loading.value = false
  }
}
</script>
