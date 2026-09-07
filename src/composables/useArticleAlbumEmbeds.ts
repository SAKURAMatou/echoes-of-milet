import { createApp, inject, nextTick, onScopeDispose, type App } from 'vue'
import VueLazyLoad from 'vue3-lazyload'
import loadingImg from '@/assets/loading.gif'
import { PetCoordinatorKey } from '@/composables/pet/petInjection'

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
  // Embedded apps are separate Vue roots, so pass down the host app's pet
  // coordinator instead of letting them create their own.
  const parentPetCoordinator = inject(PetCoordinatorKey)
  const mountedApps: MountedAlbumApp[] = []
  let generation = 0

  function cleanup() {
    generation += 1
    for (const item of mountedApps.splice(0)) {
      item.app.unmount()
      item.host.innerHTML = ''
    }
  }

  onScopeDispose(cleanup)

  async function mount(container: HTMLElement | null, lang: 'zh' | 'ja') {
    cleanup()
    const mountGeneration = generation
    if (!container) return

    await nextTick()
    if (mountGeneration !== generation || !container.isConnected) return

    const { default: MiletAlbumViewer } = await import('@/components/milet/gallery/MiletAlbumViewer.vue')
    if (mountGeneration !== generation || !container.isConnected) return

    const hosts = Array.from(
      container.querySelectorAll<HTMLElement>('.milet-album-embed-host[data-type="milet-album-embed"]'),
    )
    if (hosts.length === 0) return

    for (const host of hosts) {
      if (!host.isConnected || !container.contains(host)) continue

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
      if (parentPetCoordinator) {
        app.provide(PetCoordinatorKey, parentPetCoordinator)
      }
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
