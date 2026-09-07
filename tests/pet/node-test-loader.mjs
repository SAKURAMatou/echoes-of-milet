import { existsSync, statSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))

function resolveFileOrDirectory(requested) {
  for (const candidate of [requested, `${requested}.ts`, `${requested}.js`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return pathToFileURL(candidate)
    }
  }
  if (existsSync(requested) && statSync(requested).isDirectory()) {
    for (const candidate of [
      join(requested, 'index.ts'),
      join(requested, 'index.js'),
      join(requested, 'index.mjs'),
    ]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        return pathToFileURL(candidate)
      }
    }
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const requested = resolvePath(join(repoRoot, 'src'), specifier.slice(2))
    const resolved = resolveFileOrDirectory(requested)
    if (resolved) return { shortCircuit: true, url: resolved.href }
  }
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL?.startsWith('file:')
  ) {
    const requested = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier)
    if (existsSync(requested) && statSync(requested).isFile()) {
      return { shortCircuit: true, url: pathToFileURL(requested).href }
    }
    const resolved = resolveFileOrDirectory(requested)
    if (resolved) return { shortCircuit: true, url: resolved.href }
  }
  return nextResolve(specifier, context)
}
