<template>
  <section class="anniversary-slide">
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-10 sm:px-8 md:grid-cols-[0.92fr_1.08fr] md:gap-14"
    >
      <div class="mobile-scroll-region order-2 md:order-1">
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h1
          class="mt-4 font-serif text-5xl leading-[0.95] text-[#1d2b36] sm:text-6xl md:text-7xl"
        >
          {{ content.title }}
        </h1>
        <p class="mt-6 max-w-xl text-base leading-8 text-[#52636f] sm:text-lg">
          {{ content.lead }}
        </p>
        <p class="mt-3 text-sm leading-7 text-[#7d6a33]">
          {{ content.giftNote }}
        </p>
        <button class="primary-action mt-8" type="button" @click="$emit('next')">
          open the year
        </button>
      </div>

      <div class="order-1 flex justify-center md:order-2">
        <div class="anniversary-number" aria-label="anniversary year">
          <span class="text-8xl font-semibold leading-none sm:text-9xl">{{ anniversaryNo }}</span>
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
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryRecordContent,
} from '@/composables/miletAnniversary'

defineProps<{
  chapter: AnniversaryChapter
  content: AnniversaryRecordContent
  anniversaryNo: number
  lang: AnniversaryLang
}>()

defineEmits<{
  (event: 'next'): void
}>()
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
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(235, 247, 249, 0.82)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.1));
  clip-path: polygon(0 22%, 84% 22%, 100% 50%, 84% 78%, 0 78%, 9% 50%);
  padding: 0 1.9rem 0 1.55rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #276d7b;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 48px -36px rgba(31, 43, 53, 0.9);
  transition:
    transform 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  background:
    linear-gradient(135deg, rgba(39, 109, 123, 0.96), rgba(49, 127, 141, 0.9)),
    linear-gradient(90deg, rgba(221, 190, 95, 0.24), rgba(255, 255, 255, 0));
  color: white;
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
  border: 1px solid rgba(255, 255, 255, 0.82);
  background:
    radial-gradient(
      circle at 48% 42%,
      rgba(255, 255, 255, 0.96),
      rgba(255, 255, 255, 0.56) 54%,
      rgba(221, 190, 95, 0.18)
    ),
    linear-gradient(145deg, rgba(255, 255, 255, 0.74), rgba(203, 232, 238, 0.42));
  color: #276d7b;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 34px 80px -50px rgba(31, 43, 53, 0.9);
}

.anniversary-number::before,
.anniversary-number::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(49, 127, 141, 0.2);
  pointer-events: none;
}

.anniversary-number::before {
  inset: 8%;
  transform: rotate(-13deg);
}

.anniversary-number::after {
  inset: 17%;
  border-color: rgba(221, 190, 95, 0.28);
  transform: rotate(18deg);
  animation: ring-breathe 4.8s ease-in-out infinite;
}

@keyframes ring-breathe {
  0%,
  100% {
    opacity: 0.58;
    transform: rotate(18deg) scale(1);
  }

  50% {
    opacity: 1;
    transform: rotate(24deg) scale(1.04);
  }
}

@media (max-width: 767px) {
  .anniversary-number {
    width: min(62vw, 260px);
  }

  .primary-action {
    min-height: 3rem;
    padding: 0 1.65rem 0 1.35rem;
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .anniversary-number {
    width: min(52vw, 210px);
  }
}
</style>
