export interface RelatedArticleSummary {
  id: number
  slug: string
  title: string
  summary?: string
  lang: 'zh' | 'ja'
  publishedAt?: string | null
  updatedAt?: string
  url?: string
}

export interface RelatedArticleGroup {
  count: number
  primary?: RelatedArticleSummary | null
  items: RelatedArticleSummary[]
}

export interface PublicArticleDetail {
  id: number
  slug: string
  articleType: string
  title: string
  summary: string
  coverImage?: ArticleCoverImage | null
  html: string
  imageIds: number[]
  toc?: ArticleTocItem[]
  defaultLang: 'zh' | 'ja'
  requestedLang: 'zh' | 'ja'
  lang: 'zh' | 'ja'
  fallbackLang: 'zh' | 'ja' | null
  i18nEnabled: boolean
  updatedAt: string
  publishedAt: string | null
}

export interface ArticleCoverImage {
  id: number
  imgId: string
  storage: 'milet' | 'blog'
  imgType: string
  link: string
  prelink: string
  accessRoute?: string
  urlOriginal?: string
  urlWebp?: string
  fname: string
  comment: string
}

export interface ArticleTocItem {
  id: string
  level: 1 | 2 | 3 | 4
  text: string
  order: number
}

export function emptyRelatedArticleGroup(): RelatedArticleGroup {
  return { count: 0, primary: null, items: [] }
}
