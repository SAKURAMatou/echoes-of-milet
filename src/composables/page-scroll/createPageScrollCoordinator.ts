import { computed, reactive, readonly } from 'vue'

import {
  bindPageScroll,
  readPageScrollMax,
  readPageScrollTop,
  readPageViewport,
  scrollPageTo,
} from './pageScrollTarget'
import type {
  BeginScrollNavigationOptions,
  PageScrollAnchorOptions,
  PageScrollCoordinator,
  PageScrollFrame,
  PageScrollRestorer,
  PageScrollState,
  PageScrollTarget,
  PageScrollToOptions,
  ScrollNavigationIntent,
  ScrollSnapshot,
} from './pageScrollTypes'

const DESKTOP_QUERY = '(min-width: 768px)'
const SCROLL_IDLE_DELAY = 140
const LAYOUT_STABILITY_TIMEOUT = 700

interface NavigationGeneration {
  id: number
  controller: AbortController
  fromEntryKey: string | null
  toEntryKey: string | null
  fromSnapshot: ScrollSnapshot
  isHistoryNavigation: boolean
  intent: ScrollNavigationIntent | null
  pendingTokens: Set<symbol>
  registrationOpen: boolean
  navigationConfirmed: boolean
  executing: boolean
  consumed: boolean
}

function resolveAnchorElement(anchor: string | HTMLElement): HTMLElement | null {
  if (typeof HTMLElement !== 'undefined' && anchor instanceof HTMLElement) return anchor
  if (typeof document === 'undefined' || typeof anchor !== 'string') return null

  const encodedId = anchor.startsWith('#') ? anchor.slice(1) : anchor
  if (!encodedId) return null

  let id = encodedId
  try {
    id = decodeURIComponent(encodedId)
  } catch {
    // A malformed hash can still refer to a literal DOM id.
  }

  return document.getElementById(id)
}

function resolveBehavior(behavior: ScrollBehavior | undefined): ScrollBehavior {
  if (behavior !== 'smooth' || typeof window === 'undefined') return behavior || 'auto'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior
}

export function createPageScrollCoordinator(): PageScrollCoordinator {
  const state = reactive<PageScrollState>({
    top: 0,
    max: 0,
    progress: 0,
    direction: 'idle',
    isScrolling: false,
    targetKind: 'window',
    viewportTop: 0,
    viewportHeight: 0,
    isLocked: false,
    lockCount: 0,
  })

  const readonlyState = readonly(state)
  const pageScrollLocked = computed(() => state.isLocked)
  const subscribers = new Set<(frame: PageScrollFrame) => void>()
  const lockTokens = new Set<symbol>()

  let disposed = false
  let elementTarget: HTMLElement | null = null
  let contentMetricsElement: HTMLElement | null = null
  let target: PageScrollTarget | null = null
  let unbindTarget: (() => void) | null = null
  let mediaQuery: MediaQueryList | null = null
  let resizeObserver: ResizeObserver | null = null
  let animationFrame = 0
  let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null
  let previousTop = 0
  let activeRestorer: PageScrollRestorer | null = null
  let generationSequence = 0
  let activeGeneration: NavigationGeneration | null = null
  let nextNavigationIntent: ScrollNavigationIntent | null = null
  let appMounted = false
  let releasePhysicalLock: (() => void) | null = null
  const snapshots = new Map<string, ScrollSnapshot>()

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
  const handleMediaChange = () => selectTarget(true)

  function notifySubscribers() {
    const frame: PageScrollFrame = { state: readonlyState, target }
    subscribers.forEach((callback) => callback(frame))
  }

  function captureSnapshot(): ScrollSnapshot {
    const fallback: ScrollSnapshot = {
      top: target ? readPageScrollTop(target) : state.top,
      max: target ? readPageScrollMax(target) : state.max,
      capturedAt: Date.now(),
    }

    if (!activeRestorer) return fallback
    try {
      return { ...fallback, ...activeRestorer.capture(), capturedAt: Date.now() }
    } catch {
      return fallback
    }
  }

  function waitForAnimationFrame(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted || !isBrowser) {
        resolve()
        return
      }
      window.requestAnimationFrame(() => resolve())
    })
  }

  async function waitForStableLayout(signal: AbortSignal) {
    if (!isBrowser || signal.aborted) return
    const startedAt = performance.now()
    let stableFrames = 0
    let lastMax = target ? readPageScrollMax(target) : 0

    while (!signal.aborted && performance.now() - startedAt < LAYOUT_STABILITY_TIMEOUT) {
      await waitForAnimationFrame(signal)
      if (signal.aborted) return
      const nextMax = target ? readPageScrollMax(target) : 0
      stableFrames = Math.abs(nextMax - lastMax) <= 1 ? stableFrames + 1 : 0
      lastMax = nextMax
      if (stableFrames >= 2) return
    }
  }

  async function executeNavigation(generation: NavigationGeneration) {
    if (
      disposed ||
      generation !== activeGeneration ||
      generation.executing ||
      generation.consumed ||
      generation.registrationOpen ||
      !generation.navigationConfirmed ||
      generation.pendingTokens.size > 0 ||
      !generation.intent ||
      !appMounted
    ) {
      return
    }

    generation.executing = true
    const { signal } = generation.controller
    const intent = generation.intent
    const snapshot =
      intent.kind === 'restore' && generation.toEntryKey
        ? snapshots.get(generation.toEntryKey)
        : intent.kind === 'preserve'
          ? generation.fromSnapshot
          : undefined

    try {
      if (snapshot && activeRestorer?.prepare) {
        await activeRestorer.prepare(snapshot, signal)
      }
      if (signal.aborted || generation !== activeGeneration) return

      await waitForStableLayout(signal)
      if (signal.aborted || generation !== activeGeneration) return

      if (intent.kind === 'manual') {
        // The page explicitly owns its scroll behavior.
      } else if (intent.kind === 'anchor') {
        scrollToAnchor(intent.anchor, { behavior: intent.behavior || 'auto' })
      } else if (snapshot) {
        const restored = activeRestorer?.restore(snapshot) || false
        if (!restored) scrollToPosition(snapshot.top, { behavior: 'auto' })
      } else {
        scrollToPosition(0, { behavior: 'auto' })
      }
      generation.consumed = true
    } finally {
      generation.executing = false
    }
  }

  function maybeExecuteNavigation(generation: NavigationGeneration | null) {
    if (!generation) return
    void executeNavigation(generation)
  }

  function beginNavigation(options: BeginScrollNavigationOptions): number {
    if (
      options.redirected &&
      activeGeneration &&
      !activeGeneration.navigationConfirmed &&
      !activeGeneration.consumed
    ) {
      return activeGeneration.id
    }

    if (activeGeneration && !activeGeneration.controller.signal.aborted) {
      activeGeneration.controller.abort()
    }

    const fromSnapshot = captureSnapshot()
    if (options.fromEntryKey) snapshots.set(options.fromEntryKey, fromSnapshot)
    const generation: NavigationGeneration = {
      id: ++generationSequence,
      controller: new AbortController(),
      fromEntryKey: options.fromEntryKey,
      toEntryKey: null,
      fromSnapshot,
      isHistoryNavigation: options.isHistoryNavigation,
      intent: null,
      pendingTokens: new Set(),
      registrationOpen: true,
      navigationConfirmed: false,
      executing: false,
      consumed: false,
    }
    activeGeneration = generation
    return generation.id
  }

  function getGeneration(generationId: number) {
    return activeGeneration?.id === generationId ? activeGeneration : null
  }

  function submitNavigationIntent(generationId: number, intent: ScrollNavigationIntent) {
    const generation = getGeneration(generationId)
    if (!generation || generation.controller.signal.aborted) return
    generation.intent = intent
    maybeExecuteNavigation(generation)
  }

  function confirmNavigation(generationId: number, toEntryKey: string) {
    const generation = getGeneration(generationId)
    if (!generation || generation.controller.signal.aborted) return
    generation.toEntryKey = toEntryKey
    generation.navigationConfirmed = true
    maybeExecuteNavigation(generation)
  }

  function abortNavigation(generationId: number) {
    const generation = getGeneration(generationId)
    if (!generation) return
    generation.controller.abort()
    generation.pendingTokens.clear()
    generation.consumed = true
  }

  function closeNavigationRegistrationWindow(generationId: number) {
    const generation = getGeneration(generationId)
    if (!generation || generation.controller.signal.aborted) return
    generation.registrationOpen = false
    maybeExecuteNavigation(generation)
  }

  function markScrollContentPending() {
    const generation = activeGeneration
    if (!generation || generation.consumed || generation.controller.signal.aborted) return () => {}

    const token = Symbol('page-scroll-content-pending')
    generation.pendingTokens.add(token)
    let active = true
    return () => {
      if (!active) return
      active = false
      generation.pendingTokens.delete(token)
      maybeExecuteNavigation(generation)
    }
  }

  function registerPageScrollRestorer(restorer: PageScrollRestorer) {
    if (disposed) return () => {}
    activeRestorer = restorer
    let active = true
    return () => {
      if (!active) return
      active = false
      if (activeRestorer === restorer) activeRestorer = null
    }
  }

  function interruptPendingNavigation() {
    const generation = activeGeneration
    if (!generation || generation.consumed || generation.controller.signal.aborted) return
    generation.controller.abort()
    generation.consumed = true
  }

  function handleScrollKey(event: KeyboardEvent) {
    if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
      interruptPendingNavigation()
    }
  }

  function measure() {
    animationFrame = 0
    if (disposed || !target) return

    if (target.kind === 'element' && !target.target.isConnected) {
      elementTarget = null
      selectTarget(false)
      return
    }

    const nextTop = readPageScrollTop(target)
    const nextMax = readPageScrollMax(target)
    const viewport = readPageViewport(target)

    state.direction = nextTop > previousTop ? 'down' : nextTop < previousTop ? 'up' : 'idle'
    state.top = nextTop
    state.max = nextMax
    state.progress = nextMax > 0 ? Math.min(1, Math.max(0, nextTop / nextMax)) : 0
    state.targetKind = target.kind
    state.viewportTop = viewport.top
    state.viewportHeight = viewport.height
    previousTop = nextTop
    notifySubscribers()
  }

  function scheduleMeasure() {
    if (disposed || !isBrowser || animationFrame) return
    animationFrame = window.requestAnimationFrame(measure)
  }

  function markScrolling() {
    if (disposed) return
    state.isScrolling = true
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = setTimeout(() => {
      scrollIdleTimer = null
      if (disposed) return
      state.isScrolling = false
      scheduleMeasure()
    }, SCROLL_IDLE_DELAY)
    scheduleMeasure()
  }

  function refreshResizeObserver() {
    resizeObserver?.disconnect()
    if (!resizeObserver) return

    if (target?.kind === 'element') resizeObserver.observe(target.target)
    if (contentMetricsElement?.isConnected) resizeObserver.observe(contentMetricsElement)
  }

  function getPreferredTarget(): PageScrollTarget | null {
    if (!isBrowser) return null
    const desktop = mediaQuery?.matches ?? window.matchMedia(DESKTOP_QUERY).matches
    if (desktop && elementTarget?.isConnected) {
      return { kind: 'element', target: elementTarget }
    }
    return { kind: 'window', target: window }
  }

  function selectTarget(preserveTop = true) {
    if (disposed) return
    const nextTarget = getPreferredTarget()
    if (
      target?.kind === nextTarget?.kind &&
      (!target || !nextTarget || target.target === nextTarget.target)
    ) {
      scheduleMeasure()
      return
    }

    const previousScrollTop = preserveTop && target ? readPageScrollTop(target) : 0
    releasePhysicalLock?.()
    releasePhysicalLock = null
    unbindTarget?.()
    unbindTarget = null
    target = nextTarget

    if (target) {
      previousTop = preserveTop ? Math.min(previousScrollTop, readPageScrollMax(target)) : 0
      if (preserveTop && previousScrollTop > 0) {
        scrollPageTo(target, { top: previousTop, left: 0, behavior: 'auto' })
      }
      unbindTarget = bindPageScroll(target, markScrolling)
    }

    refreshResizeObserver()
    if (lockTokens.size > 0) releasePhysicalLock = applyPhysicalLock()
    scheduleMeasure()
  }

  function scrollToPosition(top: number, options: PageScrollToOptions = {}) {
    if (!target) return
    scrollPageTo(target, {
      top: Math.max(0, Math.min(top, readPageScrollMax(target))),
      left: 0,
      behavior: resolveBehavior(options.behavior),
    })
    scheduleMeasure()
  }

  function scrollToAnchor(
    anchor: string | HTMLElement,
    options: PageScrollAnchorOptions = {},
  ): boolean {
    if (!target || !isBrowser) return false
    const element = resolveAnchorElement(anchor)
    if (!element) return false

    const styleOffset = Number.parseFloat(window.getComputedStyle(element).scrollMarginTop) || 0
    const requestedOffset = Math.max(styleOffset, options.offset || 0)
    const elementTop = element.getBoundingClientRect().top
    let nextTop = state.top

    if (target.kind === 'element') {
      nextTop = elementTop - target.target.getBoundingClientRect().top + target.target.scrollTop
    } else {
      const headerOffset = document.querySelector('header')?.getBoundingClientRect().height || 0
      nextTop = elementTop + window.scrollY - Math.max(requestedOffset, headerOffset + 12)
    }

    if (target.kind === 'element') nextTop -= requestedOffset
    scrollToPosition(nextTop, options)

    if (options.focus) {
      element.focus({ preventScroll: true })
    }
    return true
  }

  function registerElementTarget(element: HTMLElement) {
    if (disposed) return () => {}
    elementTarget = element
    selectTarget()

    let active = true
    return () => {
      if (!active || disposed) return
      active = false
      if (elementTarget !== element) return
      elementTarget = null
      selectTarget()
    }
  }

  function registerContentMetricsElement(element: HTMLElement) {
    if (disposed) return () => {}
    contentMetricsElement = element
    refreshResizeObserver()
    scheduleMeasure()

    let active = true
    return () => {
      if (!active || disposed) return
      active = false
      if (contentMetricsElement !== element) return
      contentMetricsElement = null
      refreshResizeObserver()
      scheduleMeasure()
    }
  }

  function applyPhysicalLock(): (() => void) | null {
    if (!target || !isBrowser) return null
    const lockedTarget = target
    const lockedTop = readPageScrollTop(lockedTarget)

    if (lockedTarget.kind === 'element') {
      const element = lockedTarget.target
      const previousOverflow = element.style.overflow
      const previousOverscrollBehavior = element.style.overscrollBehavior
      element.style.overflow = 'hidden'
      element.style.overscrollBehavior = 'contain'
      return () => {
        element.style.overflow = previousOverflow
        element.style.overscrollBehavior = previousOverscrollBehavior
        element.scrollTo({ top: lockedTop, left: 0, behavior: 'auto' })
      }
    }

    const body = document.body
    const documentElement = document.documentElement
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      documentOverflow: documentElement.style.overflow,
    }
    const scrollbarWidth = Math.max(0, window.innerWidth - documentElement.clientWidth)
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${lockedTop}px`
    body.style.width = '100%'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    documentElement.style.overflow = 'hidden'

    return () => {
      body.style.overflow = previous.bodyOverflow
      body.style.position = previous.bodyPosition
      body.style.top = previous.bodyTop
      body.style.width = previous.bodyWidth
      body.style.paddingRight = previous.bodyPaddingRight
      documentElement.style.overflow = previous.documentOverflow
      window.scrollTo({ top: lockedTop, left: 0, behavior: 'auto' })
    }
  }

  function lockPageScroll() {
    if (disposed) return () => {}
    const token = Symbol('page-scroll-lock')
    lockTokens.add(token)
    state.lockCount = lockTokens.size
    state.isLocked = lockTokens.size > 0
    if (lockTokens.size === 1) releasePhysicalLock = applyPhysicalLock()

    let active = true
    return () => {
      if (!active || disposed) return
      active = false
      lockTokens.delete(token)
      state.lockCount = lockTokens.size
      state.isLocked = lockTokens.size > 0
      if (lockTokens.size === 0) {
        releasePhysicalLock?.()
        releasePhysicalLock = null
        scheduleMeasure()
      }
    }
  }

  function subscribeScrollFrame(callback: (frame: PageScrollFrame) => void) {
    if (disposed) return () => {}
    subscribers.add(callback)

    let active = true
    return () => {
      if (!active) return
      active = false
      subscribers.delete(callback)
    }
  }

  function dispose() {
    if (disposed) return
    disposed = true
    unbindTarget?.()
    unbindTarget = null
    if (animationFrame && isBrowser) window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = null
    mediaQuery?.removeEventListener('change', handleMediaChange)
    mediaQuery = null
    resizeObserver?.disconnect()
    resizeObserver = null
    if (isBrowser) {
      window.removeEventListener('resize', scheduleMeasure)
      window.visualViewport?.removeEventListener('resize', scheduleMeasure)
      window.removeEventListener('wheel', interruptPendingNavigation)
      window.removeEventListener('touchmove', interruptPendingNavigation)
      window.removeEventListener('pointerdown', interruptPendingNavigation)
      window.removeEventListener('keydown', handleScrollKey)
    }
    activeGeneration?.controller.abort()
    activeGeneration = null
    activeRestorer = null
    snapshots.clear()
    releasePhysicalLock?.()
    releasePhysicalLock = null
    subscribers.clear()
    lockTokens.clear()
    state.lockCount = 0
    state.isLocked = false
    target = null
    elementTarget = null
    contentMetricsElement = null
  }

  if (isBrowser) {
    mediaQuery = window.matchMedia(DESKTOP_QUERY)
    mediaQuery.addEventListener('change', handleMediaChange)
    window.addEventListener('resize', scheduleMeasure, { passive: true })
    window.visualViewport?.addEventListener('resize', scheduleMeasure, { passive: true })
    window.addEventListener('wheel', interruptPendingNavigation, { passive: true })
    window.addEventListener('touchmove', interruptPendingNavigation, { passive: true })
    window.addEventListener('pointerdown', interruptPendingNavigation, { passive: true })
    window.addEventListener('keydown', handleScrollKey)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure)
    }
    selectTarget(false)
  }

  return {
    state: readonlyState,
    pageScrollLocked,
    getTarget: () => target,
    scrollToTop: (options = {}) => scrollToPosition(0, options),
    scrollToPosition,
    scrollToAnchor,
    captureSnapshot,
    restoreSnapshot: (snapshot, options = {}) => scrollToPosition(snapshot.top, options),
    registerElementTarget,
    registerContentMetricsElement,
    registerPageScrollRestorer,
    invalidateMetrics: scheduleMeasure,
    lockPageScroll,
    subscribeScrollFrame,
    markScrollContentPending,
    beginNavigation,
    submitNavigationIntent,
    confirmNavigation,
    abortNavigation,
    closeNavigationRegistrationWindow,
    notifyAppMounted: () => {
      appMounted = true
      if (activeGeneration) {
        activeGeneration.registrationOpen = false
        maybeExecuteNavigation(activeGeneration)
      }
    },
    setNextNavigationIntent: (intent) => {
      nextNavigationIntent = intent
    },
    consumeNextNavigationIntent: () => {
      const intent = nextNavigationIntent
      nextNavigationIntent = null
      return intent
    },
    dispose,
  }
}
