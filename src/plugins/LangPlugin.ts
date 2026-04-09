import { reactive } from 'vue'

import type { AppState } from '@/composables/useAppState'
import { langConfig } from '@/composables/lang'

interface LangState {
  lang: SupportedLang
}

interface CreateLangPluginOptions {
  state: AppState
  requestHeaders?: Record<string, string | string[] | undefined>
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $getConfigLang: (key: string) => object | string
    $lang: LangState
    $toggleLang: (key: SupportedLang) => void
  }
}

const selectedList = ['zh', 'jp'] as SupportedLang[]

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
  const stateLang = normalizeLang(options.state.lang)
  if (stateLang) {
    return stateLang
  }

  if (typeof window !== 'undefined') {
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

      function getConfigLang(key: string) {
        return langConfig[langState.lang]?.[key] || key
      }

      function setLang(lang: SupportedLang) {
        if (!selectedList.includes(lang)) {
          return
        }

        langState.lang = lang
        options.state.lang = lang

        if (typeof document !== 'undefined') {
          document.cookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
          window.localStorage.setItem('lang', lang)
        }
      }

      function toggleLang(key: SupportedLang) {
        setLang(key)
      }

      app.config.globalProperties.$getConfigLang = getConfigLang
      app.config.globalProperties.$lang = langState
      app.config.globalProperties.$toggleLang = toggleLang
    },
  }
}

export default createLangPlugin({
  state: {
    lang: 'zh',
    miletHomeData: null,
  },
})
