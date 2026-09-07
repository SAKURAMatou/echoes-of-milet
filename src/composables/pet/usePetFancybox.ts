import type { FancyboxOptions } from '@fancyapps/ui'
import { onScopeDispose } from 'vue'

import type { PetBusinessApi } from './petTypes'
import { usePet } from './petInjection'

const PHOTO_SUSPEND_REASON = 'photo-overlay'

type PetFancyboxOptions = Partial<FancyboxOptions>
type PetHandler = (...args: unknown[]) => void

interface PetPhotoLifecycleRecord {
  release: () => void
  reported: boolean
  routeGeneration: number | null
  routeFullPath: string
}

export interface PetFancyboxPhotoLifecycleManager {
  decorate<T extends PetFancyboxOptions>(options: T): T
  dispose(): void
}

export interface PetFancyboxPhotoOptionsDecorator {
  <T extends PetFancyboxOptions>(options: T): T
  dispose(): void
}

/**
 * Plain manager used by usePetFancyboxPhotoLifecycle so the same cleanup
 * semantics can be exercised without a Vue component.
 */
export function createPetFancyboxPhotoLifecycleManager(
  pet: PetBusinessApi,
): PetFancyboxPhotoLifecycleManager {
  const instances = new Map<object, PetPhotoLifecycleRecord>()
  let managerDisposed = false

  function cleanup(instance: object | null | undefined) {
    if (!instance) return
    const record = instances.get(instance)
    if (!record) return
    instances.delete(instance)
    record.release()
  }

  function chain(original: unknown, next: PetHandler): PetHandler {
    if (!original) return next
    return function chained(this: unknown, ...args: unknown[]) {
      try {
        ;(original as PetHandler).apply(this, args)
      } finally {
        next.apply(this, args)
      }
    }
  }

  function decorate<T extends PetFancyboxOptions>(options: T): T {
    const existingOn = options.on
    const on: PetFancyboxOptions['on'] = {
      ...existingOn,
      init: chain(
        existingOn?.init,
        ((api: unknown) => {
          if (managerDisposed || !api || typeof api !== 'object') return
          const instance = api as object
          const previous = instances.get(instance)
          if (previous) {
            instances.delete(instance)
            previous.release()
          }
          instances.set(instance, {
            release: pet.suspend(PHOTO_SUSPEND_REASON),
            reported: false,
            routeGeneration: pet.state.route.generation,
            routeFullPath: pet.state.route.fullPath,
          })
        }) as NonNullable<FancyboxOptions['on']>['init'],
      ),
      ready: chain(
        existingOn?.ready,
        ((api: unknown) => {
          if (managerDisposed || !api || typeof api !== 'object') return
          const instance = api as object
          const record = instances.get(instance)
          if (!record || record.reported) return
          record.reported = true
          pet.react('photo.open', {
            routeGeneration: record.routeGeneration ?? undefined,
            routeFullPath: record.routeFullPath || undefined,
          })
        }) as NonNullable<FancyboxOptions['on']>['ready'],
      ),
      destroy: chain(
        existingOn?.destroy,
        ((api: unknown) => {
          if (!managerDisposed && api && typeof api === 'object') {
            cleanup(api as object)
          }
        }) as NonNullable<FancyboxOptions['on']>['destroy'],
      ),
    }

    return { ...options, on }
  }

  function dispose() {
    if (managerDisposed) return
    managerDisposed = true
    for (const instance of Array.from(instances.keys())) {
      cleanup(instance)
    }
    instances.clear()
  }

  return { decorate, dispose }
}

/**
 * Shares the Fancybox photo overlay lifecycle with the pet coordinator:
 * suspend at real init, report a successful photo.open once at ready and always
 * release on destroy (including global Fancybox.destroy()/component unmount).
 *
 * Instances are tracked in a plain Map (not a WeakMap) so dispose can iterate
 * them. Chained callbacks preserve the caller's existing handlers and still run
 * the pet-side cleanup when an original callback throws.
 */
export function usePetFancyboxPhotoLifecycle(): PetFancyboxPhotoOptionsDecorator {
  const pet = usePet()
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  onScopeDispose(() => manager.dispose())
  const decorate = manager.decorate.bind(manager)
  return Object.assign(decorate, { dispose: manager.dispose })
}
