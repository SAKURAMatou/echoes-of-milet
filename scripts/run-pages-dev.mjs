import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const mode = process.argv[2] || 'local'
const port = process.env.PORT || '8788'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const env = {
  ...process.env,
}

if (mode === 'local') {
  env.API_ORIGIN = env.API_ORIGIN || 'http://localhost:8787'
  env.PUBLIC_SITE_ORIGIN = env.PUBLIC_SITE_ORIGIN || `http://localhost:${port}`
  env.VITE_BASE_API_URI = env.VITE_BASE_API_URI || env.API_ORIGIN
  env.VITE_PUBLIC_SITE_ORIGIN = env.VITE_PUBLIC_SITE_ORIGIN || env.PUBLIC_SITE_ORIGIN
}

const args = [
  'wrangler',
  'pages',
  'dev',
  'dist/client',
  '--compatibility-date',
  '2026-04-09',
  '--functions',
  'functions',
  '--port',
  port,
]

const child = spawn(npxCommand, args, {
  cwd: root,
  stdio: 'inherit',
  env,
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})