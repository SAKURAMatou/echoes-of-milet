import { isNavigationFailure, useRouter } from 'vue-router'

import { usePageScroll } from './page-scroll'

export type AnchorHistoryMode = 'none' | 'push' | 'replace'

export interface PageAnchorScrollOptions {
  behavior?: ScrollBehavior
  history?: AnchorHistoryMode
  focus?: boolean
}

function resolveHash(anchor: string | HTMLElement) {
  if (typeof HTMLElement !== 'undefined' && anchor instanceof HTMLElement) {
    return anchor.id ? `#${encodeURIComponent(anchor.id)}` : ''
  }
  if (typeof anchor !== 'string' || !anchor) return ''
  return anchor.startsWith('#') ? anchor : `#${anchor}`
}

export function usePageAnchorScroll() {
  const router = useRouter()
  const coordinator = usePageScroll()

  async function scrollToPageAnchor(
    anchor: string | HTMLElement,
    options: PageAnchorScrollOptions = {},
  ) {
    if (typeof window === 'undefined') return false

    const { behavior = 'smooth', history = 'push', focus = false } = options
    const hash = resolveHash(anchor)
    if (!hash && typeof anchor === 'string') return false

    if (history === 'none' || !hash) {
      return coordinator.scrollToAnchor(anchor, { behavior, focus })
    }

    const currentRoute = router.currentRoute.value
    const targetLocation = router.resolve({
      path: currentRoute.path,
      query: currentRoute.query,
      hash,
    })

    if (targetLocation.fullPath === currentRoute.fullPath) {
      coordinator.setNextNavigationIntent({ kind: 'anchor', anchor: hash, behavior })
      const didScroll = coordinator.scrollToAnchor(anchor, { behavior, focus })
      coordinator.consumeNextNavigationIntent()
      return didScroll
    }

    coordinator.setNextNavigationIntent({ kind: 'anchor', anchor: hash, behavior })
    const failure = await router[history]({
      path: currentRoute.path,
      query: currentRoute.query,
      hash,
    })

    if (isNavigationFailure(failure)) {
      coordinator.consumeNextNavigationIntent()
      return false
    }
    return true
  }

  return { scrollToPageAnchor }
}
