import { reactive, readonly } from 'vue'

import {
  PET_CORE_PRELOAD_ACTIONS,
  PET_MENU_DELAY_MS,
  PET_PHOTO_LOOK_WINDOW_MS,
  PET_ROUTE_MODULE_ANIMATION,
  resolvePetEventAction,
  resolvePetPageEvent,
  resolvePetRouteMode,
  resolvePetRouteModule,
} from '@/config/pet'
import {
  PET_PAGE_COOLDOWN_MS,
  PET_PAGE_PENDING_TTL_MS,
  PET_PRIORITY,
  PetPageGate,
  pickRandomAction,
  randomDelayMs,
  type PetActionName,
  type PetPendingPageEvent,
} from './petSchedulingCore'
import type {
  PetAction,
  PetAnimationPriority,
  PetAssetStatus,
  PetAssetStatuses,
  PetEvent,
  PetEventContext,
  PetHostApi,
  PetModuleKey,
  PetPositionState,
  PetRouteSnapshot,
  PetState,
} from './petTypes'

const PET_ACTIONS: PetAction[] = [
  'idle',
  'sit',
  'happy',
  'curious',
  'excited',
  'sniff',
  'look',
  'drag',
  'sleep',
]

const PAGE_PRIORITY = PET_PRIORITY.page
const USER_PRIORITY = PET_PRIORITY.user
const RANDOM_PRIORITY = PET_PRIORITY.random
const DRAG_PRIORITY = PET_PRIORITY.drag
const IDLE_PRIORITY = PET_PRIORITY.idle

export interface PetCoordinatorScheduler {
  now(): number
  schedule(callback: () => void, delayMs: number): number | null
  cancel(timerId: number | null): void
}

export interface CreatePetCoordinatorOptions {
  scheduler?: PetCoordinatorScheduler
  random?: () => number
}

const browserPetCoordinatorScheduler: PetCoordinatorScheduler = {
  now: () => Date.now(),
  schedule(callback, delayMs) {
    if (typeof window === 'undefined') return null
    return window.setTimeout(callback, delayMs)
  },
  cancel(timerId) {
    if (timerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(timerId)
    }
  },
}

interface PendingStartEvent {
  action: PetAction
  key: string
}

interface PhotoLookCandidate {
  openedAt: number
  routeName: string | null
  routeLang: PetState['route']['lang']
  routeFullPath: string
  routeGeneration: number
}

function createInitialAssetStatuses(): PetAssetStatuses {
  const statuses = {} as PetAssetStatuses
  for (const action of PET_ACTIONS) {
    statuses[action] = { sheet: 'none', static: 'none' }
  }
  return statuses
}

function actionName(action: PetAction): PetActionName {
  return action as PetActionName
}

export function createPetCoordinator(
  options: CreatePetCoordinatorOptions = {},
): PetHostApi {
  const scheduler = options.scheduler ?? browserPetCoordinatorScheduler
  const random = options.random ?? Math.random
  const pageGate = new PetPageGate({
    cooldownMs: PET_PAGE_COOLDOWN_MS,
    ttlMs: PET_PAGE_PENDING_TTL_MS,
  })
  const suspensions = new Set<symbol>()
  let disposed = false
  let hostConnected = false
  let disconnectHost: (() => void) | null = null
  let animationGeneration = 0
  let lastFiredModuleKey: string | null = null
  let lastLiveOpenKey = ''
  let lastRouteName: string | null = null
  let lastRouteInstanceKey: string | null = null
  let randomTimer: number | null = null
  let pagePendingTimer: number | null = null
  let pendingPreReady: PendingStartEvent | null = null
  let photoLookCandidate: PhotoLookCandidate | null = null

  const state = reactive<PetState>({
    hostConnected: false,
    staticReady: false,
    paused: false,
    suspensionCount: 0,
    menuOpen: false,
    dragging: false,
    animation: {
      action: 'idle',
      priority: IDLE_PRIORITY,
      generation: 0,
      requestedAt: 0,
    },
    route: {
      name: null,
      lang: 'zh',
      fullPath: '',
      mode: 'hidden',
      moduleKey: null,
      generation: 0,
    },
    position: { x: 0, y: 0 },
    assets: createInitialAssetStatuses(),
    environment: {
      motionEnabled: true,
      documentVisible: true,
    },
  })

  function now(): number {
    return scheduler.now()
  }

  function setTimer(callback: () => void, delay: number) {
    if (disposed) return null
    return scheduler.schedule(callback, Math.max(0, delay))
  }

  function clearRandomTimer() {
    if (randomTimer !== null) scheduler.cancel(randomTimer)
    randomTimer = null
  }

  function clearPagePendingTimer() {
    if (pagePendingTimer !== null) scheduler.cancel(pagePendingTimer)
    pagePendingTimer = null
  }

  function clearAllTimers() {
    clearRandomTimer()
    clearPagePendingTimer()
  }

  function updatePaused(nextPaused: boolean) {
    state.paused = nextPaused
    state.suspensionCount = suspensions.size
  }

  function resetToIdle() {
    state.animation = {
      action: 'idle',
      priority: IDLE_PRIORITY,
      generation: ++animationGeneration,
      requestedAt: now(),
    }
  }

  function closeMenuInternal() {
    if (state.menuOpen) state.menuOpen = false
  }

  function clearPhotoLookCandidate() {
    photoLookCandidate = null
  }

  function clearPageWork() {
    clearPagePendingTimer()
    pageGate.clearPending()
    pendingPreReady = null
  }

  function cancelActiveAnimation() {
    clearRandomTimer()
    if (state.animation.action === 'idle' && state.animation.priority === IDLE_PRIORITY) {
      return
    }
    resetToIdle()
  }

  function settleCurrentAnimation() {
    const current = state.animation
    if (current.action === 'idle' && current.priority === IDLE_PRIORITY) {
      state.animation = { ...current, settled: false }
      return
    }
    state.animation = { ...current, settled: true }
  }

  function randomAllowedOnRoute(): boolean {
    return state.route.mode !== 'hidden'
  }

  function randomEligible(): boolean {
    return Boolean(
      !disposed &&
        hostConnected &&
        state.staticReady &&
        !state.paused &&
        !state.menuOpen &&
        !state.dragging &&
        state.environment.motionEnabled &&
        state.environment.documentVisible &&
        randomAllowedOnRoute() &&
        state.animation.action === 'idle' &&
        state.animation.priority === IDLE_PRIORITY &&
        (state.assets.idle.static === 'ready' || state.assets.idle.sheet === 'ready'),
    )
  }

  function excludedRandomActions(): PetActionName[] {
    return PET_ACTIONS.filter((action) => {
      const status = state.assets[action]
      return status.sheet === 'error' && status.static === 'error'
    }) as PetActionName[]
  }

  function scheduleRandom() {
    clearRandomTimer()
    if (!randomEligible()) return
    const delay = randomDelayMs(random)
    randomTimer = setTimer(() => {
      randomTimer = null
      if (!randomEligible()) return
      const action = pickRandomAction(
        random,
        excludedRandomActions(),
      )
      if (action && action !== 'idle') {
        startAction(action as PetAction, RANDOM_PRIORITY)
      }
    }, delay)
  }

  function startAction(action: PetAction, priority: PetAnimationPriority): boolean {
    if (disposed || state.paused || state.route.mode === 'hidden') return false
    if (!state.environment.documentVisible) return false
    if (!PET_ACTIONS.includes(action)) return false

    const current = state.animation
    const currentIsSettled = current.settled === true
    const isInterruptible =
      current.action === 'idle' ||
      currentIsSettled ||
      priority >= current.priority
    if (!isInterruptible) return false

    if (state.dragging && priority < DRAG_PRIORITY) return false

    state.animation = {
      action,
      priority,
      generation: ++animationGeneration,
      requestedAt: now(),
      settled: !state.environment.motionEnabled,
    }
    return true
  }

  function startPageAction(action: PetAction, key: string, useCooldown: boolean): boolean {
    if (
      state.paused ||
      state.menuOpen ||
      state.dragging ||
      state.route.mode === 'hidden' ||
      !state.environment.documentVisible
    ) {
      return false
    }
    const started = startAction(action, PAGE_PRIORITY)
    if (started && useCooldown) {
      pageGate.markStarted(now())
    }
    return started
  }

  function schedulePageReaction(action: PetAction, key: string) {
    if (disposed || !state.environment.documentVisible) return
    if (!hostConnected || !state.staticReady) {
      pendingPreReady = { action, key }
      return
    }
    if (state.paused || state.route.mode === 'hidden') return

    if (state.menuOpen || state.dragging) {
      pageGate.clearPending()
      return
    }

    const event: PetPendingPageEvent = {
      key,
      action: actionName(action),
      priority: PAGE_PRIORITY,
    }
    const decision = pageGate.submit(event, now(), false)
    if (decision === 'queued') {
      const waitMs = Math.max(0, pageGate.cooldownUntil - now())
      clearPagePendingTimer()
      pagePendingTimer = setTimer(drainPageGate, waitMs)
      return
    }
    if (decision === 'dropped') return

    startPageAction(action, key, true)
  }

  function drainPageGate() {
    pagePendingTimer = null
    if (disposed || state.paused || state.menuOpen || state.dragging) return
    if (state.route.mode === 'hidden' || !state.environment.documentVisible) return
    const remainingCooldown = pageGate.cooldownUntil - now()
    if (remainingCooldown > 0) {
      pagePendingTimer = setTimer(drainPageGate, remainingCooldown)
      return
    }
    const pending = pageGate.popPending(now())
    if (!pending) {
      scheduleRandom()
      return
    }
    startPageAction(pending.action as PetAction, pending.key, true)
  }

  function flushPendingPreReady() {
    if (!pendingPreReady) return
    if (
      !hostConnected ||
      !state.staticReady ||
      state.paused ||
      state.route.mode === 'hidden' ||
      !state.environment.documentVisible
    ) {
      return
    }
    const pending = pendingPreReady
    pendingPreReady = null
    if (!state.menuOpen && !state.dragging) {
      startPageAction(pending.action, pending.key, true)
    }
  }

  function restartIdleWait() {
    if (disposed) return
    clearPhotoLookCandidate()
    clearRandomTimer()
    clearPagePendingTimer()
    pageGate.clearPending()
    if (randomEligible()) {
      scheduleRandom()
    }
  }

  function playUserHappyInternal() {
    if (disposed || state.paused || state.route.mode === 'hidden') return
    if (!state.environment.documentVisible) return
    if (state.dragging) return
    if (state.menuOpen) {
      closeMenuInternal()
      clearPhotoLookCandidate()
      restartIdleWait()
      return
    }
    closeMenuInternal()
    clearPageWork()
    clearPhotoLookCandidate()
    if (startAction('happy', USER_PRIORITY)) {
      restartIdleWait()
    }
  }

  function maybeDeferredPhotoLook() {
    const candidate = photoLookCandidate
    photoLookCandidate = null
    if (!candidate) return
    if (
      disposed ||
      state.paused ||
      state.suspensionCount > 0 ||
      !state.environment.documentVisible ||
      state.route.mode === 'hidden' ||
      state.menuOpen ||
      state.dragging ||
      candidate.routeGeneration !== state.route.generation ||
      candidate.routeName !== state.route.name ||
      candidate.routeLang !== state.route.lang ||
      candidate.routeFullPath !== state.route.fullPath
    ) {
      return
    }
    const elapsed = now() - candidate.openedAt
    if (elapsed < 0 || elapsed > PET_PHOTO_LOOK_WINDOW_MS) return
    schedulePageReaction('look', 'photo-look')
  }

  function armPhotoLookCandidate(context: PetEventContext | undefined) {
    if (!state.environment.documentVisible || state.route.mode === 'hidden') return
    const generation = state.route.generation
    if (context?.routeGeneration !== undefined && context.routeGeneration !== generation) return
    if (
      context?.routeFullPath !== undefined &&
      context.routeFullPath !== state.route.fullPath
    ) {
      return
    }
    photoLookCandidate = {
      openedAt: now(),
      routeName: state.route.name,
      routeLang: state.route.lang,
      routeFullPath: state.route.fullPath,
      routeGeneration: generation,
    }
  }

  function reactToRouteModule(moduleKey: PetModuleKey) {
    const event = resolvePetPageEvent(moduleKey)
    const action = PET_ROUTE_MODULE_ANIMATION[moduleKey]
    schedulePageReaction(action, `route:${event}`)
  }

  function liveOpenKeyFor(contentId: string | undefined) {
    return `live:${state.route.name || ''}:${contentId || ''}`
  }

  function routeContextIsCurrent(context: PetEventContext | undefined): boolean {
    if (
      context?.routeGeneration !== undefined &&
      context.routeGeneration !== state.route.generation
    ) {
      return false
    }
    if (
      context?.routeFullPath !== undefined &&
      context.routeFullPath !== state.route.fullPath
    ) {
      return false
    }
    return true
  }

  function handleContentEvent(event: PetEvent, context: PetEventContext | undefined) {
    if (event === 'news.favorite') return
    if (!routeContextIsCurrent(context)) return

    if (event === 'live.open') {
      if (state.route.name !== 'miletLiveDetail') return
      const key = liveOpenKeyFor(context?.contentId)
      if (key === lastLiveOpenKey) return
      lastLiveOpenKey = key
      schedulePageReaction('happy', key)
      return
    }

    if (event === 'location.open') {
      if (state.route.name !== 'miletPilgrimage') return
      schedulePageReaction('sniff', `location:${context?.contentId || 'unknown'}`)
      return
    }

    if (event === 'photo.open') {
      armPhotoLookCandidate(context)
      return
    }

    const moduleAction = resolvePetEventAction(event)
    if (!moduleAction) return
    schedulePageReaction(moduleAction, `${event}:${context?.contentId || 'route'}`)
  }

  return {
    state: readonly(state),

    react(event: PetEvent, context?: PetEventContext) {
      if (disposed || state.route.mode === 'hidden') return
      if (!state.environment.documentVisible) {
        clearPhotoLookCandidate()
        return
      }
      handleContentEvent(event, context)
    },

    suspend(reason: string) {
      if (disposed) return () => {}
      const token = Symbol(reason)
      suspensions.add(token)
      updatePaused(true)
      if (suspensions.size === 1) {
        closeMenuInternal()
        if (state.dragging) {
          state.dragging = false
        }
        cancelActiveAnimation()
        clearAllTimers()
        pageGate.clearPending()
        pendingPreReady = null
      }

      let active = true
      return () => {
        if (!active || disposed) {
          active = false
          return
        }
        active = false
        if (!suspensions.delete(token)) return
        updatePaused(suspensions.size > 0)
        if (suspensions.size === 0) {
          maybeDeferredPhotoLook()
          flushPendingPreReady()
          scheduleRandom()
        }
      }
    },

    connect() {
      if (disposed || hostConnected) return () => {}
      hostConnected = true
      state.hostConnected = true
      if (state.staticReady && state.route.mode !== 'hidden') {
        flushPendingPreReady()
        scheduleRandom()
      }
      let connected = true
      disconnectHost = () => {
        if (!connected) return
        connected = false
        hostConnected = false
        state.hostConnected = false
        clearAllTimers()
        clearPageWork()
        disconnectHost = null
      }
      return disconnectHost
    },

    setRoute(route: PetRouteSnapshot) {
      if (disposed) return
      const nextName = typeof route.name === 'string' ? route.name : null
      const nextLang = route.lang === 'ja' ? 'ja' : 'zh'
      const nextMode = resolvePetRouteMode(nextName)
      const nextModule = resolvePetRouteModule(nextName)
      const nextInstanceKey =
        route.instanceKey === undefined || route.instanceKey === null
          ? null
          : String(route.instanceKey)

      const routeChangedToAnotherLive =
        nextName !== lastRouteName ||
        (nextName === 'miletLiveDetail' && nextInstanceKey !== lastRouteInstanceKey)
      if (routeChangedToAnotherLive) {
        lastLiveOpenKey = ''
      }
      lastRouteName = nextName
      lastRouteInstanceKey = nextName === 'miletLiveDetail' ? nextInstanceKey : null

      state.route.name = nextName
      state.route.lang = nextLang
      state.route.fullPath = route.fullPath || ''
      state.route.mode = nextMode
      state.route.moduleKey = nextModule
      state.route.generation += 1

      closeMenuInternal()
      clearPhotoLookCandidate()
      clearAllTimers()
      clearPageWork()
      if (state.dragging) {
        state.dragging = false
        resetToIdle()
      }
      cancelActiveAnimation()

      if (nextMode === 'hidden' || !state.environment.documentVisible) {
        lastFiredModuleKey = null
        pendingPreReady = null
        return
      }

      if (nextMode === 'reactive' && nextModule) {
        if (lastFiredModuleKey !== nextModule) {
          lastFiredModuleKey = nextModule
          reactToRouteModule(nextModule)
        }
      } else {
        lastFiredModuleKey = null
        pendingPreReady = null
      }
      scheduleRandom()
    },

    syncEnvironment(motionEnabled: boolean, documentVisible: boolean) {
      if (disposed) return
      const nextMotion = Boolean(motionEnabled)
      const nextVisible = Boolean(documentVisible)
      const wasVisible = state.environment.documentVisible
      const wasMotion = state.environment.motionEnabled
      state.environment.motionEnabled = nextMotion
      state.environment.documentVisible = nextVisible

      if (!nextVisible) {
        state.dragging = false
        closeMenuInternal()
        pendingPreReady = null
        clearPhotoLookCandidate()
        clearAllTimers()
        pageGate.clearPending()
        lastFiredModuleKey = null
        lastLiveOpenKey = ''
        resetToIdle()
        return
      }

      if (!nextMotion) {
        clearAllTimers()
        if (!state.dragging) settleCurrentAnimation()
        return
      }

      if (!wasMotion) {
        resetToIdle()
      }
      if (!wasVisible) {
        lastFiredModuleKey = null
        lastLiveOpenKey = ''
      }
      scheduleRandom()
      flushPendingPreReady()
    },

    setStaticReady(ready: boolean) {
      if (disposed) return
      state.staticReady = Boolean(ready)
      if (state.staticReady) {
        flushPendingPreReady()
        scheduleRandom()
      }
    },

    setAssetStatus(action: PetAction, status: Partial<PetAssetStatus>) {
      if (disposed) return
      const next = { ...state.assets[action] }
      if (status.sheet) next.sheet = status.sheet
      if (status.static) next.static = status.static
      ;(state.assets as Record<PetAction, PetAssetStatus>)[action] = next
      if (
        next.sheet === 'error' &&
        state.animation.action === action &&
        state.animation.priority !== DRAG_PRIORITY &&
        state.animation.priority !== IDLE_PRIORITY &&
        next.static === 'error'
      ) {
        resetToIdle()
        scheduleRandom()
      }
    },

    playUserHappy: playUserHappyInternal,

    openMenu() {
      if (
        disposed ||
        state.paused ||
        state.route.mode === 'hidden' ||
        !state.environment.documentVisible
      ) {
        return
      }
      state.menuOpen = true
      clearRandomTimer()
      clearPagePendingTimer()
      pageGate.clearPending()
    },

    closeMenu() {
      if (!state.menuOpen) return
      state.menuOpen = false
      scheduleRandom()
    },

    setPosition(position: PetPositionState) {
      if (disposed) return
      state.position = { x: position.x, y: position.y }
    },

    beginDrag(position: PetPositionState) {
      if (disposed || state.paused || state.route.mode === 'hidden') return
      if (!state.environment.documentVisible) return
      if (state.menuOpen) closeMenuInternal()
      state.dragging = true
      state.position = { x: position.x, y: position.y }
      clearAllTimers()
      pageGate.clearPending()
      pendingPreReady = null
      clearPhotoLookCandidate()
      startAction('drag', DRAG_PRIORITY)
    },

    updateDragPosition(position: PetPositionState) {
      if (disposed || !state.dragging) return
      state.position = { x: position.x, y: position.y }
    },

    endDrag(commit: boolean) {
      if (disposed || !state.dragging) return
      state.dragging = false
      // The drag animation itself is an intentional active lock. Reset it
      // before the user-happy response so priority 3 is no longer rejected by
      // the still-current drag (priority 4) animation.
      resetToIdle()
      if (commit) {
        playUserHappyInternal()
      } else {
        scheduleRandom()
      }
    },

    cancelDrag() {
      if (!state.dragging) return
      state.dragging = false
      resetToIdle()
      scheduleRandom()
    },

    completeAnimation(generation: number) {
      if (disposed || generation !== state.animation.generation) return
      const completedPriority = state.animation.priority
      resetToIdle()
      if (completedPriority === PAGE_PRIORITY) {
        drainPageGate()
      } else {
        scheduleRandom()
      }
    },

    animationAssetFailed(action: PetAction) {
      if (disposed) return
      const status = state.assets[action]
      if (status.sheet !== 'error' && status.static !== 'error') return
      if (
        state.animation.action === action &&
        state.animation.priority !== DRAG_PRIORITY &&
        state.animation.priority !== IDLE_PRIORITY
      ) {
        resetToIdle()
        scheduleRandom()
      }
    },

    dispose() {
      if (disposed) return
      disposed = true
      clearAllTimers()
      disconnectHost?.()
      disconnectHost = null
      hostConnected = false
      state.hostConnected = false
      state.paused = false
      state.suspensionCount = 0
      state.menuOpen = false
      state.dragging = false
      clearPhotoLookCandidate()
      suspensions.clear()
      pendingPreReady = null
      pageGate.resetCooldown()
      resetToIdle()
    },
  }
}
