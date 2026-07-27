import type { DeepReadonly, Ref } from 'vue'

export type PageScrollTarget =
  | { kind: 'window'; target: Window }
  | { kind: 'element'; target: HTMLElement }

export type PageScrollDirection = 'up' | 'down' | 'idle'

export interface PageScrollViewport {
  top: number
  height: number
}

export interface PageScrollState {
  top: number
  max: number
  progress: number
  direction: PageScrollDirection
  isScrolling: boolean
  targetKind: PageScrollTarget['kind']
  viewportTop: number
  viewportHeight: number
  isLocked: boolean
  lockCount: number
}

export interface ScrollAnchorSnapshot {
  id: string
  offset: number
}

export interface ScrollSnapshot {
  top: number
  max: number
  capturedAt: number
  anchor?: ScrollAnchorSnapshot
  pageState?: unknown
}

export interface PageScrollFrame {
  state: DeepReadonly<PageScrollState>
  target: PageScrollTarget | null
}

export interface PageScrollToOptions {
  behavior?: ScrollBehavior
}

export interface PageScrollAnchorOptions extends PageScrollToOptions {
  focus?: boolean
  offset?: number
}

export type PageScrollPolicy = 'top' | 'restore' | 'preserve' | 'manual'

export type ScrollNavigationIntent =
  | { kind: 'top' }
  | { kind: 'restore' }
  | { kind: 'preserve' }
  | { kind: 'anchor'; anchor: string; behavior?: ScrollBehavior }
  | { kind: 'manual' }

export interface PageScrollRestorer {
  capture(): ScrollSnapshot
  prepare?(snapshot: ScrollSnapshot, signal: AbortSignal): Promise<void>
  restore(snapshot: ScrollSnapshot): boolean
}

export interface BeginScrollNavigationOptions {
  fromEntryKey: string | null
  isHistoryNavigation: boolean
  redirected?: boolean
}

export interface PageScrollCoordinator {
  readonly state: DeepReadonly<PageScrollState>
  readonly pageScrollLocked: Readonly<Ref<boolean>>
  getTarget(): PageScrollTarget | null
  scrollToTop(options?: PageScrollToOptions): void
  scrollToPosition(top: number, options?: PageScrollToOptions): void
  scrollToAnchor(anchor: string | HTMLElement, options?: PageScrollAnchorOptions): boolean
  captureSnapshot(): ScrollSnapshot
  restoreSnapshot(snapshot: ScrollSnapshot, options?: PageScrollToOptions): void
  registerElementTarget(element: HTMLElement): () => void
  registerContentMetricsElement(element: HTMLElement): () => void
  registerPageScrollRestorer(restorer: PageScrollRestorer): () => void
  invalidateMetrics(): void
  lockPageScroll(owner?: string): () => void
  subscribeScrollFrame(callback: (frame: PageScrollFrame) => void): () => void
  markScrollContentPending(owner?: string): () => void
  beginNavigation(options: BeginScrollNavigationOptions): number
  submitNavigationIntent(generationId: number, intent: ScrollNavigationIntent): void
  confirmNavigation(generationId: number, toEntryKey: string): void
  abortNavigation(generationId: number): void
  closeNavigationRegistrationWindow(generationId: number): void
  notifyAppMounted(): void
  setNextNavigationIntent(intent: ScrollNavigationIntent): void
  consumeNextNavigationIntent(): ScrollNavigationIntent | null
  dispose(): void
}
