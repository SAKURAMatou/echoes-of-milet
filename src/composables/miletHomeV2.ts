import type { RouteLocationRaw } from 'vue-router'

import { buildStaticAssetUrl } from '@/config/api'
import { withLangParam } from '@/composables/useLangRoute'
import type {
  LocalizedText,
  MiletHomeEntryViewItem,
  MiletHomeGalleryViewSection,
  MiletHomeHighlightViewItem,
  MiletLegacyOfficialSite,
  MiletHomeOfficialViewSection,
  MiletHomeSectionTitleView,
  MiletHomeTimelineViewSection,
  MiletHomeV2Data,
  MiletHomeWhyViewItem,
  MiletLang,
  RouteTarget,
  SectionKey,
  TimelineColor,
} from '@/components/milet/home/types'

const defaultInstagramPost = 'https://www.instagram.com/p/DWgab3aCYqi/'
const defaultTwitterPost = 'https://twitter.com/milet_music/status/1930447376972476786'

const miletHomeStaticLabels = {
  timelineMore: { ja: 'すべての timeline', zh: '全部时间线' },
  galleryMore: { ja: 'gallery を見る', zh: '查看 gallery' },
  ctaTitle: { ja: 'まだ、どこかに残っているなら', zh: '如果它仍在某处停留' },
  ctaButton: { ja: '続きを辿る', zh: '继续循迹' },
  officialTitle: { ja: 'official links', zh: '官方入口' },
}

const miletHomeStaticRoutes = {
  timelineMore: { name: 'miletTimeLine' },
  galleryMore: { name: 'miletPicAlbum' },
  cta: { name: 'miletPicAlbum' },
} satisfies Record<string, RouteTarget>

const defaultMiletHomeV2: MiletHomeV2Data = {
  hero: {
    lead: { ja: '響きは、まだ消えていない', zh: '回响仍未消失' },
    sublead: { ja: 'その余韻を、ここに残す', zh: '把那些余韵留在这里' },
    buttonLabel: { ja: '少しだけ、辿る', zh: '稍微，循迹' },
    scrollLabel: { ja: 'highlight へ移動', zh: '前往 highlight' },
  },
  why: [
    {
      title: { ja: '声', zh: '声音' },
      body: [
        { ja: '静かに残る、深い響き', zh: '静静停留的深层回响' },
        { ja: 'ハスキーで透明感のある歌声', zh: '沙哑与通透并存的音色' },
      ],
    },
    {
      title: { ja: '感情', zh: '情绪' },
      body: [
        { ja: '言葉の奥にあるもの', zh: '在语言之前抵达' },
        { ja: '英語と日本語を織り交ぜた表現', zh: '交织英语与日语的表达方式' },
      ],
    },
    {
      title: { ja: '距離', zh: '距离' },
      body: [
        { ja: '近すぎない、でも遠くない', zh: '不曾靠近，却也未曾远离' },
        { ja: '匿名性を残したまま届く存在', zh: '保留匿名感的表达方式' },
      ],
    },
  ],
  sections: [
    {
      key: 'highlight',
      anchor: 'highlight',
      kicker: 'highlight',
      title: { ja: '断片を辿る', zh: '片段' },
      subtitle: { ja: 'いくつかの瞬間から、少しずつ', zh: '从一些瞬间开始' },
      order: 10,
    },
    {
      key: 'timeline',
      anchor: 'timeline',
      kicker: 'timeline',
      title: { ja: '記憶を辿る', zh: '记忆' },
      subtitle: { ja: '時間の中に残るもの', zh: '留在时间里的东西' },
      order: 20,
    },
    {
      key: 'gallery',
      anchor: 'gallery',
      kicker: 'gallery',
      title: { ja: '瞬間を見る', zh: '瞬间' },
      subtitle: { ja: '切り取られた、いくつかの光', zh: '被定格的光' },
      order: 30,
    },
  ],
  highlightKindConfig: {
    live: {
      badge: { ja: 'live selected', zh: 'live selected' },
      actionLabel: { ja: '詳しく見る', zh: '查看详情' },
    },
    release: {
      badge: { ja: 'music selected', zh: 'music selected' },
      actionLabel: { ja: '作品を聴く', zh: '听这些作品' },
    },
    article: {
      badge: { ja: 'article selected', zh: 'article selected' },
      actionLabel: { ja: '読む', zh: '阅读' },
    },
    gallery: {
      badge: { ja: 'gallery selected', zh: 'gallery selected' },
      actionLabel: { ja: '見る', zh: '查看' },
    },
  },
  highlights: [
    {
      id: 'budokan-night',
      kind: 'live',
      variant: 'imageHero',
      title: { ja: '武道館の夜', zh: '武道馆之夜' },
      description: {
        ja: 'あの静けさと、最後の一音。ライブの記憶を、少ない言葉で辿る。',
        zh: '那份安静与最后一声回响。用更少的语言，重新走近 live 的记忆。',
      },
      image: '/milet-img/milet-site-og-img.jpg',
      imageAlt: { ja: 'milet official visual', zh: 'milet 官方视觉图' },
      route: { name: 'miletTimeLine' },
      priority: 10,
    },
    {
      id: 'us-inside-you',
      kind: 'release',
      variant: 'softCard',
      title: { ja: 'us / inside you', zh: 'us / inside you' },
      description: {
        ja: '感情がほどける瞬間。声の奥にある輪郭を、作品の入口として置く。',
        zh: '情绪抵达的一瞬。把声音深处的轮廓，作为作品入口放在这里。',
      },
      route: { name: 'miletRelease' },
      priority: 20,
    },
  ],
  timeline: {
    moreLabel: miletHomeStaticLabels.timelineMore,
    moreRoute: miletHomeStaticRoutes.timelineMore,
    items: [
      {
        id: 'inside-you-2019',
        dateLabel: '2019',
        title: { ja: 'inside you', zh: 'inside you' },
        body: {
          ja: '声の輪郭が最初に届いた場所。ここから記録が始まる。',
          zh: '声音的轮廓最先抵达的地方，记录从这里开始。',
        },
        color: 'blue',
        route: { name: 'miletRelease' },
        priority: 10,
      },
      {
        id: 'eyes-2020',
        dateLabel: '2020',
        title: { ja: 'eyes', zh: 'eyes' },
        body: {
          ja: '作品の奥行きが広がり、言葉と音の距離が変わっていく。',
          zh: '作品的纵深逐渐展开，语言与声音的距离也在变化。',
        },
        color: 'pink',
        route: { name: 'miletRelease' },
        priority: 20,
      },
      {
        id: '5am-2023',
        dateLabel: '2023',
        title: { ja: '5AM', zh: '5AM' },
        body: {
          ja: '夜明け前の色を持ったアルバム。余韻を拾うための節目。',
          zh: '带着黎明前色彩的专辑，也是拾起余韵的节点。',
        },
        color: 'green',
        route: { name: 'miletRelease' },
        priority: 30,
      },
      {
        id: 'live-budokan',
        dateLabel: 'LIVE',
        title: { ja: 'Budokan and beyond', zh: 'Budokan and beyond' },
        body: {
          ja: 'ライブは出来事ではなく、その後も残る時間として扱う。',
          zh: 'live 不只是一场事件，而是之后仍会停留的时间。',
        },
        color: 'violet',
        route: { name: 'miletTimeLine' },
        priority: 40,
      },
    ],
  },
  gallery: {
    moreLabel: miletHomeStaticLabels.galleryMore,
    moreRoute: miletHomeStaticRoutes.galleryMore,
    items: [
      {
        id: 'portrait-202506',
        title: { ja: 'portrait', zh: 'portrait' },
        dateLabel: '2025.06',
        caption: { ja: '静けさがそのまま画面に残る一瞬。', zh: '安静感留在画面里的一个瞬间。' },
        image: '/echoes-of-milet-OG.webp',
        imageAlt: { ja: 'milet portrait', zh: 'milet portrait' },
        aspect: '4/5',
        route: { name: 'miletPicAlbum' },
        priority: 10,
      },
      {
        id: 'site-official',
        title: { ja: 'site', zh: 'site' },
        dateLabel: 'official',
        caption: { ja: '作品への入口を、視覚から辿る。', zh: '从视觉开始走向作品入口。' },
        image: '/milet-img/milet-site-og-img.jpg',
        imageAlt: { ja: 'milet official site visual', zh: 'milet 官方站视觉图' },
        aspect: '16/10',
        route: { name: 'miletPicAlbum' },
        priority: 20,
      },
      {
        id: 'fc-archive',
        title: { ja: 'fc', zh: 'fc' },
        dateLabel: 'archive',
        caption: {
          ja: '距離を保ちながら、公開された記憶を整える。',
          zh: '保持距离，也整理那些被公开的记忆。',
        },
        image: '/milet-img/milet-fc-og-img.png',
        imageAlt: { ja: 'miles official fanclub visual', zh: 'miles 官方粉丝俱乐部视觉图' },
        aspect: '3/4',
        route: { name: 'miletPicAlbum' },
        priority: 30,
      },
      {
        id: 'background-echo',
        title: { ja: 'background', zh: 'background' },
        dateLabel: 'echo',
        caption: {
          ja: 'ページの右側に残る、見えすぎない背景。',
          zh: '留在页面右侧、不被看尽的背景。',
        },
        image: '/background/bg-milet-home-pre.webp',
        imageAlt: { ja: 'milet home background', zh: 'milet 首页背景' },
        aspect: '5/3',
        route: { name: 'miletPicAlbum' },
        priority: 40,
      },
    ],
  },
  official: {
    instagramProfileUrl: 'https://www.instagram.com/milet_music',
    insPost: defaultInstagramPost,
    twitterProfileUrl: 'https://twitter.com/milet_music',
    twitterPost: defaultTwitterPost,
    sites: [
      {
        id: 'official-site',
        type: { ja: 'official website', zh: 'official website' },
        label: { ja: 'milet official site', zh: 'milet 官方网站' },
        description: {
          ja: 'ニュース、リリース、ライブ情報を確認する。',
          zh: '查看新闻、作品发行与 live 信息。',
        },
        href: 'https://www.milet.jp/',
        image: '/milet-img/milet-site-og-img.jpg',
        imageAlt: { ja: 'milet official site visual', zh: 'milet 官方网站视觉图' },
        priority: 10,
      },
      {
        id: 'official-fanclub',
        type: { ja: 'official fanclub', zh: 'official fanclub' },
        label: { ja: 'miles', zh: 'miles 官方 FC' },
        description: { ja: '公式ファンクラブへの入口。', zh: 'milet 官方粉丝俱乐部入口。' },
        href: 'https://fc.milet.jp/',
        image: '/milet-img/milet-fc-og-img.png',
        imageAlt: { ja: 'miles fanclub visual', zh: 'miles 粉丝俱乐部视觉图' },
        priority: 20,
      },
    ],
  },
  entries: [
    {
      id: 'release',
      title: { ja: '音を辿る', zh: '循着声音' },
      body: { ja: '作品とその記憶', zh: '作品与它们留下的记忆' },
      route: { name: 'miletRelease' },
      priority: 10,
    },
    {
      id: 'timeline',
      title: { ja: '記憶を辿る', zh: '循着记忆' },
      body: { ja: 'ライブとその軌跡', zh: 'live 与行进的轨迹' },
      route: { name: 'miletTimeLine' },
      priority: 20,
    },
    // {
    //   id: 'gallery',
    //   title: { ja: '瞬間を見る', zh: '观看瞬间' },
    //   body: { ja: '写真とその一瞬', zh: '照片与被定格的时刻' },
    //   route: { name: 'miletPicAlbum' },
    //   priority: 30,
    // },
    {
      id: 'about',
      title: { ja: '言葉を読む', zh: '阅读文字' },
      body: { ja: '記録と余韻', zh: '记录与余韵' },
      route: { name: 'aboutMe' },
      priority: 40,
    },
  ],
  cta: {
    title: miletHomeStaticLabels.ctaTitle,
    buttonLabel: miletHomeStaticLabels.ctaButton,
    route: miletHomeStaticRoutes.cta,
  },
}

export function normalizeMiletLang(value: unknown): MiletLang {
  return value === 'ja' || value === 'jp' ? 'ja' : 'zh'
}

export function textOf(text: LocalizedText | string | undefined, lang: MiletLang) {
  if (!text) return ''
  if (typeof text === 'string') return text
  return text[lang] || text.jp || text.ja || text.zh || ''
}

function bodyText(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join('\n')
  }

  return typeof value === 'string' ? value : ''
}

function routeToLocation(
  route: RouteTarget | undefined,
  routeLang: string,
): RouteLocationRaw | undefined {
  if (!route?.name) return undefined
  const query = route.query
    ? Object.fromEntries(Object.entries(route.query).map(([key, value]) => [key, String(value)]))
    : undefined
  return withLangParam(
    {
      name: route.name,
      params: route.params,
      query,
    },
    routeLang,
  )
}

function siteImage(site: Record<string, any>, fallback: string) {
  return site.oginImage || site.image || site.img || fallback
}

function resolveHomeImageUrl(image: string) {
  if (!image) return ''
  if (/^https?:\/\//i.test(image) || image.startsWith('/')) return image
  return buildStaticAssetUrl(image)
}

function legacySitesToOfficialSites(legacySite: Record<string, any> | undefined) {
  if (!Array.isArray(legacySite?.siteList) || legacySite.siteList.length === 0) {
    return defaultMiletHomeV2.official.sites
  }

  return legacySite.siteList.map((site: Record<string, any>, index: number) => ({
    id: site.id || `legacy-site-${index}`,
    type: {
      ja: index === 0 ? 'official website' : 'official fanclub',
      zh: index === 0 ? 'official website' : 'official fanclub',
    },
    label: {
      ja: site.title || site.description || (index === 0 ? 'milet official site' : 'miles'),
      zh: site.title || site.description || (index === 0 ? 'milet 官方网站' : 'miles 官方 FC'),
    },
    description: {
      ja: site.description || site.title || '',
      zh: site.description || site.title || '',
    },
    href: site.link || site.href || '#',
    image: siteImage(
      site,
      index === 0 ? '/milet-img/milet-site-og-img.jpg' : '/milet-img/milet-fc-og-img.png',
    ),
    imageAlt: { ja: site.title || 'milet official visual', zh: site.title || 'milet 官方视觉图' },
    priority: (index + 1) * 10,
  }))
}

function mapLegacyTimeline(
  legacyLangData: Record<string, any> | undefined,
): MiletHomeV2Data['timeline'] {
  const colors: TimelineColor[] = ['blue', 'pink', 'green', 'violet', 'yellow']
  const items = Array.isArray(legacyLangData?.timeline)
    ? legacyLangData.timeline.slice(0, 5).map((item: Record<string, any>, index: number) => ({
        id: item.id || item.timeline_id || `legacy-timeline-${index}`,
        dateLabel: item.event_date || item.event_data || item.dateLabel || String(index + 1),
        title: {
          ja: item.timeline_title || item.title || '',
          zh: item.timeline_title || item.title || '',
        },
        body: {
          ja: bodyText(item.timeline_body || item.body),
          zh: bodyText(item.timeline_body || item.body),
        },
        color: colors[index % colors.length],
        bloglink: item.bloglink || item.link_url,
        route: { name: 'miletTimeLine' },
        priority: (index + 1) * 10,
      }))
    : []

  return {
    ...defaultMiletHomeV2.timeline,
    items: items.length > 0 ? items : defaultMiletHomeV2.timeline.items,
  }
}

function populatedArray<T>(value: T[] | undefined, fallback: T[]) {
  return Array.isArray(value) && value.length > 0 ? value : fallback
}

function mergeHomeV2Data(rawHomeV2: Partial<MiletHomeV2Data>): MiletHomeV2Data {
  return {
    ...defaultMiletHomeV2,
    ...rawHomeV2,
    hero: {
      ...defaultMiletHomeV2.hero,
      ...rawHomeV2.hero,
    },
    why: populatedArray(rawHomeV2.why, defaultMiletHomeV2.why),
    sections: populatedArray(rawHomeV2.sections, defaultMiletHomeV2.sections),
    highlightKindConfig: {
      ...defaultMiletHomeV2.highlightKindConfig,
      ...rawHomeV2.highlightKindConfig,
    },
    highlights: populatedArray(rawHomeV2.highlights, defaultMiletHomeV2.highlights),
    timeline: {
      ...defaultMiletHomeV2.timeline,
      ...rawHomeV2.timeline,
      items: populatedArray(rawHomeV2.timeline?.items, defaultMiletHomeV2.timeline.items),
      moreRoute: rawHomeV2.timeline?.moreRoute || miletHomeStaticRoutes.timelineMore,
    },
    gallery: {
      ...defaultMiletHomeV2.gallery,
      ...rawHomeV2.gallery,
      items: populatedArray(rawHomeV2.gallery?.items, defaultMiletHomeV2.gallery.items),
      moreRoute: rawHomeV2.gallery?.moreRoute || miletHomeStaticRoutes.galleryMore,
    },
    official: {
      ...defaultMiletHomeV2.official,
      ...rawHomeV2.official,
      sites: populatedArray(rawHomeV2.official?.sites, defaultMiletHomeV2.official.sites || []),
    },
    entries: populatedArray(rawHomeV2.entries, defaultMiletHomeV2.entries),
    cta: {
      ...defaultMiletHomeV2.cta,
      ...rawHomeV2.cta,
      route: rawHomeV2.cta?.route || miletHomeStaticRoutes.cta,
    },
  }
}

export function buildMiletHomeV2Data(
  rawData: Record<string, any>,
  lang: MiletLang,
): MiletHomeV2Data {
  const legacyKey = lang === 'ja' ? 'jp' : lang
  const legacyLangData = rawData?.[legacyKey] || rawData?.[lang]
  const rawHomeV2 = rawData?.homeV2 as MiletHomeV2Data | undefined

  if (rawHomeV2) {
    return mergeHomeV2Data(rawHomeV2)
  }

  const legacySite = legacyLangData?.site

  return {
    ...defaultMiletHomeV2,
    timeline: mapLegacyTimeline(legacyLangData),
    gallery: {
      ...defaultMiletHomeV2.gallery,
      moreLabel: miletHomeStaticLabels.galleryMore,
      moreRoute: miletHomeStaticRoutes.galleryMore,
    },
    official: {
      ...defaultMiletHomeV2.official,
      insPost: legacySite?.insPost || defaultInstagramPost,
      twitterPost: legacySite?.twitterPost || defaultTwitterPost,
      sites: legacySitesToOfficialSites(legacySite),
    },
  }
}

export function sectionTitleMap(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
): Record<SectionKey, MiletHomeSectionTitleView> {
  return homeV2.sections.reduce(
    (acc, section) => {
      acc[section.key] = {
        kicker: section.kicker,
        title: textOf(section.title, lang),
        subtitle: textOf(section.subtitle, lang),
      }
      return acc
    },
    {} as Record<SectionKey, MiletHomeSectionTitleView>,
  )
}

export function whyViewItems(homeV2: MiletHomeV2Data, lang: MiletLang): MiletHomeWhyViewItem[] {
  return homeV2.why.map((item) => ({
    title: textOf(item.title, lang),
    body: item.body.map((line) => textOf(line, lang)).filter(Boolean),
  }))
}

export function highlightViewItems(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
  routeLang: string,
): MiletHomeHighlightViewItem[] {
  return [...homeV2.highlights]
    .sort((a, b) => a.priority - b.priority)
    .map((item) => {
      const kindConfig = homeV2.highlightKindConfig?.[item.kind]
      return {
        id: item.id,
        variant: item.variant,
        badge: textOf(item.badge || kindConfig?.badge, lang),
        title: textOf(item.title, lang),
        description: textOf(item.description, lang),
        image: item.image,
        imageAlt: textOf(item.imageAlt, lang),
        actionLabel:
          textOf(item.actionLabel || kindConfig?.actionLabel, lang) ||
          (lang === 'ja' ? '詳しく見る' : '查看详情'),
        to: routeToLocation(item.route, routeLang),
        href: item.href,
      }
    })
}

export function timelineViewSection(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
  routeLang: string,
): MiletHomeTimelineViewSection {
  const moreTo = routeToLocation(homeV2.timeline.moreRoute, routeLang) || '#'
  return {
    moreLabel: textOf(homeV2.timeline.moreLabel, lang),
    moreTo,
    items: [...homeV2.timeline.items]
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5)
      .map((item) => {
        const blogTo =
          item.bloglink && item.bloglink.endsWith('.html')
            ? withLangParam({ name: 'blogDetail', params: { id: item.bloglink } }, routeLang)
            : undefined
        return {
          id: item.id,
          dateLabel: item.dateLabel,
          title: textOf(item.title, lang),
          body: textOf(item.body, lang),
          color: item.color,
          to: routeToLocation(item.route, routeLang) || blogTo || moreTo,
        }
      }),
  }
}

export function galleryViewSection(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
  routeLang: string,
): MiletHomeGalleryViewSection {
  const moreTo = routeToLocation(homeV2.gallery.moreRoute, routeLang) || '#'
  return {
    moreLabel: textOf(homeV2.gallery.moreLabel, lang),
    moreTo,
    items: [...homeV2.gallery.items]
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: textOf(item.title, lang),
        dateLabel: item.dateLabel,
        caption: textOf(item.caption, lang),
        image: resolveHomeImageUrl(item.image),
        imageAlt: textOf(item.imageAlt, lang),
        aspect: item.aspect,
        to: routeToLocation(item.route, routeLang) || moreTo,
        href: item.href,
      })),
  }
}

function legacyOfficialSites(homeV2: MiletHomeV2Data, lang: MiletLang) {
  const legacySites =
    homeV2.official.siteList?.[lang === 'ja' ? 'jp' : 'zh'] || homeV2.official.siteList?.[lang]
  if (!Array.isArray(legacySites) || legacySites.length === 0) {
    return null
  }

  return legacySites.map((site: MiletLegacyOfficialSite, index: number) => ({
    id: `official-site-${index}`,
    type: index === 0 ? 'official website' : 'official fanclub',
    label: site.title || site.description || (index === 0 ? 'milet official site' : 'miles'),
    description: site.description || site.title || '',
    href: site.link || site.href || '#',
    image: siteImage(
      site,
      index === 0 ? '/milet-img/milet-site-og-img.jpg' : '/milet-img/milet-fc-og-img.png',
    ),
    imageAlt: site.title || site.description || 'milet official visual',
  }))
}

export function officialViewSection(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
): MiletHomeOfficialViewSection {
  const siteViews =
    legacyOfficialSites(homeV2, lang) ||
    [...(homeV2.official.sites || [])]
      .sort((a, b) => a.priority - b.priority)
      .map((site) => ({
        id: site.id,
        type: textOf(site.type, lang),
        label: textOf(site.label, lang),
        description: textOf(site.description, lang),
        href: site.href,
        image: site.image,
        imageAlt: textOf(site.imageAlt, lang),
      }))

  return {
    title: textOf(miletHomeStaticLabels.officialTitle, lang),

    instagramProfileUrl: homeV2.official.instagramProfileUrl,
    insPost: homeV2.official.insPost || homeV2.official.insPost,
    twitterProfileUrl: homeV2.official.twitterProfileUrl,
    twitterPost: homeV2.official.twitterPost || homeV2.official.twitterPost,
    sites: siteViews,
  }
}

export function entryViewItems(
  homeV2: MiletHomeV2Data,
  lang: MiletLang,
  routeLang: string,
): MiletHomeEntryViewItem[] {
  return [...homeV2.entries]
    .sort((a, b) => a.priority - b.priority)
    .map((entry) => ({
      id: entry.id,
      title: textOf(entry.title, lang),
      body: textOf(entry.body, lang),
      to: routeToLocation(entry.route, routeLang) || '#',
    }))
}

export function ctaView(lang: MiletLang, routeLang: string) {
  return {
    title: textOf(miletHomeStaticLabels.ctaTitle, lang),
    buttonLabel: textOf(miletHomeStaticLabels.ctaButton, lang),
    to: routeToLocation(miletHomeStaticRoutes.cta, routeLang) || '#',
  }
}
