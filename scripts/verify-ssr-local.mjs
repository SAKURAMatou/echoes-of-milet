import { spawn } from 'node:child_process'
import { existsSync, readFileSync, watch } from 'node:fs'
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import renderConfig from '../render.config.json' with { type: 'json' }
import apiProxyConfig from '../api-proxy.config.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.PORT || 5173)
const watchMode = process.argv.includes('--watch')
const runtimeRoot = path.join(root, '.ssr-runtime', 'verify-ssr-local')
const developmentConfig = apiProxyConfig.origins.development
const productionConfig = apiProxyConfig.origins.production
const publicSiteUrl = new URL(developmentConfig.site)
publicSiteUrl.port = String(port)
const publicSiteOrigin = publicSiteUrl.toString().replace(/\/$/, '')
const proxyPublicSiteOrigin = productionConfig.site
const upstreamOrigin = productionConfig.backend
const localizedSsgRoutes = new Set(renderConfig.ssgRoutes)
const allowedApiPrefixes = Object.values(apiProxyConfig.routes)
const sourceGuardToken = loadSourceGuardToken()

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

  if (
    lowerValue === 'jp' ||
    lowerValue === 'ja' ||
    lowerValue.startsWith('ja-') ||
    lowerValue.includes('jp')
  ) {
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

function parseEnvValue(value = '') {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function loadEnvFiles() {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local']
  const shellEnvKeys = new Set(Object.keys(process.env))

  for (const file of envFiles) {
    const envPath = path.join(root, file)
    if (!existsSync(envPath)) {
      continue
    }

    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const matched = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!matched || shellEnvKeys.has(matched[1])) {
        continue
      }

      process.env[matched[1]] = parseEnvValue(matched[2])
    }
  }
}

function loadSourceGuardToken() {
  loadEnvFiles()
  return process.env.MILET_SOURCE_GUARD_TOKEN || ''
}

function headerEntries(rawHeaders = {}) {
  const entries = []

  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        entries.push([key, item])
      }
      continue
    }

    entries.push([key, value])
  }

  return entries
}

function getRequestOrigin() {
  return proxyPublicSiteOrigin
}

function buildProxyHeaders(req, targetUrl) {
  const requestOrigin = getRequestOrigin()
  const headers = new Headers(headerEntries(req.headers))
  headers.set('host', targetUrl.host)
  headers.set('origin', requestOrigin || headers.get('origin') || '')
  headers.set('referer', headers.get('referer') || `${requestOrigin}/`)
  headers.set('accept-encoding', 'identity')
  headers.set('x-forwarded-host', req.headers.host || '')
  headers.set('x-forwarded-proto', requestOrigin.startsWith('https://') ? 'https' : 'http')
  headers.set('x-forwarded-origin', requestOrigin)

  if (sourceGuardToken) {
    headers.set('X-Milet-Source-Token', sourceGuardToken)
  }

  return headers
}

function isPathUnder(pathname = '/', prefix = '/') {
  if (prefix.endsWith('/')) {
    return pathname.startsWith(prefix)
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isAllowedApiPath(pathname = '/') {
  return allowedApiPrefixes.some((prefix) => isPathUnder(pathname, prefix))
}

function resolveOtherTargetPath(pathname) {
  const key = pathname.replace(/^\/other\//, '')
  return apiProxyConfig.otherRquests?.[key] || null
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

  const otherTargetPath = requestUrl.pathname.startsWith('/other/')
    ? resolveOtherTargetPath(requestUrl.pathname)
    : null

  if (requestUrl.pathname.startsWith('/other/') && !otherTargetPath) {
    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    })
    res.end('Not Found')
    return
  }

  const targetPath = otherTargetPath || requestUrl.pathname
  const targetUrl = new URL(targetPath + requestUrl.search, upstreamOrigin)
  const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')

  const response = await fetch(targetUrl, {
    method: req.method,
    headers: buildProxyHeaders(req, targetUrl),
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

let runtime = await loadRuntime()
let isRebuilding = false
let pendingRebuild = false
const activeWatchers = []

async function loadRuntime() {
  const template = await readFile(path.join(root, 'dist', 'client', 'ssr-template.html'), 'utf-8')
  const runtimeId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const runtimeDir = path.join(runtimeRoot, runtimeId)
  await mkdir(runtimeRoot, { recursive: true })
  await cp(path.join(root, 'dist', 'server'), runtimeDir, { recursive: true })

  const renderModuleUrl = pathToFileURL(path.join(runtimeDir, 'entry-server.js')).href
  const { render } = await import(renderModuleUrl)
  return {
    render,
    template,
    runtimeDir,
    loadedAt: new Date(),
  }
}

async function cleanupRuntime(runtimeToRemove) {
  if (!runtimeToRemove?.runtimeDir) {
    return
  }

  try {
    await rm(runtimeToRemove.runtimeDir, { recursive: true, force: true })
  } catch {
    // keep serving; stale temp bundles are harmless and can be removed later
  }
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(command, ['run', 'build:ssr'], {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`SSR rebuild failed with exit code ${code}`))
    })
  })
}

async function rebuildRuntime(reason) {
  if (isRebuilding) {
    pendingRebuild = true
    return
  }

  isRebuilding = true
  console.log(`[ssr-watch] rebuilding because ${reason}`)

  try {
    await runBuild()
    const previousRuntime = runtime
    runtime = await loadRuntime()
    cleanupRuntime(previousRuntime)
    console.log(`[ssr-watch] deployed new SSR bundle at ${runtime.loadedAt.toLocaleTimeString()}`)
  } catch (error) {
    console.error('[ssr-watch] rebuild failed; keeping previous SSR bundle')
    console.error(error)
  } finally {
    isRebuilding = false
  }

  if (pendingRebuild) {
    pendingRebuild = false
    rebuildRuntime('additional changes arrived during rebuild')
  }
}

function startWatchMode() {
  const watchTargets = [
    path.join(root, 'src'),
    path.join(root, 'functions'),
    path.join(root, 'api-proxy.config.json'),
    path.join(root, 'render.config.json'),
    path.join(root, 'index.html'),
    path.join(root, 'vite.config.js'),
  ]
  let debounceTimer = null

  function scheduleRebuild(eventType, filename) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      rebuildRuntime(`${eventType}${filename ? ` ${filename}` : ''}`)
    }, 300)
  }

  for (const target of watchTargets) {
    if (!existsSync(target)) {
      continue
    }

    try {
      activeWatchers.push(watch(target, { recursive: true }, scheduleRebuild))
    } catch {
      activeWatchers.push(watch(target, scheduleRebuild))
    }
  }

  console.log('[ssr-watch] watching source files for hot deployment')
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || '/'

    if (url.startsWith('/api/') || url.startsWith('/other/')) {
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

    const rendered = await runtime.render(url, {
      headers: req.headers,
    })
    const html = injectHtml(runtime.template, rendered)

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
  console.log(`Local public origin: ${publicSiteOrigin}`)
  console.log(`Proxy public origin: ${proxyPublicSiteOrigin}`)
  console.log(`Source guard token: ${sourceGuardToken ? 'loaded' : 'not set'}`)

  if (watchMode) {
    startWatchMode()
  }
})
