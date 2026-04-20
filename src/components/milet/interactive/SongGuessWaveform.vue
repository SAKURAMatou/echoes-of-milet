<template>
  <div class="song-waveform" :class="{ 'is-playing': playing, 'is-urgent': urgent }" aria-hidden="true">
    <span
      v-for="bar in bars"
      :key="bar"
      class="song-waveform__bar"
      :style="{ '--bar-height': `${bar}%`, '--bar-delay': `${bar * 13}ms` }"
    ></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  playing: boolean
  urgent?: boolean
}>()

const bars = [26, 54, 38, 72, 45, 88, 52, 66, 34, 78, 48, 92, 42, 64, 30, 74, 56, 84, 36, 68, 46, 80]
</script>

<style scoped>
.song-waveform {
  display: grid;
  grid-template-columns: repeat(22, minmax(4px, 1fr));
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 112px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(238, 248, 250, 0.66)),
    repeating-linear-gradient(90deg, rgba(49, 127, 141, 0.08) 0, rgba(49, 127, 141, 0.08) 1px, transparent 1px, transparent 18px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  overflow: hidden;
}

.song-waveform__bar {
  display: block;
  height: var(--bar-height);
  min-height: 16px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(49, 127, 141, 0.82), rgba(155, 216, 210, 0.5));
  transform-origin: center;
  opacity: 0.68;
}

.song-waveform.is-playing .song-waveform__bar {
  animation: song-wave-pulse 900ms ease-in-out infinite alternate;
  animation-delay: var(--bar-delay);
}

.song-waveform.is-urgent .song-waveform__bar {
  background: linear-gradient(180deg, rgba(140, 72, 85, 0.9), rgba(236, 160, 173, 0.48));
}

@keyframes song-wave-pulse {
  from {
    transform: scaleY(0.56);
    opacity: 0.46;
  }

  to {
    transform: scaleY(1.08);
    opacity: 0.92;
  }
}

@media (max-width: 640px) {
  .song-waveform {
    height: 86px;
    gap: 4px;
    padding: 14px;
  }
}
</style>
