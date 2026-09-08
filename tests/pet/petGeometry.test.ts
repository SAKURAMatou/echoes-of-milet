import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clampPetPosition,
  defaultPetPosition,
  isPetDragStarted,
  petPointerDistance,
  resolvePetRadialMenuLayout,
  resolvePetSpeechBubbleLayout,
  resolvePetViewportBox,
} from '../../src/composables/pet/petGeometryCore.ts'

const hostSize = { width: 60, height: 60 }
const viewport = { left: 0, top: 0, width: 320, height: 480 }
const noInsets = { left: 0, right: 0, top: 0, bottom: 0 }

test('8px euclidean drag threshold distinguishes micro moves from drags', () => {
  assert.equal(isPetDragStarted({ x: 10, y: 10 }, { x: 17.99, y: 10 }), false)
  assert.equal(isPetDragStarted({ x: 10, y: 10 }, { x: 18, y: 10 }), true)
  assert.equal(isPetDragStarted({ x: 0, y: 0 }, { x: 4, y: 4 }), false)
  assert.equal(petPointerDistance({ x: 0, y: 0 }, { x: 6, y: 8 }), 10)
})

test('clamp keeps the full host inside the visible box plus edge insets', () => {
  const insets = { left: 4, right: 8, top: 4, bottom: 12 }
  const above = clampPetPosition({ x: 100, y: -50 }, hostSize, viewport, insets)
  assert.equal(above.y, 4)

  const beyondRight = clampPetPosition({ x: 400, y: 100 }, hostSize, viewport, insets)
  assert.equal(beyondRight.x, 320 - 8 - 60)

  const below = clampPetPosition({ x: 100, y: 600 }, hostSize, viewport, insets)
  assert.equal(below.y, 480 - 12 - 60)
})

test('default position preserves the reserved bottom edge next to back-to-top', () => {
  const point = defaultPetPosition(viewport, hostSize, noInsets, 16, 88)
  assert.equal(point.x, 320 - 16 - 60)
  assert.equal(point.y, 480 - 88 - 60)
})

test('default position also honors safe/edge insets on the inner edges', () => {
  const insets = { left: 8, right: 8, top: 10, bottom: 12 }
  const point = defaultPetPosition(
    { left: 0, top: 0, width: 160, height: 120 },
    { width: 80, height: 80 },
    insets,
    0,
    0,
  )
  assert.equal(point.x, 160 - 8 - 80)
  assert.equal(point.y, 120 - 12 - 80)
})

test('tiny viewport clamps to a safe fallback instead of going negative', () => {
  const tiny = clampPetPosition(
    { x: -20, y: -20 },
    { width: 300, height: 300 },
    { left: 0, top: 0, width: 100, height: 120 },
    noInsets,
  )
  assert.ok(tiny.x >= 0)
  assert.ok(tiny.y >= 0)
})

test('visual viewport offsets and scale translate into the fixed-layer visible box', () => {
  const box = resolvePetViewportBox({
    innerWidth: 1440,
    innerHeight: 900,
    visualViewport: {
      offsetLeft: 12,
      offsetTop: 8,
      width: 700,
      height: 400,
      scale: 2,
    },
  })
  // visualViewport width/height are already CSS pixels: never multiply by scale.
  assert.deepEqual(box, { left: 12, top: 8, width: 700, height: 400 })
})

test('layout viewport fallback is used when visualViewport is absent', () => {
  const box = resolvePetViewportBox({
    innerWidth: 375,
    innerHeight: 812,
    visualViewport: null,
  })
  assert.deepEqual(box, { left: 0, top: 0, width: 375, height: 812 })
})

test('radial menu distributes four actions evenly and close to a bottom-right pet', () => {
  const items = resolvePetRadialMenuLayout({
    viewport: { left: 0, top: 0, width: 1280, height: 720 },
    safeInsets: noInsets,
    petX: 1088,
    petY: 472,
    petSize: 160,
    itemWidth: 144,
    itemHeight: 46,
    itemCount: 4,
  })

  assert.equal(items.length, 4)
  assert.ok(items.every((item) => item.left < 1088 + 80))
  const verticalGaps = items.slice(1).map((item, index) => Math.abs(item.top - items[index].top))
  assert.ok(verticalGaps.every((gap) => Math.abs(gap - verticalGaps[0]) < 0.001))
  assert.equal(1088 - (items[0].left + 144), 8)
})

test('radial menu keeps four evenly-spaced actions inside a small mobile viewport', () => {
  const items = resolvePetRadialMenuLayout({
    viewport: { left: 0, top: 0, width: 320, height: 480 },
    safeInsets: { left: 0, right: 6, top: 12, bottom: 8 },
    petX: 184,
    petY: 272,
    petSize: 120,
    itemWidth: 132,
    itemHeight: 42,
    itemCount: 4,
    horizontalGap: 6,
    itemGap: 10,
  })

  for (const item of items) {
    assert.ok(item.left >= 8)
    assert.ok(item.left + 132 <= 320 - 8)
    assert.ok(item.top >= 12)
    assert.ok(item.top + 42 <= 480 - 8)
  }

  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1]
    const current = items[index]
    const overlaps =
      previous.left < current.left + 132 &&
      previous.left + 132 > current.left &&
      previous.top < current.top + 42 &&
      previous.top + 42 > current.top
    assert.equal(overlaps, false)
  }

  const verticalGaps = items.slice(1).map((item, index) => Math.abs(item.top - items[index].top))
  assert.ok(verticalGaps.every((gap) => Math.abs(gap - verticalGaps[0]) < 0.001))
})

test('radial menu derives enough vertical span for additional configured actions', () => {
  const items = resolvePetRadialMenuLayout({
    viewport: { left: 0, top: 0, width: 1440, height: 900 },
    safeInsets: noInsets,
    petX: 1248,
    petY: 652,
    petSize: 160,
    itemWidth: 144,
    itemHeight: 46,
    itemCount: 6,
  })

  assert.equal(items.length, 6)
  for (let index = 1; index < items.length; index += 1) {
    assert.ok(Math.abs(items[index].top - items[index - 1].top) >= 58)
  }
})

test('speech bubble opens above-left of the default bottom-right desktop pet', () => {
  const bubble = resolvePetSpeechBubbleLayout({
    viewport: { left: 0, top: 0, width: 1280, height: 720 },
    safeInsets: noInsets,
    petX: 1088,
    petY: 472,
    petSize: 160,
    bubbleWidth: 224,
    bubbleHeight: 86,
  })

  assert.equal(bubble.horizontal, 'left')
  assert.equal(bubble.vertical, 'above')
  assert.ok(bubble.left >= 10)
  assert.ok(bubble.left + 224 <= 1270)
  assert.ok(bubble.top >= 10)
  assert.ok(bubble.top + 86 <= 710)
})

test('speech bubble flips below-right near the top-left corner', () => {
  const bubble = resolvePetSpeechBubbleLayout({
    viewport: { left: 0, top: 0, width: 1024, height: 768 },
    safeInsets: noInsets,
    petX: 12,
    petY: 12,
    petSize: 160,
    bubbleWidth: 224,
    bubbleHeight: 86,
  })

  assert.equal(bubble.horizontal, 'right')
  assert.equal(bubble.vertical, 'below')
  assert.ok(bubble.left > 12)
  assert.ok(bubble.top > 12)
})

test('speech bubble remains inside a safe-area constrained mobile viewport', () => {
  const bubble = resolvePetSpeechBubbleLayout({
    viewport: { left: 4, top: 6, width: 320, height: 480 },
    safeInsets: { left: 12, right: 16, top: 20, bottom: 14 },
    petX: 190,
    petY: 320,
    petSize: 120,
    bubbleWidth: 190,
    bubbleHeight: 82,
  })

  assert.ok(bubble.left >= 16)
  assert.ok(bubble.left + 190 <= 4 + 320 - 16)
  assert.ok(bubble.top >= 26)
  assert.ok(bubble.top + 82 <= 6 + 480 - 14)
})
