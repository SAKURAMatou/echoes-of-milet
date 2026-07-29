<template>
  <button
    class="chapter-control chapter-control-prev"
    type="button"
    :disabled="atStart"
    :aria-label="previousLabel"
    @click="$emit('prev')"
  >
    <span aria-hidden="true">←</span>
    <em>{{ lang === 'ja' ? '前へ' : '上一章' }}</em>
  </button>
  <button
    class="chapter-control chapter-control-next"
    type="button"
    :disabled="atEnd"
    :aria-label="nextLabel"
    @click="$emit('next')"
  >
    <span aria-hidden="true">→</span>
    <em>{{ lang === 'ja' ? '次へ' : '下一章' }}</em>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { AnniversaryLang } from '@/composables/miletAnniversary'

const props = defineProps<{
  atStart: boolean
  atEnd: boolean
  lang: AnniversaryLang
}>()

defineEmits<{
  (event: 'prev'): void
  (event: 'next'): void
}>()

const previousLabel = computed(() => (props.lang === 'ja' ? '前の章' : '上一章'))
const nextLabel = computed(() => (props.lang === 'ja' ? '次の章' : '下一章'))
</script>

<style scoped>
.chapter-control {
  position: absolute;
  top: 50%;
  z-index: 30;
  display: flex;
  width: 5.6rem;
  min-height: 11rem;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.38);
  color: rgba(39, 109, 123, 0.9);
  text-transform: uppercase;
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 70px -54px rgba(31, 43, 53, 0.95);
  transform: translateY(-50%);
  transition:
    transform var(--anniversary-micro-duration, 180ms) ease,
    background var(--anniversary-micro-duration, 180ms) ease,
    opacity var(--anniversary-micro-duration, 180ms) ease;
  animation: chapter-control-hint 1.6s ease-out 1;
}

.chapter-control-prev {
  left: 1.15rem;
  border-radius: 0 999px 999px 0;
}

.chapter-control-next {
  right: 1.15rem;
  border-radius: 999px 0 0 999px;
}

.chapter-control span {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
}

.chapter-control em {
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.12em;
  writing-mode: vertical-rl;
}

.chapter-control:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.7);
}

.chapter-control-prev:hover:not(:disabled) {
  transform: translateY(-50%) translateX(-0.2rem);
}

.chapter-control-next:hover:not(:disabled) {
  transform: translateY(-50%) translateX(0.2rem);
}

.chapter-control:focus-visible {
  outline: 3px solid rgba(39, 109, 123, 0.55);
  outline-offset: 4px;
}

.chapter-control:disabled {
  cursor: not-allowed;
  opacity: 0.16;
  animation: none;
}

@keyframes chapter-control-hint {
  0%,
  100% {
    opacity: 0.42;
  }

  45% {
    opacity: 0.82;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-control {
    animation: none;
    transition: none;
  }
}
</style>
