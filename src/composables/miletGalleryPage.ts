import axiosInstance from '@/AxiosUtil'
import { apiRoutes, buildStaticAssetPreviewUrl, buildStaticAssetUrl } from '@/config/api'
import type {
  GalleryAlbumMetadata,
  GalleryImage,
  GalleryPageData,
} from '@/composables/publicPageData'

interface GalleryPageResponse {
  code: number
  data?: GalleryImage[]
  maxPage?: number
  album?: GalleryAlbumMetadata | null
}

type GalleryRequestScope =
  | { articleSlug: string; lang: 'zh' | 'ja' }
  | { previewId: string; previewSession: string }

export function normalizeGalleryImageSources(image: GalleryImage): GalleryImage {
  const originalUrl = buildStaticAssetUrl(image.url_original || image.link)
  const thumbnailUrl = buildStaticAssetUrl(image.url_webp || image.prelink || originalUrl)

  return {
    ...image,
    link: originalUrl,
    previewLink: buildStaticAssetPreviewUrl(originalUrl),
    prelink: thumbnailUrl || originalUrl,
  }
}

export async function fetchMiletGalleryPage(
  galleryId: string,
  page: number,
  scope?: GalleryRequestScope,
): Promise<GalleryPageData> {
  const requestPath = scope && 'previewId' in scope
    ? `/api/articles/preview/${encodeURIComponent(scope.previewId)}/albums/${encodeURIComponent(galleryId)}/${page}`
    : scope && 'articleSlug' in scope
      ? `/api/articles/${scope.lang}/${encodeURIComponent(scope.articleSlug)}/albums/${encodeURIComponent(galleryId)}/${page}`
    : `${apiRoutes.miletPiclist}/${page}/${galleryId}`
  const response = await axiosInstance.get<GalleryPageResponse>(
    requestPath,
    scope && 'previewId' in scope
      ? { headers: { 'X-Milet-Article-Preview-Session': scope.previewSession } }
      : undefined,
  )
  if (response.code !== 200) throw new Error('Album load failed.')

  const images = (Array.isArray(response.data) ? response.data : []).map(
    normalizeGalleryImageSources,
  )

  return {
    album: response.album,
    images,
    maxPage: response.maxPage || 1,
  }
}
