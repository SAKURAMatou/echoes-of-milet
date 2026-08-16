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

function staticAssetPath(assetPath: string) {
  const value = assetPath.trim()
  if (!value) return ''

  if (!/^https?:\/\//i.test(value)) {
    return value.startsWith('/static/') ? value : ''
  }

  try {
    const url = new URL(value)
    const backendOrigin = apiProxyConfig.origins.production.backend.replace(/\/+$/, '')
    const siteOrigin = apiProxyConfig.origins.production.site.replace(/\/+$/, '')
    if ((url.origin === backendOrigin || url.origin === siteOrigin) && url.pathname.startsWith('/static/')) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return ''
  }

  return ''
}

export function buildStaticAssetUrl(assetPath: string, baseType = 'milet') {
  if (!assetPath) return ''
  const proxiedPath = staticAssetPath(assetPath)
  if (proxiedPath) return proxiedPath
  if (/^https?:\/\//i.test(assetPath)) return assetPath
  const baseRoute = baseType === 'milet' ? staticRoutes.miletImage : staticRoutes.blogImage
  return `${baseRoute}${assetPath.replace(/^\/+/, '')}`
}

export function buildStaticAssetAbsoluteUrl(assetPath: string, baseType = 'milet') {
  const url = buildStaticAssetUrl(assetPath, baseType)
  if (!url || /^https?:\/\//i.test(url)) return url
  return `${getSiteOrigin().replace(/\/+$/, '')}${url.startsWith('/') ? url : `/${url}`}`
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
