export type ExtraInformationResourceType = 'article' | 'gallery' | 'external_link'

export interface ExtraInformationItem {
  type: ExtraInformationResourceType
  id: string
  title: string
  summary: string
  coverImage: string
  url: string
  linkScope: 'internal' | 'external'
}

export interface ExtraInformationGroup {
  count: number
  items: ExtraInformationItem[]
}

export function emptyExtraInformationGroup(): ExtraInformationGroup {
  return { count: 0, items: [] }
}
