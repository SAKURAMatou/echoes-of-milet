import type { PetAction } from '@/composables/pet/petTypes'

import manifest from './manifest.json'
import curiousSheet from './curious.sheet.webp'
import curiousStatic from './curious.static.webp'
import dragSheet from './drag.sheet.webp'
import dragStatic from './drag.static.webp'
import excitedSheet from './excited.sheet.webp'
import excitedStatic from './excited.static.webp'
import happySheet from './happy.sheet.webp'
import happyStatic from './happy.static.webp'
import idleSheet from './idle.sheet.webp'
import idleStatic from './idle.static.webp'
import lookSheet from './look.sheet.webp'
import lookStatic from './look.static.webp'
import sitSheet from './sit.sheet.webp'
import sitStatic from './sit.static.webp'
import sleepSheet from './sleep.sheet.webp'
import sleepStatic from './sleep.static.webp'
import sniffSheet from './sniff.sheet.webp'
import sniffStatic from './sniff.static.webp'

const actionIds = [
  'idle',
  'sit',
  'happy',
  'curious',
  'excited',
  'sniff',
  'look',
  'drag',
  'sleep',
] as const satisfies readonly PetAction[]

const imageUrls: Record<
  PetAction,
  { sheet: string; static: string }
> = {
  idle: { sheet: idleSheet, static: idleStatic },
  sit: { sheet: sitSheet, static: sitStatic },
  happy: { sheet: happySheet, static: happyStatic },
  curious: { sheet: curiousSheet, static: curiousStatic },
  excited: { sheet: excitedSheet, static: excitedStatic },
  sniff: { sheet: sniffSheet, static: sniffStatic },
  look: { sheet: lookSheet, static: lookStatic },
  drag: { sheet: dragSheet, static: dragStatic },
  sleep: { sheet: sleepSheet, static: sleepStatic },
}

export interface ResolvedPetAnimationAsset {
  id: PetAction
  src: string
  staticSrc: string
  frameWidth: number
  frameHeight: number
  columns: number
  rows: number
  frameCount: number
  fps: number
  durations: number[]
  loop: boolean
  anchor: { x: number; y: number }
  bytes: number
}

const resolved = {} as Record<PetAction, ResolvedPetAnimationAsset>

for (const id of actionIds) {
  const meta = manifest.animations[id]
  if (!meta) {
    throw new Error(`Pet manifest is missing animation "${id}"`)
  }
  resolved[id] = {
    id,
    src: imageUrls[id].sheet,
    staticSrc: imageUrls[id].static,
    frameWidth: meta.frameWidth,
    frameHeight: meta.frameHeight,
    columns: meta.columns,
    rows: meta.rows,
    frameCount: meta.frameCount,
    fps: meta.fps,
    durations: meta.durations,
    loop: meta.loop,
    anchor: meta.anchor,
    bytes: meta.bytes,
  }
}

export const PET_ANIMATION_ASSETS: Readonly<Record<PetAction, ResolvedPetAnimationAsset>> =
  resolved

export type { PetAction }
