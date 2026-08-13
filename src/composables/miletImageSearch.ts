import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'

export const MILET_IMAGE_SEARCH_PAGE_SIZE = 24
export const MILET_IMAGE_SEARCH_MIN_LENGTH = 2
export const MILET_IMAGE_SEARCH_MAX_LENGTH = 80

export type MiletImageSearchItem = {
  imgId: string
  comment?: string | null
  width?: number | null
  height?: number | null
  urlOriginal: string
  urlWebp?: string | null
  albumTitle?: string | null
  album?: string | null
  capturedAt?: string | null
  takenAt?: string | null
  createdAt?: string | null
}

export type MiletImageSearchResponse = {
  code: number
  query: string
  page: number
  pageSize: number
  total: number
  maxPage: number
  data: MiletImageSearchItem[]
}

type SearchMiletImagesOptions = {
  query: string
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export function imageSearchQueryLength(value: string) {
  return Array.from(value.normalize('NFKC').trim()).length
}

export async function searchMiletImages({
  query,
  page = 1,
  pageSize = MILET_IMAGE_SEARCH_PAGE_SIZE,
  signal,
}: SearchMiletImagesOptions) {
  return axiosInstance.get<MiletImageSearchResponse>(apiRoutes.miletImageSearch, {
    params: { q: query, page, pageSize },
    signal,
  })
}
