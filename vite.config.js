import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_BASE_API_URI || 'https://api.miles-dml.org'
  const publicSiteOrigin = env.VITE_PUBLIC_SITE_ORIGIN || 'http://localhost:5173'

  return {
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              const requestOrigin = req.headers.origin || publicSiteOrigin
              const forwardedProto =
                req.headers['x-forwarded-proto'] ||
                (requestOrigin.startsWith('https://') ? 'https' : 'http')

              proxyReq.setHeader('Origin', requestOrigin)
              proxyReq.setHeader('Referer', req.headers.referer || `${requestOrigin}/`)
              proxyReq.setHeader('Accept-Encoding', 'identity')
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '')
              proxyReq.setHeader('X-Forwarded-Proto', forwardedProto)
              proxyReq.setHeader('X-Forwarded-Origin', requestOrigin)
            })
          },
        },
      },
    },
    ssr: {
      noExternal: ['vue3-lazyload'],
    },
  }
})
