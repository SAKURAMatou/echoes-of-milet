import { inject, type InjectionKey } from 'vue'

import type { AnniversaryApiPayload } from '@/composables/miletAnniversary'
import type { PublicArticleDetail } from '@/composables/articleType'
import type { PilgrimageSsrPayload } from '@/composables/miletPilgrimage'

export interface AppState {
  lang: SupportedLang
  miletHomeData: Record<string, any> | null
  miletArticleData: PublicArticleDetail | null
  miletAnniversaryData: AnniversaryApiPayload | null
  miletPilgrimageData: PilgrimageSsrPayload | null
}

export const AppStateKey: InjectionKey<AppState> = Symbol('app-state')

export function createInitialState(initialState?: Partial<AppState>): AppState {
  return {
    lang: initialState?.lang === 'jp' ? 'jp' : 'zh',
    miletHomeData: initialState?.miletHomeData ?? null,
    miletArticleData: initialState?.miletArticleData ?? null,
    miletAnniversaryData: initialState?.miletAnniversaryData ?? null,
    miletPilgrimageData: initialState?.miletPilgrimageData ?? null,
  }
}

export function useAppState() {
  const state = inject(AppStateKey)

  if (!state) {
    throw new Error('App state is not available')
  }

  return state
}
