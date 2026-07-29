<template>
  <section
    :id="`anniversary-chapter-${chapter.id}`"
    class="anniversary-slide anniversary-slide-intro"
    data-page-scroll-anchor="anniversary-chapter-greeting"
    :inert="active ? undefined : true"
    :aria-hidden="active ? undefined : 'true'"
  >
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 md:grid-cols-[0.92fr_1.08fr] md:gap-14"
    >
      <div class="mobile-scroll-region anniversary-copy order-2 md:order-1">
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h1
          class="milet-page-title-font anniversary-heading mt-4 text-5xl leading-[0.95] text-[#1d2b36] sm:text-6xl md:text-7xl"
          data-anniversary-heading
          tabindex="-1"
        >
          {{ content.title }}
        </h1>
        <p class="anniversary-body mt-6 max-w-xl text-base leading-8 text-[#52636f] sm:text-lg">
          {{ content.lead }}
        </p>
        <p class="anniversary-body mt-3 text-sm leading-7 text-[#7d6a33]">
          {{ content.giftNote }}
        </p>
        <button class="primary-action anniversary-actions mt-8" type="button" @click="$emit('next')">
          {{ lang === 'ja' ? 'この一年をひらく' : '打开这一年的回声' }}
        </button>
      </div>

      <div class="order-1 flex justify-center md:order-2" aria-hidden="true">
        <div class="anniversary-number" :class="{ 'play-rings': playEntrance }">
          <i
            v-for="ring in ringCount"
            :key="ring"
            class="echo-ring"
            :style="ringStyle(ring)"
          ></i>
          <span class="anniversary-digit text-8xl font-semibold leading-none sm:text-9xl">{{ anniversaryNo }}</span>
          <span class="mt-2 text-lg font-semibold uppercase tracking-[0.26em]">anniversary</span>
          <span class="mt-5 max-w-[260px] text-center text-sm leading-7 text-[#52636f]">
            {{ lang === 'ja' ? 'お祝いを、やわらかい光にして。' : '把祝福放进柔和的光里。' }}
          </span>
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
  AnniversaryRecordContent,
} from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  content: AnniversaryRecordContent
  anniversaryNo: number
  lang: AnniversaryLang
  active: boolean
  playEntrance: boolean
}>()

defineEmits<{
  (event: 'next'): void
}>()

const ringCount = computed(() => Math.max(3, Math.min(6, Math.ceil(props.anniversaryNo / 2))))

function ringStyle(index: number) {
  const inset = 5 + index * 5.5
  return {
    inset: `${inset}%`,
    '--ring-delay': `${(index - 1) * 90}ms`,
    '--ring-rotation': `${index % 2 ? -9 - index * 2 : 9 + index * 2}deg`,
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

.primary-action {
  min-height: 2.75rem;
  border: none;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(235, 247, 249, 0.9));
  clip-path: polygon(0 22%, 84% 22%, 100% 50%, 84% 78%, 0 78%, 9% 50%);
  padding: 0 1.9rem 0 1.55rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #276d7b;
  box-shadow: 0 18px 48px -36px rgba(31, 43, 53, 0.9);
  transition: transform var(--anniversary-micro-duration, 180ms) ease, color var(--anniversary-micro-duration, 180ms) ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  color: #194e59;
}

.primary-action:focus-visible {
  outline: 3px solid rgba(39, 109, 123, 0.55);
  outline-offset: 4px;
}

.anniversary-number {
  position: relative;
  display: flex;
  width: min(72vw, 420px);
  aspect-ratio: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.86);
  background:
    radial-gradient(circle at 48% 42%, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.6) 54%, rgba(221, 190, 95, 0.18)),
    linear-gradient(145deg, rgba(255, 255, 255, 0.76), rgba(203, 232, 238, 0.42));
  color: #276d7b;
  box-shadow: 0 34px 80px -50px rgba(31, 43, 53, 0.9);
}

.echo-ring {
  position: absolute;
  border: 1px solid rgba(49, 127, 141, 0.18);
  border-radius: 50%;
  opacity: 0.72;
  transform: rotate(var(--ring-rotation));
}

.echo-ring:nth-child(even) {
  border-color: rgba(204, 167, 67, 0.27);
}

.play-rings .echo-ring {
  animation: ring-echo 760ms var(--anniversary-ease-out, ease-out) var(--ring-delay) 1 both;
}

.play-rings .anniversary-digit {
  animation: digit-focus 680ms var(--anniversary-ease-out, ease-out) 1 both;
}

@keyframes ring-echo {
  from { opacity: 0; transform: rotate(var(--ring-rotation)) scale(0.84); }
  to { opacity: 0.72; transform: rotate(var(--ring-rotation)) scale(1); }
}

@keyframes digit-focus {
  from { opacity: 0.45; filter: blur(5px); transform: scale(0.97); }
  to { opacity: 1; filter: blur(0); transform: scale(1); }
}

@media (max-width: 767px), (max-height: 640px) {
  .anniversary-number { width: min(66vw, 270px); }
}

@media (prefers-reduced-motion: reduce) {
  .play-rings .echo-ring,
  .play-rings .anniversary-digit { animation: none; }
}
</style>
