import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const compileScript = path.join(root, 'scripts', 'compile-server.mjs')
const compiledServer = path.join(root, '.ssr-runtime', 'server.mjs')
const watchTargets = [
  path.join(root, 'server.ts'),
  path.join(root, '.env'),
  path.join(root, '.env.development'),
  path.join(root, 'vite.config.js'),
]

let serverProcess = null
let restarting = false
let restartTimer = null

function runCompile() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [compileScript], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`compile failed with code ${code}`))
      }
    })
  })
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve()
      return
    }

    const current = serverProcess
    serverProcess = null
    current.once('exit', () => resolve())
    current.kill('SIGTERM')
  })
}

function startServer() {
  serverProcess = spawn(process.execPath, [compiledServer], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  })

  serverProcess.on('exit', (code, signal) => {
    if (serverProcess && code !== 0 && signal !== 'SIGTERM') {
      console.error(`[dev:ssr] server exited with code ${code ?? 'null'}`)
    }
  })
}

async function restartServer() {
  if (restarting) {
    return
  }

  restarting = true
  try {
    await stopServer()
    await runCompile()
    startServer()
  } catch (error) {
    console.error('[dev:ssr] restart failed:', error)
  } finally {
    restarting = false
  }
}

function scheduleRestart() {
  if (restartTimer) {
    clearTimeout(restartTimer)
  }

  restartTimer = setTimeout(() => {
    restartTimer = null
    restartServer()
  }, 150)
}

await restartServer()

const watchers = watchTargets.map((target) =>
  watch(target, { persistent: true }, () => {
    console.log(`[dev:ssr] detected change: ${path.basename(target)}`)
    scheduleRestart()
  }),
)

function shutdown() {
  for (const watcher of watchers) {
    watcher.close()
  }

  stopServer().finally(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
