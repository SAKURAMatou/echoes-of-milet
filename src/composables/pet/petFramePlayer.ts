/**
 * Adapted clock-driven clip player from designs/jean-motion/player.js.
 *
 * Unlike the preview script, each Vue mount creates its own instance; no globals
 * are read or written, and per-frame manifest durations are authoritative.
 */

import type { PetAction } from './petTypes'

export interface PetClipRuntime {
  frameCount: number
  durations?: number[]
  fps?: number
  loop: boolean
}

export interface PetFrameResult {
  frame: number
  ended: boolean
}

export function shouldPetAnimationLoop(
  action: PetAction,
  assetLoops: boolean,
  dragging: boolean,
): boolean {
  return assetLoops && (action !== 'drag' || dragging)
}

export function resolvePetFrame(
  clip: PetClipRuntime,
  elapsedMs: number,
  loop: boolean,
): PetFrameResult {
  const frameCount = Math.max(1, clip.frameCount)
  const durations =
    clip.durations && clip.durations.length >= frameCount
      ? clip.durations
      : Array.from({ length: frameCount }, () => 1000 / Math.max(1, clip.fps || 1))
  const total = durations.reduce((sum, value) => sum + value, 0)
  const cursor = loop
    ? Math.max(0, elapsedMs) % total
    : Math.min(Math.max(0, elapsedMs), Math.max(0, total - 0.001))
  let remaining = cursor

  for (let index = 0; index < durations.length; index += 1) {
    if (remaining < durations[index]) {
      return { frame: index, ended: !loop && elapsedMs >= total }
    }
    remaining -= durations[index]
  }

  return { frame: frameCount - 1, ended: !loop && elapsedMs >= total }
}

export class PetFramePlayer {
  elapsedMs = 0
  action: string | null = null
  playing = true
  private currentClip: PetClipRuntime | null = null
  private currentLoop = true

  select(action: string, clip: PetClipRuntime, loop = true) {
    this.action = action
    this.currentClip = clip
    this.currentLoop = loop
    this.elapsedMs = 0
    this.playing = true
  }

  tick(deltaMs: number): PetFrameResult {
    if (this.playing) {
      this.elapsedMs += Math.max(0, deltaMs)
    }
    if (!this.currentClip || !this.action) {
      return { frame: 0, ended: false }
    }
    return resolvePetFrame(this.currentClip, this.elapsedMs, this.currentLoop)
  }

  get loop(): boolean {
    return this.currentLoop
  }
}
