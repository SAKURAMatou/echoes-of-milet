import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import renderConfig from '../render.config.json' with { type: 'json' }
import apiProxyConfig from '../api-proxy.config.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.PORT || 5173)
const developmentConfig = apiProxyConfig.origins.development
const publicSiteUrl = new URL(developmentConfig.site)
publicSiteUrl.port = String(port)
const publicSiteOrigin = publicSiteUrl.toString().replace(/\/$/, '')
const upstreamOrigin = developmentConfig.backend
const localizedSsgRoutes = new Set(renderConfig.ssgRoutes)
const allowedApiPrefixes = Object.values(apiProxyConfig.routes)

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

const hopByHopResponseHeaders = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

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
  return localizedSsgRoutes.has(normalizeUrl(url))
}

function normalizeLang(value) {
  if (!value) {
    return null
  }

  const lowerValue = String(value).toLowerCase()

  if (lowerValue === 'zh' || lowerValue.startsWith('zh-')) {
    return 'zh'
  }

  if (lowerValue === 'jp' || lowerValue === 'ja' || lowerValue.startsWith('ja-') || lowerValue.includes('jp')) {
    return 'jp'
  }

  return null
}

function parseCookieLang(cookieHeader) {
  if (!cookieHeader) {
    return null
  }

  const matched = String(cookieHeader).match(/(?:^|;\s*)lang=([^;]+)/i)
  return normalizeLang(matched?.[1] ? decodeURIComponent(matched[1]) : null)
}

function resolveRequestLang(req, requestUrl) {
  const queryLang = normalizeLang(requestUrl.searchParams.get('lang'))
  if (queryLang) {
    return queryLang
  }

  const cookieLang = parseCookieLang(req.headers.cookie)
  if (cookieLang) {
    return cookieLang
  }

  return normalizeLang(req.headers['accept-language']) ?? 'zh'
}

function injectHtml(template, payload) {
  return template
    .replace('__HTML_LANG__', payload.htmlLang)
    .replace('<!--app-head-->', payload.headTags)
    .replace('<!--app-html-->', payload.appHtml)
    .replace(
      '<!--app-state-->',
      `<script>window.__INITIAL_STATE__=${JSON.stringify(payload.initialState).replace(/</g, '\\u003c')}</script>`,
    )
}

function buildProxyResponseHeaders(response) {
  const responseHeaders = {}

  for (const [key, value] of response.headers.entries()) {
    if (hopByHopResponseHeaders.has(key.toLowerCase())) {
      continue
    }

    responseHeaders[key] = value
  }

  return responseHeaders
}

function isAllowedApiPath(pathname = '/') {
  return allowedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

async function proxyApiRequest(req, res) {
  const requestUrl = new URL(req.url || '/', publicSiteOrigin)
  if (!isAllowedApiPath(requestUrl.pathname)) {
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Forbidden')
    return
  }

  const targetUrl = new URL(requestUrl.pathname + requestUrl.search, upstreamOrigin)
  const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')
  const headers = {
    ...req.headers,
    host: targetUrl.host,
    origin: publicSiteOrigin,
    referer: `${publicSiteOrigin}/`,
    'accept-encoding': 'identity',
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': 'http',
    'x-forwarded-origin': publicSiteOrigin,
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: bodyAllowed ? req : undefined,
    duplex: bodyAllowed ? 'half' : undefined,
  })

  res.writeHead(response.status, buildProxyResponseHeaders(response))

  if (response.body) {
    for await (const chunk of response.body) {
      res.write(chunk)
    }
  }

  res.end()
}

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    })
    res.end(content)
    return true
  } catch {
    return false
  }
}

async function resolveStaticFile(urlPath) {
  const distRoot = path.join(root, 'dist', 'client')
  const cleanPath = decodeURIComponent(normalizeUrl(urlPath))
  const relativePath = cleanPath.replace(/^\/+/, '')
  const preferredPaths = [
    path.join(distRoot, relativePath),
    path.join(distRoot, relativePath, 'index.html'),
    cleanPath === '/' ? path.join(distRoot, 'index.html') : null,
  ].filter(Boolean)

  for (const candidate of preferredPaths) {
    try {
      const fileStat = await stat(candidate)
      if (fileStat.isFile()) {
        return candidate
      }
    } catch {
      // ignore
    }
  }

  return null
}

async function resolveLocalizedSsgFile(urlPath, lang) {
  const distRoot = path.join(root, 'dist', 'client')
  const cleanPath = decodeURIComponent(normalizeUrl(urlPath))
  const relativeRoute = cleanPath === '/' ? '' : cleanPath.replace(/^\/+/, '')
  const candidate = path.join(distRoot, '_localized', lang, relativeRoute, 'index.html')

  try {
    const fileStat = await stat(candidate)
    if (fileStat.isFile()) {
      return candidate
    }
  } catch {
    return null
  }

  return null
}

const template = await readFile(path.join(root, 'dist', 'client', 'ssr-template.html'), 'utf-8')
const renderModuleUrl = pathToFileURL(path.join(root, 'dist', 'server', 'entry-server.js')).href
const { render } = await import(renderModuleUrl)

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '/'

    if (url.startsWith('/api/')) {
      await proxyApiRequest(req, res)
      return
    }

    const requestUrl = new URL(url, publicSiteOrigin)

    if (isSsgRoute(url)) {
      const localizedSsgFile = await resolveLocalizedSsgFile(
        requestUrl.pathname,
        resolveRequestLang(req, requestUrl),
      )
      if (localizedSsgFile) {
        const served = await serveFile(localizedSsgFile, res)
        if (served) {
          return
        }
      }
    }

    const staticFile = await resolveStaticFile(url)
    if (staticFile && isAssetRequest(url)) {
      const served = await serveFile(staticFile, res)
      if (served) {
        return
      }
    }

    const rendered = await render(url, {
      headers: req.headers,
    })
    const html = injectHtml(template, rendered)

    res.writeHead(rendered.status || 200, {
      'Content-Type': 'text/html; charset=utf-8',
    })
    res.end(html)
  } catch (error) {
    console.error(error)
    res.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Internal Server Error')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Local SSR verify server ready on http://127.0.0.1:${port}`)
  console.log(`API upstream: ${upstreamOrigin}`)
  console.log(`Public origin: ${publicSiteOrigin}`)
})
