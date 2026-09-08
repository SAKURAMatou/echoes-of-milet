import test from 'node:test'
import assert from 'node:assert/strict'

import { createPetCoordinator } from '../../src/composables/pet/createPetCoordinator.ts'
import { PET_SPEECH_DURATION_MS } from '../../src/config/pet.ts'
import type { PetRouteSnapshot } from '../../src/composables/pet/petTypes.ts'

class FakePetScheduler {
  time = 100_000
  private nextId = 1
  private timers = new Map<number, { callback: () => void; at: number }>()

  now() {
    return this.time
  }

  schedule(callback: () => void, delayMs: number) {
    const id = this.nextId++
    this.timers.set(id, { callback, at: this.time + Math.max(0, delayMs) })
    return id
  }

  cancel(timerId: number | null) {
    if (timerId !== null) this.timers.delete(timerId)
  }

  get pendingCount() {
    return this.timers.size
  }

  runUntil(time: number) {
    while (true) {
      const next = Array.from(this.timers.values()).sort((a, b) => a.at - b.at)[0]
      if (!next || next.at > time) break
      const id = Array.from(this.timers.entries()).find(([, value]) => value === next)?.[0]
      if (id !== undefined) this.timers.delete(id)
      this.time = next.at
      next.callback()
    }
    this.time = time
  }
}

function route(name: string, fullPath: string, instanceKey?: string | null): PetRouteSnapshot {
  return { name, lang: 'zh', fullPath, instanceKey }
}

function readyPet() {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler, random: () => 0.5 })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('home', '/zh'))
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()
  return { pet, scheduler }
}

test('endDrag(true) finishes the drag animation before playing user-happy', () => {
  const { pet } = readyPet()
  pet.beginDrag({ x: 120, y: 300 })
  const dragGeneration = pet.state.animation.generation
  assert.equal(pet.state.dragging, true)
  assert.equal(pet.state.animation.priority, 5)

  pet.endDrag(true)
  assert.equal(pet.state.dragging, false)
  assert.equal(pet.state.animation.action, 'happy')
  assert.equal(pet.state.animation.priority, 4)

  // A stale completion from the old drag must never reset the happy reaction.
  pet.completeAnimation(dragGeneration)
  assert.equal(pet.state.animation.action, 'happy')
  assert.equal(pet.state.animation.priority, 4)

  pet.completeAnimation(pet.state.animation.generation)
  assert.equal(pet.state.animation.action, 'idle')
})

test('cancelDrag and stale drag completions settle to idle', () => {
  const { pet } = readyPet()
  pet.beginDrag({ x: 0, y: 0 })
  const dragGeneration = pet.state.animation.generation
  pet.cancelDrag()
  assert.equal(pet.state.animation.action, 'idle')
  pet.completeAnimation(dragGeneration)
  assert.equal(pet.state.animation.action, 'idle')
})

test('two coordinator instances keep priority, drag and pause state independent', () => {
  const first = readyPet()
  const second = readyPet()
  const secondRelease = second.pet.suspend('side-menu')
  assert.equal(first.pet.state.paused, false)
  assert.equal(second.pet.state.paused, true)

  first.pet.beginDrag({ x: 10, y: 20 })
  assert.equal(first.pet.state.dragging, true)
  assert.equal(second.pet.state.dragging, false)
  secondRelease()
  second.pet.playUserHappy()
  assert.equal(second.pet.state.animation.action, 'happy')
  assert.equal(first.pet.state.animation.action, 'drag')

  first.pet.endDrag(true)
  assert.equal(first.pet.state.animation.action, 'happy')
  assert.equal(second.pet.state.paused, false)
})

test('nested same-reason suspension tokens release independently and idempotently', () => {
  const { pet } = readyPet()
  const first = pet.suspend('photo-overlay')
  const second = pet.suspend('photo-overlay')
  assert.equal(pet.state.paused, true)
  first()
  assert.equal(pet.state.paused, true)
  first()
  second()
  assert.equal(pet.state.paused, false)
  second()
  assert.equal(pet.state.paused, false)
})

test('early page completion waits for the two second cooldown and drains latest', () => {
  const { pet, scheduler } = readyPet()
  const startedAt = scheduler.time
  pet.react('timeline.enter')
  const firstGeneration = pet.state.animation.generation
  assert.equal(pet.state.animation.action, 'curious')

  scheduler.time = startedAt + 1000
  pet.completeAnimation(firstGeneration)
  assert.equal(pet.state.animation.action, 'idle')

  scheduler.time = startedAt + 1500
  pet.react('news.enter')
  assert.equal(pet.state.animation.action, 'idle', 'pending must wait for cooldown')

  scheduler.runUntil(startedAt + 2000)
  assert.equal(pet.state.animation.action, 'sit')
  const pendingGeneration = pet.state.animation.generation

  // The completed first animation cannot cancel or reset the drained one.
  pet.completeAnimation(firstGeneration)
  assert.equal(pet.state.animation.action, 'sit')
  pet.completeAnimation(pendingGeneration)
  assert.equal(pet.state.animation.action, 'idle')
})

test('pre-ready current live event starts only for the current route generation', () => {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('miletLiveDetail', '/zh/milet/live/a', 'a'))
  const generationA = pet.state.route.generation

  pet.setRoute(route('miletLiveDetail', '/zh/milet/live/b', 'b'))
  const generationB = pet.state.route.generation
  assert.equal(generationB, generationA + 1)

  // A stale A reaction must be dropped before host readiness.
  pet.react('live.open', {
    contentId: 'event-a',
    routeGeneration: generationA,
  })
  pet.react('live.open', {
    contentId: 'event-b',
    routeGeneration: generationB,
  })

  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()

  assert.equal(pet.state.animation.action, 'happy')
  assert.equal(pet.state.animation.priority, 3)
})

test('hidden tab drops page events, photo deferral and menu, then resumes idle', () => {
  const { pet } = readyPet()
  pet.openMenu()
  pet.playUserHappy()
  pet.syncEnvironment(true, false)

  assert.equal(pet.state.menuOpen, false)
  assert.equal(pet.state.animation.action, 'idle')
  pet.react('timeline.enter', {
    routeGeneration: pet.state.route.generation,
    routeFullPath: pet.state.route.fullPath,
  })
  pet.syncEnvironment(true, true)
  assert.equal(pet.state.animation.action, 'idle', 'hidden events must not replay')
})

test('reduced motion settles postures without priority locks or random timers', () => {
  const { pet, scheduler } = readyPet()
  pet.playUserHappy()
  const happyGeneration = pet.state.animation.generation
  pet.syncEnvironment(false, true)

  assert.equal(pet.state.animation.action, 'happy')
  assert.equal(pet.state.animation.settled, true)
  scheduler.runUntil(scheduler.time + 60_000)
  assert.equal(scheduler.pendingCount, 0)

  // A new page reaction can replace a settled posture immediately.
  pet.react('news.enter')
  assert.equal(pet.state.animation.action, 'sit')
  assert.equal(pet.state.animation.settled, true)

  // A stale completion from the previously reduced happy posture is ignored.
  pet.completeAnimation(happyGeneration)
  assert.equal(pet.state.animation.action, 'sit')

  pet.syncEnvironment(true, true)
  assert.equal(pet.state.animation.action, 'idle')
})

test('quiet routes play a random non-idle action after the idle delay', () => {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler, random: () => 0.86 })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('home', '/zh'))
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()

  scheduler.runUntil(scheduler.time + 32_000)
  assert.equal(pet.state.animation.action, 'sleep')
  assert.equal(pet.state.animation.priority, 1)
  assert.notEqual(pet.state.animation.action, 'idle')
})

test('random speech uses the idle cycle, auto-hides and yields to the menu', () => {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler, random: () => 0.999 })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('home', '/zh'))
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()

  scheduler.runUntil(scheduler.time + 29_980)
  assert.equal(pet.state.speech.visible, true)
  assert.equal(pet.state.speech.messageKey, 'nearbyPresence')
  assert.equal(pet.state.animation.action, 'idle')
  const firstGeneration = pet.state.speech.generation

  scheduler.runUntil(scheduler.time + PET_SPEECH_DURATION_MS - 1)
  assert.equal(pet.state.speech.visible, true)
  scheduler.runUntil(scheduler.time + 1)
  assert.equal(pet.state.speech.visible, false)
  assert.equal(scheduler.pendingCount, 1)

  scheduler.runUntil(scheduler.time + 29_980)
  assert.equal(pet.state.speech.visible, true)
  assert.equal(pet.state.speech.messageKey, 'cozySpot')
  assert.ok(pet.state.speech.generation > firstGeneration)

  pet.openMenu()
  assert.equal(pet.state.speech.visible, false)
  assert.equal(pet.state.menuOpen, true)
  assert.equal(scheduler.pendingCount, 0)

  pet.closeMenu()
  assert.equal(scheduler.pendingCount, 1)
})

test('clicking the pet restarts the random-action wait', () => {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler, random: () => 0 })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('home', '/zh'))
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()

  scheduler.runUntil(scheduler.time + 9_000)
  pet.playUserHappy()
  assert.equal(pet.state.animation.action, 'happy')
  pet.completeAnimation(pet.state.animation.generation)

  scheduler.runUntil(scheduler.time + 9_999)
  assert.equal(pet.state.animation.action, 'idle')
  scheduler.runUntil(scheduler.time + 1)
  assert.equal(pet.state.animation.action, 'sit')
})

test('photo deferral is invalidated by navigation and hidden visibility', () => {
  const { pet } = readyPet()
  pet.setRoute(route('miletArticle', '/zh/milet/articles/a'))
  const articleGeneration = pet.state.route.generation
  const release = pet.suspend('photo-overlay')
  pet.react('photo.open', {
    routeGeneration: articleGeneration,
    routeFullPath: '/zh/milet/articles/a',
  })

  pet.setRoute(route('miletArticle', '/zh/milet/articles/b'))
  release()
  assert.equal(pet.state.animation.action, 'idle', 'A look must not replay on article B')

  const hiddenRelease = pet.suspend('photo-overlay')
  pet.react('photo.open', {
    routeGeneration: pet.state.route.generation,
    routeFullPath: pet.state.route.fullPath,
  })
  pet.syncEnvironment(true, false)
  hiddenRelease()
  pet.syncEnvironment(true, true)
  assert.equal(pet.state.animation.action, 'idle')
})

test('latest valid photo look is kept until every overlay token releases', () => {
  const { pet } = readyPet()
  pet.setRoute(route('miletArticle', '/zh/milet/articles/a'))
  const generation = pet.state.route.generation
  const fullPath = pet.state.route.fullPath

  const releaseA = pet.suspend('photo-overlay')
  pet.react('photo.open', { routeGeneration: generation, routeFullPath: fullPath })
  const releaseB = pet.suspend('photo-overlay')
  pet.react('photo.open', { routeGeneration: generation, routeFullPath: fullPath })

  releaseA()
  assert.equal(pet.state.animation.action, 'idle')
  releaseB()
  assert.equal(pet.state.animation.action, 'look')
})

test('reduced motion still allows a static photo look', () => {
  const { pet } = readyPet()
  pet.setRoute(route('miletArticle', '/zh/milet/articles/a'))
  pet.syncEnvironment(false, true)
  const release = pet.suspend('photo-overlay')
  pet.react('photo.open', {
    routeGeneration: pet.state.route.generation,
    routeFullPath: pet.state.route.fullPath,
  })
  release()
  assert.equal(pet.state.animation.action, 'look')
  assert.equal(pet.state.animation.settled, true)
})

test('dispose makes every late call and callback a no-op', () => {
  const { pet, scheduler } = readyPet()
  pet.react('timeline.enter')
  const generation = pet.state.animation.generation
  const positionBefore = { ...pet.state.position }
  pet.dispose()

  pet.completeAnimation(generation)
  pet.playUserHappy()
  pet.beginDrag({ x: 1, y: 2 })
  pet.endDrag(true)
  pet.react('live.open', {
    contentId: 'x',
    routeGeneration: pet.state.route.generation,
    routeFullPath: pet.state.route.fullPath,
  })
  pet.syncEnvironment(false, false)
  pet.setRoute(route('miletRelease', '/zh/milet/release'))
  pet.setAssetStatus('happy', { static: 'ready' })
  pet.setPosition({ x: 9, y: 9 })
  const release = pet.suspend('after-dispose')
  release()
  assert.equal(typeof pet.connect(), 'function')

  assert.equal(pet.state.animation.action, 'idle')
  assert.equal(pet.state.dragging, false)
  assert.equal(pet.state.paused, false)
  assert.deepEqual({ ...pet.state.position }, positionBefore)
  scheduler.runUntil(scheduler.time + 120_000)
  assert.equal(scheduler.pendingCount, 0)
})

test('live.open is deduped across locale while different slugs reset it', () => {
  const { pet, scheduler } = readyPet()
  pet.setRoute({
    name: 'miletLiveDetail',
    lang: 'zh',
    fullPath: '/zh/milet/live/event-a',
    instanceKey: 'event-a',
  })
  const generationA = pet.state.route.generation
  pet.react('live.open', {
    contentId: '1001',
    routeGeneration: generationA,
    routeFullPath: '/zh/milet/live/event-a',
  })
  const firstHappyGeneration = pet.state.animation.generation

  // Language replacement with the same instance must not duplicate.
  pet.setRoute({
    name: 'miletLiveDetail',
    lang: 'ja',
    fullPath: '/ja/milet/live/event-a',
    instanceKey: 'event-a',
  })
  const japaneseGeneration = pet.state.route.generation
  pet.completeAnimation(firstHappyGeneration)
  pet.react('live.open', {
    contentId: '1001',
    routeGeneration: japaneseGeneration,
    routeFullPath: '/ja/milet/live/event-a',
  })
  assert.equal(pet.state.animation.action, 'idle')

  // A different slug clears the old dedupe key even if that slug had failed.
  scheduler.time += 3000
  pet.setRoute({
    name: 'miletLiveDetail',
    lang: 'ja',
    fullPath: '/ja/milet/live/event-b',
    instanceKey: 'event-b',
  })
  pet.setRoute({
    name: 'miletLiveDetail',
    lang: 'zh',
    fullPath: '/zh/milet/live/event-a',
    instanceKey: 'event-a',
  })
  const revisitedGeneration = pet.state.route.generation
  pet.react('live.open', {
    contentId: '1001',
    routeGeneration: revisitedGeneration,
    routeFullPath: '/zh/milet/live/event-a',
  })
  assert.equal(pet.state.animation.action, 'happy')
})

test('attention enters, holds, reverses and switches only to the latest direction', () => {
  const { pet } = readyPet()
  pet.setAssetStatus('lookLeft', { sheet: 'ready' })
  pet.setAssetStatus('lookRight', { sheet: 'ready' })

  pet.beginAttention('left')
  assert.equal(pet.state.animation.action, 'lookLeft')
  assert.equal(pet.state.animation.priority, 2)
  assert.equal(pet.state.animation.playback, 'forwardHold')
  assert.equal(pet.state.attention.phase, 'entering')

  pet.completeAnimation(pet.state.animation.generation)
  assert.equal(pet.state.attention.phase, 'holding')
  assert.equal(pet.state.animation.action, 'lookLeft')

  pet.updateAttention('right')
  assert.equal(pet.state.attention.phase, 'leaving')
  assert.equal(pet.state.attention.pendingDirection, 'right')
  assert.equal(pet.state.animation.playback, 'reverseOnce')
  pet.completeAnimation(pet.state.animation.generation)

  assert.equal(pet.state.attention.direction, 'right')
  assert.equal(pet.state.attention.phase, 'entering')
  assert.equal(pet.state.animation.action, 'lookRight')
})

test('page and direct reactions interrupt attention while menu and reduced motion block it', () => {
  const { pet } = readyPet()
  pet.setAssetStatus('lookUp', { sheet: 'ready' })
  pet.beginAttention('up')
  pet.react('news.enter')
  assert.equal(pet.state.attention.phase, 'inactive')
  assert.equal(pet.state.animation.action, 'sit')
  assert.equal(pet.state.animation.priority, 3)

  pet.completeAnimation(pet.state.animation.generation)
  pet.openMenu()
  pet.beginAttention('up')
  assert.equal(pet.state.attention.phase, 'inactive')
  pet.playDirectReaction('double')
  assert.equal(pet.state.menuOpen, false)
  assert.equal(pet.state.animation.priority, 4)

  pet.completeAnimation(pet.state.animation.generation)
  pet.syncEnvironment(false, true)
  pet.beginAttention('up')
  assert.equal(pet.state.attention.phase, 'inactive')
})

test('direct reaction pools avoid immediately repeating an available action', () => {
  const scheduler = new FakePetScheduler()
  const pet = createPetCoordinator({ scheduler, random: () => 0 })
  pet.syncEnvironment(true, true)
  pet.setRoute(route('home', '/zh'))
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()

  pet.playDirectReaction('double')
  assert.equal(pet.state.animation.action, 'happy')
  pet.completeAnimation(pet.state.animation.generation)
  pet.playDirectReaction('double')
  assert.equal(pet.state.animation.action, 'curious')
})

test('a failed attention asset clears the attention state and returns to idle', () => {
  const { pet } = readyPet()
  pet.setAssetStatus('lookLeft', { sheet: 'ready' })
  pet.beginAttention('left')
  assert.equal(pet.state.attention.phase, 'entering')

  pet.setAssetStatus('lookLeft', { sheet: 'error', static: 'error' })
  assert.equal(pet.state.animation.action, 'idle')
  assert.equal(pet.state.attention.phase, 'inactive')
  assert.equal(pet.state.attention.direction, null)
})
