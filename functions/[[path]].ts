import apiProxyConfig from '../api-proxy.config.json'

interface FetcherLike {
  fetch(request: Request): Promise<Response>
}

interface PagesFunctionEnv {
  ASSETS: FetcherLike
}

interface FunctionContext {
  request: Request
  env: PagesFunctionEnv
}

const ssgRoutes = new Set(['/', '/milet/about'])
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

function getRequestOrigin(request: Request, env: PagesFunctionEnv) {
  const url = new URL(request.url)
  return url.origin
}

function buildProxyHeaders(request: Request, env: PagesFunctionEnv) {
  const requestOrigin = getRequestOrigin(request, env)
  const headers = new Headers(request.headers)
  headers.set('origin', requestOrigin || headers.get('origin'))
  headers.set('referer', headers.get('referer') || `${requestOrigin}/`)
  headers.set('accept-encoding', 'identity')
  headers.set('x-forwarded-host', new URL(request.url).host)
  headers.set('x-forwarded-proto', new URL(request.url).protocol.replace(':', ''))
  headers.set('x-forwarded-origin', requestOrigin)
  return headers
}

function stripProxyResponseHeaders(headers: Headers) {
  const cloned = new Headers(headers)
  ;['content-encoding', 'content-length', 'transfer-encoding', 'connection'].forEach((name) =>
    cloned.delete(name),
  )
  return cloned
}

function isAllowedApiPath(pathname: string) {
  return allowedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
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

export const onRequest = async (context: FunctionContext) => {
  const { request, env } = context

  try {
    const pathname = normalizeUrl(new URL(request.url).pathname)

    if (pathname.startsWith('/api/')) {
      return proxyApiRequest(request, env)
    }

    if (isAssetRequest(pathname)) {
      const staticAssetResponse = await env.ASSETS.fetch(
        createStaticAssetRequest(request, pathname),
      )
      return staticAssetResponse
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
    const rendered = await render(pathname, {
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
