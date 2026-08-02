<template>
  <div class="horizontal-scroll-hint">
    <button
      v-if="active && hasLeft"
      type="button"
      class="horizontal-scroll-hint__control horizontal-scroll-hint__control--left"
      :aria-label="leftAriaLabel"
      @click="scrollByDirection(-1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <div
      ref="railRef"
      class="horizontal-scroll-hint__rail"
      :class="contentClass"
      @scroll="updateScrollHint"
    >
      <slot />
    </div>

    <button
      v-if="active && hasRight"
      type="button"
      class="horizontal-scroll-hint__control horizontal-scroll-hint__control--right"
      :aria-label="rightAriaLabel"
      @click="scrollByDirection(1)"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    active?: boolean
    contentClass?: string
    leftAriaLabel?: string
    rightAriaLabel?: string
    minScrollDistance?: number
    scrollRatio?: number
    refreshKey?: unknown
  }>(),
  {
    active: true,
    contentClass: '',
    leftAriaLabel: 'scroll left',
    rightAriaLabel: 'scroll right',
    minScrollDistance: 160,
    scrollRatio: 0.72,
  },
)

const railRef = ref<HTMLElement | null>(null)
const hasLeft = ref(false)
const hasRight = ref(false)

let resizeObserver: ResizeObserver | null = null

function updateScrollHint() {
  const rail = railRef.value
  if (!rail || !props.active) {
    hasLeft.value = false
    hasRight.value = false
    return
  }

  const maxScrollLeft = rail.scrollWidth - rail.clientWidth
  hasLeft.value = rail.scrollLeft > 4
  hasRight.value = rail.scrollLeft < maxScrollLeft - 4
}

function scheduleUpdate() {
  void nextTick(updateScrollHint)
}

function scrollByDirection(direction: -1 | 1) {
  const rail = railRef.value
  if (!rail) return

  const distance = Math.max(Math.round(rail.clientWidth * props.scrollRatio), props.minScrollDistance)
  rail.scrollBy({ left: direction * distance, behavior: 'smooth' })
  window.setTimeout(updateScrollHint, 260)
}

watch(() => [props.active, props.refreshKey], scheduleUpdate)

onUpdated(scheduleUpdate)

onMounted(() => {
  updateScrollHint()
  const rail = railRef.value
  if (rail && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScrollHint)
    resizeObserver.observe(rail)
  }
  window.addEventListener('resize', updateScrollHint)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateScrollHint)
})
</script>

<style scoped>
.horizontal-scroll-hint {
  position: relative;
  min-width: 0;
  flex: 1 1 0%;
}

.horizontal-scroll-hint__rail {
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.horizontal-scroll-hint__rail::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll-hint__control {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 4;
  display: grid;
  width: 2.6rem;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(49, 127, 141, 0.78);
  cursor: pointer;
  padding: 0;
}

.horizontal-scroll-hint__control::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.horizontal-scroll-hint__control svg {
  position: relative;
  z-index: 1;
  height: 1.18rem;
  width: 1.18rem;
  filter: drop-shadow(0 2px 7px rgba(49, 127, 141, 0.24));
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.horizontal-scroll-hint__control:hover {
  color: rgba(14, 116, 144, 0.96);
}

.horizontal-scroll-hint__control--left {
  left: 0;
}

.horizontal-scroll-hint__control--left::before {
  background: linear-gradient(
    270deg,
    rgba(255, 255, 255, 0),
    var(--scroll-hint-edge-bg, rgba(249, 252, 255, 0.98)) 62%
  );
}

.horizontal-scroll-hint__control--left svg {
  animation: horizontal-scroll-hint-prev 720ms ease-in-out 2;
}

.horizontal-scroll-hint__control--right {
  right: 0;
}

.horizontal-scroll-hint__control--right::before {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    var(--scroll-hint-edge-bg, rgba(249, 252, 255, 0.98)) 62%
  );
}

.horizontal-scroll-hint__control--right svg {
  animation: horizontal-scroll-hint-next 720ms ease-in-out 2;
}

@media (hover: hover) and (pointer: fine) {
  .horizontal-scroll-hint__control--left:hover svg {
    transform: translateX(-0.12rem);
  }

  .horizontal-scroll-hint__control--right:hover svg {
    transform: translateX(0.12rem);
  }
}

@keyframes horizontal-scroll-hint-prev {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(-0.14rem);
  }
}

@keyframes horizontal-scroll-hint-next {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(0.14rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .horizontal-scroll-hint__control svg { animation: none; transition: color 1ms; }
}
</style>
