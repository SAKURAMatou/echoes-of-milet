import { stripLangPrefix, toUrlLang } from '@/composables/useLangRoute'
import { buildStaticAssetAbsoluteUrl, getSiteOrigin } from '@/config/api'
import type { PublicArticleDetail } from '@/composables/articleType'
import { resolveLiveImageUrl, type LiveEventDetailPayload } from '@/composables/liveArchive'

export type SeoKey =
  | 'galleryDetail'
  | 'news'
  | 'release'
  | 'timeline'
  | 'home'
  | 'milet'
  | 'about'
  | 'anniversary'
  | 'pilgrimage'
  | 'gallery'
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

export interface RenderSeoOptions {
  galleryTitle?: string
  galleryDescription?: string
  galleryImages?: import('@/composables/publicPageData').GalleryImage[]
  noindex?: boolean
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

function collectionMeta(
  path: string,
  zhTitle: string,
  jaTitle: string,
  zhDescription: string,
  jaDescription: string,
): SeoMeta {
  return {
    content: {
      zh: {
        title: `${zhTitle} | Echoes of milet`,
        description: zhDescription,
        keywords: ['milet', zhTitle],
        imageAlt: zhTitle,
      },
      jp: {
        title: `${jaTitle} | Echoes of milet`,
        description: jaDescription,
        keywords: ['milet', jaTitle],
        imageAlt: jaTitle,
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: path,
    schemaType: 'CollectionPage',
  }
}

const seoMap: Record<SeoKey, SeoMeta> = {
  galleryDetail: {
    ...collectionMeta(
      '/milet/galleryDetail',
      'milet 照片相册',
      'milet フォトアルバム',
      '浏览 milet 照片与图片说明，查看大图，并通过相册目录继续发现舞台、作品与日常中的影像记录。',
      'milet の写真とキャプションをまとめたフォトアルバムです。写真を拡大して楽しみながら、アルバム一覧からステージや作品にまつわる記録をたどれます。',
    ),
    allowDynamicPath: true,
  },
  news: collectionMeta(
    '/milet/news',
    'milet 新闻与采访索引',
    'milet ニュース・インタビュー一覧',
    '按主题整理 milet 相关新闻、采访与媒体报道，查看发布时间、内容摘要和来源链接，继续前往原文阅读，追踪作品与演出相关动态。',
    'milet に関するニュース、インタビュー、メディア掲載情報をテーマ別にまとめています。公開日や記事の概要、出典を確認し、リンク先の原文で作品や公演の話題を読むことができます。',
  ),
  release: collectionMeta(
    '/milet/release',
    'milet 专辑、单曲与影像发行目录',
    'milet ディスコグラフィー・作品一覧',
    '整理 milet 的专辑、EP、单曲与现场影像发行记录，浏览作品封面、发行日期与曲目信息，并按作品类型、年份和关键词查找感兴趣的发行内容。',
    'milet のアルバム、EP、シングル、ライブ映像作品をまとめたディスコグラフィーです。ジャケット、発売日、収録曲を確認し、作品の種類や年、キーワードでリリース情報を探せます。',
  ),
  timeline: collectionMeta(
    '/milet/timeline',
    'milet 活动时间线',
    'milet 活動年表',
    '沿时间线浏览 milet 的作品发布、演出与活动记录，回顾不同阶段的重要节点，并通过相关内容了解每段音乐旅程。',
    'milet の作品リリース、公演、活動の記録を時系列でたどる年表です。それぞれの時期の出来事と関連情報を通して、音楽の歩みを振り返ることができます。',
  ),
  gallery: {
    content: {
      zh: {
        title: 'milet 照片相册 | Echoes of milet',
        description:
          '按主题与时间整理 milet 的照片相册，收录舞台、作品与旅途中的光影片段。那些短暂闪现的表情、风景与记忆，也在一次次翻阅中重新泛起余韵。',
        keywords: [
          'Echoes of milet',
          'milet',
          'milet 相册',
          'milet 照片',
          'milet 写真',
          'milet gallery',
        ],
        imageAlt: 'Echoes of milet 照片相册',
      },
      jp: {
        title: 'Photo Albums | Echoes of milet',
        description:
          'テーマと時間に沿って、miletにまつわる写真をアルバムとして綴っています。ステージや作品、旅の途中に残された表情や風景、記憶が、ページをめくるたび静かな余韻となってよみがえります。',
        keywords: [
          'Echoes of milet',
          'milet',
          'milet 写真',
          'milet photo',
          'milet gallery',
          'milet アルバム',
        ],
        imageAlt: 'Echoes of milet Photo Albums',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/galleryList',
    type: 'website',
    schemaType: 'CollectionPage',
  },
  liveEvent: {
    content: {
      zh: {
        title: 'Live Event | Echoes of milet',
        description: 'Echoes of milet live event archive.',
        keywords: ['Echoes of milet', 'milet live', 'live', 'setlist'],
        imageAlt: 'Echoes of milet live event',
      },
      jp: {
        title: 'Live Event | Echoes of milet',
        description: 'Echoes of milet live event archive.',
        keywords: ['Echoes of milet', 'milet live', 'live', 'setlist'],
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
        title: 'milet 演出档案与歌单 | Echoes of milet',
        description:
          '按年份浏览 milet 的演出与巡演档案，查看公演日期、城市、场馆与已整理的歌单，结合相关照片、文章和作品记录，回顾每场演出的音乐现场。',
        keywords: ['Echoes of milet', 'milet', 'live archive', 'milet live', 'setlist'],
        imageAlt: 'Echoes of milet Live Archive',
      },
      jp: {
        title: 'milet 公演記録・セットリスト | Echoes of milet',
        description:
          'milet のライブとツアーを年ごとにたどる公演アーカイブです。公演日、都市、会場、記録されたセットリストを確認し、関連する写真や記事とともにステージの記憶を振り返ることができます。',
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
          '从 Echoes of milet 开始了解 milet 的音乐与魅力，浏览精选作品、演出档案、活动时间线和照片相册，发现巡礼地图与互动内容，并通过官方 SNS 和站点链接继续追踪她的动态。',
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
          '回顾这一年与 milet 共同留下的音乐记忆，浏览周年祝福、作品发布节点、milet の日照片和年度故事，从时间线与影像中重温重要时刻，并继续探索其他年份的周年记录。',
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
          'milet とともに重ねた一年の音楽の記憶を振り返る周年ページです。周年メッセージ、作品の節目、milet の日フォトや一年の物語をたどり、ほかの年のアーカイブにも進めます。',
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
          '了解非官方粉丝站 Echoes of milet 的建站故事、miles DML 的维护信息与内容整理方式，看看音乐和现场记忆如何汇集在这里，也可以通过留言反馈分享使用感受、建议和想法。',
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

export function seoPlainText(value = '') {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function summarize(primary: string | undefined, fallback: string) {
  const text = seoPlainText(primary)
  const description =
    text.length >= 60 ? text : [text, seoPlainText(fallback)].filter(Boolean).join(' ')
  return Array.from(description).slice(0, 170).join('')
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
  return buildStaticAssetAbsoluteUrl(url)
}

/** 文章分享图使用公开端绝对地址，由公开端的静态资源代理访问图片。 */
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
  return lang === 'jp' || lang === 'ja' ? 'jp' : 'zh'
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
  return path === meta.canonicalPath || path.startsWith(`${meta.canonicalPath}/`)
    ? path
    : meta.canonicalPath
}

function createLocalizedUrl(pathname: string, lang: SupportedLang) {
  return `${siteUrl}/${toUrlLang(lang)}${pathname === '/' ? '' : pathname}`
}

function renderAlternateLinks(pathname: string, article?: PublicArticleDetail | null) {
  // A fallback is not a translation. Do not advertise an unverified language pair.
  if (article && (!article.i18nEnabled || article.fallbackLang)) return ''
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
      description: summarize(
        options.article.summary,
        `${options.article.title}。${seoPlainText(options.article.html) || localized.description}`,
      ),
      keywords: ['Echoes of milet', 'milet', options.article.title],
      imageAlt: options.article.title,
    }
  }
  if (seoKey === 'liveEvent' && options.liveDetail?.event) {
    localized = {
      ...localized,
      title: `${options.liveDetail.event.title} ${resolvedLang === 'jp' ? '公演記録' : '演出记录'} | Echoes of milet`,
      description: summarize(
        options.liveDetail.event.summary,
        [
          options.liveDetail.event.title,
          options.liveDetail.event.dateStart,
          options.liveDetail.event.venueSummary,
          resolvedLang === 'jp'
            ? '公演日、会場と関連情報をまとめた milet の公演記録。掲載されたセットリストや写真、記事からステージの記憶をたどれます。'
            : '整理 milet 演出的日期、场馆与相关信息，通过已收录的歌单、照片和文章回顾演出记录。',
        ]
          .filter(Boolean)
          .join('。'),
      ),
      keywords: ['Echoes of milet', 'milet', 'live', options.liveDetail.event.title],
      imageAlt: options.liveDetail.event.title,
    }
  }
  if (seoKey === 'anniversary') {
    const year = normalizeCanonicalPath(options.path || '').match(/anniversary\/(\d{4})$/)?.[1]
    localized = {
      ...localized,
      title: year
        ? resolvedLang === 'jp'
          ? `milet ${year} 年の周年記録 | Echoes of milet`
          : `milet ${year} 年周年记录 | Echoes of milet`
        : resolvedLang === 'jp'
          ? 'milet 周年アーカイブ・年別一覧 | Echoes of milet'
          : 'milet 历年周年记录目录 | Echoes of milet',
      description: year
        ? `${year} ${localized.description}`
        : resolvedLang === 'jp'
          ? 'milet の周年記録を年ごとにたどるアーカイブです。各年のページから、作品の節目、周年メッセージ、写真と振り返りを読み、音楽とともに重ねてきた記憶を探せます。'
          : '按年份浏览 milet 的历年周年记录，从目录进入每一年的专属页面，回顾作品节点、周年祝福、照片与年度故事，重温音乐陪伴下积累的记忆。',
    }
  }
  if (seoKey === 'galleryDetail') {
    const id =
      normalizeCanonicalPath(options.path || '')
        .split('/')
        .pop() || ''
    const name =
      options.galleryTitle ||
      (resolvedLang === 'jp' ? `milet フォトアルバム ${id}` : `milet 照片相册 ${id}`)
    localized = {
      ...localized,
      title: `${name} | Echoes of milet`,
      imageAlt: name,
      description: summarize(
        options.galleryDescription ||
          options.galleryImages
            ?.map((image) => image.comment || '')
            .filter(Boolean)
            .join('。'),
        `${name}。${localized.description}`,
      ),
    }
  }
  const canonicalPath =
    !seoKey && options.path
      ? normalizeCanonicalPath(options.path)
      : resolveCanonicalPath(meta, options)
  const canonicalLang =
    seoKey === 'article' && options.article ? resolveLang(options.article.lang) : resolvedLang
  const canonicalUrl = createLocalizedUrl(canonicalPath, canonicalLang)
  const robots =
    !seoKey ||
    options.noindex ||
    (seoKey === 'liveEvent' && options.path?.includes('/milet/live-preview/'))
      ? 'noindex,nofollow,noarchive'
      : 'index,follow,max-image-preview:large'
  const imageUrl =
    resolveLiveDetailImage(options.liveDetail) ||
    resolveArticleImage(options.article) ||
    toAbsoluteUrl(options.galleryImages?.[0]?.prelink || options.galleryImages?.[0]?.link) ||
    toAbsoluteUrl(meta.image) ||
    `${siteUrl}/echoes-of-milet-OG.webp`
  const escapedTitle = escapeHtml(localized.title)
  const escapedDescription = escapeHtml(localized.description)
  const escapedImageAlt = escapeHtml(localized.imageAlt)
  const structuredDataScripts = [
    `<script type="application/ld+json">${escapeJsonForHtml(renderStructuredData(meta, localized, canonicalUrl, imageUrl, canonicalLang, options.article))}</script>`,
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
    renderAlternateLinks(canonicalPath, seoKey === 'article' ? options.article : undefined),
    `<meta name="robots" content="${robots}">`,
    `<meta property="og:title" content="${escapedTitle}">`,
    `<meta property="og:description" content="${escapedDescription}">`,
    `<meta property="og:type" content="${meta.type ?? 'website'}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:alt" content="${escapedImageAlt}">`,
    `<meta property="og:site_name" content="Echoes of milet">`,
    `<meta property="og:locale" content="${toOgLocale(canonicalLang)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapedTitle}">`,
    `<meta name="twitter:description" content="${escapedDescription}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<meta name="twitter:image:alt" content="${escapedImageAlt}">`,
    ...structuredDataScripts,
  ]
    .filter(Boolean)
    .map((tag) => tag.replace(/^<(title|meta|link|script)\b/gm, '<$1 data-milet-seo'))
    .join('\n')
}
