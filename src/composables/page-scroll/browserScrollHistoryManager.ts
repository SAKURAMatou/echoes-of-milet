export const MILET_SCROLL_ENTRY_KEY = 'miletScrollEntryKey'

interface MiletHistoryState extends Record<string, unknown> {
  [MILET_SCROLL_ENTRY_KEY]?: string
  position?: number
}

export interface BrowserNavigationStart {
  fromEntryKey: string
  isHistoryNavigation: boolean
  pendingTargetEntryKey: string | null
}

export interface BrowserScrollHistoryManager {
  readonly activeEntryKey: string
  readonly activePosition: number | null
  beginNavigation(): BrowserNavigationStart
  ensureCurrentTargetEntryKey(options: { historyNavigation: boolean }): string
  commitActiveEntryKey(key: string): void
}

export interface BrowserScrollHistoryLease {
  manager: BrowserScrollHistoryManager
  release(): void
}

function createEntryKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `milet-scroll-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function readHistoryState(): MiletHistoryState {
  const state = window.history.state
  return state && typeof state === 'object' ? state : {}
}

function readPosition(state = readHistoryState()): number | null {
  return typeof state.position === 'number' ? state.position : null
}

function replaceMergedHistoryState(state: MiletHistoryState) {
  window.history.replaceState(state, '', window.location.href)
}

class BrowserScrollHistoryManagerImpl implements BrowserScrollHistoryManager {
  private currentEntryKey: string
  private currentPosition: number | null

  constructor() {
    const rawState = window.history.state
    const state = readHistoryState()
    this.currentEntryKey = state[MILET_SCROLL_ENTRY_KEY] || createEntryKey()
    this.currentPosition = readPosition(state)

    // Let Vue Router initialize a completely empty history state first. Writing a
    // key-only object here would make createWebHistory() skip its own state shape.
    if (rawState && state[MILET_SCROLL_ENTRY_KEY] !== this.currentEntryKey) {
      replaceMergedHistoryState({ ...state, [MILET_SCROLL_ENTRY_KEY]: this.currentEntryKey })
    }
  }

  get activeEntryKey() {
    return this.currentEntryKey
  }

  get activePosition() {
    return this.currentPosition
  }

  beginNavigation(): BrowserNavigationStart {
    const state = readHistoryState()
    const pendingTargetEntryKey = state[MILET_SCROLL_ENTRY_KEY] || null
    const position = readPosition(state)
    const isHistoryNavigation =
      position !== null && this.currentPosition !== null && position !== this.currentPosition

    return {
      fromEntryKey: this.currentEntryKey,
      isHistoryNavigation,
      pendingTargetEntryKey: isHistoryNavigation ? pendingTargetEntryKey : null,
    }
  }

  ensureCurrentTargetEntryKey(options: { historyNavigation: boolean }): string {
    const state = readHistoryState()
    const position = readPosition(state)
    const isNewEntry =
      !options.historyNavigation &&
      position !== null &&
      this.currentPosition !== null &&
      position !== this.currentPosition
    const existingKey = state[MILET_SCROLL_ENTRY_KEY]
    const key =
      !isNewEntry && existingKey
        ? existingKey
        : !options.historyNavigation && this.currentPosition === null
          ? this.currentEntryKey
          : createEntryKey()

    if (existingKey !== key) {
      replaceMergedHistoryState({ ...state, [MILET_SCROLL_ENTRY_KEY]: key })
    }
    return key
  }

  commitActiveEntryKey(key: string) {
    this.currentEntryKey = key
    this.currentPosition = readPosition()
  }
}

let sharedManager: BrowserScrollHistoryManagerImpl | null = null
let leaseCount = 0
let originalScrollRestoration: ScrollRestoration | null = null

export function acquireBrowserScrollHistoryLease(): BrowserScrollHistoryLease {
  if (typeof window === 'undefined') {
    throw new Error('Browser scroll history can only be acquired in a browser')
  }

  if (!sharedManager) {
    originalScrollRestoration = window.history.scrollRestoration
    sharedManager = new BrowserScrollHistoryManagerImpl()
    window.history.scrollRestoration = 'manual'
  }
  leaseCount += 1

  const manager = sharedManager
  let active = true
  return {
    manager,
    release() {
      if (!active) return
      active = false
      leaseCount = Math.max(0, leaseCount - 1)
      if (leaseCount > 0 || !sharedManager) return

      if (originalScrollRestoration) {
        window.history.scrollRestoration = originalScrollRestoration
      }
      sharedManager = null
      originalScrollRestoration = null
    },
  }
}
