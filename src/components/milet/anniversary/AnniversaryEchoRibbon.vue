<template>
  <div class="echo-ribbon" aria-hidden="true">
    <div class="echo-ribbon-desktop">
      <svg viewBox="0 0 1000 180" preserveAspectRatio="none">
        <path class="echo-ribbon-memory" :d="desktopPath" pathLength="1" />
        <path
          v-for="(segment, index) in desktopSegments"
          :key="`desktop-segment-${index}`"
          :class="['echo-ribbon-progress', { 'is-active': index < activeSegmentCount }]"
          :d="segment"
          pathLength="1"
        />
      </svg>
      <span
        v-for="(node, index) in desktopNodes"
        :key="`desktop-${index}`"
        :class="['echo-node', index <= activeChapter ? 'is-read' : '']"
        :style="nodeStyle(node, 1000, 180)"
      >
        <i
          v-if="index === activeChapter"
          :key="`desktop-pulse-${activeChapter}-${motionCycle}`"
          class="echo-node-pulse"
        ></i>
      </span>
    </div>

    <div class="echo-ribbon-compact">
      <svg viewBox="0 0 40 400" preserveAspectRatio="none">
        <path class="echo-ribbon-memory" :d="compactPath" pathLength="1" />
        <path
          v-for="(segment, index) in compactSegments"
          :key="`compact-segment-${index}`"
          :class="['echo-ribbon-progress', { 'is-active': index < activeSegmentCount }]"
          :d="segment"
          pathLength="1"
        />
      </svg>
      <span
        v-for="(node, index) in compactNodes"
        :key="`compact-${index}`"
        :class="['echo-node', index <= activeChapter ? 'is-read' : '']"
        :style="nodeStyle(node, 40, 400)"
      >
        <i
          v-if="index === activeChapter"
          :key="`compact-pulse-${activeChapter}-${motionCycle}`"
          class="echo-node-pulse"
        ></i>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  activeChapter: number
  chapterCount: number
  motionCycle: number
}>()

const desktopPath = 'M 28 138 C 142 30, 244 154, 354 86 S 574 42, 690 112 S 878 150, 972 42'
const compactPath = 'M 21 12 C 6 66, 34 92, 19 137 S 7 211, 20 263 S 34 330, 21 388'
const desktopSegments = [
  'M 28 138 C 142 30, 244 154, 354 86',
  'M 354 86 C 464 18, 574 42, 690 112',
  'M 690 112 C 806 182, 878 150, 972 42',
]
const compactSegments = [
  'M 21 12 C 6 66, 34 92, 19 137',
  'M 19 137 C 4 182, 7 211, 20 263',
  'M 20 263 C 33 315, 34 330, 21 388',
]
const desktopNodes = [
  { x: 28, y: 138 },
  { x: 354, y: 86 },
  { x: 690, y: 112 },
  { x: 972, y: 42 },
]
const compactNodes = [
  { x: 21, y: 12 },
  { x: 19, y: 137 },
  { x: 20, y: 263 },
  { x: 21, y: 388 },
]

const activeSegmentCount = computed(() =>
  Math.max(0, Math.min(props.activeChapter, props.chapterCount - 1, desktopSegments.length)),
)

function nodeStyle(node: { x: number; y: number }, viewWidth: number, viewHeight: number) {
  return {
    left: `${(node.x / viewWidth) * 100}%`,
    top: `${(node.y / viewHeight) * 100}%`,
  }
}
</script>

<style scoped>
.echo-ribbon {
  position: absolute;
  inset: auto 2.4rem 1.25rem;
  z-index: 5;
  height: 7.5rem;
  pointer-events: none;
}

.echo-ribbon-desktop,
.echo-ribbon-compact,
.echo-ribbon svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.echo-ribbon svg {
  overflow: visible;
}

.echo-ribbon-memory,
.echo-ribbon-progress {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.echo-ribbon-memory {
  stroke: rgba(49, 127, 141, 0.14);
  stroke-width: 2;
}

.echo-ribbon-progress {
  stroke: rgba(49, 127, 141, 0.58);
  stroke-width: 2.6;
  stroke-dasharray: 1 1;
  stroke-dashoffset: 1;
  opacity: 0;
  transition:
    stroke-dashoffset 420ms var(--anniversary-ease-out),
    opacity var(--anniversary-micro-duration) ease;
}

.echo-ribbon-progress.is-active {
  stroke-dashoffset: 0;
  opacity: 1;
}

.echo-node {
  position: absolute;
  box-sizing: border-box;
  width: 0.82rem;
  height: 0.82rem;
  border: 2px solid rgba(49, 127, 141, 0.24);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  transform: translate(-50%, -50%);
  transition:
    background var(--anniversary-micro-duration) ease,
    border-color var(--anniversary-micro-duration) ease;
}

.echo-node.is-read {
  border-color: rgba(49, 127, 141, 0.72);
  background: rgba(221, 190, 95, 0.92);
}

.echo-node-pulse {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.55rem;
  height: 1.55rem;
  border: 1.5px solid rgba(49, 127, 141, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: echo-node-arrival 680ms var(--anniversary-ease-out) 1 both;
}

.echo-ribbon-compact {
  display: none;
}

@keyframes echo-node-arrival {
  from {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(0.65);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.4);
  }
}

@media (max-width: 767px), (max-height: 640px), (max-height: 699px) and (min-aspect-ratio: 3/2) {
  .echo-ribbon {
    position: fixed;
    inset: 8.5rem max(0.35rem, env(safe-area-inset-right, 0px)) max(2.4rem, env(safe-area-inset-bottom, 0px)) auto;
    width: 1.7rem;
    height: auto;
    opacity: 0.62;
  }

  .echo-ribbon-desktop {
    display: none;
  }

  .echo-ribbon-compact {
    display: block;
  }

  .echo-ribbon-compact .echo-node {
    width: 0.56rem;
    height: 0.56rem;
    border-width: 1.5px;
  }

  .echo-ribbon-compact .echo-node-pulse {
    width: 1rem;
    height: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .echo-ribbon-progress,
  .echo-node {
    transition: none;
  }

  .echo-node-pulse {
    animation: none;
    opacity: 0.34;
  }
}
</style>
