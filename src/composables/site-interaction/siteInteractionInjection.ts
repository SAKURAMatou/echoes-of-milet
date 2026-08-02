import { inject, type InjectionKey } from 'vue'

import type { SiteInteractionCoordinator } from './siteInteractionTypes'

export const SiteInteractionCoordinatorKey: InjectionKey<SiteInteractionCoordinator> = Symbol(
  'SiteInteractionCoordinator',
)

export function useSiteInteraction(): SiteInteractionCoordinator {
  const coordinator = inject(SiteInteractionCoordinatorKey)
  if (!coordinator) throw new Error('Site interaction coordinator is not available')
  return coordinator
}
