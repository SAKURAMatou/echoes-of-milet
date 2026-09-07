import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PET_PAGE_COOLDOWN_MS,
  PET_PAGE_PENDING_TTL_MS,
  PET_PRIORITY,
  PET_RANDOM_ACTIONS,
  PET_RANDOM_MAX_MS,
  PET_RANDOM_MIN_MS,
  PetPageGate,
  comparePetPriority,
  eligibleRandomActions,
  petPriorityRank,
  pickRandomAction,
  randomDelayMs,
} from '../../src/composables/pet/petSchedulingCore.ts'

test('priority constants keep the required idle/random/page/user/drag order', () => {
  assert.equal(PET_PRIORITY.idle, 0)
  assert.equal(PET_PRIORITY.random, 1)
  assert.equal(PET_PRIORITY.page, 2)
  assert.equal(PET_PRIORITY.user, 3)
  assert.equal(PET_PRIORITY.drag, 4)
  assert.ok(comparePetPriority(PET_PRIORITY.user, PET_PRIORITY.page) > 0)
  assert.equal(petPriorityRank(PET_PRIORITY.drag), 4)
})

test('page gate starts the first event immediately and pops latest only after cooldown', () => {
  const gate = new PetPageGate()
  const now = 10_000

  assert.equal(gate.submit({ key: 'a', action: 'curious', priority: 2 }, now, false), 'start')
  gate.markStarted(now)

  assert.equal(gate.submit({ key: 'b', action: 'sniff', priority: 2 }, now + 500, false), 'queued')
  assert.equal(gate.submit({ key: 'c', action: 'sit', priority: 2 }, now + 900, false), 'queued')

  assert.equal(gate.popPending(now + 1000), null, 'cooldown must remain in effect')
  const pending = gate.popPending(now + 2050)
  assert.equal(pending?.key, 'c')
  assert.equal(pending?.action, 'sit')
  assert.equal(gate.popPending(now + 2050), null)
})

test('page gate drops blocked page events and clears the pending slot during user activity', () => {
  const gate = new PetPageGate()
  const now = 20_000
  assert.equal(gate.submit({ key: 'a', action: 'happy', priority: 2 }, now, true), 'dropped')
  gate.markStarted(now)
  assert.equal(gate.submit({ key: 'b', action: 'happy', priority: 2 }, now + 500, false), 'queued')
  gate.clearPending()
  assert.equal(gate.popPending(now + 900), null)
})

test('page pending event expires after its TTL and cannot fire after the cooldown', () => {
  const gate = new PetPageGate()
  const now = 30_000
  gate.markStarted(now)
  assert.equal(gate.submit({ key: 'a', action: 'look', priority: 2 }, now + 200, false), 'queued')
  assert.equal(gate.popPending(now + 200 + PET_PAGE_PENDING_TTL_MS + 1), null)
  assert.equal(gate.submit({ key: 'b', action: 'sit', priority: 2 }, now + PET_PAGE_COOLDOWN_MS, false), 'start')
})

test('random delay is bounded by 10-30 seconds and respects deterministic rng', () => {
  assert.equal(randomDelayMs(() => 0), PET_RANDOM_MIN_MS)
  assert.equal(randomDelayMs(() => 1), PET_RANDOM_MAX_MS)
  for (let index = 0; index < 100; index += 1) {
    const delay = randomDelayMs(() => 0.5)
    assert.ok(delay >= PET_RANDOM_MIN_MS && delay <= PET_RANDOM_MAX_MS)
  }
})

test('idle random candidates include every authored action except default idle', () => {
  assert.deepEqual(eligibleRandomActions(), [...PET_RANDOM_ACTIONS])
  assert.equal(eligibleRandomActions().includes('idle'), false)
  assert.deepEqual(eligibleRandomActions(['drag', 'sleep']), [
    'sit',
    'happy',
    'curious',
    'excited',
    'sniff',
    'look',
  ])
})

test('random picker honors the injected rng and respects excluded failed actions', () => {
  assert.equal(pickRandomAction(() => 0), 'sit')
  assert.equal(pickRandomAction(() => 0, ['sit']), 'happy')
  assert.equal(
    pickRandomAction(() => 0, [...PET_RANDOM_ACTIONS]),
    null,
  )
})
