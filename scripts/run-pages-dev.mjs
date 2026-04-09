import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = process.env.PORT || '5173'
const env = {
  ...process.env,
  API_ORIGIN: process.env.API_ORIGIN || 'http://localhost:8787',
  PUBLIC_SITE_ORIGIN: process.env.PUBLIC_SITE_ORIGIN || `http://localhost:${port}`,
}

env.VITE_BASE_API_URI = env.VITE_BASE_API_URI || env.API_ORIGIN
env.VITE_PUBLIC_SITE_ORIGIN = env.VITE_PUBLIC_SITE_ORIGIN || env.PUBLIC_SITE_ORIGIN

const args = [
  'wrangler',
  'pages',
  'dev',
  'dist/client',
  '--compatibility-date',
  '2026-04-09',
  '--ip',
  '127.0.0.1',
  '--port',
  port,
]

const child =
  process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', 'npx', ...args], {
        cwd: root,
        stdio: 'inherit',
        env,
      })
    : spawn('npx', args, {
        cwd: root,
        stdio: 'inherit',
        env,
      })

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
