<template>
  <div
    id="pilgrimage-map"
    class="pilgrimage-map-shell relative h-full min-h-0 scroll-mt-[5.5rem] overflow-hidden border-t border-white/70 md:scroll-mt-[6.5rem]"
    :class="{ 'pilgrimage-map-shell--markers-visible': markersVisible }"
  >
    <div ref="mapContainer" class="absolute inset-0 z-0 bg-[#e9f2ef]" />

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
        <span class="h-2 w-2 animate-pulse rounded-full bg-[#6fb8ad]" />
      </div>
      <div class="h-1.5 overflow-hidden rounded-full bg-[#dfece9]">
        <span class="pilgrimage-map-skeleton block h-full w-1/2 rounded-full bg-[#9bd0c8]" />
      </div>
    </div>

    <div
      v-if="!selectedDistrict"
      class="absolute left-5 top-5 z-10 max-w-xs rounded-lg border border-white/80 bg-white/80 p-4 text-sm text-[#60717a] shadow-[0_20px_54px_-38px_rgba(31,41,55,0.75)] backdrop-blur"
    >
      {{ pageText.emptyDistrict }}
    </div>

    <div
      v-if="selectedDistrict && spotsCount === 0 && !spotsLoading"
      class="absolute left-5 top-5 z-10 max-w-xs rounded-lg border border-white/80 bg-white/80 p-4 text-sm text-[#60717a] shadow-[0_20px_54px_-38px_rgba(31,41,55,0.75)] backdrop-blur"
    >
      {{ pageText.emptySpot }}
    </div>

    <div class="absolute bottom-4 left-4 right-4 z-10 flex min-w-0 items-center gap-2 text-xs">
      <span
        class="shrink-0 rounded-lg border border-white/80 bg-white/82 px-3 py-2 text-[#526670] shadow-[0_18px_45px_-35px_rgba(31,41,55,0.8)] backdrop-blur"
      >
        {{ pageText.mapLabel }} / OpenMapTiles
      </span>
      <span
        class="min-w-0 truncate rounded-lg border border-[#9bd0c8]/70 bg-[#f0fbf8]/88 px-3 py-2 text-[#2f6f69] shadow-[0_18px_45px_-35px_rgba(31,41,55,0.8)] backdrop-blur lg:hidden"
      >
        {{ pageText.dataCreditShort }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
