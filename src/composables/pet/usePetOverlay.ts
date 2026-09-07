import {
  onScopeDispose,
  unref,
  watch,
  type ComputedRef,
  type Ref,
  type WatchSource,
} from 'vue'

import type { PetBusinessApi } from './petTypes'
import { usePet } from './petInjection'

export type PetOverlaySource = Ref<boolean> | ComputedRef<boolean> | (() => boolean)

/**
 * Acquires one unique pet pause token while an overlay is open and releases it
 * when the overlay closes or this setup scope is disposed.
 *
 * An explicit `watch` (sync flush) is used on purpose: it only tracks the
 * overlay source. A watchEffect that runs `pet.suspend()` can accidentally
 * subscribe to coordinator state that suspend reads/mutates and then release
 * and reacquire tokens on unrelated coordinator changes.
 */
export function usePetOverlay(
  source: PetOverlaySource,
  reason: string,
  coordinator: PetBusinessApi = usePet(),
) {
  let release: (() => void) | null = null

  function apply(open: boolean) {
    if (open && !release) {
      release = coordinator.suspend(reason)
      return
    }
    if (!open && release) {
      release()
      release = null
    }
  }

  const resolvedSource =
    typeof source === 'function' ? source : (() => unref(source)) as () => boolean
  const stopWatch = watch(resolvedSource as WatchSource<boolean>, apply, {
    flush: 'sync',
    immediate: true,
  })

  onScopeDispose(() => {
    stopWatch()
    apply(false)
  })
}
