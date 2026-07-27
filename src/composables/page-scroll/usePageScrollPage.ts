import { onBeforeUnmount } from 'vue'

import { usePageScroll } from './usePageScrollController'

export function usePageScrollPage() {
  const coordinator = usePageScroll()
  const pendingReleases = new Set<() => void>()

  onBeforeUnmount(() => {
    pendingReleases.forEach((release) => release())
    pendingReleases.clear()
  })

  return {
    markScrollContentPending(owner?: string) {
      const releaseToken = coordinator.markScrollContentPending(owner)
      let active = true
      const release = () => {
        if (!active) return
        active = false
        pendingReleases.delete(release)
        releaseToken()
      }
      pendingReleases.add(release)
      return release
    },
  }
}
