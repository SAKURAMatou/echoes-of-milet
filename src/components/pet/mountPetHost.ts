import { createApp, type App as VueApp } from 'vue'
import type { Router } from 'vue-router'

import type { PageScrollCoordinator } from '@/composables/page-scroll'
import { PageScrollCoordinatorKey } from '@/composables/page-scroll'
import type { PetHostApi } from '@/composables/pet'
import { PetCoordinatorKey } from '@/composables/pet'
import type { SiteInteractionCoordinator } from '@/composables/site-interaction'
import { SiteInteractionCoordinatorKey } from '@/composables/site-interaction'

interface ClientPetHostDependencies {
  router: Router
  scrollCoordinator: PageScrollCoordinator
  interactionCoordinator: SiteInteractionCoordinator
  petCoordinator: PetHostApi
}

export interface ClientPetHostHandle {
  ready: Promise<void>
  stop(): void
}

/**
 * Starts the decorative pet in a separate client-only Vue root. Keeping it
 * outside the SSR application isolates optional animation/runtime failures
 * from the page hydration path while preserving the shared router and
 * coordinators.
 */
export function mountPetHost(
  target: Element,
  dependencies: ClientPetHostDependencies,
): ClientPetHostHandle {
  let petApp: VueApp<Element> | null = null
  let stopped = false

  const ready = import('./PetHost.vue').then(({ default: PetHost }) => {
    if (stopped) return
    const app = createApp(PetHost)
    app.provide(PageScrollCoordinatorKey, dependencies.scrollCoordinator)
    app.provide(SiteInteractionCoordinatorKey, dependencies.interactionCoordinator)
    app.provide(PetCoordinatorKey, dependencies.petCoordinator)
    app.use(dependencies.router)
    app.mount(target)
    petApp = app
  })

  return {
    ready,
    stop() {
      stopped = true
      petApp?.unmount()
      petApp = null
      target.replaceChildren()
    },
  }
}
