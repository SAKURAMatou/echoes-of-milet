import test from 'node:test'
import assert from 'node:assert/strict'

import { PET_MODULE_ROUTES, PET_QUICK_MENU_ROUTES } from '../../src/config/pet.ts'
import { PET_TEXT } from '../../src/composables/lang/pet.ts'

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
