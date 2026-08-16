import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import apiProxyConfig from './api-proxy.config.json' with { type: 'json' }
import { json } from 'node:stream/consumers'

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

export default defineConfig(({ mode }) => {
  const runtimeConfig = apiProxyConfig.origins[mode] || apiProxyConfig.origins.production
  const apiOrigin = runtimeConfig.backend
  const publicSiteOrigin = runtimeConfig.site
  const env = loadEnv(mode, process.cwd(), '')
  // const imageProxyMode = env.MILET_DEV_IMAGE_PROXY_MODE === 'worker' ? 'worker' : 'site'
  // const imageTarget =
  //   env.MILET_DEV_IMAGE_TARGET ||
  //   (imageProxyMode === 'worker'
  //     ? runtimeConfig.backend
  //     : apiProxyConfig.origins.production.site)
  const imageTarget = apiProxyConfig.origins.production.backend
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

              const bodyAllowed = !['GET', 'HEAD'].includes(req.method || 'GET')
              const targetUrl = new URL(requestUrl.pathname + requestUrl.search, apiOrigin)
              const response = await fetch(targetUrl, {
                method: req.method,
                headers: {
                  ...req.headers,
                  host: targetUrl.host,
                  origin: publicSiteOrigin,
                  referer: `${publicSiteOrigin}/`,
                  'accept-encoding': 'identity',
                  'x-forwarded-host': req.headers.host || '',
                  'x-forwarded-proto': publicSiteOrigin.startsWith('https://') ? 'https' : 'http',
                  'x-forwarded-origin': publicSiteOrigin,
                  'X-Milet-Source-Token': env.MILET_SOURCE_GUARD_TOKEN || '',
                },
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
    server: {
      proxy: {
        '^/static/(?:milet|blog)/(?:img|img-preview)/': {
          target: imageTarget,
          changeOrigin: true,
          headers: env.MILET_SOURCE_GUARD_TOKEN
            ? {
                'X-Milet-Source-Token': env.MILET_SOURCE_GUARD_TOKEN,
              }
            : undefined,
        },
      },
    },
  }
})
