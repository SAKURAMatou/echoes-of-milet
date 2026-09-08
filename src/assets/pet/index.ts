import { PET_ACTIONS, type PetAction } from '@/composables/pet/petTypes'

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
import lookLeftSheet from './look-left.sheet.webp'
import lookLeftStatic from './look-left.static.webp'
import lookLeftUpSheet from './look-left-up.sheet.webp'
import lookLeftUpStatic from './look-left-up.static.webp'
import lookRightSheet from './look-right.sheet.webp'
import lookRightStatic from './look-right.static.webp'
import lookRightUpSheet from './look-right-up.sheet.webp'
import lookRightUpStatic from './look-right-up.static.webp'
import lookUpSheet from './look-up.sheet.webp'
import lookUpStatic from './look-up.static.webp'
import sitSheet from './sit.sheet.webp'
import sitStatic from './sit.static.webp'
import sleepSheet from './sleep.sheet.webp'
import sleepStatic from './sleep.static.webp'
import sniffSheet from './sniff.sheet.webp'
import sniffStatic from './sniff.static.webp'

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
  lookLeft: { sheet: lookLeftSheet, static: lookLeftStatic },
  lookLeftUp: { sheet: lookLeftUpSheet, static: lookLeftUpStatic },
  lookUp: { sheet: lookUpSheet, static: lookUpStatic },
  lookRightUp: { sheet: lookRightUpSheet, static: lookRightUpStatic },
  lookRight: { sheet: lookRightSheet, static: lookRightStatic },
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

for (const id of PET_ACTIONS) {
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
