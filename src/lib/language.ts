export type SupportedLanguage = 'ko' | 'en' | 'zh-CN' | 'vi' | 'th' | 'id' | 'es'

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ko', 'en', 'zh-CN', 'vi', 'th', 'id', 'es']

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  'zh-CN': '中文',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  es: 'Español',
}

const LANGUAGE_KEY = 'dm_app_language'
const AUTH_SELECTED_LANGUAGE_KEY = 'dm_auth_selected_language'

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}

export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'ko'
  const lang = navigator.language.toLowerCase()

  if (lang.startsWith('ko')) return 'ko'
  if (lang.startsWith('en')) return 'en'
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang.startsWith('vi')) return 'vi'
  if (lang.startsWith('th')) return 'th'
  if (lang.startsWith('id')) return 'id'
  if (lang.startsWith('es')) return 'es'

  return 'ko'
}

export function getStoredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)
    if (isSupportedLanguage(stored)) return stored
  } catch {
    // ignore storage failures
  }
  return detectBrowserLanguage()
}

export function saveStoredLanguage(language: SupportedLanguage) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language)
  } catch {
    // ignore storage failures
  }
}

export function saveAuthSelectedLanguage(language: SupportedLanguage) {
  try {
    sessionStorage.setItem(AUTH_SELECTED_LANGUAGE_KEY, language)
  } catch {
    // ignore storage failures
  }
}

export function getAuthSelectedLanguage(): SupportedLanguage | null {
  try {
    const stored = sessionStorage.getItem(AUTH_SELECTED_LANGUAGE_KEY)
    return isSupportedLanguage(stored) ? stored : null
  } catch {
    return null
  }
}

export function consumeAuthSelectedLanguage(): SupportedLanguage | null {
  const stored = getAuthSelectedLanguage()
  try {
    sessionStorage.removeItem(AUTH_SELECTED_LANGUAGE_KEY)
  } catch {
    // ignore storage failures
  }
  return stored
}

export const TTS_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  'zh-CN': 'cmn-CN',
  vi: 'vi-VN',
  th: 'th-TH',
  id: 'id-ID',
  es: 'es-ES',
}
