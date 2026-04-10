import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import renderConfig from '../render.config.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const clientDist = path.join(root, 'dist', 'client')
const serverEntryUrl = pathToFileURL(path.join(root, 'dist', 'server', 'entry-server.js')).href

const routes = renderConfig.ssgRoutes
const localizedLangs = ['zh', 'jp']
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
await writeFile(path.join(clientDist, 'ssr-template.html'), template)

for (const route of routes) {
  for (const lang of localizedLangs) {
    const localizedRoute = `${route}${route.includes('?') ? '&' : '?'}lang=${lang}`
    const rendered = await render(localizedRoute)
    const routePath = route === '/' ? '' : route.replace(/^\//, '')
    const filePath = path.join(clientDist, '_localized', lang, routePath, 'index.html')

    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, injectHtml(template, rendered))
  }
}
