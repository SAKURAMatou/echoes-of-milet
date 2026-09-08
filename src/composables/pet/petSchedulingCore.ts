/**
 * Pure scheduling decisions for the desktop pet.
 *
 * This module intentionally has no Vue, DOM, timer or Vite imports so it can be
 * unit-tested directly with Node's built-in TypeScript type-stripping runner.
 */

import { PET_ACTION_POOLS, type PetWeightedAction } from '@/config/pet'
import { PET_SPEECH_KEYS, type PetAction, type PetSpeechKey } from './petTypes'

export type PetPriority = 0 | 1 | 2 | 3 | 4 | 5

export const PET_PRIORITY = {
  idle: 0 as const,
  random: 1 as const,
  attention: 2 as const,
  page: 3 as const,
  user: 4 as const,
  drag: 5 as const,
}

export const PET_PAGE_COOLDOWN_MS = 2000
export const PET_PAGE_PENDING_TTL_MS = 2000
export const PET_RANDOM_MIN_MS = 10000
export const PET_RANDOM_MAX_MS = 30000

export type PetRandomAction = (typeof PET_ACTION_POOLS.idleRandom)[number]

/** Explicit so interaction-only actions can never leak into unattended playback. */
export const PET_RANDOM_ACTIONS: readonly PetRandomAction[] = PET_ACTION_POOLS.idleRandom
export const PET_RANDOM_BEHAVIORS = [...PET_RANDOM_ACTIONS, 'speech'] as const
export type PetRandomBehavior = (typeof PET_RANDOM_BEHAVIORS)[number]

export interface PetPendingPageEvent {
  key: string
  action: PetAction
  priority: PetPriority
}

export interface PetPageGateOptions {
  cooldownMs?: number
  ttlMs?: number
}

export type PetPageGateDecision = 'start' | 'queued' | 'dropped'

/**
 * Serializes page-level reactions: at most one starts immediately, and while a
 * 2s cooldown is active only the latest page event may wait with its own 2s TTL.
 */
export class PetPageGate {
  readonly cooldownMs: number
  readonly ttlMs: number
  cooldownUntil = Number.NEGATIVE_INFINITY
  pending: PetPendingPageEvent | null = null
  pendingExpiresAt = Number.NEGATIVE_INFINITY

  constructor(options: PetPageGateOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? PET_PAGE_COOLDOWN_MS
    this.ttlMs = options.ttlMs ?? PET_PAGE_PENDING_TTL_MS
  }

  submit(event: PetPendingPageEvent, now: number, blocked: boolean): PetPageGateDecision {
    if (blocked) {
      this.pending = null
      this.pendingExpiresAt = Number.NEGATIVE_INFINITY
      return 'dropped'
    }

    if (this.pending && now > this.pendingExpiresAt) {
      this.pending = null
      this.pendingExpiresAt = Number.NEGATIVE_INFINITY
    }

    if (this.cooldownUntil > now) {
      this.pending = event
      this.pendingExpiresAt = now + this.ttlMs
      return 'queued'
    }

    return 'start'
  }

  markStarted(now: number) {
    this.cooldownUntil = now + this.cooldownMs
    this.pending = null
    this.pendingExpiresAt = Number.NEGATIVE_INFINITY
  }

  popPending(now: number): PetPendingPageEvent | null {
    // The pending slot is a cooldown escape hatch only: it must never start
    // while the current page reaction's cooldown is still active.
    if (now < this.cooldownUntil) return null
    if (!this.pending || now > this.pendingExpiresAt) {
      this.pending = null
      this.pendingExpiresAt = Number.NEGATIVE_INFINITY
      return null
    }
    const next = this.pending
    this.pending = null
    this.pendingExpiresAt = Number.NEGATIVE_INFINITY
    return next
  }

  clearPending() {
    this.pending = null
    this.pendingExpiresAt = Number.NEGATIVE_INFINITY
  }

  resetCooldown() {
    this.cooldownUntil = Number.NEGATIVE_INFINITY
    this.clearPending()
  }
}

export function comparePetPriority(left: PetPriority, right: PetPriority): number {
  return left - right
}

export function petPriorityRank(priority: PetPriority): number {
  return priority
}

export function randomDelayMs(random: () => number = Math.random): number {
  const ratio = Math.min(1, Math.max(0, random()))
  return PET_RANDOM_MIN_MS + Math.round((PET_RANDOM_MAX_MS - PET_RANDOM_MIN_MS) * ratio)
}

export function eligibleRandomActions(excluded: PetAction[] = []): PetRandomAction[] {
  const excludedSet = new Set(excluded)
  return PET_RANDOM_ACTIONS.filter((action) => !excludedSet.has(action))
}

export function pickRandomAction(
  random: () => number = Math.random,
  excluded: PetAction[] = [],
): PetRandomAction | null {
  const pool = eligibleRandomActions(excluded)
  if (pool.length === 0) return null
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
  return pool[index] ?? null
}

export function eligibleRandomBehaviors(excluded: PetAction[] = []): PetRandomBehavior[] {
  const excludedSet = new Set(excluded)
  return PET_RANDOM_BEHAVIORS.filter(
    (behavior) => behavior === 'speech' || !excludedSet.has(behavior),
  )
}

export function pickRandomBehavior(
  random: () => number = Math.random,
  excluded: PetAction[] = [],
): PetRandomBehavior | null {
  const pool = eligibleRandomBehaviors(excluded)
  if (pool.length === 0) return null
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
  return pool[index] ?? null
}

export function pickPetSpeechKey(
  random: () => number = Math.random,
  previous: PetSpeechKey | null = null,
): PetSpeechKey {
  const pool =
    previous && PET_SPEECH_KEYS.length > 1
      ? PET_SPEECH_KEYS.filter((key) => key !== previous)
      : [...PET_SPEECH_KEYS]
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
  return pool[index] ?? PET_SPEECH_KEYS[0]
}

export function pickWeightedPetAction(
  pool: readonly PetWeightedAction[],
  random: () => number = Math.random,
  previous: PetAction | null = null,
  excluded: PetAction[] = [],
): PetAction | null {
  const excludedSet = new Set(excluded)
  let eligible = pool.filter((entry) => !excludedSet.has(entry.action) && entry.weight > 0)
  if (eligible.length > 1 && previous) {
    const withoutPrevious = eligible.filter((entry) => entry.action !== previous)
    if (withoutPrevious.length > 0) eligible = withoutPrevious
  }
  const totalWeight = eligible.reduce((sum, entry) => sum + entry.weight, 0)
  if (totalWeight <= 0) return null
  let cursor = Math.min(1, Math.max(0, random())) * totalWeight
  for (const entry of eligible) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.action
  }
  return eligible[eligible.length - 1]?.action ?? null
}
