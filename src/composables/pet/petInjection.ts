import { inject, type InjectionKey } from 'vue'

import type { PetBusinessApi, PetHostApi } from './petTypes'

export const PetCoordinatorKey: InjectionKey<PetHostApi> = Symbol('PetCoordinator')

/** Business-facing view of the app-scoped pet coordinator. */
export function usePet(): PetBusinessApi {
  const coordinator = inject(PetCoordinatorKey)
  if (!coordinator) {
    throw new Error('Pet coordinator is not available')
  }
  return coordinator
}

/** Host controls used by the singleton pet UI. Prefer usePet() elsewhere. */
export function usePetHostControls(): PetHostApi {
  const coordinator = inject(PetCoordinatorKey)
  if (!coordinator) {
    throw new Error('Pet coordinator is not available')
  }
  return coordinator
}
