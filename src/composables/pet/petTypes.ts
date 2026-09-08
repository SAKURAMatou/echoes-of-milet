import type { DeepReadonly } from 'vue'

export type PetUrlLang = 'zh' | 'ja'
export type PetRouteMode = 'reactive' | 'quiet' | 'hidden'
export type PetModuleKey = 'timeline' | 'release' | 'live' | 'pilgrimage' | 'news' | 'album'

/** Canonical action registry shared by scheduling, runtime state and assets. */
export const PET_ACTIONS = [
  'idle',
  'sit',
  'happy',
  'curious',
  'excited',
  'sniff',
  'look',
  'drag',
  'sleep',
  'lookLeft',
  'lookLeftUp',
  'lookUp',
  'lookRightUp',
  'lookRight',
] as const

export type PetAction = (typeof PET_ACTIONS)[number]

export type PetAnimationPriority = 0 | 1 | 2 | 3 | 4 | 5
export type PetPlayback = 'loop' | 'once' | 'forwardHold' | 'reverseOnce'
export type PetLookDirection = 'left' | 'leftUp' | 'up' | 'rightUp' | 'right'
export type PetDirectReaction = 'single' | 'double' | 'longPress'
export type PetAttentionPhase = 'inactive' | 'entering' | 'holding' | 'leaving'

export const PET_SPEECH_KEYS = [
  'gentleTouch',
  'doubleWag',
  'stayClose',
  'cozySpot',
  'nearbyPresence',
] as const

export type PetSpeechKey = (typeof PET_SPEECH_KEYS)[number]

export type PetEvent =
  | 'timeline.enter'
  | 'release.enter'
  | 'live.enter'
  | 'pilgrimage.enter'
  | 'news.enter'
  | 'album.enter'
  | 'photo.open'
  | 'live.open'
  | 'location.open'
  | 'news.favorite'

export interface PetEventContext {
  contentId?: string
  routeGeneration?: number
  routeFullPath?: string
  origin?: string
}

export interface PetAssetStatus {
  sheet: 'none' | 'loading' | 'ready' | 'error'
  static: 'none' | 'loading' | 'ready' | 'error'
}

export type PetAssetStatuses = Record<PetAction, PetAssetStatus>

export interface PetAnimationRuntimeState {
  action: PetAction
  priority: PetAnimationPriority
  playback: PetPlayback
  generation: number
  requestedAt: number
  /**
   * Reduced-motion / static settle: the current posture is intentionally
   * displayed without an active animation lock or an expected completion.
   */
  settled?: boolean
}

export interface PetAttentionState {
  direction: PetLookDirection | null
  pendingDirection: PetLookDirection | null
  phase: PetAttentionPhase
}

export interface PetSpeechState {
  visible: boolean
  messageKey: PetSpeechKey | null
  generation: number
}

export interface PetRouteState {
  name: string | null
  lang: PetUrlLang
  fullPath: string
  mode: PetRouteMode
  moduleKey: PetModuleKey | null
  generation: number
}

export interface PetPositionState {
  x: number
  y: number
}

export interface PetState {
  hostConnected: boolean
  staticReady: boolean
  paused: boolean
  suspensionCount: number
  menuOpen: boolean
  dragging: boolean
  animation: PetAnimationRuntimeState
  attention: PetAttentionState
  speech: PetSpeechState
  route: PetRouteState
  position: PetPositionState
  assets: PetAssetStatuses
  environment: {
    motionEnabled: boolean
    documentVisible: boolean
  }
}

export interface PetRouteSnapshot {
  name?: string | null
  lang?: PetUrlLang | null
  fullPath: string
  /** Stable content identity (for example the live slug) within one route. */
  instanceKey?: string | null
}

/** Thin business API exposed to pages and overlay components. */
export interface PetBusinessApi {
  readonly state: DeepReadonly<PetState>
  react(event: PetEvent, context?: PetEventContext): void
  suspend(reason: string): () => void
}

/** Host-only controls. Callers outside the pet UI should use PetBusinessApi instead. */
export interface PetHostApi extends PetBusinessApi {
  connect(): () => void
  setRoute(route: PetRouteSnapshot): void
  syncEnvironment(motionEnabled: boolean, documentVisible: boolean): void
  setStaticReady(ready: boolean): void
  setAssetStatus(action: PetAction, status: Partial<PetAssetStatus>): void
  playUserHappy(): void
  playDirectReaction(trigger: PetDirectReaction): void
  beginAttention(direction: PetLookDirection): void
  updateAttention(direction: PetLookDirection): void
  endAttention(): void
  openMenu(): void
  closeMenu(): void
  setPosition(position: PetPositionState): void
  beginDrag(position: PetPositionState): void
  updateDragPosition(position: PetPositionState): void
  endDrag(commit: boolean): void
  cancelDrag(): void
  completeAnimation(generation: number): void
  animationAssetFailed(action: PetAction): void
  dispose(): void
}
