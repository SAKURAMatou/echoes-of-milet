import {
  PET_ATTENTION_REENTRY_COOLDOWN_MS,
  PET_LOOK_SENSOR,
} from '@/config/pet'
import {
  isPointInPetLookPreloadRange,
  isPointInPetLookSensor,
  resolvePetLookDirection,
} from './petLookGeometryCore'
import type { PetLookDirection, PetPositionState } from './petTypes'

export interface PetProximityOptions {
  getPetPosition(): PetPositionState
  getPetSize(): number
  enabled(): boolean
  canBeginAttention(): boolean
  isAttentionActive(): boolean
  onBegin(direction: PetLookDirection): void
  onUpdate(direction: PetLookDirection): void
  onEnd(): void
  onPreload(direction: PetLookDirection): void
}

export interface PetProximityController {
  attach(): void
  detach(): void
  reevaluate(): void
  suppress(durationMs: number): void
}

export function createPetProximityController(
  options: PetProximityOptions,
): PetProximityController {
  let attached = false
  let frame = 0
  let suppressTimer = 0
  let latestPoint: { x: number; y: number } | null = null
  let inRange = false
  let currentDirection: PetLookDirection | null = null
  let candidateDirection: PetLookDirection | null = null
  let candidateSince = 0
  let suppressUntil = 0
  let reentryAfter = 0
  const preloaded = new Set<PetLookDirection>()
  let capability: MediaQueryList | null = null

  function scheduleAfter(delayMs: number) {
    if (suppressTimer) window.clearTimeout(suppressTimer)
    suppressTimer = window.setTimeout(() => {
      suppressTimer = 0
      schedule()
    }, Math.max(0, delayMs) + 16)
  }

  function now() {
    return typeof performance === 'undefined' ? Date.now() : performance.now()
  }

  function input() {
    return {
      pointer: latestPoint || { x: 0, y: 0 },
      petPosition: options.getPetPosition(),
      petSize: options.getPetSize(),
      sensor: PET_LOOK_SENSOR,
    }
  }

  function endAttention(timestamp: number, applyCooldown: boolean) {
    if (inRange || options.isAttentionActive()) options.onEnd()
    inRange = false
    currentDirection = null
    candidateDirection = null
    candidateSince = 0
    if (applyCooldown) {
      reentryAfter = timestamp + PET_ATTENTION_REENTRY_COOLDOWN_MS
      scheduleAfter(PET_ATTENTION_REENTRY_COOLDOWN_MS)
    }
  }

  function evaluate(timestamp = now()) {
    frame = 0
    if (!latestPoint) return
    if (
      !attached ||
      !capability?.matches ||
      !options.enabled() ||
      timestamp < suppressUntil ||
      timestamp < reentryAfter
    ) {
      endAttention(timestamp, false)
      return
    }

    const geometry = input()
    const direction = resolvePetLookDirection(geometry, currentDirection)
    if (
      direction &&
      !preloaded.has(direction) &&
      isPointInPetLookPreloadRange(geometry, PET_LOOK_SENSOR.preloadRadius)
    ) {
      preloaded.add(direction)
      options.onPreload(direction)
    }

    if (!isPointInPetLookSensor(geometry, inRange)) {
      if (inRange) endAttention(timestamp, true)
      return
    }
    inRange = true
    if (!direction) return

    if (!currentDirection) {
      currentDirection = direction
      candidateDirection = null
      if (options.canBeginAttention()) options.onBegin(direction)
      return
    }

    if (!options.isAttentionActive()) {
      currentDirection = direction
      candidateDirection = null
      candidateSince = 0
      if (options.canBeginAttention()) options.onBegin(direction)
      return
    }

    if (direction === currentDirection) {
      candidateDirection = null
      candidateSince = 0
      return
    }
    if (candidateDirection !== direction) {
      candidateDirection = direction
      candidateSince = timestamp
    }
    if (timestamp - candidateSince < PET_LOOK_SENSOR.directionStableMs) {
      schedule()
      return
    }
    currentDirection = direction
    candidateDirection = null
    options.onUpdate(direction)
  }

  function schedule() {
    if (!attached || frame) return
    frame = window.requestAnimationFrame(evaluate)
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    latestPoint = { x: event.clientX, y: event.clientY }
    schedule()
  }

  function onPointerLeave(event: PointerEvent) {
    if (event.pointerType && event.pointerType !== 'mouse') return
    latestPoint = null
    endAttention(now(), true)
  }

  function onCapabilityChange() {
    if (!capability?.matches) endAttention(now(), false)
    else schedule()
  }

  function attach() {
    if (attached) return
    attached = true
    capability = window.matchMedia('(hover: hover) and (pointer: fine)')
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    capability.addEventListener('change', onCapabilityChange)
  }

  function detach() {
    if (!attached) return
    attached = false
    if (frame) window.cancelAnimationFrame(frame)
    if (suppressTimer) window.clearTimeout(suppressTimer)
    frame = 0
    suppressTimer = 0
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerleave', onPointerLeave)
    capability?.removeEventListener('change', onCapabilityChange)
    capability = null
    latestPoint = null
    endAttention(now(), false)
    preloaded.clear()
  }

  function reevaluate() {
    schedule()
  }

  function suppress(durationMs: number) {
    const duration = Math.max(0, durationMs)
    suppressUntil = Math.max(suppressUntil, now() + duration)
    scheduleAfter(duration)
    endAttention(now(), false)
  }

  return { attach, detach, reevaluate, suppress }
}
