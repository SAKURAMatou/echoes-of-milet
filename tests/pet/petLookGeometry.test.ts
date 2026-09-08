import test from 'node:test'
import assert from 'node:assert/strict'

import { PET_LOOK_SENSOR } from '../../src/config/pet.ts'
import {
  isPointInPetLookSensor,
  resolvePetLookDirection,
} from '../../src/composables/pet/petLookGeometryCore.ts'

const petPosition = { x: 500, y: 400 }

function target(x: number, y: number, petSize = 160) {
  return {
    pointer: { x, y },
    petPosition,
    petSize,
    sensor: PET_LOOK_SENSOR,
  }
}

test('look sensor uses separate scaled enter and exit ellipses', () => {
  const centerX = 580
  const centerY = 456
  assert.equal(isPointInPetLookSensor(target(centerX + 219, centerY), false), true)
  assert.equal(isPointInPetLookSensor(target(centerX + 230, centerY), false), false)
  assert.equal(isPointInPetLookSensor(target(centerX + 230, centerY), true), true)

  const mobileCenterX = 560
  const mobileCenterY = 442
  assert.equal(isPointInPetLookSensor(target(mobileCenterX + 164, mobileCenterY, 120), false), true)
  assert.equal(isPointInPetLookSensor(target(mobileCenterX + 170, mobileCenterY, 120), false), false)
})

test('five-way look direction keeps lower points horizontal and preserves the center dead zone', () => {
  assert.equal(resolvePetLookDirection(target(780, 456)), 'right')
  assert.equal(resolvePetLookDirection(target(700, 340)), 'rightUp')
  assert.equal(resolvePetLookDirection(target(580, 280)), 'up')
  assert.equal(resolvePetLookDirection(target(460, 340)), 'leftUp')
  assert.equal(resolvePetLookDirection(target(380, 456)), 'left')
  assert.equal(resolvePetLookDirection(target(500, 600)), 'left')
  assert.equal(resolvePetLookDirection(target(660, 600)), 'right')
  assert.equal(resolvePetLookDirection(target(580, 470), 'up'), 'up')
})

test('direction hysteresis keeps the current sector near an angular boundary', () => {
  const radians = (35 * Math.PI) / 180
  const point = target(580 + Math.cos(radians) * 150, 456 - Math.sin(radians) * 150)
  assert.equal(resolvePetLookDirection(point, 'right'), 'right')
  assert.equal(resolvePetLookDirection(point, null), 'rightUp')
})
