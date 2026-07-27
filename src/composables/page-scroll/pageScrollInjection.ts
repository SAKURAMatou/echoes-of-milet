import type { InjectionKey } from 'vue'

import type { PageScrollCoordinator } from './pageScrollTypes'

export const PageScrollCoordinatorKey: InjectionKey<PageScrollCoordinator> =
  Symbol('PageScrollCoordinator')
