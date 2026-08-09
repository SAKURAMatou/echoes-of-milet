<template>
  <div
    id="pilgrimage-map"
    class="pilgrimage-map-shell relative h-full min-h-0 scroll-mt-[5.5rem] overflow-hidden border-t border-[#d4e4ed]/80 md:scroll-mt-[6.5rem]"
    :class="{ 'pilgrimage-map-shell--markers-visible': markersVisible }"
  >
    <div ref="mapContainer" class="absolute inset-0 z-0 bg-[#e1f3ef]" />
    <div class="pilgrimage-map-decorations pointer-events-none absolute inset-0 z-[8]">
      <img
        v-for="decoration in mapDecorations"
        :key="decoration.id"
        :src="decoration.imageUrl"
        alt=""
        aria-hidden="true"
        class="absolute bottom-[var(--decoration-offset-y)] block h-[var(--decoration-height)] w-[var(--decoration-width)] select-none object-contain opacity-[0.92] drop-shadow-[0_16px_24px_rgba(31,41,55,0.18)] max-lg:bottom-[var(--decoration-mobile-offset-y)] max-lg:h-[var(--decoration-mobile-height)] max-lg:w-[var(--decoration-mobile-width)] max-lg:opacity-[0.82]"
        :class="decorationClasses(decoration)"
        :style="decorationStyle(decoration)"
        loading="lazy"
        decoding="async"
      />
    </div>

    <div
      v-if="mapLoading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-white/60 text-sm text-[#526670] backdrop-blur-sm"
    >
      {{ pageText.loading }}
    </div>

    <div
      v-if="mapTransitioning || spotsLoading"
      class="pointer-events-none absolute inset-x-4 top-[48%] z-20 rounded-lg border border-white/80 bg-white/72 p-3 text-xs text-[#526670] shadow-[0_18px_45px_-35px_rgba(31,41,55,0.8)] backdrop-blur"
    >
      <div class="mb-2 flex items-center justify-between">
        <span>{{ pageText.loading }}</span>
        <span class="h-2 w-2 animate-pulse rounded-full bg-[#f9a8d4]" />
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-[#eef4df]">
        <span class="pilgrimage-map-skeleton block h-full w-1/2 rounded-full bg-[#fcd34d]" />
      </div>
    </div>

    <div
      v-if="!selectedDistrict || (selectedDistrict && spotsCount === 0 && !spotsLoading)"
      class="pointer-events-none absolute left-14 right-3 top-6 z-10 w-fit max-w-[calc(100%-4.25rem)] rounded-lg border border-white/80 bg-white/80 px-3 py-2.5 text-sm leading-6 text-[#60717a] shadow-[0_20px_54px_-38px_rgba(31,41,55,0.75)] backdrop-blur lg:top-7"
    >
      {{ selectedDistrict ? pageText.emptySpot : pageText.emptyDistrict }}
    </div>

    <div class="absolute bottom-4 left-4 right-4 z-10 flex min-w-0 items-center gap-2 text-xs">
      <span
        class="shrink-0 rounded-lg border border-[#fcd34d]/50 bg-[#fffbeb]/70 px-3 py-2 text-[#76591c] shadow-[0_18px_45px_-35px_rgba(182,138,47,0.55)] backdrop-blur"
      >
        {{ pageText.mapLabel }} / OpenMapTiles
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { pilgrimageMapConfig } from '@/components/milet/pilgrimage/pilgrimageMapConfig'
import type { PilgrimageDistrict, PilgrimagePageText } from '@/composables/miletPilgrimage'

defineProps<{
  pageText: PilgrimagePageText
  mapLoading: boolean
  mapTransitioning: boolean
  spotsLoading: boolean
  markersVisible: boolean
  selectedDistrict: PilgrimageDistrict | null
  spotsCount: number
}>()

const mapContainer = ref<HTMLElement | null>(null)
const mapDecorations = pilgrimageMapConfig.mapDecorations

function decorationStyle(decoration: (typeof mapDecorations)[number]) {
  return {
    '--decoration-width': `${decoration.layout.desktop.size[0]}px`,
    '--decoration-height': `${decoration.layout.desktop.size[1]}px`,
    '--decoration-offset-x': `${decoration.layout.desktop.offset[0]}px`,
    '--decoration-offset-y': `${decoration.layout.desktop.offset[1]}px`,
    '--decoration-mobile-width': `${decoration.layout.mobile.size[0]}px`,
    '--decoration-mobile-height': `${decoration.layout.mobile.size[1]}px`,
    '--decoration-mobile-offset-x': `${decoration.layout.mobile.offset[0]}px`,
    '--decoration-mobile-offset-y': `${decoration.layout.mobile.offset[1]}px`,
  }
}

function decorationClasses(decoration: (typeof mapDecorations)[number]) {
  return decoration.position === 'bottom-right'
    ? 'right-[var(--decoration-offset-x)] -scale-x-100 max-lg:right-[var(--decoration-mobile-offset-x)]'
    : 'left-[var(--decoration-offset-x)] max-lg:left-[var(--decoration-mobile-offset-x)]'
}

defineExpose({ mapContainer })
</script>

<style scoped>
.pilgrimage-map-skeleton {
  animation: pilgrimage-map-skeleton 1.1s ease-in-out infinite alternate;
}

@keyframes pilgrimage-map-skeleton {
  from {
    transform: translateX(-70%);
  }

  to {
    transform: translateX(170%);
  }
}
</style>
