import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import renderConfig from '../render.config.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.PORT || 5173)
const publicSiteOrigin = process.env.PUBLIC_SITE_ORIGIN || `http://127.0.0.1:${port}`
const upstreamOrigin = process.env.API_ORIGIN || process.env.VITE_BASE_API_URI || 'http://127.0.0.1:8787'
const ssgRoutes = new Set(renderConfig.ssgRoutes)

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
  return ssgRoutes.has(normalizeUrl(url))
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

async function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.url || '/', upstreamOrigin)
  const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')
  const headers = {
    ...req.headers,
    host: targetUrl.host,
    origin: req.headers.origin || publicSiteOrigin,
    referer: req.headers.referer || `${publicSiteOrigin}/`,
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

const template = await readFile(path.join(root, 'dist', 'client', '__ssr-template.html'), 'utf-8')
const renderModuleUrl = pathToFileURL(path.join(root, 'dist', 'server', 'entry-server.js')).href
const { render } = await import(renderModuleUrl)

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '/'

    if (url.startsWith('/api/')) {
      await proxyApiRequest(req, res)
      return
    }

    const staticFile = await resolveStaticFile(url)
    if (staticFile && (isAssetRequest(url) || isSsgRoute(url))) {
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
