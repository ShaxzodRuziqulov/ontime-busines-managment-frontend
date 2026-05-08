<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Building2, Users, ArrowRight, X, Loader2 } from 'lucide-vue-next'
import { usersApi } from '@/api/users'
import { businessesApi } from '@/api/businesses'
import type { User, Business } from '@/types'

const emit = defineEmits<{ close: [] }>()
const router = useRouter()

const query = ref('')
const loading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(-1)

const allUsers = ref<User[]>([])
const allBusinesses = ref<Business[]>([])
const dataLoaded = ref(false)

const statusLabels: Record<string, string> = {
  TRIAL: 'Sinov', ACTIVE: 'Faol', EXPIRED: "Muddati o'tgan",
  SUSPENDED: "To'xtatilgan", DRAFT: 'Qoralama', PENDING_REVIEW: 'Tekshiruvda',
}

interface Result {
  type: 'user' | 'business'
  id: string
  title: string
  subtitle: string
  to: string
}

const results = computed<Result[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q || q.length < 2) return []

  const users: Result[] = allUsers.value
    .filter(u =>
      u.login.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(u => ({
      type: 'user',
      id: u.id,
      title: u.displayName || u.login,
      subtitle: u.email ? `${u.login} · ${u.email}` : u.login,
      to: '/admin/users',
    }))

  const businesses: Result[] = allBusinesses.value
    .filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.addressLine?.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(b => ({
      type: 'business',
      id: b.id,
      title: b.name,
      subtitle: `${statusLabels[b.status] ?? b.status}${b.city ? ' · ' + b.city : ''}`,
      to: `/admin/businesses/${b.id}`,
    }))

  return [...users, ...businesses]
})

watch(query, () => { activeIndex.value = -1 })

async function loadData() {
  if (dataLoaded.value) return
  loading.value = true
  try {
    const [u, b] = await Promise.allSettled([usersApi.getAll(), businessesApi.getAll()])
    if (u.status === 'fulfilled') allUsers.value = u.value.data
    if (b.status === 'fulfilled') allBusinesses.value = b.value.data
    dataLoaded.value = true
  } finally {
    loading.value = false
  }
}

function navigate(result: Result) {
  router.push(result.to)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    if (activeIndex.value >= 0 && results.value[activeIndex.value]) {
      navigate(results.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(async () => {
  await nextTick()
  inputRef.value?.focus()
  loadData()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')" />

      <!-- Search panel -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl z-10 overflow-hidden">
        <!-- Input -->
        <div class="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Loader2 v-if="loading" class="w-5 h-5 text-slate-400 flex-shrink-0 animate-spin" />
          <Search v-else class="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            placeholder="Foydalanuvchi yoki biznes qidirish..."
            class="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          <button @click="$emit('close')" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Results -->
        <div class="max-h-80 overflow-y-auto">
          <!-- Empty query hint -->
          <div v-if="query.length < 2 && !loading" class="px-4 py-8 text-center text-slate-400 text-sm">
            <Search class="w-8 h-8 mx-auto mb-2 opacity-30" />
            Kamida 2 harf kiriting
          </div>

          <!-- No results -->
          <div v-else-if="query.length >= 2 && results.length === 0 && !loading" class="px-4 py-8 text-center text-slate-400 text-sm">
            "{{ query }}" bo'yicha hech narsa topilmadi
          </div>

          <!-- Result groups -->
          <template v-else-if="results.length > 0">
            <!-- Users group -->
            <div v-if="results.some(r => r.type === 'user')">
              <div class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users class="w-3.5 h-3.5" /> Foydalanuvchilar
              </div>
              <button
                v-for="(result, idx) in results.filter(r => r.type === 'user')"
                :key="result.id"
                @click="navigate(result)"
                @mouseenter="activeIndex = results.indexOf(result)"
                :class="[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  activeIndex === results.indexOf(result) ? 'bg-primary-50' : 'hover:bg-slate-50',
                ]"
              >
                <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users class="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ result.title }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ result.subtitle }}</p>
                </div>
                <ArrowRight class="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              </button>
            </div>

            <!-- Businesses group -->
            <div v-if="results.some(r => r.type === 'business')">
              <div class="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 class="w-3.5 h-3.5" /> Bizneslar
              </div>
              <button
                v-for="result in results.filter(r => r.type === 'business')"
                :key="result.id"
                @click="navigate(result)"
                @mouseenter="activeIndex = results.indexOf(result)"
                :class="[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  activeIndex === results.indexOf(result) ? 'bg-primary-50' : 'hover:bg-slate-50',
                ]"
              >
                <div class="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 class="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ result.title }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ result.subtitle }}</p>
                </div>
                <ArrowRight class="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              </button>
            </div>
          </template>
        </div>

        <!-- Footer hint -->
        <div class="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
          <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 font-mono">↑↓</kbd> navigatsiya</span>
          <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 font-mono">Enter</kbd> ochish</span>
          <span><kbd class="px-1.5 py-0.5 rounded bg-slate-100 font-mono">Esc</kbd> yopish</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
