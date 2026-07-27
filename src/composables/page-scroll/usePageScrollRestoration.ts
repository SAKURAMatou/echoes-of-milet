import { onBeforeUnmount } from 'vue'

import type { PageScrollRestorer } from './pageScrollTypes'
import { usePageScroll } from './usePageScrollController'

export function usePageScrollRestoration(restorer: PageScrollRestorer) {
  const coordinator = usePageScroll()
  const unregister = coordinator.registerPageScrollRestorer(restorer)
  onBeforeUnmount(unregister)
  return unregister
}
