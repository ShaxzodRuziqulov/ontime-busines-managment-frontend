<template>
  <div class="max-w-5xl mx-auto">
    <div class="mb-7">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 grid place-items-center">
          <QrCode class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-slate-800">{{ t('qr.title') }}</h2>
          <p class="text-sm text-slate-500 mt-1">{{ t('qr.subtitle') }}</p>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="businessStore.loading" />
    <div
        v-else-if="!businessStore.business"
        class="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500"
    >
      {{ t('qr.fillBusiness') }}
    </div>

    <div
        v-else-if="businessStore.isReadOnly"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"
    >
      <QrCode class="mx-auto h-10 w-10 text-amber-600" />
      <h3 class="mt-3 font-semibold text-amber-900">{{ t('qr.inactiveTitle') }}</h3>
      <p class="mt-1 text-sm text-amber-800">{{ t('qr.inactiveDesc') }}</p>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
      <section class="rounded-2xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8 flex flex-col items-center">
        <p class="text-sm font-semibold text-slate-800">{{ businessStore.business.name }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ t('qr.onlineBooking') }}</p>
        <div class="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <img
              v-if="qrImageUrl"
              :src="qrImageUrl"
              :alt="t('qr.alt', { name: businessStore.business.name })"
              class="w-full max-w-[320px] rounded-xl bg-white"
          />
          <div
              v-else
              class="grid h-72 w-72 place-items-center text-sm text-slate-400"
          >
            {{ t('qr.generating') }}
          </div>
        </div>
        <p class="mt-5 max-w-sm text-center text-sm leading-6 text-slate-500">
          {{ t('qr.printHint') }}
        </p>
      </section>

      <section class="rounded-2xl border border-slate-100 bg-white shadow-sm p-6">
        <h3 class="text-base font-semibold text-slate-800">{{ t('qr.actionsTitle') }}</h3>
        <p class="mt-1 text-sm text-slate-500">{{ t('qr.actionsDesc') }}</p>

        <div class="mt-5 space-y-3">
          <button
              type="button"
              :disabled="sharingQr"
              class="action-button share-mobile bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60"
              @click="shareQrImage"
          >
            <Send class="w-5 h-5" />
            <span>
              <b>{{ sharingQr ? t('qr.preparing') : t('qr.share') }}</b>
              <small>{{ t('qr.shareHint') }}</small>
            </span>
          </button>
          <button
              type="button"
              class="action-button border border-slate-200 text-slate-700 hover:bg-slate-50"
              @click="printQrCode"
          >
            <Printer class="w-5 h-5 text-slate-500" />
            <span>
              <b>{{ t('qr.print') }}</b>
              <small>{{ t('qr.printDesc') }}</small>
            </span>
          </button>
          <button
              type="button"
              class="action-button border border-slate-200 text-slate-700 hover:bg-slate-50"
              @click="downloadQrCode"
          >
            <Download class="w-5 h-5 text-slate-500" />
            <span>
              <b>{{ t('qr.download') }}</b>
              <small>{{ t('qr.downloadDesc') }}</small>
            </span>
          </button>
        </div>

        <div class="mt-6 border-t border-slate-100 pt-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {{ t('qr.customerLink') }}
          </p>
          <div class="mt-2 flex gap-2">
            <input
                :value="publicBookingUrl"
                readonly class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600 outline-none"
            />
            <button
                type="button"
                class="rounded-xl border border-primary-200 px-3 text-primary-700 hover:bg-primary-50"
                :title="t('qr.copyLink')"
                @click="copyBookingUrl"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Copy, Download, Printer, QrCode, Send } from 'lucide-vue-next'
import QRCode from 'qrcode'
import { useBusinessStore } from '@/stores/business'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const businessStore = useBusinessStore()
const toast = useToast()
const sharingQr = ref(false)
const clientAppUrl = (import.meta.env.VITE_CLIENT_APP_URL || 'https://salonqueue.netlify.app').replace(/\/$/, '')
const publicBookingUrl = computed(() => {
  const id = businessStore.business?.id
  return id ? `${clientAppUrl}/business/${id}` : clientAppUrl
})
const qrImageUrl = ref('')

watch(publicBookingUrl, async (url) => {
  try {
    qrImageUrl.value = await QRCode.toDataURL(url, {
      width: 700,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
  } catch {
    qrImageUrl.value = ''
    toast.error(t('qr.createError'))
  }
}, { immediate: true })

async function qrImageFile() {
  const response = await fetch(qrImageUrl.value)
  if (!response.ok) throw new Error('QR image yuklanmadi')
  const image = await response.blob()
  const name = (businessStore.business?.name || 'biznes').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '')
  return new File([image], `${name || 'biznes'}-qr-kod.png`, { type: image.type || 'image/png' })
}

async function copyBookingUrl() {
  try {
    await navigator.clipboard.writeText(publicBookingUrl.value)
    toast.success(t('qr.linkCopied'))
  } catch {
    toast.error(t('qr.copyError'))
  }
}

async function shareQrImage() {
  if (!navigator.share) {
    toast.error(t('qr.shareUnsupported'))
    return
  }
  sharingQr.value = true
  try {
    const file = await qrImageFile()
    if (navigator.canShare && !navigator.canShare({ files: [file] })) throw new Error(t('qr.shareError'))
    await navigator.share({ title: t('qr.shareTitle', { name: businessStore.business?.name || t('qr.businessFallback') }), text: t('qr.scanText'), files: [file] })
  } catch (error) {
    if ((error as Error).name !== 'AbortError') toast.error(t('qr.shareError'))
  } finally {
    sharingQr.value = false
  }
}

async function downloadQrCode() {
  try {
    const file = await qrImageFile()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(file)
    link.download = file.name
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast.error(t('qr.downloadError'))
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] || char)
}

function printQrCode() {
  const popup = window.open('', '_blank', 'width=720,height=760')
  if (!popup) { toast.error(t('qr.printPopupError')); return }
  const businessName = escapeHtml(businessStore.business?.name || t('qr.businessFallback'))
  const bookingUrl = escapeHtml(publicBookingUrl.value)
  popup.document.write(`
<!doctype html>
<html lang="uz">
<head>
<title>
${businessName} — QR-kod
</title>
<style>
body{font-family:Arial,sans-serif;text-align:center;padding:36px;color:#0f172a}
img{width:360px;max-width:100%;margin:24px auto;display:block}
p{word-break:break-all;color:#475569;font-size:14px}
.hint{font-size:16px;color:#334155}
</style>
</head>
<body>
<h1>${businessName}</h1>
<p class="hint">${escapeHtml(t('qr.scanText'))}</p>
<img src="${qrImageUrl.value}" alt="QR-kod">
<p>${bookingUrl}</p>
<script>window.onload=()=>window.print()<\/script>
</body>
</html>
`)
  popup.document.close()
}
</script>

<style scoped>
.action-button {
  @apply w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors;
}
.action-button span {
  @apply flex min-w-0 flex-col;
}
.action-button b {
  @apply text-sm font-semibold;
}
.action-button small {
  @apply mt-0.5 text-xs opacity-75;
}
@media (min-width: 1024px) {
  .share-mobile { display: none; }
}
</style>
