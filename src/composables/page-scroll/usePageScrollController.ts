import { inject } from 'vue'

import { PageScrollCoordinatorKey } from './pageScrollInjection'

export function usePageScroll() {
  const coordinator = inject(PageScrollCoordinatorKey)

  if (!coordinator) {
    throw new Error('PageScrollCoordinator is not available in the current Vue app')
  }

  return coordinator
}
