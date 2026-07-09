import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import apiProxyConfig from './api-proxy.config.json' with { type: 'json' }

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
  'set-cookie',
])
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

function buildProxyResponseHeaders(response) {
  const responseHeaders = {}

  for (const [key, value] of response.headers.entries()) {
    if (hopByHopResponseHeaders.has(key.toLowerCase())) {
      continue
    }

    responseHeaders[key] = value
  }
  responseHeaders['x-content-type-options'] = 'nosniff'
  responseHeaders['referrer-policy'] = responseHeaders['referrer-policy'] || 'strict-origin-when-cross-origin'

  return responseHeaders
}

function buildProxyRequestHeaders(req, targetUrl, publicSiteOrigin, sourceToken) {
  const headers = {}
  for (const name of proxyRequestHeaderAllowList) {
    const value = req.headers[name]
    if (Array.isArray(value)) headers[name] = value.join(', ')
    else if (value) headers[name] = value
  }
  return {
    ...headers,
    host: targetUrl.host,
    origin: publicSiteOrigin,
    referer: `${publicSiteOrigin}/`,
    'accept-encoding': 'identity',
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': publicSiteOrigin.startsWith('https://') ? 'https' : 'http',
    'x-forwarded-origin': publicSiteOrigin,
    'X-Milet-Source-Token': sourceToken || '',
  }
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : value
}

function isCrossSiteWriteBlocked(req, requestUrl) {
  const method = req.method || 'GET'
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false
  if (firstHeader(req.headers['sec-fetch-site']) === 'cross-site') return true

  const origin = firstHeader(req.headers.origin)
  if (!origin) return false

  try {
    return new URL(origin).origin !== requestUrl.origin
  } catch {
    return true
  }
}

function writeForbidden(res, message = 'Forbidden') {
  res.writeHead(403, {
    'content-type': 'text/plain; charset=utf-8',
    'x-content-type-options': 'nosniff',
  })
  res.end(message)
}

export default defineConfig(({ mode }) => {
  const runtimeConfig = apiProxyConfig.origins[mode] || apiProxyConfig.origins.production
  const apiOrigin = runtimeConfig.backend
  const publicSiteOrigin = runtimeConfig.site
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      vueDevTools(),
      tailwindcss(),
      {
        name: 'api-proxy-guard',
        configureServer(server) {
          server.middlewares.use('/api', async (req, res, next) => {
            try {
              const relativePath = req.url?.startsWith('/') ? req.url : `/${req.url || ''}`
              const requestUrl = new URL(`/api${relativePath}`, publicSiteOrigin)
              if (isCrossSiteWriteBlocked(req, requestUrl)) {
                writeForbidden(res, 'Cross-site write requests are not allowed')
                return
              }

              const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')
              const targetUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin)
              const response = await fetch(targetUrl, {
                method: req.method,
                headers: buildProxyRequestHeaders(req, targetUrl, publicSiteOrigin, env.MILET_SOURCE_GUARD_TOKEN),
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
            } catch (error) {
              next(error)
            }
          })
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ssr: {
      noExternal: ['vue3-lazyload'],
    },
  }
})
