import { toUrlLang } from '@/composables/useLangRoute'

interface SeoLocaleContent {
  title: string
  description: string
}

interface SeoMeta {
  content: Record<SupportedLang, SeoLocaleContent>
  image: string
  canonicalPath: string
  type?: 'website' | 'article'
}

const siteUrl = 'https://miles-dml.org'

const seoMap: Record<string, SeoMeta> = {
  home: {
    content: {
      zh: {
        title: 'Echoes of milet | milet 中文站',
        description:
          'Echoes of milet 是由 miles DML 维护的 milet 中文站，收录站点导览、精选内容入口与围绕 milet 的整理内容。',
      },
      jp: {
        title: 'Echoes of milet | milet 日本語ファンサイト',
        description:
          'Echoes of milet は miles DML が運営する milet の日本語ファンサイトです。サイト案内、注目コンテンツ、milet に関するまとめを掲載しています。',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/',
    type: 'website',
  },
  milet: {
    content: {
      zh: {
        title: 'Echoes of milet | milet 首页',
        description:
          'Echoes of milet 的 milet 首页，包含人物介绍、时间线亮点、画廊入口与官方链接，帮助用户快速进入核心内容。',
      },
      jp: {
        title: 'Echoes of milet | milet ホーム',
        description:
          'Echoes of milet の milet ホームページです。プロフィール、タイムライン、ギャラリー導線、公式リンクをまとめています。',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet',
    type: 'website',
  },
  about: {
    content: {
      zh: {
        title: '关于本站与 miles DML | Echoes of milet',
        description:
          '了解 Echoes of milet 的建站背景、miles DML 的维护信息，以及与站点相关的留言反馈入口。',
      },
      jp: {
        title: 'このサイトと miles DML について | Echoes of milet',
        description:
          'Echoes of milet の制作背景、miles DML の運営情報、フィードバック窓口をまとめた日本語ページです。',
      },
    },
    image: '/echoes-of-milet-OG.webp',
    canonicalPath: '/milet/about',
    type: 'website',
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

function resolveLang(lang?: string | null): SupportedLang {
  return lang === 'jp' ? 'jp' : 'zh'
}

export function toHtmlLang(lang?: string | null) {
  return resolveLang(lang) === 'jp' ? 'ja-JP' : 'zh-CN'
}

function toOgLocale(lang?: string | null) {
  return resolveLang(lang) === 'jp' ? 'ja_JP' : 'zh_CN'
}

function createLocalizedUrl(pathname: string, lang: SupportedLang) {
  return `${siteUrl}/${toUrlLang(lang)}${pathname === '/' ? '' : pathname}`
}

function renderAlternateLinks(pathname: string) {
  return [
    `<link rel="alternate" hreflang="zh-CN" href="${createLocalizedUrl(pathname, 'zh')}">`,
    `<link rel="alternate" hreflang="ja-JP" href="${createLocalizedUrl(pathname, 'jp')}">`,
    `<link rel="alternate" hreflang="x-default" href="${siteUrl}/">`,
  ].join('\n')
}

function renderStructuredData(
  title: string,
  description: string,
  canonicalUrl: string,
  lang: SupportedLang,
) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    inLanguage: toHtmlLang(lang),
    url: canonicalUrl,
    author: {
      '@type': 'Person',
      name: 'miles DML',
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
  })
}

export function resolveSeoMeta(seoKey?: string) {
  return seoMap[seoKey ?? 'home'] ?? seoMap.home
}

export function renderSeoTags(seoKey?: string, lang?: string | null) {
  const meta = resolveSeoMeta(seoKey)
  const resolvedLang = resolveLang(lang)
  const localized = meta.content[resolvedLang]
  const canonicalUrl = createLocalizedUrl(meta.canonicalPath, resolvedLang)
  const imageUrl = meta.image.startsWith('http') ? meta.image : `${siteUrl}${meta.image}`

  return [
    `<title>${escapeHtml(localized.title)}</title>`,
    `<meta name="description" content="${escapeHtml(localized.description)}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    renderAlternateLinks(meta.canonicalPath),
    `<meta name="robots" content="index,follow,max-image-preview:large">`,
    `<meta property="og:title" content="${escapeHtml(localized.title)}">`,
    `<meta property="og:description" content="${escapeHtml(localized.description)}">`,
    `<meta property="og:type" content="${meta.type ?? 'website'}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:site_name" content="Echoes of milet">`,
    `<meta property="og:locale" content="${toOgLocale(resolvedLang)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(localized.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(localized.description)}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
    `<script type="application/ld+json">${escapeJsonForHtml(renderStructuredData(localized.title, localized.description, canonicalUrl, resolvedLang))}</script>`,
  ].join('\n')
}
