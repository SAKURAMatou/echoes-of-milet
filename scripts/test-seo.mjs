import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({
  root,
  configFile: false,
  plugins: [vue()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})

try {
  const { renderSeoTags } = await server.ssrLoadModule('/src/server/seo.ts')
  const { pageSeoOptions, pageDataUnavailable } =
    await server.ssrLoadModule('/src/server/page-seo.ts')
  const { createInitialState } = await server.ssrLoadModule('/src/composables/useAppState.ts')
  const canonical = (html) => html.match(/rel="canonical" href="([^"]+)"/)?.[1]
  const title = (html) => html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]
  for (const lang of ['zh', 'ja']) {
    for (const [key, route] of [
      ['news', 'news'],
      ['release', 'release'],
      ['galleryDetail', 'galleryDetail/gallery_38'],
      ['timeline', 'timeline'],
    ]) {
      const html = renderSeoTags(key, lang, { path: `/${lang}/milet/${route}?tracking=1` })
      assert.ok(canonical(html).endsWith(`/${lang}/milet/${route}`))
      assert.equal((html.match(/data-milet-seo rel="alternate"/g) || []).length, 3)
    }
  }
  const archive = renderSeoTags('anniversary', 'zh', { path: '/zh/milet/anniversary' })
  const year = renderSeoTags('anniversary', 'zh', { path: '/zh/milet/anniversary/2026' })
  assert.notEqual(title(archive), title(year))
  assert.notEqual(canonical(archive), canonical(year))
  const article = {
    slug: 'sample',
    title: 'A < B "quoted"',
    summary: '',
    html: '<script>secret()</script><p>真实正文 &amp; 摘要</p>',
    requestedLang: 'ja',
    lang: 'zh',
    fallbackLang: 'zh',
    i18nEnabled: true,
  }
  const fallback = renderSeoTags('article', 'ja', { path: '/ja/milet/articles/sample', article })
  assert.ok(canonical(fallback).endsWith('/zh/milet/articles/sample'))
  assert.ok(!fallback.includes('hreflang='))
  assert.ok(fallback.includes('&lt; B &quot;quoted&quot;'))
  assert.ok(!fallback.includes('secret()'))
  assert.ok(fallback.includes('"inLanguage":"zh-CN"'))
  assert.ok(fallback.includes('property="og:locale" content="zh_CN"'))
  const state = createInitialState({ miletArticleData: article })
  assert.equal(pageSeoOptions('/zh/milet/news', state).article, null)
  assert.equal(pageSeoOptions('/ja/milet/articles/another', state).article, null)
  assert.match(
    renderSeoTags(undefined, 'zh', { path: '/zh/milet/interactive/song-guess' }),
    /noindex/,
  )
  state.miletNewsPageData = {
    key: 'zh',
    payload: { items: [], topics: [], hasMore: false, error: 'temporary failure' },
  }
  assert.equal(pageDataUnavailable('/zh/milet/news', state), true)
  assert.equal(Boolean(pageDataUnavailable('/ja/milet/news', state)), false)

  // Exercise the actual Vue SSR path with deterministic API fixtures, never the network.
  const axios = (await server.ssrLoadModule('/src/AxiosUtil.ts')).default
  let fail = false
  axios.get = async (url) => {
    if (fail) throw new Error('fixture unavailable')
    if (url.includes('/news/topics')) return { success: true, items: [] }
    if (url.includes('/news'))
      return {
        success: true,
        items: [
          {
            id: 1,
            title: 'SSR news fixture',
            url: 'https://example.org/news',
            publishDate: '2026-09-09',
            topic: 'News',
            summary: 'Fixture summary',
          },
        ],
        hasMore: false,
      }
    if (url.includes('/piclist/'))
      return {
        code: 200,
        maxPage: 2,
        data: [{ link: '/photo.webp', prelink: '/photo.webp', comment: 'SSR photo fixture' }],
      }
    if (url.includes('/release/type/'))
      return {
        data: [
          {
            id: url,
            title: 'SSR release fixture',
            artist: 'milet',
            releaseType: 'ALBUM',
            distributionType: 'PHYSICAL',
            releaseDate: '2026-09-09',
            editions: [],
          },
        ],
        total: 1,
      }
    if (url.includes('/live/events/'))
      return {
        event: { id: 1, slug: 'fixture', title: 'SSR live fixture', type: 'one_man' },
        performances: [],
        relatedArticles: [],
        relatedGalleries: [],
      }
    throw new Error(`Unexpected fixture URL: ${url}`)
  }
  const { render } = await server.ssrLoadModule('/src/server/render.ts')
  for (const [route, text] of [
    ['news', 'SSR news fixture'],
    ['release', 'SSR release fixture'],
    ['galleryDetail/gallery_38', 'SSR photo fixture'],
    ['live/fixture', 'SSR live fixture'],
  ]) {
    const result = await render(`/zh/milet/${route}`)
    assert.equal(result.status, 200, route)
    assert.ok(result.appHtml.includes(text), `${route} must contain server-rendered content`)
    assert.ok(
      !result.appHtml.includes('teleport start'),
      `${route} must not teleport to body before hydration`,
    )
    assert.doesNotThrow(() => JSON.stringify(result.initialState))
  }
  fail = true
  const originalError = console.error
  console.error = () => {}
  try {
    for (const route of ['news', 'release', 'galleryDetail/gallery_38']) {
      const result = await render(`/zh/milet/${route}`)
      assert.equal(
        result.status,
        503,
        `${route} must not return an indexable success for an API failure`,
      )
      assert.ok(JSON.stringify(result.initialState).includes('fixture unavailable'))
    }
  } finally {
    console.error = originalError
  }
  console.log('SEO and SSR regression checks passed.')
} finally {
  await server.close()
}
