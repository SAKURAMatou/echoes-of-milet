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

export async function fetchMiletGalleryPage(
  galleryId: string,
  page: number,
): Promise<GalleryPageData> {
  const response = await axiosInstance.get<GalleryPageResponse>(
    `${apiRoutes.miletPiclist}/${page}/${galleryId}`,
  )
  if (response.code !== 200) throw new Error('Album load failed.')

  const images = (Array.isArray(response.data) ? response.data : []).map((image) => ({
    ...image,
    link: buildStaticAssetUrl(image.url_original || image.link),
    previewLink: buildStaticAssetPreviewUrl(image.url_original || image.link),
    prelink: buildStaticAssetUrl(image.url_webp || image.prelink || image.link),
  }))

  return {
    album: response.album,
    images,
    maxPage: response.maxPage || 1,
  }
}
