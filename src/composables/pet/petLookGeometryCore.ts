import type { PetLookDirection, PetPositionState } from './petTypes'

export interface PetLookSensorGeometry {
  enterRadiusX: number
  enterRadiusY: number
  exitRadiusX: number
  exitRadiusY: number
  centerOffsetY: number
  centerDeadZone: number
  angleHysteresisDeg: number
  referenceSize: number
}

export interface PetLookPoint {
  x: number
  y: number
}

export interface PetLookTargetInput {
  pointer: PetLookPoint
  petPosition: PetPositionState
  petSize: number
  sensor: PetLookSensorGeometry
}

export function resolvePetLookOffset(input: PetLookTargetInput): PetLookPoint {
  const scale = input.petSize / Math.max(1, input.sensor.referenceSize)
  return {
    x: input.pointer.x - (input.petPosition.x + input.petSize / 2),
    y:
      input.pointer.y -
      (input.petPosition.y + input.petSize / 2 + input.sensor.centerOffsetY * scale),
  }
}

export function isPointInPetLookSensor(input: PetLookTargetInput, active: boolean): boolean {
  const offset = resolvePetLookOffset(input)
  const scale = input.petSize / Math.max(1, input.sensor.referenceSize)
  const radiusX = (active ? input.sensor.exitRadiusX : input.sensor.enterRadiusX) * scale
  const radiusY = (active ? input.sensor.exitRadiusY : input.sensor.enterRadiusY) * scale
  if (radiusX <= 0 || radiusY <= 0) return false
  return (offset.x / radiusX) ** 2 + (offset.y / radiusY) ** 2 <= 1
}

export function resolvePetLookDirection(
  input: PetLookTargetInput,
  current: PetLookDirection | null = null,
): PetLookDirection | null {
  const offset = resolvePetLookOffset(input)
  const scale = input.petSize / Math.max(1, input.sensor.referenceSize)
  const deadZone = input.sensor.centerDeadZone * scale
  if (Math.hypot(offset.x, offset.y) <= deadZone) return current

  if (offset.y >= 0) {
    if (Math.abs(offset.x) <= deadZone) return current
    return offset.x < 0 ? 'left' : 'right'
  }

  const angle = (Math.atan2(-offset.y, offset.x) * 180) / Math.PI
  const boundaries = [30, 70, 110, 150]
  const candidate: PetLookDirection =
    angle < boundaries[0]
      ? 'right'
      : angle < boundaries[1]
        ? 'rightUp'
        : angle < boundaries[2]
          ? 'up'
          : angle < boundaries[3]
            ? 'leftUp'
            : 'left'

  if (
    current &&
    current !== candidate &&
    boundaries.some(
      (boundary) => Math.abs(angle - boundary) <= input.sensor.angleHysteresisDeg,
    )
  ) {
    return current
  }
  return candidate
}

export function isPointInPetLookPreloadRange(
  input: PetLookTargetInput,
  preloadRadius: number,
): boolean {
  const offset = resolvePetLookOffset(input)
  const scale = input.petSize / Math.max(1, input.sensor.referenceSize)
  return Math.hypot(offset.x, offset.y) <= preloadRadius * scale
}
