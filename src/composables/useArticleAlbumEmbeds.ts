import { createApp, nextTick, type App } from 'vue'
import VueLazyLoad from 'vue3-lazyload'
import loadingImg from '@/assets/loading.gif'

type MountedAlbumApp = {
  app: App
  host: HTMLElement
}

function normalizeBoolean(value: string | null, fallback: boolean) {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function normalizeLayout(value: string | null): 'detail' | 'compact' {
  return value === 'compact' ? 'compact' : 'detail'
}

export function useArticleAlbumEmbeds() {
  const mountedApps: MountedAlbumApp[] = []

  function cleanup() {
    for (const item of mountedApps.splice(0)) {
      item.app.unmount()
      item.host.innerHTML = ''
    }
  }

  async function mount(container: HTMLElement | null, lang: 'zh' | 'ja') {
    cleanup()
    if (!container) return

    await nextTick()
    const hosts = Array.from(
      container.querySelectorAll<HTMLElement>('.milet-album-embed-host[data-type="milet-album-embed"]'),
    )
    if (hosts.length === 0) return

    const { default: MiletAlbumViewer } = await import('@/components/milet/gallery/MiletAlbumViewer.vue')
    for (const host of hosts) {
      const galleryId = host.dataset.galleryId || ''
      if (!/^gallery_(ALL|\d+)$/.test(galleryId)) continue

      host.innerHTML = ''
      const app = createApp(MiletAlbumViewer, {
        galleryId,
        embedded: true,
        layout: normalizeLayout(host.dataset.layout || null),
        showTip: normalizeBoolean(host.dataset.showTip || null, false),
        lang,
      })
      app.use(VueLazyLoad, {
        loading: loadingImg,
        error: './assets/default_images_list.svg',
      })
      app.mount(host)
      mountedApps.push({ app, host })
    }
  }

  return { mount, cleanup }
}
