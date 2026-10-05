import { build, preview } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const outDir = path.join(root, '.ssr-runtime', 'submission-webp-browser')
// Build the diagnostic entry using the application's production Vite/Worker configuration.
await build({
  root,
  publicDir: false,
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: { input: path.join(root, 'tests/browser/submission-webp.html') },
  },
})
const server = await preview({
  root,
  build: { outDir },
  preview: { host: '127.0.0.1', port: 4312, strictPort: true },
})
console.log('WebP diagnostic: http://127.0.0.1:4312/tests/browser/submission-webp.html')
console.log('No submission or R2 requests are made. Press Ctrl+C to stop.')
process.on('SIGINT', () => {
  server.httpServer.close()
  process.exit(0)
})
