<template>
  <div
    v-if="visible"
    class="site-echo-layer"
    :class="[`is-${interaction.state.phase}`, `is-${interaction.state.direction}`, `is-${interaction.state.preset}`]"
    aria-hidden="true"
  >
    <svg class="site-echo-layer__path" viewBox="0 0 320 40" preserveAspectRatio="none">
      <path d="M8 27 C 78 5, 142 36, 212 16 S 280 12, 312 22" />
    </svg>
    <span class="site-echo-layer__node"></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useSiteInteraction } from '@/composables/site-interaction'

const interaction = useSiteInteraction()
const visible = computed(
  () =>
    interaction.state.phase !== 'idle' &&
    interaction.state.motionEnabled &&
    interaction.state.documentVisible,
)
</script>

<style scoped>
.site-echo-layer {
  pointer-events: none;
  position: fixed;
  inset-inline: clamp(1rem, 5vw, 5rem);
  top: calc(4rem + env(safe-area-inset-top, 0px));
  z-index: 35;
  height: 2.5rem;
  color: var(--echo-route-color, var(--echo-color-teal));
  opacity: 0.84;
}

.site-echo-layer.is-quiet { --echo-route-color: var(--echo-color-sky); }
.site-echo-layer.is-archive { --echo-route-color: var(--echo-color-gold); }
.site-echo-layer.is-map { --echo-route-color: #4d9b78; }
.site-echo-layer.is-challenge { --echo-route-color: #8c4855; }
.site-echo-layer.is-immersive { opacity: 0.48; }

.site-echo-layer__path {
  display: block;
  width: min(20rem, 62vw);
  height: 100%;
  overflow: visible;
}

.site-echo-layer__path path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 370;
  stroke-dashoffset: 370;
}

.site-echo-layer__node {
  position: absolute;
  top: 0.85rem;
  left: min(19.1rem, 58vw);
  width: 0.55rem;
  height: 0.55rem;
  border: 1px solid currentColor;
  border-radius: 9999px;
  opacity: 0;
}

.is-departing .site-echo-layer__path path {
  animation: site-echo-path var(--echo-duration-route) var(--echo-ease-out) both;
}

.is-back .site-echo-layer__path { transform: scaleX(-1); transform-origin: center; }
.is-replace .site-echo-layer__path path { animation: site-echo-replace 180ms ease-out both; }

.is-arriving .site-echo-layer__path path {
  stroke-dashoffset: 0;
  opacity: 0.34;
}

.is-arriving .site-echo-layer__node {
  animation: site-echo-node var(--echo-duration-route) var(--echo-ease-out) both;
}

@keyframes site-echo-path { to { stroke-dashoffset: 0; } }
@keyframes site-echo-replace { 0% { opacity: .18; } 100% { opacity: .72; } }
@keyframes site-echo-node {
  0% { opacity: .72; transform: scale(.72); }
  100% { opacity: 0; transform: scale(2.8); }
}

@media (prefers-reduced-motion: reduce) {
  .site-echo-layer { display: none; }
}
</style>
