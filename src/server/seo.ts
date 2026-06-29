import { stripLangPrefix, toUrlLang } from '@/composables/useLangRoute'
import { getSiteOrigin, getImginOrigin } from '@/config/api'
import type { PublicArticleDetail } from '@/composables/articleType'
import { resolveLiveImageUrl, type LiveEventDetailPayload } from '@/composables/liveArchive'

export type SeoKey =
  | 'home'
  | 'milet'
  | 'about'
  | 'anniversary'
  | 'pilgrimage'
  | 'article'
  | 'liveArchive'
  | 'liveEvent'

interface SeoLocaleContent {
  title: string
  description: string
  keywords: string[]
  imageAlt: string
}

interface SeoMeta {
  content: Record<SupportedLang, SeoLocaleContent>
  image: string
  canonicalPath: string
  type?: 'website' | 'article'
  schemaType?: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'Article'
  allowDynamicPath?: boolean
}

interface RenderSeoOptions {
  path?: string
  pilgrimageSpots?: PilgrimageSeoSpot[]
  article?: PublicArticleDetail | null
  liveDetail?: LiveEventDetailPayload | null
}

export interface PilgrimageSeoSpot {
  id: string
  title: string
  workTitle?: string
  category?: string
  tags?: string[]
  description?: string
  displayLat?: number
  displayLng?: number
  coverImageUrl?: string
}

const siteUrl = getSiteOrigin()

const seoMap: Record<SeoKey, SeoMeta> = {
  liveEvent: {
    content: {
      zh: {
        title: 'Live Event | Echoes of milet',
        description: 'Echoes of milet live event archive.',
        keywords: ['Echoes of milet', 'milet', 'live', 'setlist'],
        imageAlt: 'Echoes of milet live event',
      },
      jp: {
        title: 'Live Event | Echoes of milet',
        description: 'Echoes of milet live event archive.',
        keywords: ['Echoes of milet', 'milet', 'live', 'setlist'],
        imageAlt: 'Echoes of milet live event',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/live',
    type: 'article',
    schemaType: 'Article',
    allowDynamicPath: true,
  },
  liveArchive: {
    content: {
      zh: {
        title: 'Live Archive | Echoes of milet',
        description: '整理 milet 演出的日期、场馆、setlist 与关联内容。',
        keywords: ['Echoes of milet', 'milet', 'live archive', 'milet live', 'setlist'],
        imageAlt: 'Echoes of milet Live Archive',
      },
      jp: {
        title: 'Live Archive | Echoes of milet',
        description: 'milet の公演日、会場、setlist、関連コンテンツを整理する Live Archive です。',
        keywords: ['Echoes of milet', 'milet', 'live archive', 'milet live', 'setlist'],
        imageAlt: 'Echoes of milet Live Archive',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/live',
    type: 'website',
    schemaType: 'CollectionPage',
  },
  article: {
    content: {
      zh: {
        title: 'Article | Echoes of milet',
        description: 'Echoes of milet article.',
        keywords: ['Echoes of milet', 'milet', 'article'],
        imageAlt: 'Echoes of milet article',
      },
      jp: {
        title: 'Article | Echoes of milet',
        description: 'Echoes of milet article.',
        keywords: ['Echoes of milet', 'milet', 'article'],
        imageAlt: 'Echoes of milet article',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/articles',
    type: 'article',
    schemaType: 'Article',
    allowDynamicPath: true,
  },
  home: {
    content: {
      zh: {
        title: 'Echoes of milet | milet 中文站',
        description:
          'Echoes of milet 是由 miles DML 创建并维护的 milet fan site (注意，本站非官方，milet官方的fan site是https://fc.milet.jp)。本站收录milet官方的站点导航、精选内容入口、周年记录、时间线、以及其他围绕 milet 的整理内容。记录了milet带来的感动与美好回忆，欢迎所有喜欢 milet 的朋友们一起交流分享。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet 中文站',
          'miles DML',
          'milet fan site',
        ],
        imageAlt: 'Echoes of milet 站点封面',
      },
      jp: {
        title: 'Echoes of milet | milet fan site',
        description:
          'Echoes of milet は miles DML が作成・運営している milet fan site です。非公式サイトであり、milet 公式の fan site は https://fc.milet.jp です。本サイトでは milet 公式サイトへのナビゲーション、注目コンテンツ、周年記録、タイムライン、milet にまつわる整理コンテンツを収録しています。milet が届けてくれた感動と美しい思い出を記録し、milet が好きな方々との交流と共有を歓迎します。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet fan site',
          'miles DML',
          'milet 非公式ファンサイト',
        ],
        imageAlt: 'Echoes of milet サイトカバー',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/',
    type: 'website',
    schemaType: 'WebPage',
  },
  milet: {
    content: {
      zh: {
        title: 'milet 首页 | Echoes of milet',
        description:
          'Echoes of milet 的 milet 首页，快速进入 milet 魅力介绍、精选内容、活动时间线、照片图集、小互动游戏、mielt官方SNS入口与官方链接。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet fan site',
          'miles DML',
          'milet 首页',
          'milet 介绍',
          'milet 时间线',
          'milet 图集',
          'milet 作品',
        ],
        imageAlt: 'Echoes of milet 的 milet 首页预览',
      },
      jp: {
        title: 'milet home | Echoes of milet',
        description:
          'Echoes of milet の milet ホームです。milet の魅力紹介、注目コンテンツ、活動タイムライン、フォトギャラリー、小さなインタラクティブゲーム、milet 公式 SNS 入口、公式リンクへすばやく移動できます。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet fan site',
          'miles DML',
          'milet home',
          'milet profile',
          'milet timeline',
          'milet gallery',
          'milet works',
          'milet 公式SNS',
        ],
        imageAlt: 'Echoes of milet の milet ホームプレビュー',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet',
    type: 'website',
    schemaType: 'WebPage',
  },
  pilgrimage: {
    content: {
      zh: {
        title: 'milet 圣地巡礼地图与路线 | Echoes of milet',
        description:
          'milet 圣地巡礼地图由 Echoes of milet 整理多个城市中与 milet 作品、MV 拍摄地、公开影像、街景和活动记录相关的巡礼地点，支持按城市、区划和路线查看 spot、照片、坐标、导航与地点说明。',
        keywords: [
          'milet 圣地巡礼地图',
          'milet圣地巡礼地图',
          'milet圣地巡礼',
          'milet 圣地巡礼',
          '圣地巡礼',
          '巡礼地图',
          'milet 巡礼地图',
          'milet 拍摄地',
          'milet MV 拍摄地',
          'milet spot',
          'milet 地图',
          'Echoes of milet',
          'miles DML',
        ],
        imageAlt: 'Echoes of milet milet 圣地巡礼地图预览',
      },
      jp: {
        title: 'milet 聖地巡礼マップとルート | Echoes of milet',
        description:
          'milet 聖地巡礼マップとして、Echoes of milet が milet の作品、MV ロケ地、公開映像、街並み、イベント記録に関係する spot を複数の都市から整理し、写真、座標、ナビ、場所の説明を表示します。',
        keywords: [
          'milet 聖地巡礼マップ',
          'milet 聖地巡礼',
          '聖地巡礼',
          '聖地巡礼マップ',
          'milet 巡礼マップ',
          'milet ロケ地',
          'milet MV ロケ地',
          'milet spot',
          'milet map',
          'Echoes of milet',
          'miles DML',
        ],
        imageAlt: 'Echoes of milet milet 聖地巡礼マップのプレビュー',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/pilgrimage',
    type: 'website',
    schemaType: 'CollectionPage',
  },
  anniversary: {
    content: {
      zh: {
        title: 'milet 周年记录 | Echoes of milet',
        description:
          '查看 Echoes of milet 的 milet 周年模块，给milet的周年祝福、作品节点、milet の日照片与回顾记录。并且按年份进行数据整理。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet fan site',
          'miles DML',
          'milet 周年',
          'milet anniversary',
          'milet の日',
          'milet 纪念',
          'milet 周年记录',
        ],
        imageAlt: 'Echoes of milet milet 周年记录封面',
      },
      jp: {
        title: 'milet anniversary archive | Echoes of milet',
        description:
          'Echoes of milet の milet 周年モジュールです。milet への周年メッセージ、作品の節目、milet の日フォト、振り返り記録を年ごとに整理しています。',
        keywords: [
          'Echoes milet',
          'milet',
          'Echoes of milet',
          'milet fan site',
          'miles DML',
          'milet anniversary',
          'milet の日',
          'milet 記念',
          'milet archive',
          'milet anniversary record',
        ],
        imageAlt: 'Echoes of milet milet 周年記録カバー',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/anniversary',
    type: 'website',
    schemaType: 'CollectionPage',
    allowDynamicPath: true,
  },
  about: {
    content: {
      zh: {
        title: '关于本站与 miles DML | Echoes of milet',
        description:
          '了解 Echoes of milet 的建站背景、miles DML 的维护信息、内容整理方式，以及与站点相关的留言反馈入口。',
        keywords: ['Echoes of milet 关于', 'miles DML', 'milet 中文站反馈', 'milet fan site'],
        imageAlt: 'Echoes of milet 关于页面封面',
      },
      jp: {
        title: 'このサイトと miles DML について | Echoes of milet',
        description:
          'Echoes of milet の制作背景、miles DML の運営・メンテナンス情報、コンテンツ整理方針、サイトに関するメッセージやフィードバックの入口をまとめたページです。',
        keywords: [
          'Echoes of milet about',
          'miles DML',
          'milet fan site feedback',
          'milet 非公式ファンサイト',
        ],
        imageAlt: 'Echoes of milet についてページのカバー',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/about',
    type: 'website',
    schemaType: 'AboutPage',
  },
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeJsonForHtml(value: string) {
  return value.replace(/</g, '\\u003c')
}

function toAbsoluteUrl(value?: string | null) {
  const url = (value || '').trim()
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${getImginOrigin()}${url.startsWith('/') ? url : `/${url}`}`
}

/**
 * 后端的文章中使用的图片需要使用后端域名进行发访问
 * @param article
 * @returns
 */
function resolveArticleImage(article?: PublicArticleDetail | null) {
  const image = article?.coverImage
  if (!image) return undefined
  return toAbsoluteUrl(image.urlWebp || image.urlOriginal || image.prelink || image.link)
}

function resolveLiveDetailImage(liveDetail?: LiveEventDetailPayload | null) {
  const imageUrl = resolveLiveImageUrl(liveDetail?.event.mainVisual)
  return toAbsoluteUrl(imageUrl)
}

function resolveLang(lang?: string | null): SupportedLang {
  return lang === 'jp' ? 'jp' : 'zh'
}

export function toHtmlLang(lang?: string | null) {
  return resolveLang(lang) === 'jp' ? 'ja-JP' : 'zh-CN'
}

function toOgLocale(lang?: string | null) {
  return resolveLang(lang) === 'jp' ? 'ja_JP' : 'zh_CN'
}

function normalizeCanonicalPath(pathname: string) {
  const normalized = stripLangPrefix(pathname.split('?')[0] || '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized || '/'
}

function resolveCanonicalPath(meta: SeoMeta, options: RenderSeoOptions) {
  if (!meta.allowDynamicPath || !options.path) {
    return meta.canonicalPath
  }

  const path = normalizeCanonicalPath(options.path)
  return path.startsWith(meta.canonicalPath) ? path : meta.canonicalPath
}

function createLocalizedUrl(pathname: string, lang: SupportedLang) {
  return `${siteUrl}/${toUrlLang(lang)}${pathname === '/' ? '' : pathname}`
}

function renderAlternateLinks(pathname: string) {
  return [
    `<link rel="alternate" hreflang="zh-CN" href="${createLocalizedUrl(pathname, 'zh')}">`,
    `<link rel="alternate" hreflang="ja-JP" href="${createLocalizedUrl(pathname, 'jp')}">`,
    `<link rel="alternate" hreflang="x-default" href="${siteUrl}${pathname === '/' ? '' : pathname}">`,
  ].join('\n')
}

function renderStructuredData(
  meta: SeoMeta,
  localized: SeoLocaleContent,
  canonicalUrl: string,
  imageUrl: string,
  lang: SupportedLang,
  article?: PublicArticleDetail | null,
) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': meta.schemaType ?? 'WebPage',
    name: localized.title,
    description: localized.description,
    inLanguage: toHtmlLang(lang),
    url: canonicalUrl,
    image: imageUrl,
    keywords: localized.keywords.join(', '),
    author: {
      '@type': 'Person',
      name: 'miles DML',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Echoes of milet',
      url: siteUrl,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Echoes of milet',
      url: siteUrl,
      creator: {
        '@type': 'Person',
        name: 'miles DML',
      },
    },
  }

  if (meta.schemaType === 'Article' && article) {
    return JSON.stringify({
      ...baseData,
      author: {
        '@type': 'Person',
        name: article.createdBy || 'miles DML',
      },
      headline: article.title,
      datePublished: article.publishedAt || undefined,
      dateModified: article.updatedAt || undefined,
    })
  }

  return JSON.stringify(baseData)
}

function renderPilgrimageSpotListStructuredData(
  localized: SeoLocaleContent,
  canonicalUrl: string,
  lang: SupportedLang,
  spots: PilgrimageSeoSpot[],
) {
  const itemListElement = spots.map((spot, index) => {
    const anchorUrl = `${canonicalUrl}#pilgrimage-spot-${encodeURIComponent(spot.id)}`
    const lat = Number(spot.displayLat)
    const lng = Number(spot.displayLng)
    const additionalProperty = [
      spot.workTitle
        ? {
            '@type': 'PropertyValue',
            name: lang === 'jp' ? '作品' : '作品',
            value: spot.workTitle,
          }
        : undefined,
      spot.category
        ? {
            '@type': 'PropertyValue',
            name: lang === 'jp' ? 'カテゴリ' : '分类',
            value: spot.category,
          }
        : undefined,
    ].filter(Boolean)

    return {
      '@type': 'ListItem',
      position: index + 1,
      url: anchorUrl,
      item: {
        '@type': 'Place',
        '@id': `${canonicalUrl}#place-${encodeURIComponent(spot.id)}`,
        name: spot.title,
        description:
          spot.description ||
          [spot.workTitle, spot.category, ...(spot.tags || [])].filter(Boolean).join(' / '),
        url: anchorUrl,
        image: toAbsoluteUrl(spot.coverImageUrl),
        keywords: spot.tags?.join(', '),
        geo:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? {
                '@type': 'GeoCoordinates',
                latitude: lat,
                longitude: lng,
              }
            : undefined,
        additionalProperty,
      },
    }
  })

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${localized.title} spots`,
    description: localized.description,
    inLanguage: toHtmlLang(lang),
    url: canonicalUrl,
    numberOfItems: itemListElement.length,
    itemListElement,
  })
}

export function resolveSeoMeta(seoKey?: string) {
  return seoMap[(seoKey as SeoKey) ?? 'home'] ?? seoMap.home
}

export function renderSeoTags(
  seoKey?: string,
  lang?: string | null,
  options: RenderSeoOptions = {},
) {
  const meta = resolveSeoMeta(seoKey)
  const resolvedLang = resolveLang(lang)
  let localized = meta.content[resolvedLang]
  if (seoKey === 'article' && options.article) {
    localized = {
      ...localized,
      title: `${options.article.title} | Echoes of milet`,
      description: options.article.summary || localized.description,
      keywords: ['Echoes of milet', 'milet', options.article.title],
      imageAlt: options.article.title,
    }
  }
  if (seoKey === 'liveEvent' && options.liveDetail?.event) {
    localized = {
      ...localized,
      title: `${options.liveDetail.event.title} | Echoes of milet`,
      description: options.liveDetail.event.summary || localized.description,
      keywords: ['Echoes of milet', 'milet', 'live', options.liveDetail.event.title],
      imageAlt: options.liveDetail.event.title,
    }
  }
  const canonicalPath = resolveCanonicalPath(meta, options)
  const canonicalUrl = createLocalizedUrl(canonicalPath, resolvedLang)
  const robots = seoKey === 'liveEvent' && options.path?.includes('/milet/live-preview/')
    ? 'noindex,nofollow,noarchive'
    : 'index,follow,max-image-preview:large'
  const imageUrl =
    resolveLiveDetailImage(options.liveDetail) ||
    resolveArticleImage(options.article) ||
    toAbsoluteUrl(meta.image) ||
    `${siteUrl}/echoes-of-milet-OG.webp`
  const escapedTitle = escapeHtml(localized.title)
  const escapedDescription = escapeHtml(localized.description)
  const escapedImageAlt = escapeHtml(localized.imageAlt)
  const structuredDataScripts = [
    `<script type="application/ld+json">${escapeJsonForHtml(renderStructuredData(meta, localized, canonicalUrl, imageUrl, resolvedLang, options.article))}</script>`,
  ]

  if (seoKey === 'pilgrimage' && options.pilgrimageSpots?.length) {
    structuredDataScripts.push(
      `<script type="application/ld+json">${escapeJsonForHtml(
        renderPilgrimageSpotListStructuredData(
          localized,
          canonicalUrl,
          resolvedLang,
          options.pilgrimageSpots,
        ),
      )}</script>`,
    )
  }

  return [
    `<title>${escapedTitle}</title>`,
    `<meta name="description" content="${escapedDescription}">`,
    `<meta name="keywords" content="${escapeHtml(localized.keywords.join(', '))}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    renderAlternateLinks(canonicalPath),
    `<meta name="robots" content="${robots}">`,
    `<meta property="og:title" content="${escapedTitle}">`,
    `<meta property="og:description" content="${escapedDescription}">`,
    `<meta property="og:type" content="${meta.type ?? 'website'}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:alt" content="${escapedImageAlt}">`,
    `<meta property="og:site_name" content="Echoes of milet">`,
    `<meta property="og:locale" content="${toOgLocale(resolvedLang)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapedTitle}">`,
    `<meta name="twitter:description" content="${escapedDescription}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${escapedImageAlt}">`,
    ...structuredDataScripts,
  ].join('\n')
}
