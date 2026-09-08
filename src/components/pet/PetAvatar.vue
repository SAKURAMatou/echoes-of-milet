<template>
  <button
    ref="rootRef"
    type="button"
    class="pet-avatar echo-focus pointer-events-auto relative block touch-none select-none rounded-full outline-none"
    :class="dragging ? 'pet-avatar--dragging' : 'pet-avatar--grab'"
    :aria-label="label"
    :style="{
      width: `${sizePx}px`,
      height: `${sizePx}px`,
    }"
  >
    <span
      v-if="sheetReady && motionEnabled && !staticPose"
      aria-hidden="true"
      class="pet-avatar__sheet absolute inset-0"
      :style="sheetStyle"
    />
    <img
      v-else-if="staticSrc"
      aria-hidden="true"
      class="pet-avatar__static absolute inset-0 h-full w-full"
      :src="staticSrc"
      alt=""
      draggable="false"
    />
    <span
      v-else
      aria-hidden="true"
      class="pet-avatar__fallback absolute inset-0 grid place-items-center text-base font-black text-[#317f8d]/75"
    >
      Jean
    </span>
    <span class="sr-only">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { ResolvedPetAnimationAsset } from '@/assets/pet'
import { PetFramePlayer } from '@/composables/pet/petFramePlayer'
import type { PetAction, PetPlayback } from '@/composables/pet/petTypes'

const props = defineProps<{
  action: PetAction
  animationGeneration: number
  playback: PetPlayback
  meta: ResolvedPetAnimationAsset | null
  sheetReady: boolean
  staticSrc: string
  sizePx: number
  dragging: boolean
  label: string
  motionEnabled: boolean
  documentVisible: boolean
}>()

const emit = defineEmits<{
  complete: [generation: number]
}>()

const rootRef = ref<HTMLElement | null>(null)
const player = new PetFramePlayer()
const currentFrame = ref(0)
const staticPose = ref(false)
let animationFrame = 0
let lastTimestamp = 0
let lastAction = ''
let lastGeneration = -1
let completionSentFor = -1

const columns = computed(() => Math.max(1, props.meta?.columns || 1))
const rows = computed(() => Math.max(1, props.meta?.rows || 1))

const sheetStyle = computed(() => {
  const meta = props.meta
  if (!meta) return undefined
  const columnIndex = Math.min(meta.columns - 1, currentFrame.value % columns.value)
  const rowIndex = Math.min(meta.rows - 1, Math.floor(currentFrame.value / columns.value))
  return {
    backgroundImage: `url("${meta.src}")`,
    backgroundSize: `${meta.columns * 100}% ${meta.rows * 100}%`,
    backgroundPosition:
      columns.value <= 1
        ? `${rowIndex === 0 ? 0 : 100}% ${rowIndex === 0 ? 0 : 100}%`
        : `${(columnIndex / (columns.value - 1)) * 100}% ${
            rows.value <= 1 ? 0 : (rowIndex / (rows.value - 1)) * 100
          }%`,
  }
})

function shouldRunFrameLoop() {
  return props.motionEnabled && props.documentVisible && props.sheetReady
}

function stopFrameLoop() {
  if (animationFrame && typeof window !== 'undefined') {
    window.cancelAnimationFrame(animationFrame)
  }
  animationFrame = 0
  lastTimestamp = 0
}

function startFrameLoop() {
  if (animationFrame) return
  if (!shouldRunFrameLoop()) return
  lastTimestamp = 0
  animationFrame = requestAnimationFrame(tick)
}

function resetPlayer() {
  const meta = props.meta
  if (!meta) return
  player.select(
    props.action,
    meta,
    props.playback,
    props.playback === 'reverseOnce' ? currentFrame.value : undefined,
  )
  currentFrame.value = props.playback === 'reverseOnce' ? currentFrame.value : 0
  staticPose.value = false
  completionSentFor = -1
  lastAction = props.action
  lastGeneration = props.animationGeneration
  lastTimestamp = 0
}

function tick(timestamp: number) {
  animationFrame = 0
  if (!props.meta || !shouldRunFrameLoop()) {
    lastTimestamp = 0
    return
  }

  if (lastTimestamp === 0) {
    lastTimestamp = timestamp
    animationFrame = requestAnimationFrame(tick)
    return
  }

  const delta = Math.min(1000, timestamp - lastTimestamp)
  lastTimestamp = timestamp
  animationFrame = requestAnimationFrame(tick)
  const result = player.tick(delta)
  currentFrame.value = result.frame
  if (!result.ended) {
    staticPose.value = false
    return
  }

  staticPose.value = false
  if (completionSentFor !== props.animationGeneration) {
    completionSentFor = props.animationGeneration
    emit('complete', props.animationGeneration)
  }
  stopFrameLoop()
}

watch(
  () => [props.action, props.animationGeneration, props.playback, props.meta] as const,
  () => {
    const meta = props.meta
    if (
      !meta ||
      (lastAction === props.action && lastGeneration === props.animationGeneration)
    ) {
      return
    }
    resetPlayer()
    startFrameLoop()
  },
  { immediate: true },
)

watch(
  () => [props.motionEnabled, props.documentVisible, props.sheetReady] as const,
  () => {
    if (shouldRunFrameLoop()) {
      startFrameLoop()
    } else {
      stopFrameLoop()
    }
  },
  { immediate: true },
)

onMounted(() => {
  resetPlayer()
  startFrameLoop()
})

onBeforeUnmount(() => {
  stopFrameLoop()
})

function focusSelf() {
  rootRef.value?.focus({ preventScroll: true })
}

function getElement() {
  return rootRef.value
}

defineExpose({ getElement, focus: focusSelf })
</script>

<style scoped>
.pet-avatar {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
}

.pet-avatar--dragging {
  cursor: grabbing;
}

.pet-avatar:focus-visible {
  outline: 3px solid rgb(49 127 141 / 0.7);
  outline-offset: 3px;
}

.pet-avatar__sheet {
  pointer-events: none;
  background-repeat: no-repeat;
}

.pet-avatar__static {
  pointer-events: none;
  object-fit: contain;
}

.pet-avatar__sheet,
.pet-avatar__static {
  transform: translate3d(-7.5%, -1.25%, 0) scale(1.25);
  transform-origin: center;
}

.pet-avatar__fallback {
  pointer-events: none;
  user-select: none;
}
</style>
