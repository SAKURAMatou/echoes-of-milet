<template>
  <div class="echo-ribbon" aria-hidden="true">
    <svg class="echo-ribbon-desktop" viewBox="0 0 1000 180" preserveAspectRatio="none">
      <path class="echo-ribbon-memory" :d="desktopPath" pathLength="1" />
      <path
        class="echo-ribbon-progress"
        :d="desktopPath"
        pathLength="1"
        :style="progressStyle"
      />
      <g v-for="(node, index) in desktopNodes" :key="`desktop-${index}`">
        <circle
          :cx="node.x"
          :cy="node.y"
          r="7"
          :class="['echo-node', index <= activeChapter ? 'is-read' : '']"
        />
        <circle
          v-if="index === activeChapter"
          :key="`desktop-pulse-${activeChapter}-${motionCycle}`"
          :cx="node.x"
          :cy="node.y"
          r="13"
          class="echo-node-pulse"
        />
      </g>
    </svg>

    <svg class="echo-ribbon-compact" viewBox="0 0 40 400" preserveAspectRatio="none">
      <path class="echo-ribbon-memory" :d="compactPath" pathLength="1" />
      <path
        class="echo-ribbon-progress"
        :d="compactPath"
        pathLength="1"
        :style="progressStyle"
      />
      <g v-for="(node, index) in compactNodes" :key="`compact-${index}`">
        <circle
          :cx="node.x"
          :cy="node.y"
          r="4.5"
          :class="['echo-node', index <= activeChapter ? 'is-read' : '']"
        />
        <circle
          v-if="index === activeChapter"
          :key="`compact-pulse-${activeChapter}-${motionCycle}`"
          :cx="node.x"
          :cy="node.y"
          r="8"
          class="echo-node-pulse"
        />
      </g>
    </svg>
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
const compactPath = 'M 21 12 C 5 92, 35 135, 19 202 S 6 306, 21 388'
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

const progressStyle = computed(() => {
  const denominator = Math.max(1, props.chapterCount - 1)
  const progress = Math.max(0, Math.min(1, props.activeChapter / denominator))
  return { '--echo-progress': `${1 - progress}` }
})
</script>

<style scoped>
.echo-ribbon {
  position: absolute;
  inset: auto 2.4rem 1.25rem;
  z-index: 5;
  height: 7.5rem;
  pointer-events: none;
}

.echo-ribbon svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.echo-ribbon-memory,
.echo-ribbon-progress {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.echo-ribbon-memory {
  stroke: rgba(49, 127, 141, 0.14);
  stroke-width: 2;
}

.echo-ribbon-progress {
  stroke: rgba(49, 127, 141, 0.58);
  stroke-width: 2.6;
  stroke-dasharray: 1;
  stroke-dashoffset: var(--echo-progress);
  transition: stroke-dashoffset var(--anniversary-track-duration) var(--anniversary-ease-out);
}

.echo-node {
  fill: rgba(255, 255, 255, 0.9);
  stroke: rgba(49, 127, 141, 0.24);
  stroke-width: 2;
  transition:
    fill var(--anniversary-micro-duration) ease,
    stroke var(--anniversary-micro-duration) ease;
}

.echo-node.is-read {
  fill: rgba(221, 190, 95, 0.88);
  stroke: rgba(49, 127, 141, 0.72);
}

.echo-node-pulse {
  fill: none;
  stroke: rgba(49, 127, 141, 0.4);
  stroke-width: 1.5;
  animation: echo-node-arrival 680ms var(--anniversary-ease-out) 1 both;
}

.echo-ribbon-compact {
  display: none;
}

@keyframes echo-node-arrival {
  from {
    opacity: 0.8;
    transform: scale(0.65);
    transform-origin: center;
  }
  to {
    opacity: 0;
    transform: scale(1.4);
    transform-origin: center;
  }
}

@media (max-width: 767px), (max-height: 640px) {
  .echo-ribbon {
    position: fixed;
    inset: 8.5rem 0.35rem 2.4rem auto;
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
}

@media (prefers-reduced-motion: reduce) {
  .echo-ribbon-progress,
  .echo-node {
    transition: none;
  }

  .echo-node-pulse {
    animation: none;
  }
}
</style>
