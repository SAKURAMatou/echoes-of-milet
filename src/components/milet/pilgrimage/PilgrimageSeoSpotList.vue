<template>
  <section
    v-if="totalSpotCount > 0"
    class="pilgrimage-seo-spot-list relative mx-3 mb-4 mt-4 rounded-lg border border-[#dccff3]/80 bg-white/66 px-4 py-3 text-[#34444b] shadow-[0_18px_54px_-44px_rgba(97,73,144,0.32)] backdrop-blur sm:mx-5 lg:mx-7"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left text-sm font-semibold text-[#614990] outline-none transition hover:text-[#4f3d7b] focus-visible:ring-4 focus-visible:ring-violet-100"
      :aria-expanded="listOpen"
      @click="toggleList"
    >
      <span class="min-w-0">
        {{ copy.summary }}
        <span class="ml-2 text-xs font-normal text-[#789096]">
          {{ copy.cityCount(cities.length) }} / {{ copy.spotCount(totalSpotCount) }}
        </span>
      </span>
      <span class="shrink-0 text-lg leading-none text-[#6f858b]">
        {{ listOpen ? '−' : '+' }}
      </span>
    </button>

    <div v-show="listOpen">
      <p class="mt-3 text-sm leading-7 text-[#60717a]">
        {{ copy.intro }}
      </p>

      <div class="mt-4 space-y-3">
        <section
          v-for="city in cities"
          :key="city.id"
          class="rounded-lg border border-[#d7ccf2]/80 bg-white/58 shadow-[0_16px_36px_-32px_rgba(97,73,144,0.34)]"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 px-3 py-3 text-left outline-none transition hover:bg-[#f5f3ff]/70 focus-visible:ring-4 focus-visible:ring-violet-100"
            :aria-expanded="openCityId === city.id"
            @click="toggleCity(city.id)"
          >
            <span class="min-w-0">
              <span class="font-serif text-xl leading-tight text-[#26313a]">
                {{ city.name }}
              </span>
              <span class="ml-3 text-xs text-[#789096]">
                {{ copy.spotCount(citySpotCount(city)) }}
              </span>
            </span>
            <span class="shrink-0 text-lg leading-none text-[#6f858b]">
              {{ openCityId === city.id ? '−' : '+' }}
            </span>
          </button>

          <div v-show="openCityId === city.id" class="space-y-3 border-t border-[#d7ccf2] p-3">
            <section
              v-for="district in city.districts"
              :key="district.id"
              class="rounded-lg border border-[#bcebdd] bg-[#f0fdfa]/62"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left outline-none transition hover:bg-white/76 focus-visible:ring-4 focus-visible:ring-teal-100"
                :aria-expanded="openDistrictId === district.id"
                @click="toggleDistrict(district.id)"
              >
                <span>
                  <span class="text-sm font-semibold text-[#1d6564]">
                    {{ district.name }}
                  </span>
                  <span class="ml-2 text-xs font-normal text-[#789096]">
                    {{ copy.spotCount(district.spots.length) }}
                  </span>
                </span>
                <span class="shrink-0 text-lg leading-none text-[#6f858b]">
                  {{ openDistrictId === district.id ? '−' : '+' }}
                </span>
              </button>

              <ol
                v-show="openDistrictId === district.id"
                class="grid gap-3 border-t border-[#bcebdd] p-3 md:grid-cols-2"
              >
                <li
                  v-for="(spot, index) in district.spots"
                  :id="spotAnchorId(spot.id)"
                  :key="spot.id"
                  class="pilgrimage-seo-spot-card grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-[#d3e5ef]/90 bg-white/76 p-2.5 shadow-[0_14px_36px_-34px_rgba(58,91,119,0.68)] transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:border-[#a8cde2]/95 hover:shadow-[0_18px_42px_-34px_rgba(58,91,119,0.76)]"
                >
                  <img
                    v-if="spot.coverImageUrl"
                    :src="buildStaticAssetUrl(spot.coverImageUrl)"
                    :alt="spot.title"
                    class="h-16 w-16 rounded-md border border-white/80 object-cover shadow-[0_10px_24px_-20px_rgba(58,91,119,0.7)]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="grid h-16 w-16 place-items-center rounded-md bg-[#fffbeb] text-xs font-semibold text-[#b68a2f]"
                    aria-hidden="true"
                  >
                    {{ index + 1 }}
                  </div>

                  <div class="min-w-0">
                    <h4 class="truncate font-serif text-lg leading-tight text-[#26313a]">
                      {{ spot.title }}
                    </h4>
                    <p class="mt-1 text-xs leading-5 text-[#60717a]">
                      <span v-if="spot.workTitle">{{ copy.workLabel }}: {{ spot.workTitle }}</span>
                      <span v-if="spot.category"> / {{ spot.category }}</span>
                    </p>
                    <p
                      v-if="spotSummary(spot)"
                      class="mt-1 line-clamp-2 text-xs leading-5 text-[#789096]"
                    >
                      {{ spotSummary(spot) }}
                    </p>
                    <p class="mt-1 text-[11px] leading-5 text-[#8a9ca2]">
                      {{ coordinateText(spot) }}
                    </p>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { PilgrimageLang, PilgrimageSpotSummary } from '@/composables/miletPilgrimage'
import { PILGRIMAGE_SEO_LIST_TEXT } from '@/composables/miletPilgrimage'
import { buildStaticAssetUrl } from '@/config/api'

interface SeoSpotListDistrict {
  id: string
  name: string
  spots: PilgrimageSpotSummary[]
}

interface SeoSpotListCity {
  id: string
  name: string
  districts: SeoSpotListDistrict[]
}

const props = defineProps<{
  cities: SeoSpotListCity[]
  lang: PilgrimageLang
}>()

const listOpen = ref(false)
const openCityId = ref('')
const openDistrictId = ref('')

const copy = computed(() => {
  return {
    ...PILGRIMAGE_SEO_LIST_TEXT[props.lang],
    cityCount: (count: number) => `${count} ${PILGRIMAGE_SEO_LIST_TEXT[props.lang].cityLabel}`,
    spotCount: (count: number) => `${count} spots`,
  }
})

function toggleList() {
  listOpen.value = !listOpen.value
  if (!listOpen.value) {
    openCityId.value = ''
    openDistrictId.value = ''
  }
}

function toggleCity(cityId: string) {
  const nextCityId = openCityId.value === cityId ? '' : cityId
  openCityId.value = nextCityId
  openDistrictId.value = ''
}

function toggleDistrict(districtId: string) {
  openDistrictId.value = openDistrictId.value === districtId ? '' : districtId
}

const totalSpotCount = computed(() =>
  props.cities.reduce(
    (cityTotal, city) =>
      cityTotal +
      city.districts.reduce((districtTotal, district) => districtTotal + district.spots.length, 0),
    0,
  ),
)

function citySpotCount(city: SeoSpotListCity) {
  return city.districts.reduce((total, district) => total + district.spots.length, 0)
}

function spotAnchorId(id: string) {
  return `pilgrimage-spot-${id}`
}

function spotSummary(spot: PilgrimageSpotSummary) {
  return spot.tags?.length ? spot.tags.join(' / ') : ''
}

function coordinateText(spot: PilgrimageSpotSummary) {
  const lat = Number(spot.displayLat)
  const lng = Number(spot.displayLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `${copy.value.coordinateLabel}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
</script>

<style scoped>
.pilgrimage-seo-spot-list {
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(249, 252, 250, 0.82)),
    radial-gradient(circle at 100% 0%, rgba(196, 181, 253, 0.18), transparent 30%),
    radial-gradient(circle at 0% 22%, rgba(252, 211, 77, 0.12), transparent 28%),
    repeating-linear-gradient(
      0deg,
      rgba(97, 73, 144, 0.026) 0,
      rgba(97, 73, 144, 0.026) 1px,
      transparent 1px,
      transparent 22px
    );
}

.pilgrimage-seo-spot-list::after {
  position: absolute;
  right: 18px;
  bottom: 12px;
  color: rgba(201, 135, 145, 0.34);
  content: 'with milet';
  font-family: Georgia, serif;
  font-size: 1.1rem;
  font-style: italic;
  pointer-events: none;
}

.pilgrimage-seo-spot-card:nth-child(3n + 1) {
  border-color: rgba(125, 211, 252, 0.52);
}

.pilgrimage-seo-spot-card:nth-child(3n + 2) {
  border-color: rgba(252, 211, 77, 0.48);
}

.pilgrimage-seo-spot-card:nth-child(3n) {
  border-color: rgba(249, 168, 212, 0.48);
}
</style>
