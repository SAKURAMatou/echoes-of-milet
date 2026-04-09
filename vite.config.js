import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

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
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_BASE_API_URI || 'https://api.miles-dml.org'
  const publicSiteOrigin = env.VITE_PUBLIC_SITE_ORIGIN || 'http://localhost:5173'

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
              const requestUrl = new URL(req.url || '/', publicSiteOrigin)

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
  }
})
