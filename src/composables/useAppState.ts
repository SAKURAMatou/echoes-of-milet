import { inject, type InjectionKey } from 'vue'

import type { AnniversaryApiPayload } from '@/composables/miletAnniversary'
import type { PublicArticleDetail } from '@/composables/articleType'
import type { PilgrimageSsrPayload } from '@/composables/miletPilgrimage'
import type { LiveEventDetailPayload, LiveEventListResponse } from '@/composables/liveArchive'

export interface CachedPayload<T> {
  key: string
  payload: T
}

export interface AppState {
  lang: SupportedLang
  miletHomeData: Record<string, any> | null
  miletArticleData: PublicArticleDetail | null
  miletAnniversaryData: AnniversaryApiPayload | null
  miletPilgrimageData: PilgrimageSsrPayload | null
  miletLiveListData: CachedPayload<LiveEventListResponse> | null
  miletLiveDetailData: CachedPayload<LiveEventDetailPayload> | null
  miletLivePreviewData: CachedPayload<LiveEventDetailPayload> | null
}

export const AppStateKey: InjectionKey<AppState> = Symbol('app-state')

export function createInitialState(initialState?: Partial<AppState>): AppState {
  return {
    lang: initialState?.lang === 'jp' ? 'jp' : 'zh',
    miletHomeData: initialState?.miletHomeData ?? null,
    miletArticleData: initialState?.miletArticleData ?? null,
    miletAnniversaryData: initialState?.miletAnniversaryData ?? null,
    miletPilgrimageData: initialState?.miletPilgrimageData ?? null,
    miletLiveListData: initialState?.miletLiveListData ?? null,
    miletLiveDetailData: initialState?.miletLiveDetailData ?? null,
    miletLivePreviewData: initialState?.miletLivePreviewData ?? null,
  }
}

export function useAppState() {
  const state = inject(AppStateKey)

  if (!state) {
    throw new Error('App state is not available')
  }

  return state
}
