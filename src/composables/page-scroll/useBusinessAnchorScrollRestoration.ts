import type { Ref } from 'vue'

import type { ScrollSnapshot } from './pageScrollTypes'
import { usePageScrollRestoration } from './usePageScrollRestoration'
import { usePageScroll } from './usePageScrollController'

interface BusinessAnchorRestorationOptions {
  root: Ref<HTMLElement | null>
  capturePageState?: () => unknown
  prepare?: (snapshot: ScrollSnapshot, signal: AbortSignal) => Promise<void>
}

const ANCHOR_SELECTOR = '[data-page-scroll-anchor]'

export function useBusinessAnchorScrollRestoration(options: BusinessAnchorRestorationOptions) {
  const coordinator = usePageScroll()

  function anchorElements() {
    return Array.from(options.root.value?.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR) || [])
  }

  usePageScrollRestoration({
    capture() {
      const viewportTop = coordinator.state.viewportTop
      const captureLine = viewportTop + coordinator.state.viewportHeight * 0.32
      const elements = anchorElements()
      let anchor = elements[0] || null

      for (const element of elements) {
        if (element.getBoundingClientRect().top > captureLine) break
        anchor = element
      }

      const anchorId = anchor?.dataset.pageScrollAnchor
      return {
        top: coordinator.state.top,
        max: coordinator.state.max,
        capturedAt: Date.now(),
        anchor:
          anchor && anchorId
            ? {
                id: anchorId,
                offset: anchor.getBoundingClientRect().top - viewportTop,
              }
            : undefined,
        pageState: options.capturePageState?.(),
      }
    },
    async prepare(snapshot, signal) {
      await options.prepare?.(snapshot, signal)
    },
    restore(snapshot) {
      if (!snapshot.anchor) return false
      const target = anchorElements().find(
        (element) => element.dataset.pageScrollAnchor === snapshot.anchor?.id,
      )
      if (!target) return false

      const currentOffset = target.getBoundingClientRect().top - coordinator.state.viewportTop
      coordinator.scrollToPosition(coordinator.state.top + currentOffset - snapshot.anchor.offset, {
        behavior: 'auto',
      })
      return true
    },
  })
}
