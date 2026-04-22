import type { RouteLocationRaw } from 'vue-router'

type UrlLang = 'zh' | 'ja'

function normalizeUrlLang(value?: string | null): UrlLang | null {
  if (!value) {
    return null
  }

  const lowerValue = value.toLowerCase()

  if (lowerValue === 'zh' || lowerValue.startsWith('zh-')) {
    return 'zh'
  }

  if (lowerValue === 'ja' || lowerValue === 'jp' || lowerValue.startsWith('ja-') || lowerValue.includes('jp')) {
    return 'ja'
  }

  return null
}

export function toSupportedLang(value?: string | null): SupportedLang {
  return normalizeUrlLang(value) === 'ja' ? 'jp' : 'zh'
}

export function resolveSupportedLang(value?: string | null): SupportedLang | null {
  const urlLang = normalizeUrlLang(value)
  if (!urlLang) {
    return null
  }

  return urlLang === 'ja' ? 'jp' : 'zh'
}

export function toUrlLang(value?: string | null): UrlLang {
  return toSupportedLang(value) === 'jp' ? 'ja' : 'zh'
}

export function resolveUrlLangFromPath(pathname: string): UrlLang | null {
  const matched = pathname.match(/^\/(zh|ja)(?:\/|$)/i)
  return normalizeUrlLang(matched?.[1] ?? null)
}

function headerValue(value?: string | string[] | null) {
  return Array.isArray(value) ? value.join(',') : value
}

function parseCookieLang(cookieHeader?: string | string[] | null) {
  const source = headerValue(cookieHeader)
  if (!source) {
    return null
  }

  const matched = source.match(/(?:^|;\s*)lang=([^;]+)/i)
  return normalizeUrlLang(matched?.[1] ? decodeURIComponent(matched[1]) : null)
}

export function resolvePreferredUrlLang(headers?: Record<string, string | string[] | undefined>) {
  const headerCookieLang = parseCookieLang(headers?.cookie)
  if (headerCookieLang) {
    return headerCookieLang
  }

  const headerAcceptLang = normalizeUrlLang(headerValue(headers?.['accept-language']))
  if (headerAcceptLang) {
    return headerAcceptLang
  }

  if (typeof document !== 'undefined') {
    const cookieLang = parseCookieLang(document.cookie)
    if (cookieLang) {
      return cookieLang
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLang = normalizeUrlLang(navigator.language)
    if (browserLang) {
      return browserLang
    }
  }

  return 'zh'
}

export function stripLangPrefix(pathname: string) {
  const urlLang = resolveUrlLangFromPath(pathname)

  if (!urlLang) {
    return pathname || '/'
  }

  const stripped = pathname.replace(/^\/(?:zh|ja)(?=\/|$)/i, '')
  return stripped || '/'
}

export function withLangParam(to: RouteLocationRaw, currentLang?: string | null): RouteLocationRaw {
  const urlLang = toUrlLang(currentLang)

  if (typeof to === 'string') {
    const normalizedPath = to.startsWith('/') ? to : `/${to}`
    return `/${urlLang}${stripLangPrefix(normalizedPath)}`
  }

  const nextParams = 'params' in to ? to.params : undefined
  const nextLang = nextParams && typeof nextParams.lang === 'string' ? normalizeUrlLang(nextParams.lang) : null

  if (nextLang) {
    return to
  }

  return {
    ...to,
    params: {
      ...(nextParams ?? {}),
      lang: urlLang,
    },
  } as RouteLocationRaw
}
