import test from 'node:test'
import assert from 'node:assert/strict'

import { createPetPointerController } from '../../src/composables/pet/usePetPointer.ts'

class FakeEventListenerHost {
  listeners = new Map<string, Set<(event: any) => void>>()

  addEventListener(type: string, callback: (event: any) => void) {
    let callbacks = this.listeners.get(type)
    if (!callbacks) {
      callbacks = new Set()
      this.listeners.set(type, callbacks)
    }
    callbacks.add(callback)
  }

  removeEventListener(type: string, callback: (event: any) => void) {
    this.listeners.get(type)?.delete(callback)
  }

  dispatch(type: string, event: any) {
    for (const callback of Array.from(this.listeners.get(type) || [])) {
      callback(event)
    }
  }
}

class FakeElement extends FakeEventListenerHost {
  private pointerCaptured: number | null = null

  setPointerCapture(id: number) {
    this.pointerCaptured = id
  }

  hasPointerCapture(id: number) {
    return this.pointerCaptured === id
  }

  releasePointerCapture() {
    this.pointerCaptured = null
  }
}

class FakeWindow extends FakeEventListenerHost {
  private frames = new Map<number, () => void>()
  private nextFrameId = 1

  requestAnimationFrame(callback: () => void) {
    const id = this.nextFrameId++
    this.frames.set(id, callback)
    return id
  }

  cancelAnimationFrame(id: number) {
    this.frames.delete(id)
  }

  runFrames() {
    const pending = Array.from(this.frames.values())
    this.frames.clear()
    for (const callback of pending) callback()
  }
}

class FakeDocument extends FakeEventListenerHost {
  hidden = false
}

function setupGlobalDom() {
  const window = new FakeWindow()
  const document = new FakeDocument()
  ;(globalThis as Record<string, unknown>).window = window
  ;(globalThis as Record<string, unknown>).document = document
  return { window, document }
}

function pointerEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...overrides,
  }
}

function mouseEvent(detail: number, overrides: Record<string, unknown> = {}) {
  const event = {
    detail,
    defaultPrevented: false,
    stopped: false,
    preventDefault() {
      event.defaultPrevented = true
    },
    stopPropagation() {
      event.stopped = true
    },
    ...overrides,
  }
  return event
}

function controllerWithLogs() {
  const log = {
    downs: [] as Array<{ x: number; y: number }>,
    activates: 0,
    dragStarts: [] as Array<{ x: number; y: number }>,
    dragMoves: [] as Array<{ x: number; y: number }>,
    dragEnds: [] as boolean[],
  }
  const controller = createPetPointerController({
    onPointerDown(point) {
      log.downs.push(point)
    },
    onActivate() {
      log.activates += 1
    },
    onDragStart(point) {
      log.dragStarts.push(point)
    },
    onDragMove(point) {
      log.dragMoves.push(point)
    },
    onDragEnd(commit) {
      log.dragEnds.push(commit)
    },
  })
  return { controller, log }
}

test('threshold crossing move is delivered instead of being dropped', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 5, clientY: 0 }))
  assert.equal(log.dragStarts.length, 0)

  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 10, clientY: 1 }))
  assert.deepEqual(log.dragStarts, [{ x: 0, y: 0 }])
  const window = globalThis.window as unknown as FakeWindow
  window.runFrames()
  assert.deepEqual(log.dragMoves, [{ x: 10, y: 1 }])

  element.dispatch('pointerup', pointerEvent({ pointerId: 1, clientX: 12, clientY: 3 }))
  assert.deepEqual(log.dragMoves.at(-1), { x: 10, y: 1 })
  assert.deepEqual(log.dragEnds, [true])
})

test('pointerup flushes the queued final coordinates before ending', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 20, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 42, clientY: 17 }))
  // Deliberately do not run the rAF queue before pointerup.
  element.dispatch('pointerup', pointerEvent({ pointerId: 1, clientX: 42, clientY: 17 }))

  assert.deepEqual(log.dragMoves, [{ x: 42, y: 17 }])
  assert.deepEqual(log.dragEnds, [true])

  const window = globalThis.window as unknown as FakeWindow
  window.runFrames()
  assert.deepEqual(log.dragMoves, [{ x: 42, y: 17 }], 'late rAF must be cancelled')

  const click = mouseEvent(1)
  element.dispatch('click', click)
  assert.equal(click.defaultPrevented, true, 'pointer-derived click must be suppressed')
  assert.equal(log.activates, 0)
})

test('pointercancel/lost capture/blur cancel drag and suppress derived click', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 50, clientY: 0 }))
  element.dispatch('lostpointercapture', pointerEvent({ pointerId: 1, clientX: 50, clientY: 0 }))
  assert.deepEqual(log.dragEnds, [false])

  const click = mouseEvent(1)
  element.dispatch('click', click)
  assert.equal(click.defaultPrevented, true)
  assert.equal(log.activates, 0)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 60, clientY: 0 }))
  const window = globalThis.window as unknown as FakeWindow
  window.dispatch('blur', {})
  assert.deepEqual(log.dragEnds, [false, false])
  const suppressed = mouseEvent(1)
  element.dispatch('click', suppressed)
  assert.equal(suppressed.defaultPrevented, true)
})

test('keyboard detail=0 click still activates after a pointer cancel', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointercancel', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  const click = mouseEvent(0)
  element.dispatch('click', click)
  assert.equal(click.defaultPrevented, false)
  assert.equal(log.activates, 1)
})

test('detach and cancel finish an in-progress drag without commit', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 40, clientY: 0 }))
  controller.detach()
  assert.deepEqual(log.dragEnds, [false])

  const secondElement = new FakeElement()
  controller.attach(secondElement)
  secondElement.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 0, clientY: 0 }))
  secondElement.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 30, clientY: 0 }))
  controller.cancel()
  assert.deepEqual(log.dragEnds, [false, false])
})

test('micro move pointerup activates once and mouse click is suppressed', () => {
  setupGlobalDom()
  const element = new FakeElement()
  const { controller, log } = controllerWithLogs()
  controller.attach(element)

  element.dispatch('pointerdown', pointerEvent({ pointerId: 1, clientX: 100, clientY: 100 }))
  element.dispatch('pointermove', pointerEvent({ pointerId: 1, clientX: 104, clientY: 103 }))
  element.dispatch('pointerup', pointerEvent({ pointerId: 1, clientX: 104, clientY: 103 }))
  assert.equal(log.dragStarts.length, 0)
  assert.equal(log.activates, 1)

  const click = mouseEvent(1)
  element.dispatch('click', click)
  assert.equal(click.defaultPrevented, true)
  assert.equal(log.activates, 1)
})
