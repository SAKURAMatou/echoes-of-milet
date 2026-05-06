<template>
  <section
    id="hero"
    ref="heroSection"
    class="relative isolate flex h-[75svh] min-h-[560px] w-full max-w-full items-end justify-center overflow-hidden px-5 pb-24 pt-24 sm:px-8 md:px-10"
    :class="{ 'is-animation-paused': !isAnimationActive }"
  >
    <div
      class="absolute rounded-lg inset-0 -z-30 bg-[linear-gradient(135deg,#ffffff_0%,#eef8ff_46%,#d9ecfb_100%)]"
    ></div>
    <div class="hero-live-beams absolute inset-0 -z-20"></div>
    <div class="hero-live-haze absolute inset-x-0 top-0 -z-20 h-[62%]"></div>
    <div class="hero-stage-floor absolute inset-x-0 bottom-0 -z-20 h-[44%]"></div>
    <div class="hero-waveform pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[8.5rem]">
      <svg
        class="hero-sine hero-sine-primary"
        aria-hidden="true"
        preserveAspectRatio="none"
        viewBox="0 0 1200 160"
      >
        <path
          d="M0 106 C 75 40, 150 40, 225 106 S 375 172, 450 106 S 600 40, 675 106 S 825 172, 900 106 S 1050 40, 1200 106"
        />
      </svg>
      <svg
        class="hero-sine hero-sine-secondary"
        aria-hidden="true"
        preserveAspectRatio="none"
        viewBox="0 0 1200 160"
      >
        <path
          d="M0 118 C 100 74, 190 74, 290 118 S 480 162, 580 118 S 770 74, 870 118 S 1060 162, 1200 118"
        />
      </svg>
      <svg
        class="hero-sine hero-sine-tertiary"
        aria-hidden="true"
        preserveAspectRatio="none"
        viewBox="0 0 1200 160"
      >
        <path
          d="M0 92 C 120 70, 210 70, 330 92 S 540 114, 660 92 S 870 70, 990 92 S 1120 114, 1200 92"
        />
      </svg>
    </div>
    <div
      class="hero-waveform-line pointer-events-none absolute inset-x-0 bottom-16 -z-10 h-px"
    ></div>
    <div
      class="absolute inset-x-0 bottom-0 -z-10 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.56)_100%)]"
    ></div>

    <div class="relative z-10 mx-auto flex w-full max-w-[620px] flex-col items-center text-center">
      <div class="relative">
        <span
          class="pointer-events-none absolute left-1/2 top-0 -z-10 w-max -translate-x-1/2 -translate-y-[88%] font-serif text-[clamp(2.5rem,7vw,4.7rem)] leading-none text-[#317f8d]/12"
          aria-hidden="true"
        >
          {{ currentYear }} archive
        </span>
        <h1
          class="hero-title-glow font-serif text-[clamp(2.85rem,7.6vw,4.7rem)] leading-none text-[#1e2a35]"
        >
          echoes of milet
        </h1>
      </div>
      <p class="mt-7 text-lg leading-8 text-[#3f4f5a]">{{ lead }}</p>
      <p class="mt-2 text-sm leading-7 text-[#6a7a85]">{{ sublead }}</p>
      <button
        type="button"
        class="mt-8 inline-flex min-h-11 items-center rounded-full border border-[#7b8a95]/55 bg-white/40 px-6 text-sm font-semibold text-[#23313d] shadow-[0_18px_44px_-34px_rgba(35,49,61,0.9)] transition hover:-translate-y-0.5 hover:border-[#23313d] hover:bg-[#23313d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#317f8d]"
        @click="$emit('scrollToHighlight')"
      >
        {{ buttonLabel }}
      </button>
      <button
        type="button"
        class="hero-scroll-indicator mt-9 rounded-full px-4 py-2 text-2xl leading-none text-[#317f8d]"
        :aria-label="scrollLabel"
        @click="$emit('scrollToHighlight')"
      >
        ↓
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{
  currentYear: number
  lead: string
  sublead: string
  buttonLabel: string
  scrollLabel: string
}>()

defineEmits<{
  scrollToHighlight: []
}>()

const heroSection = ref<HTMLElement | null>(null)
const isAnimationActive = ref(true)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      isAnimationActive.value = Boolean(entry?.isIntersecting)
    },
    {
      rootMargin: '160px 0px',
    },
  )

  if (heroSection.value) {
    observer.observe(heroSection.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.hero-live-beams {
  background:
    linear-gradient(
      106deg,
      transparent 0%,
      transparent 18%,
      rgba(125, 183, 224, 0.2) 24%,
      rgba(255, 255, 255, 0.03) 34%,
      transparent 46%
    ),
    linear-gradient(
      72deg,
      transparent 0%,
      transparent 34%,
      rgba(80, 148, 190, 0.14) 43%,
      rgba(255, 255, 255, 0.02) 52%,
      transparent 66%
    ),
    linear-gradient(
      118deg,
      transparent 0%,
      transparent 58%,
      rgba(171, 208, 231, 0.22) 65%,
      rgba(255, 255, 255, 0.04) 73%,
      transparent 88%
    );
  filter: blur(0.4px);
  mask-image: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.9) 58%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.9) 58%, transparent 100%);
  transform-origin: center top;
  animation: live-beam-drift 9s ease-in-out infinite alternate;
}

.hero-live-haze {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0)),
    repeating-linear-gradient(
      92deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0) 34px,
      rgba(255, 255, 255, 0.18) 35px,
      rgba(255, 255, 255, 0) 70px
    );
  opacity: 0.7;
  animation: haze-shift 12s ease-in-out infinite alternate;
}

.hero-stage-floor {
  background:
    linear-gradient(
      180deg,
      transparent 0%,
      rgba(172, 210, 232, 0.22) 58%,
      rgba(255, 255, 255, 0.52) 100%
    ),
    repeating-linear-gradient(
      90deg,
      rgba(30, 42, 53, 0.05) 0,
      rgba(30, 42, 53, 0.05) 1px,
      transparent 1px,
      transparent 64px
    );
  mask-image: linear-gradient(180deg, transparent 0%, #000 48%, #000 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 48%, #000 100%);
}

.hero-waveform {
  opacity: 0.62;
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(49, 127, 141, 0.08) 62%,
      rgba(255, 255, 255, 0.18) 100%
    ),
    repeating-linear-gradient(
      90deg,
      rgba(49, 127, 141, 0.08) 0,
      rgba(49, 127, 141, 0.08) 1px,
      transparent 1px,
      transparent 14px
    );
  mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 100%);
}

.hero-sine {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 220%;
  left: -60%;
  overflow: visible;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform-origin: left center;
}

.hero-sine-primary {
  stroke: rgba(49, 127, 141, 0.24);
  stroke-width: 4;
  filter: drop-shadow(0 12px 22px rgba(49, 127, 141, 0.12));
  animation: sine-primary-flow 8.5s linear infinite;
}

.hero-sine-secondary {
  stroke: rgba(140, 72, 85, 0.14);
  stroke-width: 2;
  animation: sine-secondary-flow 11s linear infinite;
}

.hero-sine-tertiary {
  stroke: rgba(49, 127, 141, 0.11);
  stroke-width: 1.5;
  animation: sine-tertiary-flow 14s linear infinite;
}

.hero-waveform-line {
  background: linear-gradient(90deg, transparent, rgba(49, 127, 141, 0.38), transparent);
  opacity: 0.58;
}

.hero-title-glow {
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7),
    0 22px 52px rgba(38, 95, 132, 0.22);
}

.hero-scroll-indicator {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.74) 0%, rgba(255, 255, 255, 0) 72%);
  box-shadow: 0 14px 36px -26px rgba(49, 127, 141, 0.9);
  animation: hero-scroll-pulse 1.8s ease-in-out infinite;
}

.is-animation-paused .hero-live-beams,
.is-animation-paused .hero-live-haze,
.is-animation-paused .hero-sine,
.is-animation-paused .hero-scroll-indicator {
  animation-play-state: paused;
}

@keyframes live-beam-drift {
  from {
    opacity: 0.76;
    transform: translateX(-1.4%) skewX(-1deg);
  }

  to {
    opacity: 1;
    transform: translateX(1.6%) skewX(1deg);
  }
}

@keyframes haze-shift {
  from {
    transform: translateX(-2%);
  }

  to {
    transform: translateX(2%);
  }
}

@keyframes sine-primary-flow {
  from {
    opacity: 0.72;
    transform: translateX(0) translateY(0) scaleY(0.92);
  }

  to {
    opacity: 0.72;
    transform: translateX(28%) translateY(2px) scaleY(1);
  }
}

@keyframes sine-secondary-flow {
  from {
    opacity: 0.48;
    transform: translateX(-6%) translateY(3px) scaleY(0.86);
  }

  to {
    opacity: 0.48;
    transform: translateX(22%) translateY(1px) scaleY(0.98);
  }
}

@keyframes sine-tertiary-flow {
  from {
    opacity: 0.38;
    transform: translateX(-12%) translateY(-8px) scaleY(0.78);
  }

  to {
    opacity: 0.38;
    transform: translateX(18%) translateY(-6px) scaleY(0.9);
  }
}

@keyframes hero-scroll-pulse {
  0%,
  100% {
    opacity: 0.46;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-live-beams,
  .hero-live-haze,
  .hero-sine,
  .hero-scroll-indicator {
    animation: none;
  }

  .hero-sine {
    transform: none;
  }
}
</style>
