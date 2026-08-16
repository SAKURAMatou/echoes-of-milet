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

export function getBackendOrigin() {
  return getRuntimeConfig().backend
}

export function getSiteOrigin() {
  return getRuntimeConfig().site
}

export function buildStaticAssetUrl(assetPath: string, baseType = 'milet') {
  const value = assetPath.trim()
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

  const imageRoute = baseType === 'milet' ? staticRoutes.miletImage : staticRoutes.blogImage
  const previewRoute =
    baseType === 'milet' ? staticRoutes.miletImagePreview : staticRoutes.blogImagePreview

  try {
    const isAbsolute = /^https?:\/\//i.test(rawUrl)
    const url = new URL(rawUrl, getSiteOrigin())
    if (!url.pathname.startsWith(imageRoute)) return rawUrl
    url.pathname = `${previewRoute}${url.pathname.slice(imageRoute.length)}`
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return rawUrl
  }
}
