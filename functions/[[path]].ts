import apiProxyConfig from '../api-proxy.config.json'
import renderConfig from '../render.config.json'
import { buildShortLinkTarget } from '../src/config/shortLinks'

interface FetcherLike {
  fetch(request: Request): Promise<Response>
}

interface PagesFunctionEnv {
  ASSETS: FetcherLike
  MILET_SOURCE_GUARD_TOKEN: string
}

interface FunctionContext {
  request: Request
  env: PagesFunctionEnv
}

const supportedLangs = ['zh', 'ja'] as const
const ssgRoutes = new Set((renderConfig.ssgRoutes || []).flatMap(localizeConfiguredRoute))
const baiduVerificationContent = '3c345798cdedc5cdc0a388e198c65a32'
const baiduVerificationPaths = new Set([
  '/baidu_verify_codeva-HqQ4QBPDlh.html',
  '/baidu_verify_codeva-HqQ4QBPDlh',
])
const allowedApiPrefixes = Object.values(apiProxyConfig.routes) as string[]
const allowedOtherPaths = new Set(
  Object.keys(apiProxyConfig.otherRquests || {}).map((key) => `/other/${key}`),
)
const pagesRuntimeConfig = apiProxyConfig.origins.production
const upstreamOrigin = pagesRuntimeConfig.backend
const proxyRequestHeaderAllowList = [
  'accept',
  'accept-language',
  'content-type',
  'if-none-match',
  'if-modified-since',
  'range',
  'x-milet-lang',
  'x-milet-route-lang',
]
const hopByHopResponseHeaders = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]
const htmlContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' https://platform.twitter.com https://www.instagram.com https://cdn.syndication.twimg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.miles-dml.org https://platform.twitter.com https://syndication.twitter.com https://cdn.syndication.twimg.com https://www.instagram.com",
  "frame-src https://platform.twitter.com https://syndication.twitter.com https://www.instagram.com",
  "media-src 'self' https://api.miles-dml.org",
  "object-src 'none'",
].join('; ')

function normalizeUrl(url = '/') {
  const [pathname] = url.split('?')
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function localizeConfiguredRoute(route: string) {
  const cleanPath = normalizeUrl(route)
  if (cleanPath === '/') {
    return supportedLangs.map((lang) => `/${lang}`)
  }

  if (/^\/(?:zh|ja)(?=\/|$)/i.test(cleanPath)) {
    return [cleanPath]
  }

  return supportedLangs.map((lang) => `/${lang}${cleanPath}`)
}

function isAssetRequest(url = '/') {
  return /\.[a-z0-9]+$/i.test(normalizeUrl(url))
}

function isSsgRoute(url = '/') {
  return ssgRoutes.has(normalizeUrl(url))
}

function normalizeLang(value?: string | null) {
  if (!value) {
    return null
  }

  const lowerValue = value.toLowerCase()

  if (lowerValue === 'zh' || lowerValue.startsWith('zh-')) {
    return 'zh'
  }

  if (
    lowerValue === 'ja' ||
    lowerValue === 'jp' ||
    lowerValue.startsWith('ja-') ||
    lowerValue.includes('jp')
  ) {
    return 'ja'
  }

  return null
}

function parseCookieLang(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return null
  }

  const matched = cookieHeader.match(/(?:^|;\s*)lang=([^;]+)/i)
  return normalizeLang(matched?.[1] ? decodeURIComponent(matched[1]) : null)
}

function resolvePreferredLang(request: Request) {
  const cookieLang = parseCookieLang(request.headers.get('cookie'))
  if (cookieLang) {
    return cookieLang
  }

  return normalizeLang(request.headers.get('accept-language')) ?? 'zh'
}

function convertLegacyPath(pathname: string, lang: 'zh' | 'ja') {
  const cleanPath = normalizeUrl(pathname)
  return cleanPath === '/' ? `/${lang}` : `/${lang}${cleanPath}`
}

/**
 * 给请求添加语言前缀的重定向，例如 /about -> /zh/about 或 /ja/about，具体取决于用户的语言偏好
 * @param pathname
 * @param request
 * @returns
 */
function buildBarePathRedirect(pathname: string, request: Request) {
  const cleanPath = normalizeUrl(pathname)
  if (cleanPath === '/' || cleanPath.startsWith('/zh') || cleanPath.startsWith('/ja')) {
    return null
  }

  if (isAssetRequest(cleanPath)) {
    return null
  }

  if (cleanPath.startsWith('/api/')) {
    return null
  }
  if (cleanPath.startsWith('/other/')) {
    return null
  }

  return convertLegacyPath(cleanPath, resolvePreferredLang(request))
}

function buildShortLinkRedirect(pathname: string, request: Request) {
  return buildShortLinkTarget(pathname, resolvePreferredLang(request))
}

function injectHtml(
  template: string,
  payload: { htmlLang: string; headTags: string; appHtml: string; initialState: unknown },
) {
  return template
    .replace('__HTML_LANG__', payload.htmlLang)
    .replace('<!--app-head-->', payload.headTags)
    .replace('<!--app-html-->', payload.appHtml)
    .replace(
      '<!--app-state-->',
      `<script>window.__INITIAL_STATE__=${JSON.stringify(payload.initialState).replace(/</g, '\\u003c')}</script>`,
    )
}

function getRequestOrigin(request: Request) {
  const url = new URL(request.url)
  return pagesRuntimeConfig.site || url.origin
}

function buildProxyHeaders(request: Request, env?: PagesFunctionEnv | null) {
  const requestOrigin = getRequestOrigin(request)
  const headers = new Headers()
  for (const name of proxyRequestHeaderAllowList) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('origin', requestOrigin)
  headers.set('referer', `${requestOrigin}/`)
  headers.set('accept-encoding', 'identity')
  headers.set('x-forwarded-host', new URL(request.url).host)
  headers.set('x-forwarded-proto', new URL(request.url).protocol.replace(':', ''))
  headers.set('x-forwarded-origin', requestOrigin)

  if (env?.MILET_SOURCE_GUARD_TOKEN) {
    headers.set('X-Milet-Source-Token', env.MILET_SOURCE_GUARD_TOKEN)
  }
  return headers
}

function stripProxyResponseHeaders(headers: Headers) {
  const cloned = new Headers(headers)
  hopByHopResponseHeaders.forEach((name) => cloned.delete(name))
  applyBaseSecurityHeaders(cloned)
  return cloned
}

function applyBaseSecurityHeaders(headers: Headers) {
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', headers.get('referrer-policy') || 'strict-origin-when-cross-origin')
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('x-frame-options', headers.get('x-frame-options') || 'SAMEORIGIN')
}

function withSecurityHeaders(response: Response, html = false) {
  const headers = new Headers(response.headers)
  applyBaseSecurityHeaders(headers)
  if (html) {
    headers.set('content-security-policy', htmlContentSecurityPolicy)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function buildHtmlResponseHeaders(pathname: string) {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
  })
  applyBaseSecurityHeaders(headers)
  headers.set('content-security-policy', htmlContentSecurityPolicy)

  if (pathname.includes('/milet/live-preview/')) {
    headers.set('cache-control', 'no-store')
    headers.set('x-robots-tag', 'noindex, nofollow')
    headers.set('referrer-policy', 'no-referrer')
  }

  return headers
}

function isPathUnder(pathname: string, prefix: string) {
  if (prefix.endsWith('/')) {
    return pathname.startsWith(prefix)
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isAllowedApiPath(pathname: string) {
  return allowedApiPrefixes.some((prefix) => isPathUnder(pathname, prefix))
}

function forbiddenResponse(message = 'Forbidden') {
  const headers = new Headers({
    'content-type': 'text/plain; charset=utf-8',
  })
  applyBaseSecurityHeaders(headers)
  return new Response(message, {
    status: 403,
    headers,
  })
}

function isCrossSiteWriteBlocked(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false
  if (request.headers.get('sec-fetch-site') === 'cross-site') return true

  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin !== new URL(request.url).origin
  } catch {
    return true
  }
}

async function proxyApiRequest(request: Request, env: PagesFunctionEnv) {
  const url = new URL(request.url)
  if (!isAllowedApiPath(url.pathname)) {
    return forbiddenResponse()
  }
  if (isCrossSiteWriteBlocked(request)) {
    return forbiddenResponse('Cross-site write requests are not allowed')
  }
  const targetUrl = new URL(url.pathname + url.search, upstreamOrigin)

  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: buildProxyHeaders(request, env),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })

  return new Response(response.body, {
    status: response.status,
    headers: stripProxyResponseHeaders(response.headers),
  })
}
async function proxyOtherRequest(request: Request, env: PagesFunctionEnv) {
  const url = new URL(request.url)
  if (!allowedOtherPaths.has(url.pathname)) {
    return forbiddenResponse()
  }
  if (isCrossSiteWriteBlocked(request)) {
    return forbiddenResponse('Cross-site write requests are not allowed')
  }
  const uri = apiProxyConfig.otherRquests[url.pathname.replace('/other/', '')]
  if (!uri) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  }
  const targetUrl = new URL(uri, upstreamOrigin)

  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: buildProxyHeaders(request, env),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })
  return new Response(response.body, {
    status: response.status,
    headers: stripProxyResponseHeaders(response.headers),
  })
}

async function getTemplate(request: Request, env: PagesFunctionEnv) {
  let templateUrl = new URL('/ssr-template.html', request.url)
  let response: Response | null = null

  for (let i = 0; i < 4; i += 1) {
    const templateRequest = new Request(templateUrl.toString(), request)
    response = await env.ASSETS.fetch(templateRequest)

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new Error(`SSR template redirect is missing location header: ${response.status}`)
      }

      templateUrl = new URL(location, templateUrl)
      continue
    }

    break
  }

  if (!response || !response.ok) {
    throw new Error(`SSR template fetch failed: ${response?.status} ${response?.statusText}`)
  }

  const template = await response.text()
  if (!template.includes('<!--app-html-->')) {
    throw new Error('SSR template is missing <!--app-html--> placeholder')
  }

  return template
}

function createStaticAssetRequest(request: Request, pathname: string) {
  if (isAssetRequest(pathname)) {
    return request
  }

  const assetPath = pathname === '/' ? '/index.html' : `${pathname}/index.html`
  return new Request(new URL(assetPath, request.url).toString(), request)
}

function createRedirectResponse(target: string, status: number) {
  const headers = new Headers({
    location: target,
  })
  applyBaseSecurityHeaders(headers)
  return new Response(null, {
    status,
    headers,
  })
}

export const onRequest = async (context: FunctionContext) => {
  const { request, env } = context

  try {
    if (!env.MILET_SOURCE_GUARD_TOKEN) {
      return new Response('Source guard token is not configured', { status: 500 })
    }

    const url = new URL(request.url)
    const pathname = normalizeUrl(url.pathname)

    if (baiduVerificationPaths.has(pathname)) {
      return withSecurityHeaders(new Response(baiduVerificationContent, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      }))
    }

    if (isAssetRequest(pathname)) {
      return withSecurityHeaders(await env.ASSETS.fetch(createStaticAssetRequest(request, pathname)))
    }

    if (pathname === '/') {
      return createRedirectResponse(`/${resolvePreferredLang(request)}`, 302)
    }

    const shortLinkRedirect = buildShortLinkRedirect(pathname, request)
    if (shortLinkRedirect) {
      return createRedirectResponse(shortLinkRedirect, 302)
    }

    const barePathRedirect = buildBarePathRedirect(pathname, request)
    if (barePathRedirect) {
      return createRedirectResponse(barePathRedirect, 302)
    }

    if (pathname.startsWith('/api/')) {
      return proxyApiRequest(request, env)
    }
    if (pathname.startsWith('/other/')) {
      //特殊处理的请求，例如二维码等
      return proxyOtherRequest(request, env)
    }

    if (isSsgRoute(pathname)) {
      const staticAssetResponse = await env.ASSETS.fetch(
        createStaticAssetRequest(request, pathname),
      )
      if (staticAssetResponse.ok) {
        return withSecurityHeaders(staticAssetResponse, true)
      }
    }

    const { render } = await import('../dist/server/entry-server.js')
    const rendered = await render(`${pathname}${url.search}`, {
      headers: Object.fromEntries(request.headers.entries()),
    })
    const template = await getTemplate(request, env)
    const html = injectHtml(template, rendered)

    return new Response(html, {
      status: rendered.status || 200,
      headers: buildHtmlResponseHeaders(pathname),
    })
  } catch (error) {
    const errorText = error instanceof Error ? error.stack || error.message : String(error)
    console.error('pages function render failed', {
      url: request.url,
      error: errorText,
    })

    return withSecurityHeaders(new Response('Internal Server Error', {
      status: 500,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    }))
  }
}
