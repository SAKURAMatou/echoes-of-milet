import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, nextTick, ref } from 'vue'

import { createPetCoordinator } from '../../src/composables/pet/createPetCoordinator.ts'
import { usePetOverlay } from '../../src/composables/pet/usePetOverlay.ts'

function readyPet() {
  const pet = createPetCoordinator()
  pet.syncEnvironment(true, true)
  pet.setRoute({ name: 'home', lang: 'zh', fullPath: '/zh' })
  pet.setAssetStatus('idle', { static: 'ready' })
  pet.setStaticReady(true)
  pet.connect()
  return pet
}

test('usePetOverlay acquires/releases exactly one token and cleans up on scope dispose', async () => {
  const pet = readyPet()
  const open = ref(false)
  const scope = effectScope()
  scope.run(() => {
    usePetOverlay(open, 'track-modal', pet)
  })
  assert.equal(pet.state.paused, false)

  open.value = true
  assert.equal(pet.state.paused, true)
  assert.equal(pet.state.suspensionCount, 1)

  // Coordinator mutations that the old watchEffect could accidentally track
  // must not stack extra tokens.
  pet.syncEnvironment(false, true)
  pet.setAssetStatus('idle', { static: 'ready' })
  await nextTick()
  assert.equal(pet.state.suspensionCount, 1)

  open.value = false
  assert.equal(pet.state.paused, false)
  assert.equal(pet.state.suspensionCount, 0)

  open.value = true
  assert.equal(pet.state.paused, true)
  scope.stop()
  assert.equal(pet.state.paused, false)
})

test('two overlay scopes use independent same-reason tokens', () => {
  const pet = readyPet()
  const firstOpen = ref(true)
  const secondOpen = ref(true)
  const firstScope = effectScope()
  const secondScope = effectScope()
  firstScope.run(() => {
    usePetOverlay(firstOpen, 'dialog', pet)
  })
  secondScope.run(() => {
    usePetOverlay(secondOpen, 'dialog', pet)
  })
  assert.equal(pet.state.suspensionCount, 2)
  assert.equal(pet.state.paused, true)

  secondScope.stop()
  assert.equal(pet.state.paused, true)
  assert.equal(pet.state.suspensionCount, 1)
  firstScope.stop()
  assert.equal(pet.state.paused, false)
})
