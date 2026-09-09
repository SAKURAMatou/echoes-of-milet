import { getLocalizedBranch } from '@/composables/miletPilgrimage'
import type { PilgrimageSeoSpot } from './seo'
import type { AppState } from '@/composables/useAppState'
import { liveEventDetailCacheKey, livePreviewCacheKey } from '@/composables/liveArchive'
import { stripLangPrefix } from '@/composables/useLangRoute'
import { renderSeoTags, type RenderSeoOptions, type SeoKey } from './seo'

function collectPilgrimageSeoSpots(state: AppState): PilgrimageSeoSpot[] {
  const payload = state.miletPilgrimageData
  const localizedTree = getLocalizedBranch(payload?.regionTree, state.lang)
  const regionSpots =
    localizedTree?.cities.flatMap((city) =>
      city.districts.flatMap((district) => district.spots || []),
    ) || []
  const localizedSpotList =
    regionSpots.length > 0
      ? regionSpots
      : Object.values(payload?.spotsByDistrictId || {}).flatMap(
          (spotListPayload) => getLocalizedBranch(spotListPayload, state.lang)?.spots || [],
        )

  return localizedSpotList.map((spot) => {
    const localizedDetail = getLocalizedBranch(payload?.spotDetailsBySpotId[spot.id], state.lang)
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

/** Only use data belonging to this route; previous SPA pages may still be cached. */
export function pageSeoOptions(path: string, state: AppState): RenderSeoOptions {
  const url = new URL(path, 'https://seo.invalid')
  const pathname = stripLangPrefix(url.pathname).replace(/\/$/, '') || '/'
  const lang = url.pathname.startsWith('/ja/') || url.pathname === '/ja' ? 'ja' : 'zh'
  const slug = decodeURIComponent(pathname.split('/').pop() || '')
  const article =
    pathname.startsWith('/milet/articles/') &&
    state.miletArticleData?.slug === slug &&
    state.miletArticleData.requestedLang === lang
      ? state.miletArticleData
      : null
  const live =
    pathname.startsWith('/milet/live/') &&
    state.miletLiveDetailData?.key === liveEventDetailCacheKey(slug, lang)
      ? state.miletLiveDetailData.payload
      : null
  const preview =
    pathname.startsWith('/milet/live-preview/') &&
    state.miletLivePreviewData?.key ===
      livePreviewCacheKey(slug, url.searchParams.get('token') || '', lang)
      ? state.miletLivePreviewData.payload
      : null
  const gallery =
    pathname.startsWith('/milet/galleryDetail/') && state.miletGalleryPageData?.key === slug
      ? state.miletGalleryPageData.payload
      : null
  const list = state.miletGalleryListData?.payload
  const album = gallery
    ? [...(list?.topAlbums || []), ...(list?.normalAlbums || [])].find(
        (item) => item.galleryId === slug,
      )
    : null
  const descriptions = album?.description || []
  const description =
    descriptions.find((item) => item.lang === (lang === 'ja' ? 'ja-JP' : 'zh-CN')) ||
    descriptions[0]
  return {
    path: url.pathname,
    article,
    liveDetail: preview || live,
    pilgrimageSpots:
      pathname === '/milet/pilgrimage' ? collectPilgrimageSeoSpots(state) : undefined,
    galleryImages: gallery?.images,
    galleryTitle: description?.title,
    galleryDescription: description?.description,
  }
}

export function pageDataUnavailable(path: string, state: AppState) {
  const pathname = stripLangPrefix(path.split('?')[0] || '/').replace(/\/$/, '')
  const lang = path.startsWith('/ja/') ? 'jp' : 'zh'
  if (pathname === '/milet/news') {
    return state.miletNewsPageData?.key === lang && Boolean(state.miletNewsPageData.payload.error)
  }
  if (pathname === '/milet/release') {
    return [1, 2, 3].some((type) => Boolean(state.miletReleasePageData[`${lang}:${type}`]?.error))
  }
  const galleryId = pathname.match(/^\/milet\/galleryDetail\/([^/]+)$/)?.[1]
  return Boolean(
    galleryId &&
      state.miletGalleryPageData?.key === galleryId &&
      state.miletGalleryPageData.payload.error,
  )
}

export function renderPageSeo(seoKey: SeoKey | undefined, path: string, state: AppState) {
  const lang = path === '/ja' || path.startsWith('/ja/') || path.startsWith('/ja?') ? 'jp' : 'zh'
  return renderSeoTags(seoKey, lang, pageSeoOptions(path, state))
}
