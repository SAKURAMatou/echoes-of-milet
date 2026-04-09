interface FetcherLike {
  fetch(request: Request): Promise<Response>
}

interface PagesFunctionEnv {
  ASSETS: FetcherLike
  API_ORIGIN?: string
  PUBLIC_SITE_ORIGIN?: string
  VITE_BASE_API_URI?: string
  VITE_PUBLIC_SITE_ORIGIN?: string
}

interface FunctionContext {
  request: Request
  env: PagesFunctionEnv
}

const ssgRoutes = new Set(['/', '/milet/about'])

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

function injectHtml(template: string, payload: { htmlLang: string; headTags: string; appHtml: string; initialState: unknown }) {
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
  return env.PUBLIC_SITE_ORIGIN || env.VITE_PUBLIC_SITE_ORIGIN || url.origin
}

function buildProxyHeaders(request: Request, env: PagesFunctionEnv) {
  const requestOrigin = getRequestOrigin(request, env)
  const headers = new Headers(request.headers)
  headers.set('origin', headers.get('origin') || requestOrigin)
  headers.set('referer', headers.get('referer') || `${requestOrigin}/`)
  headers.set('accept-encoding', 'identity')
  headers.set('x-forwarded-host', new URL(request.url).host)
  headers.set('x-forwarded-proto', new URL(request.url).protocol.replace(':', ''))
  headers.set('x-forwarded-origin', requestOrigin)
  return headers
}

function stripProxyResponseHeaders(headers: Headers) {
  const cloned = new Headers(headers)
  ;['content-encoding', 'content-length', 'transfer-encoding', 'connection'].forEach((name) => cloned.delete(name))
  return cloned
}

async function proxyApiRequest(request: Request, env: PagesFunctionEnv) {
  const upstreamOrigin = env.API_ORIGIN || env.VITE_BASE_API_URI || 'https://api.miles-dml.org'
  const url = new URL(request.url)
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
  const templateRequest = new Request(new URL('/ssr-template.html', request.url).toString(), request)
  const response = await env.ASSETS.fetch(templateRequest)
  if (!response.ok) {
    throw new Error(`SSR template fetch failed: ${response.status} ${response.statusText}`)
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

    if (isAssetRequest(pathname) || isSsgRoute(pathname)) {
      const staticAssetResponse = await env.ASSETS.fetch(createStaticAssetRequest(request, pathname))
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
    console.error('pages function render failed', {
      url: request.url,
      error: error instanceof Error ? error.stack || error.message : String(error),
    })

    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    })
  }
}
