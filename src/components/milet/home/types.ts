import type { RouteLocationRaw } from 'vue-router'

export type MiletLang = 'zh' | 'ja'
export type SectionKey = 'highlight' | 'timeline' | 'gallery'
export type HighlightKind = 'live' | 'release' | 'music' | 'article' | 'gallery'
export type HighlightVariant = 'imageHero' | 'softCard'
export type TimelineColor = 'blue' | 'pink' | 'green' | 'violet' | 'yellow' | 'orange'
export type GalleryAspect = '4/5' | '16/10' | '3/4' | '5/3' | '1/1'

export interface LocalizedText {
  zh?: string
  ja?: string
  jp?: string
}

export interface RouteTarget {
  name: string
  params?: Record<string, string | number>
  query?: Record<string, string | number | boolean>
}

export interface MiletHomeHeroText {
  lead: LocalizedText
  sublead: LocalizedText
  buttonLabel: LocalizedText
  scrollLabel: LocalizedText
}

export interface MiletHomeWhyItem {
  title: LocalizedText
  body: LocalizedText[]
}

export interface MiletHomeSectionMeta {
  key: SectionKey
  anchor: string
  kicker: string
  title: LocalizedText
  subtitle: LocalizedText
  order: number
}

export interface MiletHomeHighlightItem {
  id: string
  kind: HighlightKind
  variant: HighlightVariant
  badge?: LocalizedText
  title: LocalizedText
  description: LocalizedText
  image?: string
  imageAlt?: LocalizedText
  actionLabel?: LocalizedText
  route?: RouteTarget
  href?: string
  trackShowId?: string
  trackTitle?: LocalizedText | string
  priority: number
  publishedAt?: string
}

export interface MiletHomeHighlightKindConfig {
  badge: LocalizedText
  actionLabel: LocalizedText
}

export interface MiletHomeTimelineItem {
  id: string
  dateLabel: string
  title: LocalizedText
  body: LocalizedText
  color: TimelineColor
  route?: RouteTarget
  bloglink?: string
  priority: number
}

export interface MiletHomeTimelineSection {
  items: MiletHomeTimelineItem[]
  moreLabel: LocalizedText
  moreRoute: RouteTarget
}

export interface MiletHomeGalleryItem {
  id: string
  title: LocalizedText
  dateLabel: string
  caption: LocalizedText
  image: string
  imageAlt: LocalizedText
  aspect: GalleryAspect
  route?: RouteTarget
  href?: string
  priority: number
}

export interface MiletHomeGallerySection {
  items: MiletHomeGalleryItem[]
  moreLabel: LocalizedText
  moreRoute: RouteTarget
}

export interface MiletOfficialSite {
  id: string
  type: LocalizedText
  label: LocalizedText
  description: LocalizedText
  href: string
  image: string
  imageAlt: LocalizedText
  priority: number
}

export interface MiletLegacyOfficialSite {
  title?: string
  description?: string
  link?: string
  href?: string
  oginImage?: string
  image?: string
  img?: string
}

export interface MiletHomeOfficialSection {
  instagramProfileUrl: string
  insPost: string
  twitterProfileUrl: string
  twitterPost: string
  siteList?: {
    zh?: MiletLegacyOfficialSite[]
    jp?: MiletLegacyOfficialSite[]
    ja?: MiletLegacyOfficialSite[]
  }
  sites?: MiletOfficialSite[]
}

export interface MiletHomeEntryItem {
  id: string
  title: LocalizedText
  body: LocalizedText
  route: RouteTarget
  priority: number
}

export interface MiletHomeCtaText {
  title: LocalizedText
  buttonLabel: LocalizedText
  route: RouteTarget
}

export interface MiletHomeV2Data {
  hero: MiletHomeHeroText
  why: MiletHomeWhyItem[]
  sections: MiletHomeSectionMeta[]
  highlightKindConfig?: Partial<Record<HighlightKind, MiletHomeHighlightKindConfig>>
  highlights: MiletHomeHighlightItem[]
  timeline: MiletHomeTimelineSection
  gallery: MiletHomeGallerySection
  official: MiletHomeOfficialSection
  entries: MiletHomeEntryItem[]
  cta: MiletHomeCtaText
}

export interface MiletHomeSectionTitleView {
  kicker: string
  title: string
  subtitle: string
}

export interface MiletHomeWhyViewItem {
  title: string
  body: string[]
}

export interface MiletHomeHighlightViewItem {
  id: string
  kind: HighlightKind
  variant: HighlightVariant
  badge: string
  title: string
  description: string
  image?: string
  imageAlt: string
  actionLabel: string
  to?: RouteLocationRaw
  href?: string
  trackShowId?: string
  trackTitle?: string
}

export interface MiletHomeTimelineViewItem {
  id: string
  dateLabel: string
  title: string
  body: string
  color: TimelineColor
  to?: RouteLocationRaw
}

export interface MiletHomeTimelineViewSection {
  items: MiletHomeTimelineViewItem[]
  moreLabel: string
  moreTo: RouteLocationRaw
}

export interface MiletHomeGalleryViewItem {
  id: string
  title: string
  dateLabel: string
  caption: string
  image: string
  imageAlt: string
  aspect: GalleryAspect
  to?: RouteLocationRaw
  href?: string
}

export interface MiletHomeGalleryViewSection {
  items: MiletHomeGalleryViewItem[]
  moreLabel: string
  moreTo: RouteLocationRaw
}

export interface MiletOfficialSiteView {
  id: string
  type: string
  label: string
  description: string
  href: string
  image: string
  imageAlt: string
}

export interface MiletHomeOfficialViewSection {
  title: string

  instagramProfileUrl: string
  insPost: string
  twitterProfileUrl: string
  twitterPost: string
  sites: MiletOfficialSiteView[]
}

export interface MiletHomeEntryViewItem {
  id: string
  title: string
  body: string
  to: RouteLocationRaw
}
