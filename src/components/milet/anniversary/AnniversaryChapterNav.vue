<template>
  <nav class="chapter-nav" aria-label="Anniversary chapters">
    <button
      v-for="(chapter, index) in chapters"
      :key="chapter.id"
      type="button"
      :class="index === activeChapter ? 'is-active' : ''"
      @click="$emit('selectChapter', index)"
    >
      <span>{{ `0${index + 1}` }}</span>
      <em>{{ chapter.eyebrow }}</em>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { AnniversaryChapter } from '@/composables/miletAnniversary'

defineProps<{
  chapters: AnniversaryChapter[]
  activeChapter: number
}>()

defineEmits<{
  (event: 'selectChapter', index: number): void
}>()
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
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 1.1rem 1.1rem 0.32rem 0.32rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.08));
  clip-path: polygon(0 18%, 82% 18%, 100% 50%, 82% 82%, 0 82%, 8% 50%);
  padding: 0.8rem 1.35rem 0.85rem 1.15rem;
  text-align: left;
  backdrop-filter: blur(16px);
  transform: translateY(calc(var(--step, 0) * 0.18rem));
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

.chapter-nav button:nth-child(1) {
  --step: 0;
}

.chapter-nav button:nth-child(2) {
  --step: 1;
}

.chapter-nav button:nth-child(3) {
  --step: 2;
}

.chapter-nav button:nth-child(4) {
  --step: 3;
}

.chapter-nav button.is-active {
  background:
    linear-gradient(135deg, rgba(39, 109, 123, 0.98), rgba(49, 127, 141, 0.86)),
    linear-gradient(90deg, rgba(221, 190, 95, 0.26), rgba(255, 255, 255, 0));
  color: white;
  transform: translateY(0.36rem);
}

.chapter-nav button::before {
  content: '';
  position: absolute;
  right: 0.42rem;
  top: 50%;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.16);
  transform: translateY(-50%);
}

.chapter-nav button.is-active::before {
  background: rgba(255, 255, 255, 0.82);
}

.chapter-nav span {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
}

.chapter-nav em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 700;
}

@media (max-width: 767px) {
  .chapter-nav {
    top: 3.05rem;
    right: 0.75rem;
    left: 0.75rem;
    align-items: flex-start;
  }
}

@media (max-width: 430px) {
  .chapter-nav {
    top: 4.05rem;
    left: 0.55rem;
    right: 0.55rem;
    gap: 0;
  }

  .chapter-nav button {
    min-width: 25%;
    padding: 0.7rem 0.85rem 0.75rem 0.7rem;
    clip-path: polygon(0 12%, 78% 12%, 100% 50%, 78% 88%, 0 88%, 10% 50%);
  }

  .chapter-nav em {
    display: none;
  }
}
</style>
