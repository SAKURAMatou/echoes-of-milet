import { computed, ref } from 'vue'

import axiosInstance from '@/AxiosUtil'
import { apiRoutes, buildStaticAssetUrl, getImginOrigin } from '@/config/api'

export type LiveLang = 'zh' | 'ja'
export type LiveEventType = 'one_man' | 'tour' | 'special_live' | 'festival' | string
export type LiveSetlistSection = 'main' | 'encore' | 'double_encore' | string
export type LiveSetlistOverrideOperation = 'add' | 'remove' | 'replace' | 'move' | 'note' | string

export interface LiveImage {
  url?: string
  src?: string
  link?: string
  prelink?: string
  urlWebp?: string
  urlOriginal?: string
  alt?: string
  credit?: string
  focalPoint?: string
  fitMode?: 'cover' | 'contain' | string
}

export interface LiveEventListItem {
  id: string | number
  slug: string
  type: LiveEventType
  title: string
  year?: number | string
  dateStart?: string
  dateEnd?: string
  mainVisual?: LiveImage | string | null
  mainVisualAlt?: string
  performanceCount?: number
  cityCount?: number
  venueSummary?: string
  summary?: string
  computedEventState?: string
}

export interface LiveEventDetail extends LiveEventListItem {
  artist?: string
  defaultLang?: LiveLang
  mainVisualCredit?: string
  mainVisualFitMode?: 'cover' | 'contain' | string
}

export interface LivePerformance {
  id: string | number
  eventId?: string | number
  performanceNo?: number
  label?: string
  date?: string
  openTime?: string
  startTime?: string
  city?: string
  region?: string
  venueName?: string
  venueAddress?: string
  notesZh?: string
  notesJa?: string
  sortNo?: number
}

export interface LiveSetlistItem {
  id?: string | number
  itemKey: string
  sortNo: number
  section: LiveSetlistSection
  songWorkId?: string | number | null
  songTrackId?: string | number | null
  displayTitle: string
  notes?: string
  duration?: string
  changed?: boolean
}

export interface LiveSetlist {
  id?: string | number
  eventId?: string | number
  title?: string
  notes?: string
  items?: LiveSetlistItem[]
}

export interface LiveSetlistOverride {
  id?: string | number
  performanceId?: string | number
  operation: LiveSetlistOverrideOperation
  baseItemKey?: string | null
  overrideItemKey?: string | null
  sortNo?: number | null
  section?: LiveSetlistSection | null
  songWorkId?: string | number | null
  songTrackId?: string | number | null
  displayTitle?: string | null
  notes?: string | null
  duration?: string | null
}

export interface LiveRelatedArticle {
  id: string | number
  slug?: string
  title: string
  summary?: string
  publishedAt?: string
  coverImage?: LiveImage | string | null
  url?: string
}

export interface LiveRelatedGallery {
  id: string | number
  slug?: string
  title: string
  description?: string
  coverImage?: LiveImage | string | null
  photoCount?: number
  url?: string
}

export interface LiveDisplayConfig {
  blueprint?: 'one-man-magazine' | 'tour-serpentine-route' | string
  themePreset?: string
  status?: string
}

export interface LiveEventDetailPayload {
  event: LiveEventDetail
  performances: LivePerformance[]
  eventSetlist?: LiveSetlist | null
  setlistOverridesByPerformanceId?: Record<string, LiveSetlistOverride[]>
  relatedArticles?: LiveRelatedArticle[]
  relatedGalleries?: LiveRelatedGallery[]
  displayConfig?: LiveDisplayConfig | null
  initialPerformanceId?: string | number | null
}

export interface LiveEventListResponse {
  items: LiveEventListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  filters?: Record<string, unknown>
}

export interface LiveEventListQuery {
  lang: LiveLang
  type?: string
  year?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface LiveSetlistSegment {
  key: string
  section: LiveSetlistSection
  items: LiveSetlistItem[]
}

export const liveTypeOptions = [
  { value: 'all', label: 'ALL' },
  { value: 'one_man', label: 'ONE MAN' },
  { value: 'tour', label: 'TOUR' },
  { value: 'special_live', label: 'SPECIAL' },
  { value: 'festival', label: 'FESTIVAL' },
]

const listFallback: LiveEventListResponse = {
  items: [],
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 1,
}

function unwrapApiPayload<T>(value: unknown): T {
  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    if ('data' in objectValue) return objectValue.data as T
    if ('payload' in objectValue) return objectValue.payload as T
    if ('item' in objectValue) return objectValue.item as T
  }

  return value as T
}

function normalizeListResponse(value: unknown): LiveEventListResponse {
  const payload = unwrapApiPayload<Partial<LiveEventListResponse> | LiveEventListItem[]>(value)
  if (Array.isArray(payload)) {
    return {
      ...listFallback,
      items: payload,
      total: payload.length,
      totalPages: 1,
    }
  }

  return {
    ...listFallback,
    ...payload,
    items: Array.isArray(payload?.items) ? payload.items : [],
    page: Number(payload?.page) || 1,
    pageSize: Number(payload?.pageSize) || 12,
    total: Number(payload?.total) || 0,
    totalPages: Number(payload?.totalPages) || 1,
  }
}

function normalizeDetailPayload(value: unknown): LiveEventDetailPayload {
  const payload = unwrapApiPayload<LiveEventDetailPayload>(value)
  return {
    ...payload,
    performances: Array.isArray(payload?.performances) ? payload.performances : [],
    setlistOverridesByPerformanceId: payload?.setlistOverridesByPerformanceId || {},
    relatedArticles: Array.isArray(payload?.relatedArticles) ? payload.relatedArticles : [],
    relatedGalleries: Array.isArray(payload?.relatedGalleries) ? payload.relatedGalleries : [],
  }
}

function appendQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return
    query.set(key, String(value))
  })
  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

export function normalizeLiveLang(value: unknown): LiveLang {
  return value === 'ja' || value === 'jp' ? 'ja' : 'zh'
}

export function liveEventListUrl(query: LiveEventListQuery) {
  return appendQuery(`${apiRoutes.miletLive}/events`, {
    lang: query.lang,
    type: query.type,
    year: query.year,
    keyword: query.keyword?.trim(),
    page: query.page || 1,
    pageSize: query.pageSize || 12,
  })
}

export function liveEventDetailUrl(slug: string, lang: LiveLang) {
  return appendQuery(`${apiRoutes.miletLive}/events/${encodeURIComponent(slug)}`, { lang })
}

export function livePreviewUrl(previewId: string, token: string, lang: LiveLang) {
  return appendQuery(`${apiRoutes.miletLive}/preview/${encodeURIComponent(previewId)}`, {
    token,
    lang,
  })
}

export async function fetchLiveEventList(query: LiveEventListQuery) {
  const response = await axiosInstance.get(liveEventListUrl(query))
  return normalizeListResponse(response)
}

export async function fetchLiveEventDetail(slug: string, lang: LiveLang) {
  const response = await axiosInstance.get(liveEventDetailUrl(slug, lang))
  return normalizeDetailPayload(response)
}

export async function fetchLiveEventPreview(previewId: string, token: string, lang: LiveLang) {
  const response = await axiosInstance.get(livePreviewUrl(previewId, token, lang))
  return normalizeDetailPayload(response)
}

export function useLiveArchiveList(initialQuery: LiveEventListQuery) {
  const query = ref({ ...initialQuery })
  const data = ref<LiveEventListResponse | null>(null)
  const loading = ref(false)
  const error = ref('')
  const hasMore = computed(() => (data.value?.page || 1) < (data.value?.totalPages || 1))

  async function load(nextQuery: Partial<LiveEventListQuery> = {}, append = false) {
    query.value = {
      ...query.value,
      ...nextQuery,
    }
    loading.value = true
    error.value = ''

    try {
      const payload = await fetchLiveEventList(query.value)
      data.value =
        append && data.value
          ? {
              ...payload,
              items: [...data.value.items, ...payload.items],
            }
          : payload
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Live archive load failed.'
      if (!data.value) data.value = listFallback
    } finally {
      loading.value = false
    }
  }

  return {
    query,
    data,
    loading,
    error,
    hasMore,
    load,
  }
}

export function formatLiveDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

export function formatLiveDateRange(event: Pick<LiveEventListItem, 'dateStart' | 'dateEnd'>) {
  const start = formatLiveDate(event.dateStart)
  const end = formatLiveDate(event.dateEnd)
  if (!start) return end
  if (!end || start === end) return start
  return `${start} - ${end}`
}

export function formatLiveType(type?: string) {
  if (type === 'one_man') return 'ONE MAN LIVE'
  if (type === 'tour') return 'TOUR'
  if (type === 'special_live') return 'SPECIAL LIVE'
  if (type === 'festival') return 'FESTIVAL'
  return (type || 'LIVE').replace(/_/g, ' ').toUpperCase()
}

export function resolveLiveImageUrl(image?: LiveImage | string | null) {
  if (!image) return ''
  if (typeof image === 'string') {
    if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image
    return buildStaticAssetUrl(image)
  }

  const raw = image.urlWebp || image.urlOriginal || image.url || image.src || image.prelink || image.link || ''
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/static/')) return `${getImginOrigin()}${raw}`
  if (raw.startsWith('/')) return raw
  return buildStaticAssetUrl(raw)
}

function cloneSetlistItem(item: LiveSetlistItem): LiveSetlistItem {
  return {
    ...item,
    sortNo: Number(item.sortNo) || 0,
    section: item.section || 'main',
  }
}

function applyReplacement(item: LiveSetlistItem, override: LiveSetlistOverride): LiveSetlistItem {
  return {
    ...item,
    itemKey: override.overrideItemKey || item.itemKey,
    sortNo: override.sortNo ?? item.sortNo,
    section: override.section || item.section,
    songWorkId: override.songWorkId ?? item.songWorkId,
    songTrackId: override.songTrackId ?? item.songTrackId,
    displayTitle: override.displayTitle || item.displayTitle,
    notes: override.notes ?? item.notes,
    duration: override.duration ?? item.duration,
    changed: true,
  }
}

export function composeLiveSetlist(
  eventSetlist?: LiveSetlist | null,
  overrides: LiveSetlistOverride[] = [],
) {
  let items = (eventSetlist?.items || []).map(cloneSetlistItem)

  for (const override of overrides.filter((item) => item.operation === 'remove')) {
    if (!override.baseItemKey) continue
    items = items.filter((item) => item.itemKey !== override.baseItemKey)
  }

  for (const override of overrides.filter((item) => item.operation === 'replace')) {
    if (!override.baseItemKey) continue
    items = items.map((item) =>
      item.itemKey === override.baseItemKey ? applyReplacement(item, override) : item,
    )
  }

  for (const override of overrides.filter((item) => item.operation === 'move')) {
    if (!override.baseItemKey) continue
    items = items.map((item) =>
      item.itemKey === override.baseItemKey
        ? {
            ...item,
            sortNo: override.sortNo ?? item.sortNo,
            section: override.section || item.section,
            changed: true,
          }
        : item,
    )
  }

  for (const override of overrides.filter((item) => item.operation === 'note')) {
    if (!override.baseItemKey) continue
    items = items.map((item) =>
      item.itemKey === override.baseItemKey
        ? {
            ...item,
            notes: override.notes ?? item.notes,
            changed: true,
          }
        : item,
    )
  }

  for (const override of overrides.filter((item) => item.operation === 'add')) {
    const itemKey = override.overrideItemKey || `override-${override.id || override.displayTitle}`
    if (!itemKey) continue
    items.push({
      itemKey,
      sortNo: Number(override.sortNo) || 0,
      section: override.section || 'main',
      songWorkId: override.songWorkId,
      songTrackId: override.songTrackId,
      displayTitle: override.displayTitle || '',
      notes: override.notes || undefined,
      duration: override.duration || undefined,
      changed: true,
    })
  }

  return items
    .filter((item) => item.displayTitle)
    .sort((a, b) => {
      const sortDelta = (Number(a.sortNo) || 0) - (Number(b.sortNo) || 0)
      if (sortDelta !== 0) return sortDelta
      return String(a.itemKey).localeCompare(String(b.itemKey))
    })
}

export function segmentLiveSetlist(items: LiveSetlistItem[]): LiveSetlistSegment[] {
  return items.reduce<LiveSetlistSegment[]>((segments, item) => {
    const last = segments[segments.length - 1]
    if (last && last.section === item.section) {
      last.items.push(item)
      return segments
    }

    segments.push({
      key: `${item.section}-${segments.length}`,
      section: item.section,
      items: [item],
    })
    return segments
  }, [])
}

export function sectionLabel(section?: string) {
  if (section === 'encore') return 'Encore'
  if (section === 'double_encore') return 'Double Encore'
  return 'Main'
}

export function performanceLabel(performance: LivePerformance, index = 0) {
  return performance.label || `Day ${performance.performanceNo || index + 1}`
}

export function selectedPerformanceNotes(performance: LivePerformance, lang: LiveLang) {
  return lang === 'ja' ? performance.notesJa || performance.notesZh : performance.notesZh || performance.notesJa
}
