<template>
  <nav class="chapter-nav" :class="{ 'is-compact': compact }" :aria-label="navLabel">
    <button
      v-for="(chapter, index) in chapters"
      :key="chapter.id"
      type="button"
      :class="index === activeChapter ? 'is-active' : ''"
      :aria-current="index === activeChapter ? 'step' : undefined"
      :aria-label="`${index + 1}. ${chapter.title}`"
      @click="handleSelect(index, $event)"
    >
      <span>{{ String(index + 1).padStart(2, '0') }}</span>
      <em>{{ chapter.eyebrow }}</em>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { AnniversaryChapter, AnniversaryLang } from '@/composables/miletAnniversary'

const props = defineProps<{
  chapters: AnniversaryChapter[]
  activeChapter: number
  compact?: boolean
  lang: AnniversaryLang
}>()

const emit = defineEmits<{
  (event: 'selectChapter', index: number, source: 'keyboard' | 'pointer'): void
}>()

const navLabel = computed(() => (props.lang === 'ja' ? '記念ページの章' : '周年页面章节'))

function handleSelect(index: number, event: MouseEvent) {
  emit('selectChapter', index, event.detail === 0 ? 'keyboard' : 'pointer')
}
</script>

<style scoped>
.chapter-nav {
  position: absolute;
  top: 1rem;
  right: 14.5rem;
  left: 17rem;
  z-index: 30;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.25rem;
}

.chapter-nav button {
  position: relative;
  min-width: min(22vw, 11rem);
  min-height: 2.75rem;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 1.1rem 1.1rem 0.32rem 0.32rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.58)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.08));
  clip-path: polygon(0 18%, 82% 18%, 100% 50%, 82% 82%, 0 82%, 8% 50%);
  padding: 0.78rem 1.35rem 0.82rem 1.15rem;
  text-align: left;
  backdrop-filter: blur(12px);
  transition:
    background var(--anniversary-micro-duration, 180ms) ease,
    color var(--anniversary-micro-duration, 180ms) ease,
    transform var(--anniversary-micro-duration, 180ms) ease;
}

.chapter-nav button.is-active {
  background: linear-gradient(135deg, rgba(39, 109, 123, 0.98), rgba(49, 127, 141, 0.86));
  color: white;
  transform: translateY(0.3rem);
}

.chapter-nav button::before {
  content: '';
  position: absolute;
  right: 0.44rem;
  top: 50%;
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.16);
  transform: translateY(-50%);
}

.chapter-nav button.is-active::before {
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 0 0 4px rgba(221, 190, 95, 0.16);
}

.chapter-nav button:focus-visible {
  outline: 3px solid rgba(39, 109, 123, 0.58);
  outline-offset: 3px;
}

.chapter-nav span,
.chapter-nav em {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
}

.chapter-nav em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-style: normal;
}

.chapter-nav.is-compact {
  position: sticky;
  top: 0;
  right: auto;
  left: auto;
  z-index: 40;
  width: 100%;
  align-items: stretch;
  gap: 0;
  padding: max(0.35rem, env(safe-area-inset-top)) 0.5rem 0.45rem;
  background: linear-gradient(180deg, rgba(248, 252, 251, 0.97), rgba(248, 252, 251, 0.82));
  box-shadow: 0 14px 28px -26px rgba(31, 43, 53, 0.72);
  backdrop-filter: blur(12px);
}

.chapter-nav.is-compact button {
  min-width: 25%;
  min-height: 2.75rem;
  padding: 0.65rem 0.72rem;
  clip-path: polygon(0 12%, 78% 12%, 100% 50%, 78% 88%, 0 88%, 10% 50%);
}

@media (max-width: 520px) {
  .chapter-nav.is-compact em {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-nav button {
    transition: none;
  }
}
</style>
