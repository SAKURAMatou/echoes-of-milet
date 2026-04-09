import { loadEnv } from 'vite'
import { readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()
const isProd = process.env.NODE_ENV === 'production'
const mode = isProd ? 'production' : 'development'
const env = loadEnv(mode, root, '')
const port = Number(process.env.PORT || 5173)
const publicSiteOrigin = process.env.PUBLIC_SITE_ORIGIN || env.VITE_PUBLIC_SITE_ORIGIN || `http://localhost:${port}`
const upstreamOrigin = process.env.API_ORIGIN || env.VITE_BASE_API_URI || 'https://api.miles-dml.org'
const ssgRoutes = new Set(['/', '/milet/about'])

const mimeTypes: Record<string, string> = {
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

function isViteDevRequest(url = '/') {
  const pathname = normalizeUrl(url)

  return (
    pathname.startsWith('/@vite/') ||
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/__vite_') ||
    pathname === '/favicon.ico' ||
    isAssetRequest(pathname)
  )
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

function resolveRequestOrigin(req: http.IncomingMessage) {
  const protocol = req.headers['x-forwarded-proto'] || (isProd ? 'https' : 'http')
  const host = req.headers.host

  if (host) {
    return `${protocol}://${host}`
  }

  return publicSiteOrigin
}

function buildProxyResponseHeaders(response: Response) {
  const responseHeaders: Record<string, string> = {}

  for (const [key, value] of response.headers.entries()) {
    if (hopByHopResponseHeaders.has(key.toLowerCase())) {
      continue
    }

    responseHeaders[key] = value
  }

  return responseHeaders
}

async function proxyApiRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const targetUrl = new URL(req.url || '/', upstreamOrigin)
  const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')
  const requestOrigin = resolveRequestOrigin(req)
  const headers = {
    ...req.headers,
    host: targetUrl.host,
    origin: req.headers.origin || requestOrigin,
    referer: req.headers.referer || `${requestOrigin}/`,
    'accept-encoding': 'identity',
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': (req.headers['x-forwarded-proto'] || (isProd ? 'https' : 'http')).toString(),
    'x-forwarded-origin': requestOrigin,
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: bodyAllowed ? (req as any) : undefined,
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

async function serveFile(filePath: string, res: http.ServerResponse) {
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

async function resolveStaticFile(urlPath: string) {
  const distRoot = path.join(root, 'dist', 'client')
  const cleanPath = decodeURIComponent(normalizeUrl(urlPath))
  const preferredPaths = [
    path.join(distRoot, cleanPath),
    path.join(distRoot, cleanPath, 'index.html'),
    cleanPath === '/' ? path.join(distRoot, 'index.html') : null,
  ].filter(Boolean) as string[]

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

async function createRenderer() {
  if (!isProd) {
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: 'custom',
    })

    return { vite }
  }

  return {
    vite: null,
    template: await readFile(path.join(root, 'dist', 'client', '__ssr-template.html'), 'utf-8'),
    renderModuleUrl: pathToFileURL(path.join(root, 'dist', 'server', 'entry-server.js')).href,
  }
}

const renderer = await createRenderer()

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '/'

    if (url.startsWith('/api/')) {
      await proxyApiRequest(req, res)
      return
    }

    if (isProd) {
      const staticFile = await resolveStaticFile(url)
      if (staticFile && (isAssetRequest(url) || isSsgRoute(url))) {
        const served = await serveFile(staticFile, res)
        if (served) {
          return
        }
      }
    } else if (renderer.vite && isViteDevRequest(url)) {
      renderer.vite.middlewares(req, res, () => {
        res.writeHead(404)
        res.end('Not found')
      })
      return
    }

    let template: string
    let render: (url: string, request?: { headers?: Record<string, string | string[] | undefined> }) => Promise<any>

    if (!isProd && renderer.vite) {
      template = await readFile(path.join(root, 'index.html'), 'utf-8')
      template = await renderer.vite.transformIndexHtml(url, template)
      render = (await renderer.vite.ssrLoadModule('/src/entry-server.ts')).render
    } else {
      template = renderer.template
      render = (await import(renderer.renderModuleUrl)).render
    }

    const rendered = await render(url, { headers: req.headers as Record<string, string | string[] | undefined> })
    const html = injectHtml(template, rendered)

    res.writeHead(rendered.status || 200, {
      'Content-Type': 'text/html; charset=utf-8',
    })
    res.end(html)
  } catch (error) {
    if (!isProd && renderer.vite) {
      renderer.vite.ssrFixStacktrace(error as Error)
    }

    console.error(error)
    res.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`SSR server running at http://localhost:${port}`)
  console.log(`API upstream: ${upstreamOrigin}`)
  console.log(`Public origin: ${publicSiteOrigin}`)
})
