import { buildStaticAssetUrl } from '@/config/api'

export function initImgUrl(url: string): string {
  if (!url) return ''

  if (url.startsWith('http') || url.startsWith('https')) return url

  const paths = url.split('/')
  if (paths.length === 2) {
    return buildStaticAssetUrl(url)
  } else {
    return ''
  }
}
