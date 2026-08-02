import type { DeepReadonly } from 'vue'

export type SiteInteractionPhase = 'idle' | 'departing' | 'arriving'
export type SiteNavigationDirection = 'forward' | 'back' | 'replace' | 'unknown'
export type SiteInteractionPreset =
  | 'standard'
  | 'quiet'
  | 'archive'
  | 'map'
  | 'challenge'
  | 'immersive'

export interface SiteInteractionState {
  phase: SiteInteractionPhase
  direction: SiteNavigationDirection
  preset: SiteInteractionPreset
  navigationGeneration: number | null
  routeKey: string
  motionEnabled: boolean
  documentVisible: boolean
  announcement: string
  announcementId: number
}

export interface BeginSiteInteractionOptions {
  direction: SiteNavigationDirection
  preset: SiteInteractionPreset
  routeKey: string
}

export interface SiteInteractionCoordinator {
  readonly state: DeepReadonly<SiteInteractionState>
  beginNavigation(generationId: number, options: BeginSiteInteractionOptions): void
  confirmNavigation(generationId: number, options: Omit<BeginSiteInteractionOptions, 'direction'>): void
  abortNavigation(generationId: number): void
  cancelDecorativeMotion(): void
  announce(message: string): void
  connect(): () => void
  dispose(): void
}

export function resolveInteractionPreset(value: unknown): SiteInteractionPreset {
  return value === 'quiet' ||
    value === 'archive' ||
    value === 'map' ||
    value === 'challenge' ||
    value === 'immersive'
    ? value
    : 'standard'
}
