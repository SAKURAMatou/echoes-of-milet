import test from 'node:test'
import assert from 'node:assert/strict'

import { createPetCoordinator } from '../../src/composables/pet/createPetCoordinator.ts'
import { createPetFancyboxPhotoLifecycleManager } from '../../src/composables/pet/usePetFancybox.ts'

function readyPet() {
  const pet = createPetCoordinator()
  pet.syncEnvironment(true, true)
  pet.setRoute({ name: 'home', lang: 'zh', fullPath: '/zh' })
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()
  return pet
}

function decorate(manager: ReturnType<typeof createPetFancyboxPhotoLifecycleManager>) {
  const options: any = {
    on: {
      init(api: object) {},
      ready(api: object) {},
      destroy(api: object) {},
    },
  }
  return { options: manager.decorate(options), original: options }
}

test('Fancybox lifecycle captures route identity at init and discards stale ready', () => {
  const pet = readyPet()
  pet.setRoute({
    name: 'miletArticle',
    lang: 'zh',
    fullPath: '/zh/milet/articles/a',
  })
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  const { options } = decorate(manager)
  const apiA = { id: 'a' }

  options.on.init(apiA)
  assert.equal(pet.state.paused, true)
  pet.setRoute({
    name: 'miletArticle',
    lang: 'zh',
    fullPath: '/zh/milet/articles/b',
  })
  options.on.ready(apiA)
  assert.equal(pet.state.animation.action, 'idle', 'stale A photo must not replay on B')
  options.on.destroy(apiA)
  assert.equal(pet.state.paused, false)
})

test('manager dispose releases all instances and late callbacks are inert', () => {
  const pet = readyPet()
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  const { options } = decorate(manager)
  const api = { id: 'one' }
  options.on.init(api)
  manager.dispose()
  assert.equal(pet.state.paused, false)

  options.on.ready(api)
  options.on.destroy(api)
  options.on.init(api)
  assert.equal(pet.state.paused, false)
  assert.equal(pet.state.suspensionCount, 0)
})

test('latest valid photo is reported and fires only after every token releases', () => {
  const pet = readyPet()
  pet.setRoute({
    name: 'miletArticle',
    lang: 'zh',
    fullPath: '/zh/milet/articles/a',
  })
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  const { options } = decorate(manager)
  const apiA = { id: 'a' }
  const apiB = { id: 'b' }

  options.on.init(apiA)
  options.on.ready(apiA)
  options.on.init(apiB)
  options.on.ready(apiB)
  options.on.destroy(apiA)
  assert.equal(pet.state.animation.action, 'idle')
  options.on.destroy(apiB)
  assert.equal(pet.state.animation.action, 'look')
})

test('original Fancybox callbacks run and pet cleanup still happens if they throw', () => {
  const pet = readyPet()
  pet.setRoute({
    name: 'miletArticle',
    lang: 'zh',
    fullPath: '/zh/milet/articles/a',
  })
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  const order: string[] = []
  const options: any = {
    on: {
      init() {
        order.push('original-init')
        throw new Error('init exploded')
      },
      ready() {
        order.push('original-ready')
        throw new Error('ready exploded')
      },
      destroy() {
        order.push('original-destroy')
      },
    },
  }
  const decorated = manager.decorate(options)
  const api = { id: 'throws' }
  assert.throws(() => decorated.on.init(api), /init exploded/)
  assert.equal(pet.state.paused, true, 'suspend must be acquired after original throw')
  assert.throws(() => decorated.on.ready(api), /ready exploded/)
  decorated.on.destroy(api)
  assert.equal(pet.state.paused, false)
  assert.deepEqual(order, ['original-init', 'original-ready', 'original-destroy'])
})

test('preserved callbacks also receive the same instance arguments', () => {
  const pet = readyPet()
  const manager = createPetFancyboxPhotoLifecycleManager(pet)
  let readyArg: object | null = null
  const options: any = {
    on: {
      ready(api: object) {
        readyArg = api
      },
    },
  }
  const decorated = manager.decorate(options)
  const api = { id: 'instance' }
  decorated.on.init(api)
  decorated.on.ready(api)
  assert.equal(readyArg, api)
  decorated.on.destroy(api)
})
