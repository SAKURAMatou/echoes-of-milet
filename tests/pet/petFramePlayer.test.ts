import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PetFramePlayer,
  resolvePetFrame,
  shouldPetAnimationLoop,
} from '../../src/composables/pet/petFramePlayer.ts'

const twoFrameClip = {
  frameCount: 2,
  durations: [100, 300],
  fps: 10,
  loop: false,
}

test('frameAt honors per-frame durations instead of assuming a fixed fps', () => {
  assert.deepEqual(resolvePetFrame(twoFrameClip, 99, false), { frame: 0, ended: false })
  assert.deepEqual(resolvePetFrame(twoFrameClip, 100, false), { frame: 1, ended: false })
  assert.deepEqual(resolvePetFrame(twoFrameClip, 400, false), { frame: 1, ended: true })
})

test('loop playback wraps elapsed time without ending', () => {
  assert.deepEqual(resolvePetFrame(twoFrameClip, 400, true), { frame: 0, ended: false })
  assert.deepEqual(resolvePetFrame(twoFrameClip, 500, true), { frame: 1, ended: false })
  assert.deepEqual(resolvePetFrame(twoFrameClip, 520, true), { frame: 1, ended: false })
})

test('player tick selects a new clip per instance and returns stale-agnostic frames', () => {
  const player = new PetFramePlayer()
  player.select('happy', twoFrameClip, false)
  assert.equal(player.tick(50).frame, 0)
  assert.equal(player.tick(50).frame, 1)
  const ended = player.tick(300)
  assert.equal(ended.ended, true)
})

test('drag loops only during a real pointer drag', () => {
  assert.equal(shouldPetAnimationLoop('drag', true, true), true)
  assert.equal(shouldPetAnimationLoop('drag', true, false), false)
  assert.equal(shouldPetAnimationLoop('idle', true, false), true)
  assert.equal(shouldPetAnimationLoop('happy', false, false), false)
})
