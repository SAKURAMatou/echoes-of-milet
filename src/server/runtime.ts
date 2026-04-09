const ssgRoutes = new Set(['/', '/milet/about'])

export function normalizeUrl(url = '/') {
  const [pathname] = url.split('?')
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function isAssetRequest(url = '/') {
  return /\.[a-z0-9]+$/i.test(normalizeUrl(url))
}

export function isSsgRoute(url = '/') {
  return ssgRoutes.has(normalizeUrl(url))
}

export function isViteDevRequest(url = '/') {
  const pathname = normalizeUrl(url)

  return (
    pathname.startsWith('/@vite/') ||
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/__vite_') ||
    pathname === '/favicon.ico' ||
    isAssetRequest(pathname)
  )
}

export function injectHtml(template: string, payload: { htmlLang: string; headTags: string; appHtml: string; initialState: unknown }) {
  return template
    .replace('__HTML_LANG__', payload.htmlLang)
    .replace('<!--app-head-->', payload.headTags)
    .replace('<!--app-html-->', payload.appHtml)
    .replace(
      '<!--app-state-->',
      `<script>window.__INITIAL_STATE__=${JSON.stringify(payload.initialState).replace(/</g, '\\u003c')}</script>`,
    )
}
