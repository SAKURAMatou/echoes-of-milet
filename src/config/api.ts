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

export function buildStaticAssetUrl(assetPath: string, staticBase = staticRoutes.miletImage) {
  if (!assetPath) return ''
  if (/^https?:\/\//i.test(assetPath)) return assetPath
  //图片统一使用正式地址
  return `${apiProxyConfig.origins['production'].backend}${staticBase}${assetPath}`
}
