/**
 * Adapted clock-driven clip player from designs/jean-motion/player.js.
 *
 * Unlike the preview script, each Vue mount creates its own instance; no globals
 * are read or written, and per-frame manifest durations are authoritative.
 */

import type { PetAction, PetPlayback } from './petTypes'

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

export function resolvePetReverseFrame(
  clip: PetClipRuntime,
  elapsedMs: number,
  startFrame = clip.frameCount - 1,
): PetFrameResult {
  const frameCount = Math.max(1, clip.frameCount)
  const durations =
    clip.durations && clip.durations.length >= frameCount
      ? clip.durations
      : Array.from({ length: frameCount }, () => 1000 / Math.max(1, clip.fps || 1))
  const start = Math.min(frameCount - 1, Math.max(0, Math.floor(startFrame)))
  let remaining = Math.max(0, elapsedMs)

  for (let frame = start; frame > 0; frame -= 1) {
    const duration = durations[frame] ?? durations[durations.length - 1] ?? 100
    if (remaining < duration) return { frame, ended: false }
    remaining -= duration
  }
  return { frame: 0, ended: true }
}

export class PetFramePlayer {
  elapsedMs = 0
  action: string | null = null
  playing = true
  private currentClip: PetClipRuntime | null = null
  private currentPlayback: PetPlayback = 'loop'
  private reverseStartFrame = 0
  private currentFrame = 0

  select(
    action: string,
    clip: PetClipRuntime,
    playback: PetPlayback | boolean = 'loop',
    startFrame?: number,
  ) {
    const previousAction = this.action
    const previousFrame = this.currentFrame
    this.action = action
    this.currentClip = clip
    this.currentPlayback =
      typeof playback === 'boolean' ? (playback ? 'loop' : 'once') : playback
    this.reverseStartFrame = Math.min(
      Math.max(0, clip.frameCount - 1),
      Math.max(
        0,
        Math.floor(
          startFrame ??
            (this.currentPlayback === 'reverseOnce' && previousAction === action
              ? previousFrame
              : clip.frameCount - 1),
        ),
      ),
    )
    this.currentFrame = this.currentPlayback === 'reverseOnce' ? this.reverseStartFrame : 0
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
    const result =
      this.currentPlayback === 'reverseOnce'
        ? resolvePetReverseFrame(this.currentClip, this.elapsedMs, this.reverseStartFrame)
        : resolvePetFrame(
            this.currentClip,
            this.elapsedMs,
            this.currentPlayback === 'loop',
          )
    this.currentFrame = result.frame
    return result
  }

  get loop(): boolean {
    return this.currentPlayback === 'loop'
  }
}
