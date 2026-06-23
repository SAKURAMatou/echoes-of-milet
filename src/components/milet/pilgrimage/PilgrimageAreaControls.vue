<template>
  <div
    class="pilgrimage-area-controls relative z-30 mx-auto w-full rounded-lg border border-[#d2e5ef]/90 bg-white/78 p-2 shadow-[0_18px_54px_-42px_rgba(58,91,119,0.72)] backdrop-blur"
  >
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-white/58 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:px-4 lg:py-2.5"
      :aria-expanded="controlsExpanded"
      aria-controls="pilgrimage-area-controls-body"
      @click="toggleControls"
    >
      <span class="min-w-0">
        <span class="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7c9197]">
          {{ pageText.currentArea }}
        </span>
        <span class="mt-0.5 block truncate text-sm font-medium text-[#26313a]">
          {{ selectedCity?.name || pageText.allCities }}
          <span v-if="selectedDistrict">/ {{ selectedDistrict.name }}</span>
          <span v-if="selectedRoute" class="text-[#7b68a8]"> / {{ selectedRoute.title }} </span>
        </span>
      </span>
      <span
        class="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c4b5fd]/60 bg-[#f5f3ff]/78 text-lg leading-none text-[#6b5a95]"
      >
        {{ controlsExpanded ? '-' : '+' }}
      </span>
    </button>

    <div
      id="pilgrimage-area-controls-body"
      class="absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-[min(44svh,24rem)] space-y-3 overflow-y-auto rounded-lg border border-[#d2e5ef]/90 bg-white/88 p-3 shadow-[0_24px_62px_-36px_rgba(58,91,119,0.82)] backdrop-blur lg:p-4"
      :class="controlsExpanded ? 'block' : 'hidden'"
    >
      <div class="flex flex-col gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
            {{ pageText.cityLabel }}
          </span>
          <HorizontalScrollHint
            :active="controlsExpanded"
            :refresh-key="selectorRefreshKey"
            content-class="flex flex-1 gap-2"
          >
            <button
              v-for="city in cities"
              :key="city.id"
              type="button"
              class="max-w-[9.5rem] shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:max-w-[12rem] lg:px-4 lg:py-2"
              :class="
                selectedCityId === city.id
                  ? 'border-[#5eead4] bg-[#f0fdfa] text-[#1d6564] shadow-sm'
                  : 'border-[#d8e7ef]/80 bg-white/56 text-[#566b73] hover:border-[#99e6d6] hover:bg-white/86'
              "
              @click="selectCity(city.id)"
            >
              <span class="block truncate">{{ city.name }}</span>
            </button>
          </HorizontalScrollHint>
        </div>
      </div>

      <div class="flex min-w-0 items-center gap-2">
        <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
          {{ pageText.districtLabel }}
        </span>
        <HorizontalScrollHint
          :active="controlsExpanded"
          :refresh-key="selectorRefreshKey"
          content-class="flex flex-1 gap-2"
        >
          <button
            v-for="district in selectedCity?.districts || []"
            :key="district.id"
            type="button"
            class="flex max-w-[11rem] shrink-0 items-center rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 lg:max-w-[14rem] lg:px-4 lg:py-2"
            :class="
              selectedDistrictId === district.id
                ? 'border-[#f9a8d4] bg-[#fdf2f8] text-[#8f3f68]'
                : 'border-[#d8e7ef]/80 bg-white/54 text-[#60717a] hover:border-[#f5b9d6] hover:bg-white/86'
            "
            @click="selectDistrict(district.id)"
          >
            <span class="truncate font-medium">{{ district.name }}</span>
            <span class="ml-2 text-xs text-[#8a9ca2]">{{ district.spotCount }}</span>
          </button>
        </HorizontalScrollHint>
      </div>

      <div v-if="routes.length > 0" class="flex min-w-0 items-center gap-2">
        <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
          {{ pageText.routeLabel }}
        </span>
        <HorizontalScrollHint
          :active="controlsExpanded"
          :refresh-key="selectorRefreshKey"
          content-class="flex flex-1 gap-2"
        >
          <button
            type="button"
            class="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:px-4 lg:py-2"
            :class="
              !selectedRouteId
                ? 'border-[#7dd3fc] bg-[#f0f9ff] text-[#2f668f]'
                : 'border-[#d8e7ef]/80 bg-white/54 text-[#60717a] hover:border-[#a8cde2] hover:bg-white/86'
            "
            @click="selectRoute('')"
          >
            {{ pageText.allRoutes }}
          </button>
          <button
            v-for="routeItem in routes"
            :key="routeItem.id"
            type="button"
            class="max-w-[14rem] shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:px-4 lg:py-2"
            :class="
              selectedRouteId === routeItem.id
                ? 'border-[#c4b5fd] bg-[#f5f3ff] text-[#614990]'
                : 'border-[#d8e7ef]/80 bg-white/54 text-[#60717a] hover:border-[#cfc4fb] hover:bg-white/86'
            "
            @click="selectRoute(routeItem.id)"
          >
            <span class="block truncate">{{ routeItem.title }}</span>
          </button>
        </HorizontalScrollHint>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import HorizontalScrollHint from '@/components/common/HorizontalScrollHint.vue'
import type {
  PilgrimageCity,
  PilgrimageDistrict,
  PilgrimagePageText,
  PilgrimageRoute,
} from '@/composables/miletPilgrimage'

const props = defineProps<{
  pageText: PilgrimagePageText
  cities: PilgrimageCity[]
  selectedCity: PilgrimageCity | null
  selectedDistrict: PilgrimageDistrict | null
  selectedCityId: string
  selectedDistrictId: string
  routes: PilgrimageRoute[]
  selectedRoute: PilgrimageRoute | null
  selectedRouteId: string
}>()

const emit = defineEmits<{
  selectCity: [cityId: string]
  selectDistrict: [districtId: string]
  selectRoute: [routeId: string]
}>()

const controlsExpanded = ref(false)
const selectorRefreshKey = computed(() =>
  [
    props.cities.length,
    props.selectedCity?.id || '',
    props.selectedCity?.districts.length || 0,
    props.selectedDistrict?.id || '',
    props.routes.length,
  ].join('|'),
)

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

function toggleControls() {
  controlsExpanded.value = !controlsExpanded.value
}

function collapseControlsOnMobile() {
  if (isMobileViewport()) {
    controlsExpanded.value = false
  }
}

function selectCity(cityId: string) {
  emit('selectCity', cityId)
  collapseControlsOnMobile()
}

function selectDistrict(districtId: string) {
  emit('selectDistrict', districtId)
  collapseControlsOnMobile()
}

function selectRoute(routeId: string) {
  emit('selectRoute', routeId)
  controlsExpanded.value = false
}
</script>

<style scoped>
.pilgrimage-area-controls {
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(248, 253, 251, 0.72)),
    radial-gradient(circle at 18% 0%, rgba(94, 234, 212, 0.16), transparent 38%),
    radial-gradient(circle at 100% 0%, rgba(196, 181, 253, 0.12), transparent 34%);
}
</style>
