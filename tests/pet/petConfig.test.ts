import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PET_ACTION_POOLS,
  PET_LOOK_ACTION_BY_DIRECTION,
  PET_MODULE_ROUTES,
  PET_QUICK_MENU_ROUTES,
  PET_SPEECH_DURATION_MS,
} from '../../src/config/pet.ts'
import { PET_TEXT } from '../../src/composables/lang/pet.ts'
import { PET_ACTIONS, PET_SPEECH_KEYS } from '../../src/composables/pet/petTypes.ts'

test('quick-menu keys stay aligned with reactive route modules and locale copy', () => {
  const keys = new Set<string>()
  const routeNames = new Set<string>()

  for (const entry of PET_QUICK_MENU_ROUTES) {
    assert.equal(PET_MODULE_ROUTES[entry.routeName], entry.key)
    assert.ok(PET_TEXT.zh.items[entry.key])
    assert.ok(PET_TEXT.jp.items[entry.key])
    assert.equal(keys.has(entry.key), false)
    assert.equal(routeNames.has(entry.routeName), false)
    keys.add(entry.key)
    routeNames.add(entry.routeName)
  }
})

test('direct-interaction action pools remain explicit and registered', () => {
  const registered = new Set(PET_ACTIONS)
  const attention = new Set(PET_ACTION_POOLS.attention)
  for (const action of PET_ACTION_POOLS.idleRandom) {
    assert.equal(registered.has(action), true)
    assert.equal(attention.has(action), false)
  }
  assert.equal(PET_ACTION_POOLS.idleRandom.includes('drag' as never), false)
  assert.deepEqual(Object.values(PET_LOOK_ACTION_BY_DIRECTION), PET_ACTION_POOLS.attention)
})

test('speech copy remains complete across both supported languages', () => {
  assert.equal(PET_SPEECH_DURATION_MS, 5200)
  assert.deepEqual(Object.keys(PET_TEXT.zh.speech), [...PET_SPEECH_KEYS])
  assert.deepEqual(Object.keys(PET_TEXT.jp.speech), [...PET_SPEECH_KEYS])
  for (const key of PET_SPEECH_KEYS) {
    assert.ok(PET_TEXT.zh.speech[key].length > 0)
    assert.ok(PET_TEXT.jp.speech[key].length > 0)
  }
})
