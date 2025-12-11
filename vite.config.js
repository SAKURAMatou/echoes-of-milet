import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/apihost': {
        target: 'http://localhost:8787',
        changeOrigin: true, // 伪装成目标源的请求头 origin
        rewrite: (path) => path.replace(/^\/apihost/, ''), // 去掉路径中的 `/api` 前缀
      },
    },
  },
})
