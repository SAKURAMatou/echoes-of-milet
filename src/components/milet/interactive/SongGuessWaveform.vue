<template>
  <div
    class="grid h-28 w-full grid-cols-[repeat(22,minmax(4px,1fr))] items-center gap-[7px] overflow-hidden rounded-[18px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(238,248,250,0.66)),repeating-linear-gradient(90deg,rgba(49,127,141,0.08)_0,rgba(49,127,141,0.08)_1px,transparent_1px,transparent_18px)] px-5 py-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] max-sm:h-[86px] max-sm:gap-1 max-sm:p-3.5"
    aria-hidden="true"
  >
    <span
      v-for="bar in bars"
      :key="bar"
      class="block min-h-4 rounded-full opacity-70 transition-all duration-500"
      :class="[
        urgent
          ? 'bg-[linear-gradient(180deg,rgba(140,72,85,0.9),rgba(236,160,173,0.48))]'
          : 'bg-[linear-gradient(180deg,rgba(49,127,141,0.82),rgba(155,216,210,0.5))]',
        playing ? 'animate-pulse' : '',
      ]"
      :style="{ height: `${bar}%`, animationDelay: `${bar * 13}ms` }"
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
