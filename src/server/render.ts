import { renderToString } from 'vue/server-renderer'

import { createApp } from '@/app'
import { resolveSupportedLang, resolveUrlLangFromPath } from '@/composables/useLangRoute'
import { renderSeoTags, toHtmlLang } from '@/server/seo'

interface RenderRequest {
  headers?: Record<string, string | string[] | undefined>
}

export interface RenderResult {
  appHtml: string
  headTags: string
  initialState: ReturnType<typeof createApp>['state']
  htmlLang: string
  renderMode: 'ssg' | 'ssr' | 'csr'
  status: number
}

export async function render(url: string, request: RenderRequest = {}): Promise<RenderResult> {
  const requestUrl = new URL(url, 'https://miles-dml.org')
  const requestLang = resolveSupportedLang(resolveUrlLangFromPath(requestUrl.pathname))
  const { app, router, state } = createApp({
    initialState: {
      lang: requestLang,
    },
    requestHeaders: request.headers,
    currentPath: requestUrl.pathname,
  })

  await router.push(url)
  await router.isReady()

  const currentRoute = router.currentRoute.value
  const leafRoute = currentRoute.matched[currentRoute.matched.length - 1]
  const matchedSeoKey = leafRoute?.meta?.seoKey
  const renderMode = leafRoute?.meta?.renderMode ?? 'csr'
  const appHtml = renderMode === 'csr' ? '' : await renderToString(app)

  return {
    appHtml,
    headTags: renderSeoTags(matchedSeoKey, state.lang),
    initialState: state,
    htmlLang: toHtmlLang(state.lang),
    renderMode,
    status: currentRoute.matched.length === 0 ? 404 : 200,
  }
}
