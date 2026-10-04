import apiProxyConfig from '../../api-proxy.config.json'

type RuntimeName = keyof typeof apiProxyConfig.origins

function resolveRuntime(): RuntimeName {
  return import.meta.env.DEV ? 'development' : 'production'
}

export const apiRoutes = apiProxyConfig.routes
export const staticRoutes = apiProxyConfig.staticRoutes

export function getRuntimeConfig(runtime = resolveRuntime()) {
  return apiProxyConfig.origins[runtime] || apiProxyConfig.origins.production
}

// export function getBackendOrigin() {
//   return getRuntimeConfig().backend
// }

export function getSiteOrigin() {
  return getRuntimeConfig().site
}

export function resolveStaticImageStorage(image: {
  storage?: string | null
  img_type?: string | null
  imgType?: string | null
  access_route?: string | null
  accessRoute?: string | null
  coverAccessRoute?: string | null
}) {
  if (image.storage === 'blog' || image.storage === 'milet') return image.storage
  const type = (image.img_type || image.imgType || '').trim().toLowerCase()
  if (['b', 'blog', 'article', 'article-img'].includes(type)) return 'blog'
  if (['m', 's', 'milet', 'spot'].includes(type)) return 'milet'
  const route = image.access_route || image.accessRoute || image.coverAccessRoute || ''
  return route.includes(staticRoutes.blogImage) ? 'blog' : 'milet'
}

export function buildStaticAssetUrl(assetPath: string | null | undefined, baseType = 'milet') {
  const value = (assetPath || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value
  const baseRoute = baseType === 'milet' ? staticRoutes.miletImage : staticRoutes.blogImage
  return `${baseRoute}${value}`
}

export function buildStaticAssetAbsoluteUrl(assetPath: string, baseType = 'milet') {
  const url = buildStaticAssetUrl(assetPath, baseType)
  if (!url) return ''

  const siteOrigin = getSiteOrigin().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) {
    const staticPath = url.replace(/^\/(?:apihost|imagehost)(?=\/static\/)/, '')
    return `${siteOrigin}${staticPath.startsWith('/') ? staticPath : `/${staticPath}`}`
  }

  try {
    const parsed = new URL(url)
    const backendOrigins = new Set(
      Object.values(apiProxyConfig.origins).map((config) => new URL(config.backend).origin),
    )
    const isStaticAsset = Object.values(staticRoutes).some((route) =>
      parsed.pathname.startsWith(route),
    )
    if (backendOrigins.has(parsed.origin) && isStaticAsset) {
      return `${siteOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    return url
  }

  return url
}

export function buildStaticAssetPreviewUrl(assetPath: string, baseType = 'milet') {
  const rawUrl = buildStaticAssetUrl(assetPath, baseType)
  if (!rawUrl) return ''

  try {
    const isAbsolute = /^https?:\/\//i.test(rawUrl)
    const url = new URL(rawUrl, getSiteOrigin())
    const route = [
      [staticRoutes.miletImage, staticRoutes.miletImagePreview],
      [staticRoutes.blogImage, staticRoutes.blogImagePreview],
    ].find(([imageRoute]) => url.pathname.startsWith(imageRoute))
    if (!route) return rawUrl
    url.pathname = `${route[1]}${url.pathname.slice(route[0].length)}`
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return rawUrl
  }
}

export function buildStaticAssetDownloadUrl(assetPath: string | null | undefined, baseType = 'milet') {
  const rawUrl = buildStaticAssetUrl(assetPath, baseType)
  if (!rawUrl) return ''
  const url = new URL(rawUrl, getSiteOrigin())
  url.searchParams.set('download', 'true')
  return /^https?:\/\//i.test(rawUrl) ? url.href : `${url.pathname}${url.search}${url.hash}`
}
