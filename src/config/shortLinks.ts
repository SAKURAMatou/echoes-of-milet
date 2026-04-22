type UrlLang = 'zh' | 'ja'

type ShortLinkConfig = {
  slug: string
  target: string
}

export const shortLinks: ShortLinkConfig[] = [
  {
    slug: 'sg',
    target: '/milet/interactive/song-guess',
  },
]

export function normalizeShortLinkPath(pathname: string) {
  const cleanPath = pathname.split('?')[0]?.replace(/\/+$/, '') || '/'
  return cleanPath || '/'
}

export function resolveShortLink(pathname: string) {
  const cleanPath = normalizeShortLinkPath(pathname)
  const matched = cleanPath.match(/^\/(?:(zh|ja)\/)?([^/]+)$/i)
  if (!matched) return null

  const slug = matched[2]?.toLowerCase()
  const config = shortLinks.find((item) => item.slug === slug)
  if (!config) return null

  return {
    slug,
    lang: matched[1]?.toLowerCase() as UrlLang | undefined,
    target: config.target,
  }
}

export function buildShortLinkTarget(pathname: string, fallbackLang: UrlLang) {
  const matched = resolveShortLink(pathname)
  if (!matched) return null

  return `/${matched.lang || fallbackLang}${matched.target}`
}

