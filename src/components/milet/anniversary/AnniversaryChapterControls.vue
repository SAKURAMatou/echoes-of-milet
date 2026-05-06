<template>
  <button
    class="chapter-control chapter-control-prev"
    type="button"
    aria-label="Previous chapter"
    @click="$emit('prev')"
  >
    <span class="desktop-arrow max-md:hidden">←</span>
    <span class="mobile-arrow md:hidden">↑</span>
    <em>prev</em>
  </button>
  <button
    class="chapter-control chapter-control-next"
    type="button"
    aria-label="Next chapter"
    @click="$emit('next')"
  >
    <span class="desktop-arrow max-md:hidden">→</span>
    <span class="mobile-arrow md:hidden">↓</span>
    <em>next</em>
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  (event: 'prev'): void
  (event: 'next'): void
}>()
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
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.2);
  color: rgba(39, 109, 123, 0.86);
  text-transform: uppercase;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 70px -54px rgba(31, 43, 53, 0.95);
  transform: translateY(-50%);
  transition:
    transform 220ms ease,
    background 220ms ease,
    opacity 220ms ease;
  animation: chapter-control-breathe 3.8s ease-in-out infinite;
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
  letter-spacing: 0.18em;
  writing-mode: vertical-rl;
}

.chapter-control:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.58);
}

.chapter-control-prev:hover {
  transform: translateY(-50%) translateX(-0.2rem);
}

.chapter-control-next:hover {
  transform: translateY(-50%) translateX(0.2rem);
}

@keyframes chapter-control-breathe {
  0%,
  100% {
    opacity: 0.24;
  }

  45% {
    opacity: 0.78;
  }

  70% {
    opacity: 0.42;
  }
}

@media (max-width: 767px) {
  .chapter-control {
    left: 50%;
    width: min(40vw, 10.5rem);
    min-height: 3.35rem;
    flex-direction: row;
    border-radius: 1.35rem 0.45rem 1.35rem 0.45rem;
    clip-path: polygon(12% 0, 88% 0, 100% 52%, 82% 100%, 18% 100%, 0 52%);
    transform: translateX(-50%);
  }

  .chapter-control em {
    writing-mode: horizontal-tb;
  }

  .chapter-control-prev {
    top: 6.85rem;
    right: auto;
  }

  .chapter-control-next {
    top: auto;
    right: auto;
    bottom: 1.05rem;
  }

  .chapter-control-prev:hover,
  .chapter-control-next:hover {
    transform: translateX(-50%);
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .chapter-control {
    min-height: 3rem;
  }
}
</style>
