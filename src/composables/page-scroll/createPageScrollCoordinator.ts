import { computed, reactive, readonly } from 'vue'

import {
  bindPageScroll,
  readPageScrollMax,
  readPageScrollTop,
  readPageViewport,
  scrollPageTo,
} from './pageScrollTarget'
import type {
  PageScrollAnchorOptions,
  PageScrollCoordinator,
  PageScrollFrame,
  PageScrollState,
  PageScrollTarget,
  PageScrollToOptions,
  ScrollSnapshot,
} from './pageScrollTypes'

const DESKTOP_QUERY = '(min-width: 768px)'
const SCROLL_IDLE_DELAY = 140

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

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
  const handleMediaChange = () => selectTarget(true)

  function notifySubscribers() {
    const frame: PageScrollFrame = { state: readonlyState, target }
    subscribers.forEach((callback) => callback(frame))
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

  function lockPageScroll() {
    if (disposed) return () => {}
    const token = Symbol('page-scroll-lock')
    lockTokens.add(token)
    state.lockCount = lockTokens.size
    state.isLocked = lockTokens.size > 0

    let active = true
    return () => {
      if (!active || disposed) return
      active = false
      lockTokens.delete(token)
      state.lockCount = lockTokens.size
      state.isLocked = lockTokens.size > 0
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
    }
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
    captureSnapshot: (): ScrollSnapshot => ({
      top: state.top,
      max: state.max,
      capturedAt: Date.now(),
    }),
    restoreSnapshot: (snapshot, options = {}) => scrollToPosition(snapshot.top, options),
    registerElementTarget,
    registerContentMetricsElement,
    invalidateMetrics: scheduleMeasure,
    lockPageScroll,
    subscribeScrollFrame,
    dispose,
  }
}
