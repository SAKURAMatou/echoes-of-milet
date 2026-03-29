import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

type SwipeMode = 'idle' | 'pending' | 'carousel' | 'inline' | 'vertical'

interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

interface UseSwipeOptions extends SwipeCallbacks {
  dx?: Ref<number>
  decisionThresholdPx?: number
  edgeTolerancePx?: number
  handoffThresholdPx?: number
  inlineScrollSelector?: string
}

export function useSwipe(options: UseSwipeOptions = {}) {
  const dx = options.dx ?? ref(0)
  const dragging = ref(false)
  const interactionActive = computed(() => state.mode !== 'idle')

  const decisionThresholdPx = options.decisionThresholdPx ?? 8
  const edgeTolerancePx = options.edgeTolerancePx ?? 2
  const handoffThresholdPx = options.handoffThresholdPx ?? 18
  const inlineScrollSelector = options.inlineScrollSelector ?? '[data-inline-scroll]'

  let previousUserSelect = ''

  const state = {
    pointerId: -1,
    startX: 0,
    startY: 0,
    mode: 'idle' as SwipeMode,
    inlineEl: null as HTMLElement | null,
    inlineStartScrollLeft: 0,
    surfaceEl: null as HTMLElement | null,
  }

  function reset() {
    dragging.value = false
    dx.value = 0
    state.pointerId = -1
    state.startX = 0
    state.startY = 0
    state.mode = 'idle'
    state.inlineEl = null
    state.inlineStartScrollLeft = 0
    state.surfaceEl = null
    restoreUserSelect()
  }

  function restoreUserSelect() {
    document.body.style.userSelect = previousUserSelect
  }

  function lockUserSelect() {
    previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
  }

  function getInlineScrollTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return null
    return target.closest(inlineScrollSelector) as HTMLElement | null
  }

  function canInlineScroll(el: HTMLElement, deltaX: number) {
    const maxScrollLeft = el.scrollWidth - el.clientWidth
    if (maxScrollLeft <= edgeTolerancePx) return false

    if (deltaX < 0) return el.scrollLeft < maxScrollLeft - edgeTolerancePx
    if (deltaX > 0) return el.scrollLeft > edgeTolerancePx
    return false
  }

  function updateInlineScroll(deltaX: number) {
    if (!state.inlineEl) {
      return { reachedEdge: false, remainingDeltaX: deltaX }
    }

    const el = state.inlineEl
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const desiredScrollLeft = state.inlineStartScrollLeft - deltaX
    const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, desiredScrollLeft))

    el.scrollLeft = nextScrollLeft

    const consumedDeltaX = state.inlineStartScrollLeft - nextScrollLeft
    const remainingDeltaX = deltaX - consumedDeltaX
    const reachedEdge =
      nextScrollLeft <= edgeTolerancePx ||
      nextScrollLeft >= maxScrollLeft - edgeTolerancePx

    return { reachedEdge, remainingDeltaX }
  }

  function startCarouselSwipe(e: PointerEvent, deltaX: number) {
    state.mode = 'carousel'
    dragging.value = true
    dx.value = deltaX
    state.surfaceEl?.setPointerCapture?.(e.pointerId)
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0) return

    lockUserSelect()
    state.pointerId = e.pointerId
    state.startX = e.clientX
    state.startY = e.clientY
    state.mode = 'pending'
    state.surfaceEl = e.currentTarget instanceof HTMLElement ? e.currentTarget : null
    state.inlineEl = getInlineScrollTarget(e.target)
    state.inlineStartScrollLeft = state.inlineEl?.scrollLeft ?? 0
    dragging.value = false
    dx.value = 0
  }

  function handoffInlineToCarousel(e: PointerEvent, remainingDeltaX: number) {
    state.startX = e.clientX - remainingDeltaX
    startCarouselSwipe(e, remainingDeltaX)
  }

  function handlePointerMove(e: PointerEvent) {
    if (state.pointerId !== e.pointerId || state.mode === 'idle') return

    const deltaX = e.clientX - state.startX
    const deltaY = e.clientY - state.startY

    if (state.mode === 'carousel') {
      dx.value = deltaX
      e.preventDefault()
      return
    }

    if (state.mode === 'inline') {
      const { remainingDeltaX, reachedEdge } = updateInlineScroll(deltaX)
      e.preventDefault()

      if (reachedEdge && Math.abs(remainingDeltaX) > handoffThresholdPx) {
        handoffInlineToCarousel(e, remainingDeltaX)
      }
      return
    }

    if (state.mode !== 'pending') return

    if (
      Math.abs(deltaX) < decisionThresholdPx &&
      Math.abs(deltaY) < decisionThresholdPx
    ) {
      return
    }

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      state.mode = 'vertical'
      return
    }

    if (state.inlineEl && canInlineScroll(state.inlineEl, deltaX)) {
      state.mode = 'inline'
      const { remainingDeltaX, reachedEdge } = updateInlineScroll(deltaX)
      e.preventDefault()

      if (reachedEdge && Math.abs(remainingDeltaX) > handoffThresholdPx) {
        handoffInlineToCarousel(e, remainingDeltaX)
      }
      return
    }

    startCarouselSwipe(e, deltaX)
  }

  function handlePointerEnd() {
    if (state.mode === 'carousel') {
      const surfaceWidth = state.surfaceEl?.clientWidth ?? 0
      const threshold = Math.max(56, Math.min(120, surfaceWidth * 0.18))

      if (dx.value > threshold) options.onSwipeRight?.()
      else if (dx.value < -threshold) options.onSwipeLeft?.()
    }

    if (
      state.pointerId !== -1 &&
      state.surfaceEl?.hasPointerCapture?.(state.pointerId)
    ) {
      state.surfaceEl.releasePointerCapture(state.pointerId)
    }

    reset()
  }

  onBeforeUnmount(() => {
    restoreUserSelect()
  })

  return {
    dx,
    dragging,
    interactionActive,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    reset,
  }
}
