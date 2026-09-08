<template>
  <div class="grid w-full min-w-0 max-w-full gap-5 lg:grid-cols-[minmax(280px,.82fr)_minmax(420px,1.18fr)]">
    <section :class="selected ? 'hidden lg:block' : 'block'" class="min-w-0 max-w-full">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-600">Support</h1>
          <p class="text-sm text-slate-500">Telegramdan kelgan murojaatlar</p>
        </div>
        <button aria-label="Yangilash" @click="load" class="min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white p-3 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <RefreshCw :class="['h-5 w-5', loading && 'animate-spin']" />
        </button>
      </div>

      <div class="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        <button v-for="s in ['' as SupportStatus, ...statuses]" :key="s || 'all'" @click="filter = s; load()" :class="['min-h-10 shrink-0 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition', filter === s ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300']">
          {{ s ? label[s] : 'Barchasi' }}
        </button>
      </div>

      <div class="space-y-2">
        <button v-for="t in tickets" :key="t.id" @click="open(t.id)" class="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-primary-400 hover:shadow-md active:scale-[.99] dark:border-slate-700 dark:bg-slate-800">
          <div class="flex items-start justify-between gap-3">
            <strong class="min-w-0 truncate text-sm text-slate-800 dark:text-white">{{ t.requesterName }}</strong>
            <StatusBadge class="shrink-0" :status="t.status" />
          </div>
          <p class="mt-1.5 truncate text-sm text-slate-500">{{ t.subject }}</p>
          <p class="mt-3 text-xs text-slate-400">{{ date(t.updatedAt) }}</p>
        </button>
        <p v-if="loading" class="py-12 text-center text-sm text-slate-400">Yuklanmoqda...</p>
        <p v-else-if="!tickets.length" class="py-12 text-center text-sm text-slate-400">Murojaatlar yo‘q</p>
      </div>
    </section>

    <section :class="selected ? 'block' : 'hidden lg:block'" class="min-h-[calc(100vh-10rem)] min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-800 lg:min-h-0">
      <div v-if="!selected" class="flex h-full min-h-80 flex-col items-center justify-center text-slate-400">
        <MessageCircle class="mb-3 h-9 w-9" />
        Murojaatni tanlang
      </div>

      <template v-else>
        <div class="flex items-start gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
          <button aria-label="Ro‘yxatga qaytish" @click="closeTicket" class="mt-0.5 -ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"><ArrowLeft class="h-5 w-5" /></button>
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold text-slate-900 dark:text-white">{{ selected.requesterName }}</h2>
            <p class="truncate text-xs text-slate-500">{{ selected.requesterLogin || 'Telegram user' }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2">
          <label class="text-xs font-medium text-slate-500">Muhimlik
            <select :value="selected.priority" @change="save({ priority: ($event.target as HTMLSelectElement).value })" class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option v-for="p in priorities" :key="p" :value="p">{{ priorityLabel[p] }}</option>
            </select>
          </label>
          <label class="text-xs font-medium text-slate-500">Holati
            <select :value="selected.status" @change="save({ status: ($event.target as HTMLSelectElement).value })" class="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
              <option v-for="s in statuses" :key="s" :value="s">{{ label[s] }}</option>
            </select>
          </label>
        </div>

        <div class="my-4 max-h-[calc(100vh-26rem)] min-h-48 space-y-3 overflow-y-auto pr-1 lg:max-h-[390px]">
          <div v-for="m in selected.messages" :key="m.id" :class="['max-w-[88%] rounded-2xl p-3 text-sm', m.sender === 'OPERATOR' ? 'ml-auto bg-primary-50 text-primary-950 dark:bg-primary-950 dark:text-primary-50' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white']">
            <p class="break-words">{{ m.content }}</p>
            <p v-if="m.mediaType" class="mt-1 text-xs opacity-60">{{ m.mediaType }}</p>
            <p class="mt-1 text-[11px] opacity-50">{{ date(m.createdAt) }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-700 sm:flex-row">
          <textarea v-model="reply" rows="3" placeholder="Javob yozing..." class="min-h-24 w-full min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" @keydown.ctrl.enter="send" />
          <button aria-label="Javobni yuborish" @click="send" class="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 font-semibold text-white transition hover:bg-primary-500 disabled:opacity-60 sm:self-end" :disabled="!reply.trim()">
            <Send class="h-5 w-5" /><span class="sm:hidden">Yuborish</span>
          </button>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, MessageCircle, RefreshCw, Send } from 'lucide-vue-next'
import { supportApi, type SupportStatus, type SupportTicket } from '@/api/support'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/composables/useToast'

const tickets = ref<SupportTicket[]>([]);
const selected = ref<SupportTicket | null>(null);
const loading = ref(false);
const filter = ref<SupportStatus | ''>('');
const reply = ref('');
const toast = useToast()
const statuses: SupportStatus[] = ['NEW','IN_PROGRESS','WAITING_USER','RESOLVED','CLOSED']
const label: Record<SupportStatus,string> = {
  NEW:'Yangi',
  IN_PROGRESS:'Jarayonda',
  WAITING_USER:'User javobi kutilmoqda',
  RESOLVED:'Hal qilindi',
  CLOSED:'Yopildi'
}
const priorities = ['LOW','NORMAL','HIGH','URGENT'] as const
const priorityLabel: Record<(typeof priorities)[number], string> = {
  LOW:'Past',
  NORMAL:'Oddiy',
  HIGH:'Yuqori',
  URGENT:'Shoshilinch'
}

async function load() {
  loading.value=true;
  try {
    tickets.value=(
        await supportApi.adminList({status:filter.value||undefined}))
        .data.content
  } finally {
    loading.value=false
  }
}

async function open(id:string) {
  selected.value=(await supportApi.adminGet(id))
      .data; reply.value=''
}

function closeTicket() {
  selected.value = null;
  reply.value = ''
}
async function save(data:{
  status?:string;
  priority?:string
})

{
  if(!selected.value)return;
  selected.value=(await supportApi.update(selected.value.id,data))
      .data; await load()
}

async function send() {
  if(!selected.value||!reply.value.trim())return;
  try {
    selected.value=(await supportApi.reply(selected.value.id,reply.value.trim()))
        .data; reply.value='';
        await load();
        toast.success('Javob Telegramga yuborildi')
  } catch(e:any){
    toast.error(e.response?.data?.message||'Yuborib bo‘lmadi')
  }
}

function date(v:string){
  return new Date(v).toLocaleString('uz-UZ',{dateStyle:'short',timeStyle:'short'})
}

onMounted(load)

</script>