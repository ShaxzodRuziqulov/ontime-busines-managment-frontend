<template>
  <div class="max-w-3xl mx-auto space-y-6 lg:p-0 p-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-600">{{ t('support.title') }}</h1>
      <p
          class="mt-1 text-slate-500 dark:text-slate-400"
      >
        {{ t('support.subtitle') }}
      </p>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="flex gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
          <MessageCircle class="h-6 w-6" />
        </div>
        <div>
          <h2 class="font-semibold text-slate-900 dark:text-white">{{ t('support.telegramTitle') }}</h2>
          <p class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{ t('support.telegramDescBefore') }}
            <code class="rounded bg-slate-100 px-1 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200">Start</code>
            {{ t('support.telegramDescAfter') }}
          </p>
          <button
            class="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="openTelegram"
          >
            <Send class="h-4 w-4" />
            {{ loading ? t('support.opening') : t('support.openBot') }}
            <ExternalLink class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <ShieldCheck class="h-5 w-5 text-emerald-600" />
        <h3
            class="mt-3 font-medium text-slate-900 dark:text-white"
        >
          {{ t('support.linkTitle') }}
        </h3>
        <p
            class="mt-1 text-sm text-slate-500 dark:text-slate-400"
        >
          {{ t('support.linkDesc') }}
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <MessageCircle class="h-5 w-5 text-primary-600" />
        <h3 class="mt-3 font-medium text-slate-900 dark:text-white">{{ t('support.replyTitle') }}</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t('support.replyDesc') }}</p>
      </div>
    </div>

    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-semibold text-slate-900 dark:text-white">
            {{ t('support.myTickets') }}
          </h2>
          <p class="text-sm text-slate-500">{{ t('support.myTicketsDesc') }}</p>
        </div>
        <button
            @click="loadTickets"
            class="text-sm text-primary-600"
        >
          {{ t('common.refresh') }}
        </button>
      </div>
      <p
          v-if="ticketsLoading"
          class="py-5 text-sm text-slate-400"
      >
        {{ t('common.loading') }}
      </p>
      <p
          v-else-if="!tickets.length"
          class="py-5 text-sm text-slate-400"
      >
        {{ t('support.noTickets') }}
      </p>
      <div
          v-else
          class="mt-4 space-y-2"
      >
        <button
            v-for="ticket in tickets"
            :key="ticket.id"
            @click="openTicket(ticket.id)"
            class="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100 dark:bg-slate-700/40 dark:hover:bg-slate-700"
        >
          <span class="min-w-0">
            <span class="truncate text-sm font-medium text-slate-800 dark:text-white">
              {{ticket.subject}}
            </span>
            <span class="text-xs text-slate-400">
              {{new Date(ticket.updatedAt).toLocaleString('uz-UZ')}}
            </span>
          </span>
          <StatusBadge :status="ticket.status" />
        </button>
      </div>
      <div
          v-if="selectedTicket"
          class="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"
      >
        <div class="flex items-center justify-between gap-3">
          <h3 class="truncate font-medium text-slate-900 dark:text-white">{{ selectedTicket.subject }}</h3>
          <button
              @click="selectedTicket=null"
              class="text-xs text-slate-500"
          >
            {{ t('common.close') }}
          </button>
        </div>
        <div class="mt-3 max-h-72 space-y-2 overflow-y-auto">
          <div
              v-for="message in selectedTicket?.messages"
              :key="message.id"
              :class="['rounded-xl p-3 text-sm',
               message.sender === 'OPERATOR'
               ? 'ml-8 bg-primary-50 text-primary-950 dark:bg-primary-950'
               : 'mr-8 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white'
               ]"
          >
            <p>{{ message.content }}</p>
            <p class="mt-1 text-[11px] opacity-50">
              {{ new Date(message.createdAt).toLocaleString('uz-UZ') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ExternalLink, MessageCircle, Send, ShieldCheck } from 'lucide-vue-next'
import { telegramApi } from '@/api/telegram'
import { useToast } from '@/composables/useToast'
import { supportApi, type SupportTicket } from '@/api/support'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const loading = ref(false)
const toast = useToast()
const tickets = ref<SupportTicket[]>([])
const selectedTicket = ref<SupportTicket | null>(null)
const ticketsLoading = ref(false)
async function loadTickets() {
  ticketsLoading.value=true;
  try {
    tickets.value=(await supportApi.mine()).data.content
  } finally {
    ticketsLoading.value=false
  }
}

async function openTicket(id: string) {
  try {
    selectedTicket.value = (await supportApi.mineGet(id)).data
  }
  catch (error: any) {
    toast.error(error.response?.data?.message || t('support.ticketLoadError'))
  }
}

onMounted(loadTickets)

async function openTelegram() {
  loading.value = true
  try {
    const { data } = await telegramApi.createLink()
    window.location.assign(data.url)
  } catch (error: any) {
    toast.error(error.response?.data?.message || t('support.linkError'))
  } finally {
    loading.value = false
  }
}
</script>