import type { Work } from './releaseType'

export interface GalleryImage {
  link: string
  previewLink?: string
  prelink: string
  url_original?: string
  url_webp?: string
  w?: number
  h?: number
  weight?: number
  height?: number
  comment?: string
}

export interface GalleryPageData {
  error?: string
  images: GalleryImage[]
  maxPage: number
}

export interface PublicNewsItem {
  id: number
  lang: 'zh-CN' | 'ja-JP' | 'en-US'
  title: string
  url: string
  publishDate: string
  summary: string
  coverImage: string
  sourceHost: string
  topic: string
}

export interface PublicNewsTopic {
  topic: string
  count: number
  sortOrder?: number
}

export interface NewsPageData {
  error?: string
  items: PublicNewsItem[]
  topics: PublicNewsTopic[]
  hasMore: boolean
}

export interface ReleasePageData {
  error?: string
  items: Work[]
  total: number
}
