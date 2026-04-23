import apiProxyConfig from '../api-proxy.config.json'
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

const ssgRoutes = new Set(['/zh', '/ja', '/zh/milet/about', '/ja/milet/about'])
const baiduVerificationContent = '3c345798cdedc5cdc0a388e198c65a32'
const baiduVerificationPaths = new Set([
  '/baidu_verify_codeva-HqQ4QBPDlh.html',
  '/baidu_verify_codeva-HqQ4QBPDlh',
])
const allowedApiPrefixes = Object.values(apiProxyConfig.routes) as string[]
const upstreamOrigin = apiProxyConfig.origins.production.backend

function normalizeUrl(url = '/') {
  const [pathname] = url.split('?')
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
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

function stripLangPrefix(pathname: string) {
  const stripped = normalizeUrl(pathname).replace(/^\/(?:zh|ja)(?=\/|$)/i, '')
  return stripped || '/'
}

function buildLegacyRedirect(url: URL) {
  const queryLang = normalizeLang(url.searchParams.get('lang'))
  if (!queryLang) {
    return null
  }

  const targetUrl = new URL(convertLegacyPath(stripLangPrefix(url.pathname), queryLang), url.origin)
  return targetUrl.toString()
}

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
  return apiProxyConfig.origins.production.site || url.origin
}

function buildProxyHeaders(request: Request, env: PagesFunctionEnv) {
  const requestOrigin = getRequestOrigin(request)
  const headers = new Headers(request.headers)
  headers.set('origin', requestOrigin || headers.get('origin'))
  headers.set('referer', headers.get('referer') || `${requestOrigin}/`)
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
  ;['content-encoding', 'content-length', 'transfer-encoding', 'connection'].forEach((name) =>
    cloned.delete(name),
  )
  return cloned
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

async function proxyApiRequest(request: Request, env: PagesFunctionEnv) {
  const url = new URL(request.url)
  if (!isAllowedApiPath(url.pathname)) {
    return new Response('Forbidden', {
      status: 403,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
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
async function proxyOtherRequest(request: Request) {
  const url = new URL(request.url)
  if (!isAllowedApiPath(url.pathname)) {
    return new Response('Forbidden', {
      status: 403,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
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
    headers: buildProxyHeaders(request, null),
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
  return new Response(null, {
    status,
    headers: {
      location: target,
    },
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
      return new Response(baiduVerificationContent, {
        status: 200,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      })
    }

    if (isAssetRequest(pathname)) {
      return env.ASSETS.fetch(createStaticAssetRequest(request, pathname))
    }

    const legacyRedirect = buildLegacyRedirect(url)
    if (legacyRedirect) {
      return createRedirectResponse(legacyRedirect, 301)
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
      return proxyOtherRequest(request)
    }

    if (isSsgRoute(pathname)) {
      const staticAssetResponse = await env.ASSETS.fetch(
        createStaticAssetRequest(request, pathname),
      )
      if (staticAssetResponse.ok) {
        return staticAssetResponse
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
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    const errorText = error instanceof Error ? error.stack || error.message : String(error)
    console.error('pages function render failed', {
      url: request.url,
      error: errorText,
    })

    const isPreviewHost = new URL(request.url).hostname.endsWith('.pages.dev')

    return new Response(isPreviewHost ? errorText : 'Internal Server Error', {
      status: 500,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  }
}
