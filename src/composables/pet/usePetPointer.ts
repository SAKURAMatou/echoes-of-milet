import {
  PET_DOUBLE_CLICK_DISTANCE_PX,
  PET_DOUBLE_CLICK_MS,
  PET_LONG_PRESS_MS,
} from '@/config/pet'
import { isPetDragStarted, PET_DRAG_THRESHOLD_PX } from './petGeometryCore'

export interface PetPointerClientPoint {
  x: number
  y: number
}

export type PetActivationInput = 'mouse' | 'touch' | 'keyboard'

export interface PetPointerHandlers {
  onPointerDown?(point: PetPointerClientPoint): void
  onSingleActivate(input: PetActivationInput): void
  onDoubleActivate(): void
  onLongPress(): void
  onDragStart(point: PetPointerClientPoint): void
  onDragMove(point: PetPointerClientPoint): void
  onDragEnd(commit: boolean): void
}

export interface PetPointerTimerScheduler {
  schedule(callback: () => void, delayMs: number): number
  cancel(timerId: number): void
}

export interface PetPointerOptions {
  dragThreshold?: number
  doubleClickMs?: number
  doubleClickDistance?: number
  longPressMs?: number
  doubleClickEnabled?: boolean | (() => boolean)
  timers?: PetPointerTimerScheduler
}

export interface PetPointerController {
  attach(element: HTMLElement): void
  detach(): void
  cancel(): void
}

const browserTimers: PetPointerTimerScheduler = {
  schedule(callback, delayMs) {
    return window.setTimeout(callback, delayMs)
  },
  cancel(timerId) {
    window.clearTimeout(timerId)
  },
}

export function createPetPointerController(
  handlers: PetPointerHandlers,
  options: PetPointerOptions | number = {},
): PetPointerController {
  const resolvedOptions = typeof options === 'number' ? { dragThreshold: options } : options
  const dragThreshold = resolvedOptions.dragThreshold ?? PET_DRAG_THRESHOLD_PX
  const doubleClickMs = resolvedOptions.doubleClickMs ?? PET_DOUBLE_CLICK_MS
  const doubleClickDistance =
    resolvedOptions.doubleClickDistance ?? PET_DOUBLE_CLICK_DISTANCE_PX
  const longPressMs = resolvedOptions.longPressMs ?? PET_LONG_PRESS_MS
  const timers = resolvedOptions.timers ?? browserTimers
  const doubleClickEnabled = () =>
    typeof resolvedOptions.doubleClickEnabled === 'function'
      ? resolvedOptions.doubleClickEnabled()
      : resolvedOptions.doubleClickEnabled !== false
  let element: HTMLElement | null = null
  let pointerId: number | null = null
  let pointerType = ''
  let dragging = false
  let longPressed = false
  let suppressNextClick = false
  let startPoint: PetPointerClientPoint | null = null
  let latestPoint: PetPointerClientPoint | null = null
  let moveFrame = 0
  let longPressTimer: number | null = null
  let pendingMouseClick: { point: PetPointerClientPoint; timer: number } | null = null

  function clearMoveFrame() {
    if (moveFrame && typeof window !== 'undefined') window.cancelAnimationFrame(moveFrame)
    moveFrame = 0
  }

  function clearLongPressTimer() {
    if (longPressTimer !== null) timers.cancel(longPressTimer)
    longPressTimer = null
  }

  function clearPendingMouseClick() {
    if (pendingMouseClick) timers.cancel(pendingMouseClick.timer)
    pendingMouseClick = null
  }

  function releasePointerCapture(capturedPointerId: number | null) {
    if (!element || capturedPointerId === null) return
    try {
      if (element.hasPointerCapture?.(capturedPointerId)) {
        element.releasePointerCapture(capturedPointerId)
      }
    } catch {
      // Capture can already be gone after pointerup or navigation.
    }
  }

  function resetActivePointer() {
    clearMoveFrame()
    clearLongPressTimer()
    const capturedPointerId = pointerId
    pointerId = null
    releasePointerCapture(capturedPointerId)
    pointerType = ''
    dragging = false
    longPressed = false
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

  function armMouseClick(point: PetPointerClientPoint) {
    const timer = timers.schedule(() => {
      if (pendingMouseClick?.timer !== timer) return
      pendingMouseClick = null
      handlers.onSingleActivate('mouse')
    }, doubleClickMs)
    pendingMouseClick = { point, timer }
  }

  function handleMouseActivation(point: PetPointerClientPoint) {
    if (!doubleClickEnabled()) {
      clearPendingMouseClick()
      handlers.onSingleActivate('mouse')
      return
    }
    const first = pendingMouseClick
    if (!first) {
      armMouseClick(point)
      return
    }
    const closeEnough =
      Math.hypot(point.x - first.point.x, point.y - first.point.y) <= doubleClickDistance
    clearPendingMouseClick()
    if (closeEnough) {
      handlers.onDoubleActivate()
      return
    }
    handlers.onSingleActivate('mouse')
    armMouseClick(point)
  }

  function onPointerDown(event: PointerEvent) {
    if (!element || event.button !== 0 || !event.isPrimary || pointerId !== null) return
    suppressNextClick = false
    pointerId = event.pointerId
    pointerType = event.pointerType || 'mouse'
    startPoint = { x: event.clientX, y: event.clientY }
    latestPoint = startPoint
    dragging = false
    longPressed = false
    handlers.onPointerDown?.(startPoint)

    if (pointerType === 'touch') {
      longPressTimer = timers.schedule(() => {
        longPressTimer = null
        if (pointerId !== event.pointerId || dragging || longPressed) return
        longPressed = true
        clearPendingMouseClick()
        handlers.onLongPress()
      }, longPressMs)
    }

    try {
      element.setPointerCapture(event.pointerId)
    } catch {
      // Best effort; normal pointer events remain usable.
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!element || !event.isPrimary || pointerId !== event.pointerId || !startPoint) return
    const nextPoint = { x: event.clientX, y: event.clientY }
    if (longPressed) return

    if (!dragging) {
      if (!isPetDragStarted(startPoint, nextPoint, dragThreshold)) return
      clearLongPressTimer()
      clearPendingMouseClick()
      dragging = true
      handlers.onDragStart(startPoint)
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
    const wasLongPressed = longPressed
    const completedPointerType = pointerType
    const point = { x: event.clientX, y: event.clientY }
    flushLatestMove()
    resetActivePointer()

    if (wasDragging) {
      handlers.onDragEnd(true)
    } else if (!wasLongPressed && completedPointerType === 'mouse') {
      handleMouseActivation(point)
    } else if (!wasLongPressed) {
      handlers.onSingleActivate('touch')
    }
    suppressNextClick = true
  }

  function finishWithoutCommit() {
    const wasDragging = dragging
    flushLatestMove()
    resetActivePointer()
    clearPendingMouseClick()
    if (wasDragging) handlers.onDragEnd(false)
    suppressNextClick = true
  }

  function onPointerCancel(event: PointerEvent) {
    if (pointerId === event.pointerId) finishWithoutCommit()
  }

  function onLostPointerCapture(event: PointerEvent) {
    if (pointerId === event.pointerId) finishWithoutCommit()
  }

  function onWindowBlur() {
    if (pointerId !== null || pendingMouseClick) finishWithoutCommit()
  }

  function onVisibilityChange() {
    if (typeof document !== 'undefined' && document.hidden) finishWithoutCommit()
  }

  function onClick(event: MouseEvent) {
    if (event.detail === 0) {
      suppressNextClick = false
      clearPendingMouseClick()
      handlers.onSingleActivate('keyboard')
      return
    }
    if (suppressNextClick) {
      suppressNextClick = false
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function onDoubleClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  function onKeyDown() {
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
    element.addEventListener('dblclick', onDoubleClick)
    element.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  function detach() {
    if (pointerId !== null || dragging || pendingMouseClick) finishWithoutCommit()
    if (!element) return
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', onPointerEnd)
    element.removeEventListener('pointercancel', onPointerCancel)
    element.removeEventListener('lostpointercapture', onLostPointerCapture)
    element.removeEventListener('click', onClick)
    element.removeEventListener('dblclick', onDoubleClick)
    element.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('blur', onWindowBlur)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    resetActivePointer()
    clearPendingMouseClick()
    suppressNextClick = false
    element = null
  }

  function cancel() {
    finishWithoutCommit()
    suppressNextClick = false
  }

  return { attach, detach, cancel }
}
