import { reactive, readonly } from 'vue'

import type {
  BeginSiteInteractionOptions,
  SiteInteractionCoordinator,
  SiteInteractionState,
} from './siteInteractionTypes'

const ROUTE_SETTLE_MS = 320

export function createSiteInteractionCoordinator(): SiteInteractionCoordinator {
  const state = reactive<SiteInteractionState>({
    phase: 'idle',
    direction: 'unknown',
    preset: 'standard',
    navigationGeneration: null,
    routeKey: '',
    motionEnabled: true,
    documentVisible: true,
    announcement: '',
    announcementId: 0,
  })

  let settleTimer: number | null = null
  let disconnect: (() => void) | null = null
  let disposed = false
  let connected = false

  function clearSettleTimer() {
    if (settleTimer === null || typeof window === 'undefined') return
    window.clearTimeout(settleTimer)
    settleTimer = null
  }

  function settle(generationId: number) {
    clearSettleTimer()
    if (typeof window === 'undefined' || !state.motionEnabled || !state.documentVisible) {
      if (state.navigationGeneration === generationId) state.phase = 'idle'
      return
    }
    settleTimer = window.setTimeout(() => {
      if (state.navigationGeneration === generationId) state.phase = 'idle'
      settleTimer = null
    }, ROUTE_SETTLE_MS)
  }

  function cancelDecorativeMotion() {
    clearSettleTimer()
    state.phase = 'idle'
  }

  function connect() {
    if (disposed || typeof window === 'undefined' || typeof document === 'undefined') return () => {}
    if (disconnect) return disconnect

    connected = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      state.motionEnabled = !media.matches
      if (!state.motionEnabled) cancelDecorativeMotion()
    }
    const updateVisibility = () => {
      state.documentVisible = !document.hidden
      if (!state.documentVisible) cancelDecorativeMotion()
    }
    const cancelOnInput = () => cancelDecorativeMotion()
    const keyCancel = (event: KeyboardEvent) => {
      if (
        event.key === 'PageUp' ||
        event.key === 'PageDown' ||
        event.key === 'Home' ||
        event.key === 'End' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === ' '
      ) {
        cancelDecorativeMotion()
      }
    }

    updateMotion()
    updateVisibility()
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('wheel', cancelOnInput, { passive: true })
    window.addEventListener('touchstart', cancelOnInput, { passive: true })
    window.addEventListener('pointerdown', cancelOnInput, { passive: true })
    window.addEventListener('keydown', keyCancel)

    disconnect = () => {
      media.removeEventListener('change', updateMotion)
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('wheel', cancelOnInput)
      window.removeEventListener('touchstart', cancelOnInput)
      window.removeEventListener('pointerdown', cancelOnInput)
      window.removeEventListener('keydown', keyCancel)
      connected = false
      disconnect = null
    }
    return disconnect
  }

  return {
    state: readonly(state),
    beginNavigation(generationId: number, options: BeginSiteInteractionOptions) {
      if (disposed) return
      clearSettleTimer()
      state.navigationGeneration = generationId
      state.direction = options.direction
      state.preset = options.preset
      state.routeKey = options.routeKey
      state.phase = connected && state.motionEnabled && state.documentVisible ? 'departing' : 'idle'
    },
    confirmNavigation(generationId, options) {
      if (disposed || state.navigationGeneration !== generationId) return
      state.preset = options.preset
      state.routeKey = options.routeKey
      state.phase = connected && state.motionEnabled && state.documentVisible ? 'arriving' : 'idle'
      settle(generationId)
    },
    abortNavigation(generationId) {
      if (state.navigationGeneration !== generationId) return
      cancelDecorativeMotion()
      state.navigationGeneration = null
    },
    cancelDecorativeMotion,
    announce(message: string) {
      const normalized = message.trim()
      if (!normalized) return
      state.announcement = normalized
      state.announcementId += 1
    },
    connect,
    dispose() {
      if (disposed) return
      disposed = true
      clearSettleTimer()
      disconnect?.()
    },
  }
}
