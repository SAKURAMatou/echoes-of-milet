import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js')
const install = process.argv.includes('--install')
const args = install
  ? ['install', 'webkit']
  : ['test', '--config', 'tests/browser/playwright-webkit.config.mjs']
const child = spawn(process.execPath, [cli, ...args], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: path.join(root, '.ssr-runtime', 'playwright-browsers'),
  },
})
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('exit', (code) => {
  process.exitCode = code ?? 1
})
