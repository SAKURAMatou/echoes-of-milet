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
import type {
  SiteInteractionCoordinator,
  SiteNavigationDirection,
} from '@/composables/site-interaction'
import { resolveInteractionPreset } from '@/composables/site-interaction'
import { routes } from './routes'

function sameRouteContext(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  return Boolean(to.name && to.name === from.name && to.fullPath !== from.fullPath)
}

function isLanguageReplace(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  if (!to.name || to.name !== from.name) return false
  const toParams = { ...to.params }
  const fromParams = { ...from.params }
  delete toParams.lang
  delete fromParams.lang
  return (
    String(to.params.lang || '') !== String(from.params.lang || '') &&
    JSON.stringify(toParams) === JSON.stringify(fromParams) &&
    JSON.stringify(to.query) === JSON.stringify(from.query) &&
    to.hash === from.hash
  )
}

export function resolveSiteNavigationDirection(options: {
  historyDirection: 'forward' | 'back' | 'unknown'
  historyNavigation: boolean
  languageReplace: boolean
}): SiteNavigationDirection {
  if (options.languageReplace) return 'replace'
  if (options.historyNavigation) return options.historyDirection
  return 'forward'
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
  interactionCoordinator?: SiteInteractionCoordinator,
) {
  const generationByRoute = new WeakMap<object, number>()
  const historyNavigationByGeneration = new Map<number, boolean>()
  const interactionGenerationByRoute = new WeakMap<object, number>()

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
    router.beforeEach((to, from) => {
      const start = browserHistoryManager.beginNavigation()
      const generationId = scrollCoordinator.beginNavigation({
        fromEntryKey: start.fromEntryKey,
        isHistoryNavigation: start.isHistoryNavigation,
        redirected: Boolean(to.redirectedFrom),
      })
      generationByRoute.set(to, generationId)
      interactionGenerationByRoute.set(to, generationId)
      interactionCoordinator?.beginNavigation(generationId, {
        direction: resolveSiteNavigationDirection({
          historyDirection: start.historyDirection,
          historyNavigation: start.isHistoryNavigation,
          languageReplace: isLanguageReplace(to, from),
        }),
        preset: resolveInteractionPreset(to.meta.interactionPreset),
        routeKey: to.fullPath,
      })
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
        interactionCoordinator?.abortNavigation(generationId)
        historyNavigationByGeneration.delete(generationId)
        return
      }

      const historyNavigation = historyNavigationByGeneration.get(generationId) || false
      const entryKey = browserHistoryManager.ensureCurrentTargetEntryKey({ historyNavigation })
      browserHistoryManager.commitActiveEntryKey(entryKey)
      scrollCoordinator.confirmNavigation(generationId, entryKey)
      void nextTick(() => {
        interactionCoordinator?.confirmNavigation(generationId, {
          preset: resolveInteractionPreset(to.meta.interactionPreset),
          routeKey: to.fullPath,
        })
      })

      if (from.matched.length > 0) {
        void nextTick(() => scrollCoordinator.closeNavigationRegistrationWindow(generationId))
      }
      historyNavigationByGeneration.delete(generationId)
    })

    router.onError((_error, to) => {
      const generationId = generationByRoute.get(to)
      if (!generationId) return
      scrollCoordinator.abortNavigation(generationId)
      interactionCoordinator?.abortNavigation(generationId)
      historyNavigationByGeneration.delete(generationId)
    })
  }

  return router
}
