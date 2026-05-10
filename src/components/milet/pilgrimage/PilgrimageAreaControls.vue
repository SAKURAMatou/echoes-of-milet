<template>
  <div
    class="absolute left-3 right-3 top-3 z-20 space-y-3 rounded-lg border border-white/80 bg-white/82 p-3 shadow-[0_18px_54px_-42px_rgba(31,41,55,0.8)] backdrop-blur lg:static lg:min-h-0 lg:space-y-3 lg:overflow-hidden lg:border-0 lg:bg-transparent lg:px-7 lg:py-4 lg:shadow-none lg:backdrop-blur-0"
  >
    <div class="flex items-center justify-between gap-3 lg:hidden">
      <div>
        <span class="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7c9197]">
          {{ pageText.currentArea }}
        </span>
        <span class="mt-0.5 block text-sm font-medium text-[#26313a]">
          {{ selectedCity?.name || pageText.allCities }}
          <span v-if="selectedDistrict">/ {{ selectedDistrict.name }}</span>
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div class="flex min-w-0 items-center gap-2">
        <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
          {{ pageText.cityLabel }}
        </span>
        <div class="selector-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          <button
            v-for="city in cities"
            :key="city.id"
            type="button"
            class="max-w-[9.5rem] shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:max-w-[12rem] lg:py-2"
            :class="
              selectedCityId === city.id
                ? 'border-[#5ca8a6] bg-[#e9f7f4] text-[#1d6564] shadow-sm'
                : 'border-white/80 bg-white/68 text-[#566b73] hover:border-[#8bc8bf] hover:bg-white'
            "
            @click="$emit('selectCity', city.id)"
          >
            <span class="block truncate">{{ city.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
        {{ pageText.districtLabel }}
      </span>
      <div class="selector-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
        <button
          v-for="district in selectedCity?.districts || []"
          :key="district.id"
          type="button"
          class="flex max-w-[11rem] shrink-0 items-center rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 lg:max-w-[14rem] lg:py-2"
          :class="
            selectedDistrictId === district.id
              ? 'border-[#c98791] bg-[#fff1f2] text-[#8f3f4b]'
              : 'border-white/80 bg-white/62 text-[#60717a] hover:border-[#e7aeb7] hover:bg-white'
          "
          @click="$emit('selectDistrict', district.id)"
        >
          <span class="truncate font-medium">{{ district.name }}</span>
          <span class="ml-2 text-xs text-[#8a9ca2]">{{ district.spotCount }}</span>
        </button>
      </div>
    </div>

    <div v-if="routes.length > 0" class="flex min-w-0 items-center gap-2">
      <span class="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-[#7c9197]">
        {{ pageText.routeLabel }}
      </span>
      <div class="selector-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          class="shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:py-2"
          :class="!selectedRouteId ? 'border-[#5ca8a6] bg-[#e9f7f4] text-[#1d6564]' : 'border-white/80 bg-white/62 text-[#60717a] hover:border-[#8bc8bf] hover:bg-white'"
          @click="$emit('selectRoute', '')"
        >
          {{ pageText.allRoutes }}
        </button>
        <button
          v-for="routeItem in routes"
          :key="routeItem.id"
          type="button"
          class="max-w-[14rem] shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 lg:py-2"
          :class="selectedRouteId === routeItem.id ? 'border-[#5ca8a6] bg-[#e9f7f4] text-[#1d6564]' : 'border-white/80 bg-white/62 text-[#60717a] hover:border-[#8bc8bf] hover:bg-white'"
          @click="$emit('selectRoute', routeItem.id)"
        >
          <span class="block truncate">{{ routeItem.title }}</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type {
  PilgrimageCity,
  PilgrimageDistrict,
  PilgrimagePageText,
  PilgrimageRoute,
} from '@/composables/miletPilgrimage'

defineProps<{
  pageText: PilgrimagePageText
  cities: PilgrimageCity[]
  selectedCity: PilgrimageCity | null
  selectedDistrict: PilgrimageDistrict | null
  selectedCityId: string
  selectedDistrictId: string
  routes: PilgrimageRoute[]
  selectedRouteId: string
}>()

defineEmits<{
  selectCity: [cityId: string]
  selectDistrict: [districtId: string]
  selectRoute: [routeId: string]
}>()
</script>

<style scoped>
.selector-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(111, 184, 173, 0.52) transparent;
}

.selector-scroll::-webkit-scrollbar {
  height: 6px;
}

.selector-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(111, 184, 173, 0.42);
}
</style>
