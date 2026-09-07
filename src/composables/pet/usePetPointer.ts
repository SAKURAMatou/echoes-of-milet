import { isPetDragStarted, PET_DRAG_THRESHOLD_PX } from './petGeometryCore'

export interface PetPointerClientPoint {
  x: number
  y: number
}

export interface PetPointerHandlers {
  onPointerDown?(point: PetPointerClientPoint): void
  onActivate(): void
  onDragStart(point: PetPointerClientPoint): void
  onDragMove(point: PetPointerClientPoint): void
  onDragEnd(commit: boolean): void
}

export interface PetPointerController {
  attach(element: HTMLElement): void
  detach(): void
  cancel(): void
}

export function createPetPointerController(
  handlers: PetPointerHandlers,
  dragThreshold = PET_DRAG_THRESHOLD_PX,
): PetPointerController {
  let element: HTMLElement | null = null
  let pointerId: number | null = null
  let dragging = false
  let suppressNextClick = false
  let startPoint: PetPointerClientPoint | null = null
  let latestPoint: PetPointerClientPoint | null = null
  let moveFrame = 0

  function clearMoveFrame() {
    if (moveFrame && typeof window !== 'undefined') {
      window.cancelAnimationFrame(moveFrame)
    }
    moveFrame = 0
  }

  function releasePointerCapture() {
    if (!element || pointerId === null) return
    try {
      if (element.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId)
      }
    } catch {
      // Pointer capture can already be gone after pointerup or a route change.
    }
  }

  function resetPointer() {
    clearMoveFrame()
    const capturedPointerId = pointerId
    // Drop the local pointer id before releasing capture: browsers can emit
    // lostpointercapture synchronously and it must not cancel twice.
    pointerId = null
    if (capturedPointerId !== null) releasePointerCapture()
    dragging = false
    startPoint = null
    latestPoint = null
  }

  function flushLatestMove() {
    clearMoveFrame()
    if (dragging && latestPoint) {
      const point = latestPoint
      latestPoint = null
      handlers.onDragMove(point)
    }
  }

  function suppressPointerClick() {
    suppressNextClick = true
  }

  function requestMoveFrame(): number {
    if (typeof window === 'undefined') return 0
    return window.requestAnimationFrame(() => {
      moveFrame = 0
      if (dragging && latestPoint) {
        const point = latestPoint
        latestPoint = null
        handlers.onDragMove(point)
      }
    })
  }

  function onPointerDown(event: PointerEvent) {
    if (!element || event.button !== 0 || !event.isPrimary) return
    suppressNextClick = false
    if (pointerId !== null) return

    pointerId = event.pointerId
    startPoint = { x: event.clientX, y: event.clientY }
    latestPoint = startPoint
    dragging = false
    handlers.onPointerDown?.(startPoint)
    try {
      element.setPointerCapture(event.pointerId)
    } catch {
      // Capturing is best-effort; normal pointer events still work.
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!element || !event.isPrimary || pointerId !== event.pointerId || !startPoint) return
    const nextPoint = { x: event.clientX, y: event.clientY }

    if (!dragging) {
      if (!isPetDragStarted(startPoint, nextPoint, dragThreshold)) return
      dragging = true
      handlers.onDragStart(startPoint)
      // The move that crossed the threshold is also the first drag coordinate.
      latestPoint = nextPoint
      moveFrame = requestMoveFrame()
      return
    }

    latestPoint = nextPoint
    if (!moveFrame) moveFrame = requestMoveFrame()
  }

  function onPointerEnd(event: PointerEvent) {
    if (!element || pointerId !== event.pointerId) return
    const wasDragging = dragging
    // Flush the last queued coordinate before ending so pointerup cannot drop
    // the final drag position.
    flushLatestMove()
    resetPointer()

    if (wasDragging) {
      handlers.onDragEnd(true)
    } else {
      handlers.onActivate()
    }
    suppressPointerClick()
  }

  function finishWithoutCommit() {
    const wasDragging = dragging
    flushLatestMove()
    resetPointer()
    if (wasDragging) handlers.onDragEnd(false)
    suppressPointerClick()
  }

  function onPointerCancel(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    finishWithoutCommit()
  }

  function onLostPointerCapture(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    finishWithoutCommit()
  }

  function onWindowBlur() {
    if (pointerId === null && !dragging) return
    finishWithoutCommit()
  }

  function onVisibilityChange() {
    if (typeof document === 'undefined' || !document.hidden) return
    if (pointerId === null && !dragging) return
    finishWithoutCommit()
  }

  function onClick(event: MouseEvent) {
    if (event.detail === 0) {
      // Keyboard activation (Enter/Space) must never be swallowed by a stale
      // pointer suppression flag.
      suppressNextClick = false
      handlers.onActivate()
      return
    }
    if (!suppressNextClick) {
      handlers.onActivate()
      return
    }
    suppressNextClick = false
    event.preventDefault()
    event.stopPropagation()
  }

  function onKeyDown() {
    // A prior pointer path that never produced a click event must not swallow
    // the next keyboard-generated activation.
    suppressNextClick = false
  }

  function attach(nextElement: HTMLElement) {
    detach()
    element = nextElement
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerEnd)
    element.addEventListener('pointercancel', onPointerCancel)
    element.addEventListener('lostpointercapture', onLostPointerCapture)
    element.addEventListener('click', onClick)
    element.addEventListener('keydown', onKeyDown)
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', onWindowBlur)
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange)
    }
  }

  function detach() {
    if (pointerId !== null || dragging) {
      finishWithoutCommit()
    }
    if (!element) return
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerEnd)
    element.removeEventListener('pointercancel', onPointerCancel)
    element.removeEventListener('lostpointercapture', onLostPointerCapture)
    element.removeEventListener('click', onClick)
    element.removeEventListener('keydown', onKeyDown)
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', onWindowBlur)
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    resetPointer()
    suppressNextClick = false
    element = null
  }

  function cancel() {
    finishWithoutCommit()
    suppressNextClick = false
  }

  return { attach, detach, cancel }
}
