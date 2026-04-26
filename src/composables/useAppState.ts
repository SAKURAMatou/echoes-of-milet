import { inject, type InjectionKey } from 'vue'

import type { AnniversaryApiPayload } from '@/composables/miletAnniversary'

export interface AppState {
  lang: SupportedLang
  miletHomeData: Record<string, any> | null
  miletAnniversaryData: AnniversaryApiPayload | null
}

export const AppStateKey: InjectionKey<AppState> = Symbol('app-state')

export function createInitialState(initialState?: Partial<AppState>): AppState {
  return {
    lang: initialState?.lang === 'jp' ? 'jp' : 'zh',
    miletHomeData: initialState?.miletHomeData ?? null,
    miletAnniversaryData: initialState?.miletAnniversaryData ?? null,
  }
}

export function useAppState() {
  const state = inject(AppStateKey)

  if (!state) {
    throw new Error('App state is not available')
  }

  return state
}
