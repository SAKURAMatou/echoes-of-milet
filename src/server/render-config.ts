import renderConfig from '../../render.config.json'
import { stripLangPrefix } from '@/composables/useLangRoute'

export type RenderMode = 'ssg' | 'ssr' | 'csr'

const renderModeByPath = renderConfig.renderModeByPath as Record<string, RenderMode>
const ssgRoutes = renderConfig.ssgRoutes as string[]

export function normalizeUrl(url = '/') {
  const [pathname] = url.split('?')

  if (!pathname) {
    return '/'
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function isAssetRequest(url = '/') {
  return /\.[a-z0-9]+$/i.test(normalizeUrl(url))
}

export function getConfiguredRenderMode(path: string): RenderMode {
  return renderModeByPath[stripLangPrefix(normalizeUrl(path))] ?? 'csr'
}

export function getSsgRoutes() {
  return ssgRoutes.map((route) => normalizeUrl(route))
}

export function isSsgRoute(path: string) {
  return getConfiguredRenderMode(path) === 'ssg'
}
