import { ref, computed } from 'vue'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isInstalled = ref(false)

let initialized = false

function checkInstalled() {
    isInstalled.value =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & {
            standalone?: boolean | undefined
        }).standalone === true
}

function handleBeforeInstallPrompt(event: Event) {
    event.preventDefault()

    deferredPrompt.value = event as BeforeInstallPromptEvent

    console.log('PWA install prompt tayyor')
}

function handleAppInstalled() {
    deferredPrompt.value = null
    isInstalled.value = true

    console.log('PWA o‘rnatildi')
}

function initPwaInstall() {
    if (initialized) return

    initialized = true

    checkInstalled()

    window.addEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
    )

    window.addEventListener(
        'appinstalled',
        handleAppInstalled
    )
}

export function usePwaInstall() {
    if (typeof window !== 'undefined') {
        initPwaInstall()
    }

    const canInstall = computed(() => {
        return deferredPrompt.value !== null && !isInstalled.value
    })

    const install = async () => {
        if (!deferredPrompt.value) {
            console.warn('PWA install prompt mavjud emas')
            return false
        }

        const promptEvent = deferredPrompt.value

        await promptEvent.prompt()

        const { outcome } = await promptEvent.userChoice

        console.log('Install natijasi:', outcome)

        deferredPrompt.value = null

        if (outcome === 'accepted') {
            isInstalled.value = true
            return true
        }

        return false
    }

    return {
        canInstall,
        isInstalled,
        install,
    }
}