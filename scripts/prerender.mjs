import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const clientDist = path.join(root, 'dist', 'client')
const serverEntryUrl = pathToFileURL(path.join(root, 'dist', 'server', 'entry-server.js')).href

const routes = ['/', '/milet/about']
let template = await readFile(path.join(clientDist, 'index.html'), 'utf-8')
const { render } = await import(serverEntryUrl)

function injectHtml(html, payload) {
  return html
    .replace('__HTML_LANG__', payload.htmlLang)
    .replace('<!--app-head-->', payload.headTags)
    .replace('<!--app-html-->', payload.appHtml)
    .replace(
      '<!--app-state-->',
      `<script>window.__INITIAL_STATE__=${JSON.stringify(payload.initialState).replace(/</g, '\\u003c')}</script>`,
    )
}

await mkdir(clientDist, { recursive: true })
await writeFile(path.join(clientDist, '__ssr-template.html'), template)

for (const route of routes) {
  const rendered = await render(route)
  const filePath =
    route === '/'
      ? path.join(clientDist, 'index.html')
      : path.join(clientDist, route.replace(/^\//, ''), 'index.html')

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, injectHtml(template, rendered))
}
