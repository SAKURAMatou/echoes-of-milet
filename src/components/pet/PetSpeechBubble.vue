<template>
  <Transition name="pet-speech">
    <div
      v-if="visible && message"
      :key="generation"
      data-pet-speech
      aria-hidden="true"
      class="pet-speech pointer-events-none absolute"
      :data-horizontal="layout.horizontal"
      :data-vertical="layout.vertical"
      :lang="lang"
      :style="bubbleStyle"
    >
      <span class="pet-speech__glint" aria-hidden="true" />
      <p class="pet-speech__copy">{{ message }}</p>
      <span class="pet-speech__tail" aria-hidden="true" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

import {
  resolvePetSpeechBubbleLayout,
  type PetEdgeInsets,
  type PetViewportBox,
} from '@/composables/pet/petGeometryCore'
import type { PetUrlLang } from '@/composables/pet/petTypes'

const props = defineProps<{
  visible: boolean
  message: string
  generation: number
  lang: PetUrlLang
  petX: number
  petY: number
  petSize: number
  viewport: PetViewportBox
  safeInsets: PetEdgeInsets
  isMobile: boolean
}>()

const bubbleWidth = computed(() => (props.isMobile ? 190 : 224))
const bubbleHeight = computed(() => (props.isMobile ? 82 : 86))
const layout = computed(() =>
  resolvePetSpeechBubbleLayout({
    viewport: props.viewport,
    safeInsets: props.safeInsets,
    petX: props.petX,
    petY: props.petY,
    petSize: props.petSize,
    bubbleWidth: bubbleWidth.value,
    bubbleHeight: bubbleHeight.value,
  }),
)
const bubbleStyle = computed<CSSProperties>(() => ({
  left: `${layout.value.left}px`,
  top: `${layout.value.top}px`,
  width: `${bubbleWidth.value}px`,
  minHeight: `${bubbleHeight.value}px`,
}))
</script>

<style scoped>
.pet-speech {
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 1rem 1.15rem;
  border: 1px solid rgb(145 202 198 / 0.72);
  border-radius: 1.55rem 1.55rem 1.35rem 1.55rem;
  background:
    radial-gradient(circle at 15% 18%, rgb(255 255 255 / 0.98) 0 11%, transparent 38%),
    linear-gradient(145deg, rgb(255 253 243 / 0.97), rgb(239 250 247 / 0.94));
  box-shadow:
    0 18px 42px -22px rgb(17 75 76 / 0.72),
    inset 0 1px 0 rgb(255 255 255 / 0.92),
    inset 0 -1px 0 rgb(204 169 92 / 0.18);
  color: rgb(28 70 69);
  backdrop-filter: blur(14px) saturate(1.08);
  transform-origin: var(--pet-speech-origin, 80% 100%);
}

.pet-speech[data-horizontal='right'] {
  border-radius: 1.55rem 1.55rem 1.55rem 1.35rem;
  --pet-speech-origin: 20% 100%;
}

.pet-speech[data-vertical='below'] {
  --pet-speech-origin: 80% 0%;
}

.pet-speech[data-horizontal='right'][data-vertical='below'] {
  --pet-speech-origin: 20% 0%;
}

.pet-speech__copy {
  position: relative;
  z-index: 1;
  margin: 0;
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.65;
  letter-spacing: 0.035em;
  text-wrap: pretty;
}

.pet-speech__glint {
  position: absolute;
  top: 0.65rem;
  right: 0.85rem;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 999px;
  background: rgb(215 177 94 / 0.78);
  box-shadow: -0.52rem 0.18rem 0 -0.12rem rgb(105 181 178 / 0.64);
}

.pet-speech__tail {
  position: absolute;
  right: 1.6rem;
  bottom: -0.48rem;
  width: 1rem;
  height: 1rem;
  border-right: 1px solid rgb(145 202 198 / 0.72);
  border-bottom: 1px solid rgb(145 202 198 / 0.72);
  background: rgb(239 250 247 / 0.96);
  transform: rotate(45deg);
}

.pet-speech[data-horizontal='right'] .pet-speech__tail {
  right: auto;
  left: 1.6rem;
}

.pet-speech[data-vertical='below'] .pet-speech__tail {
  top: -0.48rem;
  bottom: auto;
  border: 0;
  border-top: 1px solid rgb(145 202 198 / 0.72);
  border-left: 1px solid rgb(145 202 198 / 0.72);
  background: rgb(255 253 243 / 0.97);
}

.pet-speech-enter-active {
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pet-speech-leave-active {
  transition:
    opacity 170ms ease,
    transform 190ms ease;
}

.pet-speech-enter-from,
.pet-speech-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.88);
}

.pet-speech-enter-to,
.pet-speech-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (max-width: 640px) {
  .pet-speech {
    padding: 0.9rem 1rem;
  }

  .pet-speech__copy {
    font-size: 0.78rem;
    line-height: 1.62;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pet-speech-enter-active,
  .pet-speech-leave-active {
    transition: opacity 100ms linear;
  }

  .pet-speech-enter-from,
  .pet-speech-leave-to {
    transform: none;
  }
}
</style>
