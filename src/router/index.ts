import { nextTick } from 'vue'
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouterScrollBehavior,
} from 'vue-router'

import type {
  BrowserScrollHistoryManager,
  PageScrollCoordinator,
  PageScrollPolicy,
  ScrollNavigationIntent,
} from '@/composables/page-scroll'
import { routes } from './routes'

function sameRouteContext(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  return Boolean(to.name && to.name === from.name && to.fullPath !== from.fullPath)
}

function resolveScrollIntent(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  savedPosition: Awaited<ReturnType<RouterScrollBehavior>>,
  coordinator: PageScrollCoordinator,
): ScrollNavigationIntent {
  const explicitIntent = coordinator.consumeNextNavigationIntent()
  if (explicitIntent) return explicitIntent

  const policy: PageScrollPolicy = to.meta.scrollPolicy || 'top'
  if (policy === 'manual') return { kind: 'manual' }
  if (to.hash) return { kind: 'anchor', anchor: to.hash, behavior: 'auto' }
  if (savedPosition && policy === 'restore') return { kind: 'restore' }
  if (sameRouteContext(to, from)) return { kind: 'preserve' }
  if (policy === 'preserve') return { kind: 'preserve' }
  return { kind: 'top' }
}

export function createAppRouter(
  isServer = import.meta.env.SSR,
  scrollCoordinator: PageScrollCoordinator,
  browserHistoryManager?: BrowserScrollHistoryManager,
) {
  const generationByRoute = new WeakMap<object, number>()
  const historyNavigationByGeneration = new Map<number, boolean>()

  const router = createRouter({
    history: isServer
      ? createMemoryHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (isServer || !browserHistoryManager) return false

      const generationId = generationByRoute.get(to)
      if (!generationId) {
        if (to.hash) scrollCoordinator.scrollToAnchor(to.hash, { behavior: 'auto' })
        return false
      }

      scrollCoordinator.submitNavigationIntent(
        generationId,
        resolveScrollIntent(to, from, savedPosition, scrollCoordinator),
      )
      return false
    },
  })

  if (!isServer && browserHistoryManager) {
    router.beforeEach((to) => {
      const start = browserHistoryManager.beginNavigation()
      const generationId = scrollCoordinator.beginNavigation({
        fromEntryKey: start.fromEntryKey,
        isHistoryNavigation: start.isHistoryNavigation,
        redirected: Boolean(to.redirectedFrom),
      })
      generationByRoute.set(to, generationId)
      if (!historyNavigationByGeneration.has(generationId)) {
        historyNavigationByGeneration.set(generationId, start.isHistoryNavigation)
      }
      return true
    })

    router.afterEach((to, from, failure) => {
      const generationId = generationByRoute.get(to)
      if (!generationId) return

      if (failure) {
        scrollCoordinator.abortNavigation(generationId)
        historyNavigationByGeneration.delete(generationId)
        return
      }

      const historyNavigation = historyNavigationByGeneration.get(generationId) || false
      const entryKey = browserHistoryManager.ensureCurrentTargetEntryKey({ historyNavigation })
      browserHistoryManager.commitActiveEntryKey(entryKey)
      scrollCoordinator.confirmNavigation(generationId, entryKey)

      if (from.matched.length > 0) {
        void nextTick(() => scrollCoordinator.closeNavigationRegistrationWindow(generationId))
      }
      historyNavigationByGeneration.delete(generationId)
    })

    router.onError((_error, to) => {
      const generationId = generationByRoute.get(to)
      if (!generationId) return
      scrollCoordinator.abortNavigation(generationId)
      historyNavigationByGeneration.delete(generationId)
    })
  }

  return router
}
