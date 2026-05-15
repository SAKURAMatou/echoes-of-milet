import { renderToString } from 'vue/server-renderer'

import { createApp } from '@/app'
import { getLocalizedBranch } from '@/composables/miletPilgrimage'
import {
  resolvePreferredUrlLang,
  resolveSupportedLang,
  resolveUrlLangFromPath,
} from '@/composables/useLangRoute'
import { getSiteOrigin } from '@/config/api'
import { buildShortLinkTarget } from '@/config/shortLinks'
import { renderSeoTags, toHtmlLang, type PilgrimageSeoSpot } from '@/server/seo'

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

function collectPilgrimageSeoSpots(
  state: ReturnType<typeof createApp>['state'],
): PilgrimageSeoSpot[] {
  const payload = state.miletPilgrimageData
  if (!payload?.selectedDistrictId) return []

  const spotListPayload = payload.spotsByDistrictId[payload.selectedDistrictId]
  const localizedSpotList = getLocalizedBranch(spotListPayload, state.lang)?.spots || []

  return localizedSpotList.map((spot) => {
    const localizedDetail = getLocalizedBranch(payload.spotDetailsBySpotId[spot.id], state.lang)
    const detail = localizedDetail?.spot
    return {
      id: spot.id,
      title: detail?.title || spot.title,
      workTitle: detail?.workTitle || spot.workTitle,
      category: detail?.category || spot.category,
      tags: detail?.tags || spot.tags,
      description: detail?.description,
      displayLat: detail?.displayLat ?? spot.displayLat,
      displayLng: detail?.displayLng ?? spot.displayLng,
      coverImageUrl: detail?.coverImageUrl || spot.coverImageUrl,
    }
  })
}

export async function render(url: string, request: RenderRequest = {}): Promise<RenderResult> {
  const siteOrigin = getSiteOrigin()
  const requestUrl = new URL(url, siteOrigin)
  const shortLinkTarget = buildShortLinkTarget(
    requestUrl.pathname,
    resolvePreferredUrlLang(request.headers),
  )
  const renderUrl = shortLinkTarget ? `${shortLinkTarget}${requestUrl.search}` : url
  const requestLang = resolveSupportedLang(
    resolveUrlLangFromPath(new URL(renderUrl, siteOrigin).pathname),
  )
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
    headTags: renderSeoTags(matchedSeoKey, state.lang, {
      path: currentRoute.path,
      pilgrimageSpots: collectPilgrimageSeoSpots(state),
    }),
    initialState: state,
    htmlLang: toHtmlLang(state.lang),
    renderMode,
    status: currentRoute.matched.length === 0 ? 404 : 200,
  }
}
