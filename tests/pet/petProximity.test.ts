import test from 'node:test'
import assert from 'node:assert/strict'

import { createPetProximityController } from '../../src/composables/pet/usePetProximity.ts'

class FakeMediaQuery {
  matches = true
  private listeners = new Set<() => void>()
  addEventListener(_type: string, callback: () => void) { this.listeners.add(callback) }
  removeEventListener(_type: string, callback: () => void) { this.listeners.delete(callback) }
}

class FakeWindow {
  listeners = new Map<string, Set<(event: any) => void>>()
  frames = new Map<number, (timestamp: number) => void>()
  timers = new Map<number, () => void>()
  nextId = 1
  media = new FakeMediaQuery()
  addEventListener(type: string, callback: (event: any) => void) {
    const listeners = this.listeners.get(type) || new Set()
    listeners.add(callback)
    this.listeners.set(type, listeners)
  }
  removeEventListener(type: string, callback: (event: any) => void) {
    this.listeners.get(type)?.delete(callback)
  }
  dispatch(type: string, event: any) {
    for (const callback of this.listeners.get(type) || []) callback(event)
  }
  requestAnimationFrame(callback: (timestamp: number) => void) {
    const id = this.nextId++
    this.frames.set(id, callback)
    return id
  }
  cancelAnimationFrame(id: number) { this.frames.delete(id) }
  runFrames(timestamp: number) {
    const frames = Array.from(this.frames.values())
    this.frames.clear()
    for (const callback of frames) callback(timestamp)
  }
  setTimeout(callback: () => void) {
    const id = this.nextId++
    this.timers.set(id, callback)
    return id
  }
  clearTimeout(id: number) { this.timers.delete(id) }
  matchMedia() { return this.media }
}

test('proximity uses passive coordinate sensing and stabilizes direction changes', () => {
  const fakeWindow = new FakeWindow()
  ;(globalThis as Record<string, unknown>).window = fakeWindow
  const log = { begin: [] as string[], update: [] as string[], end: 0, preload: [] as string[] }
  let attentionActive = false
  const controller = createPetProximityController({
    getPetPosition: () => ({ x: 500, y: 400 }),
    getPetSize: () => 160,
    enabled: () => true,
    canBeginAttention: () => !attentionActive,
    isAttentionActive: () => attentionActive,
    onBegin(direction) { attentionActive = true; log.begin.push(direction) },
    onUpdate(direction) { log.update.push(direction) },
    onEnd() { attentionActive = false; log.end += 1 },
    onPreload(direction) { log.preload.push(direction) },
  })
  controller.attach()

  fakeWindow.dispatch('pointermove', { pointerType: 'touch', clientX: 700, clientY: 456 })
  fakeWindow.runFrames(0)
  assert.deepEqual(log.begin, [])

  fakeWindow.dispatch('pointermove', { pointerType: 'mouse', clientX: 700, clientY: 456 })
  fakeWindow.runFrames(10)
  assert.deepEqual(log.begin, ['right'])
  assert.deepEqual(log.preload, ['right'])

  fakeWindow.dispatch('pointermove', { pointerType: 'mouse', clientX: 580, clientY: 300 })
  fakeWindow.runFrames(20)
  fakeWindow.runFrames(120)
  assert.deepEqual(log.update, [])
  fakeWindow.runFrames(131)
  assert.deepEqual(log.update, ['up'])

  fakeWindow.dispatch('pointermove', { pointerType: 'mouse', clientX: 1000, clientY: 1000 })
  fakeWindow.runFrames(150)
  assert.equal(log.end, 1)
  controller.detach()
  assert.equal(fakeWindow.listeners.get('pointermove')?.size || 0, 0)
})
