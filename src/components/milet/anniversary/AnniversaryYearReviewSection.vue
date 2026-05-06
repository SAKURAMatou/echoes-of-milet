<template>
  <section class="anniversary-slide anniversary-slide-year">
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-7 px-5 pt-10 sm:px-8 md:grid-cols-[0.86fr_1.14fr] md:gap-12"
    >
      <div>
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title">{{ chapter.title }}</h2>
        <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{
            lang === 'ja'
              ? '数えるためではなく、もう一度うれしかった瞬間に会うための year notes。'
              : '不是为了数清发生了多少事，而是再见一遍那些让人心动的时刻。'
          }}
        </p>
      </div>

      <div class="year-panel mobile-scroll-region">
        <div class="moment-heading">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
            {{ activeMoment.date }}
          </p>
          <div class="moment-title-row">
            <h3 class="font-serif text-3xl leading-tight text-[#263542] sm:text-4xl">
              {{ activeMoment.title }}
            </h3>
            <div class="moment-actions">
              <span
                class="moment-label rounded-full border border-[#d9c27b] px-3 py-1 text-xs font-semibold uppercase text-[#8a6e1b]"
              >
                {{ activeMoment.label }}
              </span>
              <button class="moment-toggle" type="button" @click="$emit('togglePause')">
                {{ paused ? pauseText.resume : pauseText.pause }}
              </button>
            </div>
          </div>
        </div>
        <p class="mt-5 text-sm leading-7 text-[#586872] sm:text-base">
          {{ activeMoment.body }}
        </p>

        <div class="moment-progress-list">
          <button
            v-for="(moment, index) in timeline"
            :key="moment.id"
            type="button"
            class="moment-progress"
            :class="index === activeMomentIndex ? 'is-active' : ''"
            @click="$emit('selectMoment', index)"
          >
            <span>{{ moment.date.replace('2025 ', '') }}</span>
            <i :style="index === activeMomentIndex ? progressStyle(progress) : undefined"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryTimelineMoment,
} from '@/composables/miletAnniversary'

defineProps<{
  chapter: AnniversaryChapter
  timeline: AnniversaryTimelineMoment[]
  activeMoment: AnniversaryTimelineMoment
  activeMomentIndex: number
  progress: number
  paused: boolean
  lang: AnniversaryLang
}>()

defineEmits<{
  (event: 'selectMoment', index: number): void
  (event: 'togglePause'): void
}>()

const pauseText = computed(() => ({
  pause: 'pause',
  resume: 'resume',
}))

function progressStyle(value: number) {
  return {
    '--progress': `${Math.max(0, Math.min(100, value))}%`,
  }
}
</script>

<style scoped>
.section-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #317f8d;
}

.section-title {
  margin-top: 1rem;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 3rem;
  line-height: 1;
  color: #1d2b36;
}

.year-panel {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.62);
  padding: 1.5rem;
  box-shadow: 0 24px 70px -48px rgba(31, 43, 53, 0.85);
  backdrop-filter: blur(18px);
}

.moment-title-row {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  margin-top: 0.75rem;
}

.moment-title-row h3 {
  min-width: 0;
}

.moment-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.moment-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.moment-toggle {
  min-height: 2.25rem;
  border: 1px solid rgba(49, 127, 141, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  padding: 0 1rem;
  color: #276d7b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    background 160ms ease,
    color 160ms ease;
}

.moment-toggle:active {
  background: rgba(39, 109, 123, 0.82);
  color: white;
}

.moment-toggle:focus-visible {
  outline: 2px solid rgba(49, 127, 141, 0.36);
  outline-offset: 3px;
}

.moment-progress-list {
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.moment-progress {
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
}

.moment-progress span {
  display: block;
  margin-bottom: 0.45rem;
  overflow: hidden;
  color: #7a8a94;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.moment-progress i {
  display: block;
  height: 0.32rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.12);
}

.moment-progress i::before {
  content: '';
  display: block;
  width: var(--progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #276d7b, rgba(221, 190, 95, 0.82));
}

  .moment-progress.is-active span {
    color: #276d7b;
  }

@media (hover: hover) and (pointer: fine) {
  .moment-toggle:hover {
    background: rgba(39, 109, 123, 0.92);
    color: white;
  }
}

@media (max-width: 767px) {
  .section-title {
    font-size: 2.45rem;
  }

  .year-panel {
    min-height: 0;
    margin-top: 0.8rem;
    padding: 1.1rem;
  }

  .moment-progress-list {
    gap: 0.55rem;
  }

  .moment-title-row {
    flex-direction: column;
    gap: 0.85rem;
  }

  .moment-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .section-title {
    font-size: 2.08rem;
  }
}
</style>
