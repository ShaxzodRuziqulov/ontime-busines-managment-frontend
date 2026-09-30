import { createI18n } from 'vue-i18n'
import uz from './locales/uz.json'
import uzCyrl from './locales/uz-Cyrl.json'
import ru from './locales/ru.json'
import en from './locales/en.json'

export type SupportedLocale = 'uz' | 'uz-Cyrl' | 'ru' | 'en'

export const SUPPORTED_LOCALES: { code: SupportedLocale; label: string }[] = [
  { code: 'uz', label: "O'zbekcha" },
  { code: 'uz-Cyrl', label: 'Ўзбекча' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

const STORAGE_KEY = 'ontime-locale'

function getInitialLocale(): SupportedLocale {
  const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
  if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) return saved
  return 'uz'
}

const i18n = createI18n({
  legacy: false,
  // onboarding sahifasidagi <strong> teglari bor matnlar v-html orqali chiqariladi
  warnHtmlMessage: false,
  locale: getInitialLocale(),
  fallbackLocale: 'uz',
  messages: {
    uz,
    'uz-Cyrl': uzCyrl,
    ru,
    en,
  },
})

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.setAttribute('lang', locale === 'uz-Cyrl' ? 'uz' : locale)
}

// Set the initial <html lang> to match the resolved starting locale
document.documentElement.setAttribute(
  'lang',
  i18n.global.locale.value === 'uz-Cyrl' ? 'uz' : (i18n.global.locale.value as string),
)

export default i18n

/** Komponentdan tashqarida (utils, store, router) tarjima olish uchun. */
export const t = (key: string, params?: Record<string, unknown>) =>
  params ? i18n.global.t(key, params) : i18n.global.t(key)

/**
 * `prefix.KEY` ko'rinishidagi tarjimalarni oddiy Record kabi ishlatish uchun proxy.
 * Har murojaatda joriy tilni o'qiydi, shuning uchun shablonlar reaktiv yangilanadi.
 * Tarjima topilmasa kalitning o'zi qaytadi.
 */
export function translatedRecord<K extends string>(prefix: string): Record<K, string> {
  return new Proxy({} as Record<K, string>, {
    get(_, key) {
      if (typeof key !== 'string') return undefined
      const full = `${prefix}.${key}`
      return i18n.global.te(full) ? i18n.global.t(full) : undefined
    },
    has(_, key) {
      return typeof key === 'string' && i18n.global.te(`${prefix}.${key}`)
    },
  })
}

/** toLocaleString / toLocaleDateString uchun joriy tilga mos BCP-47 locale. */
export function dateLocale(): string {
  const map: Record<string, string> = { uz: 'uz-UZ', 'uz-Cyrl': 'uz-Cyrl-UZ', ru: 'ru-RU', en: 'en-US' }
  return map[i18n.global.locale.value as string] ?? 'uz-UZ'
}
