import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

let server, Panel, texts, assets, gallery, live
before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../../', import.meta.url)),
    plugins: [vue()],
    optimizeDeps: { noDiscovery: true, include: [] },
    resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
    server: { middlewareMode: true },
    appType: 'custom',
  })
  Panel = (await server.ssrLoadModule('/src/components/milet/pilgrimage/PilgrimageSpotDetailPanel.vue')).default
  texts = (await server.ssrLoadModule('/src/composables/miletPilgrimage.ts')).PILGRIMAGE_TEXT
  assets = await server.ssrLoadModule('/src/config/api.ts')
  gallery = await server.ssrLoadModule('/src/composables/miletGalleryPage.ts')
  live = await server.ssrLoadModule('/src/composables/liveArchive.ts')
})
after(async () => { await server?.close() })

function renderDetail(lang, updates = {}) {
  return renderToString(createSSRApp({ render: () => h(Panel, {
    lang, pageText: texts[lang], navigationUrl: 'https://maps.google.com/?q=35,139',
    galleryName: 'pilgrimage-test', spotsLoading: false, spotDetailLoading: false, spotDetailError: false,
    selectedSpotDetail: { id: 'spot', title: 'milet', category: 'MV', workTitle: 'Walk', address: 'Tokyo', description: 'Location record', tags: [], coverImageUrl: '', photos: [], ...updates },
  }) }))
}

for (const lang of ['zh', 'jp']) {
  test(`SSR keeps location information and navigation with an empty album (${lang})`, async () => {
    const html = await renderDetail(lang)
    assert.ok(html.includes(texts[lang].emptyPhotos))
    assert.ok(html.includes('Location record'))
    assert.ok(html.includes('maps.google.com'))
    assert.ok(!html.includes('src=""'))
    assert.ok(!html.includes('data-fancybox='))
  })
}

test('legacy missing photos are treated as an empty gallery', async () => {
  const html = await renderDetail('zh', { photos: undefined, coverImageUrl: undefined })
  assert.ok(html.includes(texts.zh.emptyPhotos))
  assert.ok(!html.includes('src=""'))
})

test('SSR preserves blog bucket URLs for cover, thumbnail, original and download', async () => {
  const html = await renderDetail('jp', { photos: [{ id: '1', thumbUrl: '/static/blog/img/preview/photo.webp', fullUrl: '/static/blog/img/diary/photo.jpg', downloadUrl: '/static/blog/img/diary/photo.jpg?download=true', caption: 'milet', alt: 'milet' }] })
  assert.ok(html.includes('src="/static/blog/img/preview/photo.webp"'))
  assert.ok(html.includes('href="/static/blog/img/diary/photo.jpg"'))
  assert.ok(html.includes('data-download-src="/static/blog/img/diary/photo.jpg?download=true"'))
  assert.ok(!html.includes(texts.jp.emptyPhotos))
  assert.ok(!html.includes('/static/milet/img/'))
})

test('legacy gallery photos honor type, storage and access route independently', () => {
  for (const metadata of [{ img_type: 'B' }, { storage: 'blog' }, { access_route: '/static/blog/img/' }]) {
    const image = gallery.normalizeGalleryImageSources({ link: 'diary/photo.jpg', prelink: 'preview/photo.webp', ...metadata })
    assert.equal(image.link, '/static/blog/img/diary/photo.jpg')
    assert.equal(image.prelink, '/static/blog/img/preview/photo.webp')
    assert.equal(image.previewLink, '/static/blog/img-preview/diary/photo.jpg')
  }
  assert.equal(gallery.normalizeGalleryImageSources({ link: 'spot/photo.jpg', prelink: '', img_type: 'S' }).link, '/static/milet/img/spot/photo.jpg')
})

test('blog preview pages infer the bucket from full paths and keep query parameters', () => {
  assert.equal(assets.buildStaticAssetPreviewUrl('/static/blog/img/diary/photo.jpg?size=2#image'), '/static/blog/img-preview/diary/photo.jpg?size=2#image')
  assert.equal(assets.buildStaticAssetPreviewUrl('diary/photo.jpg', 'blog'), '/static/blog/img-preview/diary/photo.jpg')
})

test('downloads preserve existing queries and hashes without duplicate flags', () => {
  assert.equal(assets.buildStaticAssetDownloadUrl('/static/blog/img/photo.jpg?size=2&download=false#image'), '/static/blog/img/photo.jpg?size=2&download=true#image')
  assert.equal(assets.buildStaticAssetDownloadUrl('/static/milet/img/photo.jpg?download=true'), '/static/milet/img/photo.jpg?download=true')
  assert.equal(assets.buildStaticAssetDownloadUrl('https://example.com/photo.jpg?q=1'), 'https://example.com/photo.jpg?q=1&download=true')
  assert.equal(assets.buildStaticAssetDownloadUrl(undefined), '')
})

test('legacy live visuals honor bucket metadata and do not treat a route prefix as an image', () => {
  assert.equal(live.resolveLiveImageUrl({ prelink: 'preview/live.webp', storage: 'blog' }), '/static/blog/img/preview/live.webp')
  assert.equal(live.resolveLiveImageUrl({ link: 'live/photo.jpg', accessRoute: '/static/blog/img/' }), '/static/blog/img/live/photo.jpg')
  assert.equal(live.resolveLiveImageUrl({ link: 'live/photo.jpg', imgType: 'B' }), '/static/blog/img/live/photo.jpg')
  assert.equal(live.resolveLiveImageUrl({ accessRoute: '/static/blog/img/' }), '')
})
