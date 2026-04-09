import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const inputFile = path.join(root, 'server.ts')
const outputDir = path.join(root, '.ssr-runtime')
const outputFile = path.join(outputDir, 'server.mjs')

const source = await readFile(inputFile, 'utf8')
const result = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2020,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: inputFile,
})

await mkdir(outputDir, { recursive: true })
await writeFile(outputFile, result.outputText, 'utf8')
console.log(`[compile-server] wrote ${path.relative(root, outputFile)}`)
