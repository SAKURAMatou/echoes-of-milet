import { renderToString } from 'vue/server-renderer'

import { createApp } from '@/app'
import {
  resolvePreferredUrlLang,
  resolveSupportedLang,
  resolveUrlLangFromPath,
} from '@/composables/useLangRoute'
import { buildShortLinkTarget } from '@/config/shortLinks'
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
  const shortLinkTarget = buildShortLinkTarget(
    requestUrl.pathname,
    resolvePreferredUrlLang(request.headers),
  )
  const renderUrl = shortLinkTarget ? `${shortLinkTarget}${requestUrl.search}` : url
  const requestLang = resolveSupportedLang(resolveUrlLangFromPath(new URL(renderUrl, 'https://miles-dml.org').pathname))
  const { app, router, state } = createApp({
    initialState: {
      lang: requestLang,
    },
    requestHeaders: request.headers,
    currentPath: requestUrl.pathname,
  })

  await router.push(renderUrl)
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
