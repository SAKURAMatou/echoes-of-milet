import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const compileScript = path.join(root, 'scripts', 'compile-server.mjs')
const compiledServer = path.join(root, '.ssr-runtime', 'server.mjs')
const mode = process.argv[2] || 'production'

function runNode(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: 'inherit',
      env,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`command failed with code ${code}`))
      }
    })
  })
}

const runtimeEnv = { ...process.env, NODE_ENV: 'production' }

if (mode === 'preview-local') {
  runtimeEnv.API_ORIGIN = runtimeEnv.API_ORIGIN || 'http://localhost:8787'
  runtimeEnv.PUBLIC_SITE_ORIGIN = runtimeEnv.PUBLIC_SITE_ORIGIN || 'http://localhost:5173'
}

await runNode([compileScript], process.env)
await runNode([compiledServer], runtimeEnv)
