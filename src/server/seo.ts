interface SeoMeta {
  title: string
  description: string
  image: string
  canonicalPath: string
  type?: 'website' | 'article'
}

const siteUrl = 'https://miles-dml.org'

const seoMap: Record<string, SeoMeta> = {
  home: {
    title: 'Echoes of milet',
    description: 'A fan-made site about milet with curated highlights, stories, and gallery links.',
    image: '/milet-img/milet-site-og-img.jpg',
    canonicalPath: '/',
    type: 'website',
  },
  milet: {
    title: 'Echoes of milet | Home',
    description:
      'Server-rendered milet home content with intro cards, timeline highlights, and official links.',
    image: '/milet-img/milet-fc-og-img.png',
    canonicalPath: '/milet',
    type: 'website',
  },
  about: {
    title: 'About Me | Echoes of milet',
    description:
      'About the site author, the story behind the project, and a feedback form for fellow fans.',
    image: '/milet-img/milet-site-og-img.jpg',
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

export function resolveSeoMeta(seoKey?: string) {
  return seoMap[seoKey ?? 'home'] ?? seoMap.home
}

export function renderSeoTags(seoKey?: string) {
  const meta = resolveSeoMeta(seoKey)
  const canonicalUrl = `${siteUrl}${meta.canonicalPath}`
  const imageUrl = meta.image.startsWith('http') ? meta.image : `${siteUrl}${meta.image}`

  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:type" content="${meta.type ?? 'website'}">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:image" content="${imageUrl}">`,
  ].join('\n')
}
