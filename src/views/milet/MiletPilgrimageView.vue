<template>
  <article class="pilgrimage-page overflow-hidden rounded-lg text-[#24323a] lg:mb-10">
    <section
      class="pilgrimage-workspace relative h-[calc(100dvh-4rem)] min-h-[620px] overflow-hidden lg:grid lg:h-[calc(100vh-7.5rem)] lg:min-h-[760px] lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-visible xl:grid-cols-[minmax(0,1fr)_400px]"
    >
      <div class="relative h-full min-w-0 border-b border-white/70 lg:grid lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:border-b-0 lg:border-r">
        <header class="hidden border-b border-white/70 px-7 py-5 lg:block">
          <div class="flex items-end justify-between gap-5">
            <div class="min-w-0">
              <h1 class="font-serif text-[clamp(3.4rem,6vw,5.4rem)] leading-none text-[#26313a]">
                {{ pageText.title }}
              </h1>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-[#5f7178]">
                {{ pageText.subtitle }}
              </p>
            </div>

            <div class="shrink-0 rounded-lg border border-white/70 bg-white/64 px-4 py-3 text-sm text-[#526670]">
              <span class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c9197]">
                {{ pageText.currentArea }}
              </span>
              <span class="mt-1 block max-w-[190px] truncate font-medium text-[#26313a]">
                {{ selectedCity?.name || pageText.allCities }}
                <span v-if="selectedDistrict">/ {{ selectedDistrict.name }}</span>
              </span>
            </div>
          </div>
        </header>

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
                  @click="selectCity(city.id)"
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
                @click="selectDistrict(district.id)"
              >
                <span class="truncate font-medium">{{ district.name }}</span>
                <span class="ml-2 text-xs text-[#8a9ca2]">{{ district.spotCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <div id="pilgrimage-map" class="relative h-full min-h-0 overflow-hidden border-t border-white/70">
          <div ref="mapContainer" class="absolute inset-0 z-0 bg-[#e9f2ef]" />

          <div
            v-if="mapLoading"
            class="absolute inset-0 z-20 flex items-center justify-center bg-white/60 text-sm text-[#526670] backdrop-blur-sm"
          >
            {{ pageText.loading }}
          </div>

          <div
            v-if="!selectedDistrict"
            class="absolute left-5 top-5 z-10 max-w-xs rounded-lg border border-white/80 bg-white/80 p-4 text-sm text-[#60717a] shadow-[0_20px_54px_-38px_rgba(31,41,55,0.75)] backdrop-blur"
          >
            {{ pageText.emptyDistrict }}
          </div>

          <div
            v-if="selectedDistrict && spots.length === 0 && !spotsLoading"
            class="absolute left-5 top-5 z-10 max-w-xs rounded-lg border border-white/80 bg-white/80 p-4 text-sm text-[#60717a] shadow-[0_20px_54px_-38px_rgba(31,41,55,0.75)] backdrop-blur"
          >
            {{ pageText.emptySpot }}
          </div>

          <div
            class="absolute bottom-4 left-4 z-10 rounded-lg border border-white/80 bg-white/82 px-3 py-2 text-xs text-[#526670] shadow-[0_18px_45px_-35px_rgba(31,41,55,0.8)] backdrop-blur"
          >
            {{ pageText.mapLabel }} / OpenStreetMap
          </div>
        </div>
      </div>

      <aside
        id="pilgrimage-detail"
        class="absolute inset-x-0 bottom-0 z-[1000] max-h-[72%] overflow-y-auto rounded-t-2xl border-t border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,250,248,0.96))] px-4 pb-5 pt-3 shadow-[0_-24px_70px_-42px_rgba(31,41,55,0.86)] transition-transform duration-300 sm:px-6 lg:static lg:z-auto lg:max-h-full lg:min-h-0 lg:translate-y-0 lg:overflow-y-auto lg:rounded-none lg:border-t-0 lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(245,250,248,0.82))] lg:px-5 lg:py-5 lg:shadow-none"
        :class="
          selectedSpotDetail
            ? 'translate-y-0'
            : 'pointer-events-none translate-y-[calc(100%+1rem)] lg:pointer-events-auto'
        "
      >
        <div v-if="selectedSpotDetail" class="flex h-full flex-col">
          <div
            class="sticky top-0 z-30 -mx-4 mb-3 flex h-10 items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.9))] px-4 pt-1 sm:-mx-6 sm:px-6 lg:hidden"
          >
            <span class="mx-auto h-1.5 w-12 rounded-full bg-[#c8d7d4]" aria-hidden="true" />
            <button
              type="button"
              class="absolute right-4 top-1 flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9e7e4] bg-white/92 text-lg leading-none text-[#60717a] shadow-[0_12px_30px_-22px_rgba(31,41,55,0.9)] sm:right-6"
              aria-label="Close spot detail"
              @click="closeSpotDetail"
            >
              x
            </button>
          </div>

          <div class="overflow-hidden rounded-lg border border-white/80 bg-white/78 shadow-[0_22px_60px_-42px_rgba(31,41,55,0.8)]">
            <img
              :src="selectedSpotDetail.coverImageUrl"
              :alt="selectedSpotDetail.title"
              class="h-48 w-full object-cover"
            />
            <div class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#789096]">
                    {{ selectedSpotDetail.category }}
                  </p>
                  <h2 class="mt-1 break-words font-serif text-3xl leading-tight text-[#26313a]">
                    {{ selectedSpotDetail.title }}
                  </h2>
                </div>
                <a
                  :href="navigationUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="shrink-0 rounded-lg border border-[#6fb8ad] bg-[#e8f8f4] px-3 py-2 text-sm font-semibold text-[#1f6a66] transition hover:border-[#4f9f99] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
                >
                  {{ pageText.navigation }}
                </a>
              </div>

              <dl class="mt-4 space-y-3 text-sm">
                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                    {{ pageText.works }}
                  </dt>
                  <dd class="mt-1 text-[#34444b]">{{ selectedSpotDetail.workTitle }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-semibold uppercase tracking-[0.14em] text-[#82939a]">
                    {{ pageText.address }}
                  </dt>
                  <dd class="mt-1 leading-6 text-[#526670]">{{ selectedSpotDetail.address }}</dd>
                </div>
              </dl>

              <p class="mt-4 text-sm leading-7 text-[#526670]">
                {{ selectedSpotDetail.description }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in selectedSpotDetail.tags"
                  :key="tag"
                  class="rounded-lg border border-[#dbe7e4] bg-[#f7fbfa] px-2.5 py-1 text-xs text-[#60717a]"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <section class="mt-5 min-h-0 flex-1">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-[0.14em] text-[#64777f]">
                {{ pageText.photoLabel }}
              </h3>
              <span class="text-xs text-[#8a9ca2]">{{ selectedSpotDetail.photos.length }}</span>
            </div>

            <div class="photo-grid grid gap-3">
              <a
                v-for="photo in selectedSpotDetail.photos"
                :key="photo.id"
                :href="photo.fullUrl"
                :data-fancybox="galleryName"
                :data-caption="photo.caption"
                :data-width="photo.width"
                :data-height="photo.height"
                :data-download-src="photo.downloadUrl || photo.fullUrl"
                class="pilgrimage-photo block overflow-hidden rounded-lg border border-white/80 bg-white/78 p-1 shadow-[0_16px_42px_-34px_rgba(31,41,55,0.78)] transition hover:-translate-y-0.5 hover:border-[#9bd0c8]"
              >
                <LazyImage
                  :src="photo.thumbUrl || photo.fullUrl"
                  :alt="photo.alt"
                  :downloadSrc="photo.downloadUrl || photo.fullUrl"
                />
              </a>
            </div>
          </section>
        </div>

        <div
          v-else
          class="flex min-h-[480px] items-center justify-center rounded-lg border border-dashed border-[#cadbd7] bg-white/48 p-8 text-center text-sm leading-7 text-[#60717a]"
        >
          {{ spotsLoading ? pageText.loading : pageText.emptySpot }}
        </div>
      </aside>
    </section>
  </article>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

import { Fancybox } from '@fancyapps/ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import LazyImage from '@/components/LazyImage.vue'
import {
  buildNavigationUrl,
  fallbackRegionTree,
  fallbackSpotDetails,
  fallbackSpotLists,
  findInitialDistrict,
  getLocalizedBranch,
  normalizePilgrimageLang,
  PILGRIMAGE_TEXT,
  type PilgrimageCity,
  type PilgrimageDistrict,
  type PilgrimageRegionTreeResponse,
  type PilgrimageSpotDetail,
  type PilgrimageSpotDetailResponse,
  type PilgrimageSpotListResponse,
  type PilgrimageSpotSummary,
} from '@/composables/miletPilgrimage'
import { apiRoutes } from '@/config/api'

type LeafletModule = typeof import('leaflet')

const route = useRoute()
const useLocalPreviewData =
  import.meta.env.DEV && import.meta.env.VITE_USE_PILGRIMAGE_API !== 'true'
const mapContainer = ref<HTMLElement | null>(null)
const mapRef = shallowRef<any>(null)
const markerLayerRef = shallowRef<any>(null)
const leafletRef = shallowRef<LeafletModule | null>(null)

const regionTree = ref<PilgrimageRegionTreeResponse>(fallbackRegionTree)
const spotsPayload = ref<PilgrimageSpotListResponse | null>(null)
const spotDetailPayload = ref<PilgrimageSpotDetailResponse | null>(null)
const selectedCityId = ref('')
const selectedDistrictId = ref('')
const selectedSpotId = ref('')
const usingFallbackData = ref(false)
const mapLoading = ref(true)
const spotsLoading = ref(false)
const isMobileViewport = ref(false)

const currentLang = computed(() => normalizePilgrimageLang(String(route.params.lang || 'zh')))
const pageText = computed(() => PILGRIMAGE_TEXT[currentLang.value])
const localizedTree = computed(() => getLocalizedBranch(regionTree.value, currentLang.value))
const cities = computed(() => localizedTree.value?.cities || [])
const selectedCity = computed<PilgrimageCity | null>(
  () => cities.value.find((city) => city.id === selectedCityId.value) || cities.value[0] || null,
)
const selectedDistrict = computed<PilgrimageDistrict | null>(() => {
  return selectedCity.value?.districts.find((district) => district.id === selectedDistrictId.value) || null
})
const localizedSpots = computed(() => getLocalizedBranch(spotsPayload.value, currentLang.value))
const spots = computed<PilgrimageSpotSummary[]>(() => localizedSpots.value?.spots || [])
const localizedSpotDetail = computed(() => getLocalizedBranch(spotDetailPayload.value, currentLang.value))
const selectedSpotDetail = computed<PilgrimageSpotDetail | null>(() => localizedSpotDetail.value?.spot || null)
const navigationUrl = computed(() =>
  selectedSpotDetail.value ? buildNavigationUrl(selectedSpotDetail.value) : '#',
)
const galleryName = computed(() => `pilgrimage-photos-${selectedSpotDetail.value?.id || 'empty'}`)

function unwrapPayload<T>(response: any): T | null {
  if (!response || typeof response !== 'object') return null
  if ('code' in response && Number(response.code) !== 200) return null
  const payload = response.data ?? response
  return payload && typeof payload === 'object' ? (payload as T) : null
}

async function loadRegionTree() {
  if (useLocalPreviewData) {
    regionTree.value = fallbackRegionTree
    usingFallbackData.value = true
    return
  }

  try {
    const response = await axiosInstance.get(apiRoutes.miletPilgrimageRegionTree)
    const payload = unwrapPayload<PilgrimageRegionTreeResponse>(response)
    if (payload?.zh?.cities?.length || payload?.jp?.cities?.length) {
      regionTree.value = payload
      usingFallbackData.value = false
      return
    }
  } catch (error) {
    console.warn('Failed to load pilgrimage region tree, using fallback data.', error)
  }

  regionTree.value = fallbackRegionTree
  usingFallbackData.value = true
}

async function loadDistrictSpots(districtId: string) {
  if (!districtId) return

  spotsLoading.value = true
  selectedSpotId.value = ''
  spotDetailPayload.value = null

  if (useLocalPreviewData) {
    spotsPayload.value = fallbackSpotLists[districtId] || { zh: { spots: [] }, jp: { spots: [] } }
    usingFallbackData.value = true
    spotsLoading.value = false
    const firstSpot = spots.value[0]
    if (firstSpot && !isMobileViewport.value) {
      await selectSpot(firstSpot.id)
    }
    return
  }

  try {
    const response = await axiosInstance.get(
      `${apiRoutes.miletPilgrimageDistrictSpots}/${districtId}/spots`,
    )
    const payload = unwrapPayload<PilgrimageSpotListResponse>(response)
    if (payload) {
      spotsPayload.value = payload
      usingFallbackData.value = false
    } else {
      spotsPayload.value = fallbackSpotLists[districtId] || { zh: { spots: [] }, jp: { spots: [] } }
      usingFallbackData.value = true
    }
  } catch (error) {
    console.warn('Failed to load pilgrimage spots, using fallback data.', error)
    spotsPayload.value = fallbackSpotLists[districtId] || { zh: { spots: [] }, jp: { spots: [] } }
    usingFallbackData.value = true
  } finally {
    spotsLoading.value = false
  }

  const firstSpot = spots.value[0]
  if (firstSpot && !isMobileViewport.value) {
    await selectSpot(firstSpot.id)
  }
}

async function loadSpotDetail(spotId: string) {
  if (!spotId) return

  if (useLocalPreviewData) {
    spotDetailPayload.value = fallbackSpotDetails[spotId] || { zh: { spot: null }, jp: { spot: null } }
    usingFallbackData.value = true
    return
  }

  try {
    const response = await axiosInstance.get(`${apiRoutes.miletPilgrimageSpot}/${spotId}`)
    const payload = unwrapPayload<PilgrimageSpotDetailResponse>(response)
    if (payload) {
      spotDetailPayload.value = payload
      usingFallbackData.value = false
      return
    }
  } catch (error) {
    console.warn('Failed to load pilgrimage spot detail, using fallback data.', error)
  }

  spotDetailPayload.value = fallbackSpotDetails[spotId] || { zh: { spot: null }, jp: { spot: null } }
  usingFallbackData.value = true
}

function selectCity(cityId: string) {
  const city = cities.value.find((item) => item.id === cityId)
  if (!city) return

  selectedCityId.value = city.id
  const nextDistrict = city.districts[0]
  if (nextDistrict) {
    selectDistrict(nextDistrict.id)
  }
}

function selectDistrict(districtId: string) {
  selectedDistrictId.value = districtId
}

async function selectSpot(spotId: string) {
  selectedSpotId.value = spotId
  await loadSpotDetail(spotId)
}

function closeSpotDetail() {
  selectedSpotId.value = ''
  spotDetailPayload.value = null
  renderMarkers()
}

function updateViewportMode() {
  if (typeof window === 'undefined') return
  isMobileViewport.value = window.matchMedia('(max-width: 1023px)').matches
  requestAnimationFrame(() => {
    mapRef.value?.invalidateSize()
  })
}

async function initMap() {
  if (!mapContainer.value || mapRef.value) return

  const L = await import('leaflet')
  leafletRef.value = L

  const district = selectedDistrict.value || findInitialDistrict(regionTree.value, currentLang.value)
  const center: [number, number] = district
    ? [district.centerLat, district.centerLng]
    : [35.6762, 139.6503]

  mapRef.value = L.map(mapContainer.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView(center, district?.defaultZoom || 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapRef.value)

  markerLayerRef.value = L.layerGroup().addTo(mapRef.value)
  mapLoading.value = false
  renderMarkers()
}

function renderMarkers() {
  const L = leafletRef.value
  const markerLayer = markerLayerRef.value
  if (!L || !markerLayer) return

  markerLayer.clearLayers()

  spots.value.forEach((spot) => {
    const active = spot.id === selectedSpotId.value
    const marker = L.marker([spot.displayLat, spot.displayLng], {
      icon: L.divIcon({
        className: '',
        html: `<button class="pilgrimage-marker${active ? ' is-active' : ''}" type="button" aria-label="${spot.title}"><span></span></button>`,
        iconSize: active ? [42, 42] : [34, 34],
        iconAnchor: active ? [21, 40] : [17, 32],
      }),
    })

    marker.on('click', () => {
      selectSpot(spot.id)
    })
    marker.addTo(markerLayer)
  })
}

function moveMapToDistrict() {
  if (!mapRef.value || !selectedDistrict.value) return
  mapRef.value.flyTo(
    [selectedDistrict.value.centerLat, selectedDistrict.value.centerLng],
    selectedDistrict.value.defaultZoom,
    { duration: 0.7 },
  )
}

function moveMapToSpot() {
  if (!mapRef.value || !selectedSpotDetail.value) return
  mapRef.value.flyTo(
    [selectedSpotDetail.value.displayLat, selectedSpotDetail.value.displayLng],
    Math.max(selectedDistrict.value?.defaultZoom || 14, 15),
    { duration: 0.45 },
  )
}

async function setupFancybox() {
  await nextTick()
  Fancybox.destroy()
  Fancybox.bind(`[data-fancybox='${galleryName.value}']`, {
    Carousel: {
      Toolbar: {
        display: {
          left: ['counter'],
          middle: [],
          right: ['download', 'thumbs', 'close'],
        },
      },
    },
  })
}

watch(
  () => selectedDistrictId.value,
  async (districtId) => {
    if (!districtId) return
    moveMapToDistrict()
    await loadDistrictSpots(districtId)
  },
)

watch(
  () => [spots.value, selectedSpotId.value, currentLang.value],
  () => {
    renderMarkers()
  },
  { deep: true },
)

watch(
  () => selectedSpotDetail.value?.id,
  () => {
    renderMarkers()
    moveMapToSpot()
    setupFancybox()
  },
)

watch(
  () => currentLang.value,
  () => {
    document.title =
      currentLang.value === 'jp'
        ? 'Echoes of milet | 聖地巡礼'
        : 'Echoes of milet | 圣地巡礼'
  },
  { immediate: true },
)

onMounted(async () => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  await loadRegionTree()
  const district = findInitialDistrict(regionTree.value, currentLang.value)
  if (district) {
    selectedCityId.value = district.cityId
    selectedDistrictId.value = district.id
  } else {
    selectedCityId.value = cities.value[0]?.id || ''
  }
  await initMap()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportMode)
  Fancybox.destroy()
  if (mapRef.value) {
    mapRef.value.remove()
  }
})
</script>

<style scoped>
.pilgrimage-page {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(247, 251, 249, 0.86)),
    linear-gradient(135deg, rgba(232, 248, 244, 0.64), rgba(255, 241, 242, 0.52));
}

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

.photo-grid {
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
}

.pilgrimage-photo :deep(.preview-image) {
  height: 112px;
  width: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.pilgrimage-photo :deep(.group) {
  display: block;
  width: 100%;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  background: #e9f2ef;
  font-family: inherit;
}

:deep(.leaflet-control-zoom) {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 8px;
  box-shadow: 0 18px 45px -34px rgba(31, 41, 55, 0.82);
}

:deep(.leaflet-control-zoom a) {
  border: 0;
  color: #315761;
}

:deep(.leaflet-control-attribution) {
  border-top-left-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #60717a;
  font-size: 11px;
}

:global(.pilgrimage-marker) {
  position: relative;
  display: grid;
  height: 34px;
  width: 34px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 999px 999px 999px 6px;
  background: #fff;
  box-shadow: 0 16px 32px -18px rgba(31, 41, 55, 0.75);
  transform: rotate(-45deg);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

:global(.pilgrimage-marker span) {
  height: 13px;
  width: 13px;
  border-radius: 999px;
  background: #6fb8ad;
  transform: rotate(45deg);
}

:global(.pilgrimage-marker.is-active) {
  height: 42px;
  width: 42px;
  background: #fff1f2;
  box-shadow: 0 20px 40px -18px rgba(143, 63, 75, 0.72);
}

:global(.pilgrimage-marker.is-active span) {
  height: 16px;
  width: 16px;
  background: #c98791;
}

@media (max-width: 1023px) {
  .pilgrimage-page {
    min-height: auto;
  }

  .photo-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
