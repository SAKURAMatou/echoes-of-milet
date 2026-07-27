import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

import { resetPageScrollContainer, scrollToPageAnchor } from '@/composables/usePageAnchorScroll'
import type { PageScrollCoordinator } from '@/composables/page-scroll'
import { routes } from './routes'

export function createAppRouter(
  isServer = import.meta.env.SSR,
  _scrollCoordinator?: PageScrollCoordinator,
) {
  return createRouter({
    history: isServer
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }

      if (to.hash) {
        if (!isServer) {
          requestAnimationFrame(() => {
            scrollToPageAnchor(to.hash, { behavior: 'auto', history: 'none' })
          })
        }
        return false
      }

      if (!isServer) {
        requestAnimationFrame(resetPageScrollContainer)
      }
      return {
        top: 0,
        left: 0,
      }
    },
  })
}
