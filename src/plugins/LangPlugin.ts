import { reactive } from 'vue'

import {
  resolveSupportedLang,
  resolveUrlLangFromPath,
  toSupportedLang,
} from '@/composables/useLangRoute'
import type { AppState } from '@/composables/useAppState'

interface LangState {
  lang: SupportedLang
}

interface CreateLangPluginOptions {
  state: AppState
  requestHeaders?: Record<string, string | string[] | undefined>
  currentPath?: string
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $lang: LangState
    $toggleLang: (key: SupportedLang) => void
  }
}

const selectedList = ['zh', 'jp'] as SupportedLang[]

function toHtmlLang(lang: SupportedLang) {
  return lang === 'jp' ? 'ja-JP' : 'zh-CN'
}

function normalizeLang(value?: string | null): SupportedLang | null {
  if (!value) {
    return null
  }

  const lowerValue = value.toLowerCase()

  if (selectedList.includes(lowerValue as SupportedLang)) {
    return lowerValue as SupportedLang
  }

  if (lowerValue.includes('ja') || lowerValue.includes('jp')) {
    return 'jp'
  }

  if (lowerValue.includes('zh')) {
    return 'zh'
  }

  return null
}

function parseCookieLang(cookieHeader?: string | string[]) {
  const source = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader

  if (!source) {
    return null
  }

  const matched = source.match(/(?:^|;\s*)lang=([^;]+)/i)
  return normalizeLang(matched?.[1] ? decodeURIComponent(matched[1]) : null)
}

function resolveInitialLang(options: CreateLangPluginOptions) {
  const routeLang = resolveSupportedLang(resolveUrlLangFromPath(options.currentPath || '/'))
  if (routeLang) {
    return routeLang
  }

  if (typeof window !== 'undefined') {
    const pathLang = resolveUrlLangFromPath(window.location.pathname)
    if (pathLang) {
      return toSupportedLang(pathLang)
    }

    const localLang = normalizeLang(window.localStorage.getItem('lang'))
    if (localLang) {
      return localLang
    }

    const cookieLang = parseCookieLang(document.cookie)
    if (cookieLang) {
      return cookieLang
    }

    return normalizeLang(window.navigator.language) ?? 'zh'
  }

  const stateLang = normalizeLang(options.state.lang)
  if (stateLang) {
    return stateLang
  }

  const cookieLang = parseCookieLang(options.requestHeaders?.cookie)
  if (cookieLang) {
    return cookieLang
  }

  const acceptLanguage = options.requestHeaders?.['accept-language']
  const acceptLanguageValue = Array.isArray(acceptLanguage)
    ? acceptLanguage.join(',')
    : acceptLanguage

  return normalizeLang(acceptLanguageValue) ?? 'zh'
}

export function createLangPlugin(options: CreateLangPluginOptions) {
  return {
    install(app: import('vue').App) {
      const langState = reactive<LangState>({
        lang: resolveInitialLang(options),
      })

      options.state.lang = langState.lang

      function setLang(lang: SupportedLang) {
        if (!selectedList.includes(lang)) {
          return
        }

        langState.lang = lang
        options.state.lang = lang

        if (typeof document !== 'undefined') {
          document.cookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
          window.localStorage.setItem('lang', lang)
          document.documentElement.lang = toHtmlLang(lang)
        }
      }

      function toggleLang(key: SupportedLang) {
        setLang(key)
      }

      app.config.globalProperties.$lang = langState
      app.config.globalProperties.$toggleLang = toggleLang
    },
  }
}

export default createLangPlugin({
  state: {
    lang: 'zh',
    miletHomeData: null,
    miletAnniversaryData: null,
  },
  currentPath: '/',
})
