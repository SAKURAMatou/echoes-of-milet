<template>
  <article class="pilgrimage-page overflow-hidden rounded-lg text-[#24323a] lg:mb-6">
    <section
      class="pilgrimage-workspace relative z-[1] grid min-h-0 grid-rows-[auto_auto_auto] overflow-visible lg:h-[calc(100vh+2rem)] lg:min-h-[1000px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:overflow-hidden 2xl:overflow-visible"
    >
      <header
        class="relative border-b border-[#c9ddea]/70 px-4 py-4 sm:px-5 lg:col-span-2 lg:px-7 lg:py-5"
      >
        <div class="grid gap-4 pr-0 lg:pr-48">
          <div class="min-w-0">
            <h1
              class="milet-page-title-font text-[clamp(2.4rem,4.3vw,4.1rem)] leading-none text-[#26313a]"
            >
              {{ pageText.title }}
            </h1>
            <!-- <p class="mt-2 max-w-4xl text-sm leading-6 text-[#5f7178] lg:text-[15px]">
              {{ pageText.subtitle }}
            </p> -->
            <LinkedText
              class="mt-2 max-w-4xl text-sm leading-6 text-[#5f7178] lg:text-[15px]"
              :text="pageText.subtitle"
              :links="pageText.subtitleLink"
            >
            </LinkedText>
          </div>
        </div>
        <div
          class="pilgrimage-postmark pointer-events-none absolute right-4 top-3 rotate-[-4deg] rounded-[4px] border-2 border-[#c4b5fd]/45 px-[18px] pb-2.5 pt-3 text-center text-[#7b68a8] opacity-35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.52)] sm:opacity-45 max-lg:right-2.5 max-lg:top-3.5 max-lg:z-0 max-lg:origin-top-right max-lg:rotate-[-5deg] max-lg:scale-[0.86] max-lg:border-[#c4b5fd]/30 max-lg:px-3 max-lg:pb-[7px] max-lg:pt-2 max-lg:text-[#7b68a8]/60 lg:right-6 lg:top-4 lg:opacity-100"
          aria-hidden="true"
        >
          <span class="block text-[11px] font-black uppercase tracking-[0.2em]">Keep walking</span>
          <span class="mt-1 block font-serif text-xl italic leading-none">with milet</span>
        </div>
      </header>

      <div
        class="grid gap-3 border-b border-[#c9ddea]/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-5 lg:col-start-1 lg:row-start-2 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-7"
      >
        <div
          class="rounded-lg border border-[#99e6d6]/70 bg-[#f0fdfa]/58 px-3 py-2 shadow-[0_14px_34px_-30px_rgba(47,143,131,0.34)] backdrop-blur"
        >
          <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8f83]">
            {{ pageText.dataCreditLabel }}
          </div>
          <p class="mt-1 text-[13px] leading-5 text-[#45646b]">
            {{ pageText.dataCredit }}
          </p>
        </div>

        <div
          class="min-w-0 rounded-lg border border-[#fcd34d]/50 bg-[#fffbeb]/58 p-1.5 text-sm text-[#526670] shadow-[0_16px_36px_-34px_rgba(182,138,47,0.38)] backdrop-blur"
        >
          <span
            class="relative grid h-full min-h-14 grid-cols-2 rounded-lg border border-white/70 bg-white/54 p-0.5 text-sm font-bold shadow-inner"
          >
            <button
              type="button"
              class="relative z-[1] rounded-md px-3 py-2 transition"
              :class="displayMode === 'map' ? 'text-[#1d6564]' : 'text-[#7c9197]'"
              @click="setDisplayMode('map')"
            >
              {{ collectionModeText.map }}
            </button>
            <button
              type="button"
              class="relative z-[1] rounded-md px-3 py-2 transition"
              :class="displayMode === 'collection' ? 'text-[#614990]' : 'text-[#7c9197]'"
              @click="setDisplayMode('collection')"
            >
              {{ collectionModeText.collection }}
            </button>
            <span
              class="absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-md border border-[#99e6d6]/60 bg-[#f0fdfa]/92 shadow-sm transition-transform duration-300"
              :class="
                displayMode === 'collection'
                  ? 'translate-x-full border-[#c4b5fd]/60 bg-[#f5f3ff]/92'
                  : 'translate-x-0'
              "
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      <div
        class="pilgrimage-map-frame relative box-border h-[calc(72svh+7.5rem)] max-h-[940px] min-h-[740px] min-w-0 overflow-hidden border-b border-[#c9ddea]/70 sm:h-[calc(74svh+7rem)] sm:min-h-[800px] lg:col-start-1 lg:row-start-3 lg:h-full lg:max-h-none lg:min-h-0 lg:border-b-0 lg:border-r lg:border-[#c9ddea]/70"
      >
        <div
          class="pilgrimage-map-note pilgrimage-map-note--top pointer-events-none absolute left-20 right-3 top-2 z-[24] flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#4d8f86] sm:left-24 sm:text-xs lg:left-32 lg:right-8 lg:top-4 lg:gap-3 lg:text-sm"
          aria-hidden="true"
        >
          <span class="shrink-0 font-serif text-[#5eead4]/80">&#10022;</span>
          <span class="block min-w-0 truncate">{{ mapTopNoteText }}</span>
        </div>
        <div
          v-show="displayMode === 'map'"
          class="pilgrimage-area-dock absolute inset-x-4 top-10 z-[35] sm:inset-x-5 sm:top-12 lg:inset-x-7 lg:top-14"
        >
          <PilgrimageAreaControls
            :page-text="pageText"
            :cities="cities"
            :selected-city="selectedCity"
            :selected-district="selectedDistrict"
            :selected-city-id="selectedCityId"
            :selected-district-id="selectedDistrictId"
            :routes="routes"
            :selected-route="selectedRoute"
            :selected-route-id="selectedRouteId"
            @select-city="selectCity"
            @select-district="selectDistrict"
            @select-route="selectRoute"
          />
        </div>
        <div
          class="pilgrimage-map-note pointer-events-none absolute bottom-2 left-1/2 z-[24] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 overflow-hidden whitespace-nowrap font-serif text-xs italic tracking-[0.04em] text-[#9a7740] sm:text-sm lg:bottom-3 lg:gap-3 lg:text-lg"
          aria-hidden="true"
        >
          <span class="shrink-0 font-serif text-[#f9a8d4]/80">&#10022;</span>
          <span class="block min-w-0 truncate">I walk, I see, I remember - with milet.</span>
          <span class="shrink-0 font-serif text-[#fcd34d]/80">&#10022;</span>
        </div>
        <div
          class="pilgrimage-map-postcard-surface absolute inset-x-3 bottom-9 overflow-hidden rounded-[10px] border border-[#cbe0ec]/90 shadow-[0_0_0_1px_rgba(255,255,255,0.74),0_18px_42px_-34px_rgba(58,91,119,0.66)] sm:bottom-10 lg:inset-x-4 lg:bottom-12"
          :class="
            displayMode === 'map'
              ? 'top-[8.5rem] sm:top-[9.25rem] lg:top-[10.5rem]'
              : 'top-9 sm:top-10 lg:top-12'
          "
        >
          <div v-show="displayMode === 'map'" class="relative h-full">
            <PilgrimageMapPane
              ref="mapPaneRef"
              :page-text="pageText"
              :map-loading="mapLoading"
              :map-transitioning="mapTransitioning"
              :spots-loading="spotsLoading"
              :markers-visible="markersVisible"
              :selected-district="selectedDistrict"
              :spots-count="spots.length"
            />
          </div>

          <Transition name="pilgrimage-mode-panel">
            <PilgrimageCollectionPanel
              v-if="displayMode === 'collection'"
              :collections="collections"
              :selected-collection="selectedCollection"
              :selected-spot-id="selectedSpotId"
              :loading="collectionsLoading"
              :lang="currentLang"
              @select-collection="selectCollection"
              @select-spot="selectSpot"
            />
          </Transition>
        </div>
      </div>

      <PilgrimageSpotDetailPanel
        class="lg:col-start-2 lg:row-span-2 lg:row-start-2"
        :page-text="pageText"
        :selected-spot-detail="selectedSpotDetail"
        :navigation-url="navigationUrl"
        :gallery-name="galleryName"
        :spots-loading="spotsLoading"
        :spot-detail-loading="spotDetailLoading"
        :lang="currentLang"
        @close="closeSpotDetail"
      />
    </section>

    <PilgrimageSeoSpotList :cities="seoSpotListCities" :lang="currentLang" />
  </article>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import '@fancyapps/ui/dist/fancybox/fancybox.css'
import '@/components/milet/pilgrimage/pilgrimageMapStyles.css'

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onServerPrefetch,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'

import PilgrimageAreaControls from '@/components/milet/pilgrimage/PilgrimageAreaControls.vue'
import PilgrimageCollectionPanel from '@/components/milet/pilgrimage/PilgrimageCollectionPanel.vue'
import PilgrimageMapPane from '@/components/milet/pilgrimage/PilgrimageMapPane.vue'
import PilgrimageSeoSpotList from '@/components/milet/pilgrimage/PilgrimageSeoSpotList.vue'
import PilgrimageSpotDetailPanel from '@/components/milet/pilgrimage/PilgrimageSpotDetailPanel.vue'
import LinkedText from '@/components/LinkedText.vue'

import { pilgrimageMapConfig } from '@/components/milet/pilgrimage/pilgrimageMapConfig'
import {
  findInitialDistrict,
  normalizePilgrimageLang,
  PILGRIMAGE_TEXT,
  type PilgrimageDisplayMode,
} from '@/composables/miletPilgrimage'
import { usePilgrimageDataState } from '@/composables/usePilgrimageDataState'
import { usePilgrimageMapRendering } from '@/composables/usePilgrimageMapRendering'

type LeafletModule = typeof import('leaflet')
type PilgrimageMapPaneExpose = {
  mapContainer: HTMLElement | { value: HTMLElement | null } | null
}

const MAP_BOUNDS_PADDING_RATIO = 1

const route = useRoute()
const mapPaneRef = ref<PilgrimageMapPaneExpose | null>(null)
const mapRef = shallowRef<any>(null)
const markerLayerRef = shallowRef<any>(null)
const routeLayerRef = shallowRef<any>(null)
const animationLayerRef = shallowRef<any>(null)
const leafletRef = shallowRef<LeafletModule | null>(null)
const mapTransitioning = ref(false)
const markersVisible = ref(false)
const isMobileViewport = ref(false)
let districtLoadToken = 0
let resizeFrame = 0
let lastViewportWidth = 0
let suppressDistrictWatch = false
let fancyboxApi: (typeof import('@fancyapps/ui'))['Fancybox'] | null = null

const currentLang = computed(() => normalizePilgrimageLang(String(route.params.lang || 'zh')))
const pageText = computed(() => PILGRIMAGE_TEXT[currentLang.value])
const collectionModeText = computed(() =>
  currentLang.value === 'jp'
    ? {
        map: '地図',
        collection: 'コレクション',
      }
    : {
        map: '地图',
        collection: '合集',
      },
)
const mapTopNoteText = computed(() =>
  currentLang.value === 'jp'
    ? 'miletの足跡をたどり、一つひとつの風景を記録する。'
    : '追随 milet 的足迹，记录每一段风景。',
)
const {
  regionTree,
  markerSkins,
  spotsPayload,
  spotsPayloadDistrictId,
  spotDetailPayload,
  selectedCityId,
  selectedDistrictId,
  selectedSpotId,
  selectedRouteId,
  displayMode,
  selectedCollectionId,
  mapLoading,
  spotsLoading,
  collectionsLoading,
  spotDetailLoading,
  cities,
  seoSpotListCities,
  selectedCity,
  selectedDistrict,
  spots,
  routes,
  collections,
  selectedCollection,
  selectedRoute,
  routeSpotIds,
  routeOrderMap,
  selectedSpotDetail,
  navigationUrl,
  galleryName,
  loadDistrictSpots,
  loadCollections,
  loadSpotDetail,
  loadInitialPilgrimageData: loadInitialPilgrimageDataState,
  syncPilgrimageState,
} = usePilgrimageDataState({
  currentLang,
  isMobileViewport,
  autoSelectSpot: selectSpot,
})
const { renderMarkers, renderRoutes, startRouteAnimation, stopRouteAnimation } =
  usePilgrimageMapRendering({
    leafletRef,
    mapRef,
    markerLayerRef,
    routeLayerRef,
    animationLayerRef,
    spots,
    markerSkins,
    selectedSpotId,
    selectedSpotDetail,
    selectedRoute,
    routeSpotIds,
    routeOrderMap,
    isMobileViewport,
    selectSpot,
  })

type LatLngTuple = [number, number]

async function loadInitialPilgrimageData() {
  suppressDistrictWatch = true
  try {
    await loadInitialPilgrimageDataState()
  } finally {
    await nextTick()
    suppressDistrictWatch = false
  }
}

function selectCity(cityId: string) {
  const city = cities.value.find((item) => item.id === cityId)
  if (!city) return

  selectedCityId.value = city.id
  const nextDistrict =
    city.districts.find((district) => Number(district.spotCount) > 0) || city.districts[0]
  if (nextDistrict) {
    selectDistrict(nextDistrict.id)
  } else {
    stopRouteAnimation(false)
    selectedDistrictId.value = ''
    selectedRouteId.value = ''
    selectedSpotId.value = ''
    spotsPayload.value = null
    spotsPayloadDistrictId.value = ''
    spotDetailPayload.value = null
    spotDetailLoading.value = false
    void transitionSelectedArea('')
  }
  syncPilgrimageState()
}

function selectDistrict(districtId: string) {
  stopRouteAnimation(false)
  selectedDistrictId.value = districtId
  selectedRouteId.value = ''
  selectedSpotId.value = ''
  spotsPayload.value = null
  spotsPayloadDistrictId.value = ''
  spotDetailPayload.value = null
  spotDetailLoading.value = false
  void transitionSelectedArea(districtId)
  syncPilgrimageState()
}

async function selectSpot(spotId: string) {
  selectedSpotId.value = spotId
  applyMapZoomLimits()
  await loadSpotDetail(spotId)
  syncPilgrimageState()
}

async function setDisplayMode(mode: PilgrimageDisplayMode) {
  if (displayMode.value === mode) return
  displayMode.value = mode

  if (mode === 'collection') {
    stopRouteAnimation(false)
    await loadCollections()
  } else {
    await nextTick()
    mapRef.value?.invalidateSize({ pan: false })
    renderMarkers()
    renderRoutes()
    if (selectedRoute.value) startRouteAnimation()
  }

  syncPilgrimageState()
}

function selectCollection(collectionId: string) {
  selectedCollectionId.value = collectionId
  syncPilgrimageState()
}

async function selectRoute(routeId: string) {
  stopRouteAnimation(false)
  selectedRouteId.value = routeId
  applyMapZoomLimits()
  renderMarkers()
  renderRoutes()
  startRouteAnimation()
}

function closeSpotDetail() {
  selectedSpotId.value = ''
  spotDetailPayload.value = null
  spotDetailLoading.value = false
  applyMapZoomLimits()
  renderMarkers()
  syncPilgrimageState()
}

function updateViewportMode() {
  if (typeof window === 'undefined') return
  const nextMobile = window.matchMedia('(max-width: 1023px)').matches
  const modeChanged = nextMobile !== isMobileViewport.value
  const widthChanged = Math.abs(window.innerWidth - lastViewportWidth) > 24

  isMobileViewport.value = nextMobile
  lastViewportWidth = window.innerWidth

  cancelAnimationFrame(resizeFrame)
  resizeFrame = requestAnimationFrame(() => {
    if (!nextMobile || modeChanged || widthChanged) {
      mapRef.value?.invalidateSize({ pan: false })
    }
    renderMarkers()
    renderRoutes()
  })
}

function getMapContainer() {
  const exposed = mapPaneRef.value?.mapContainer
  if (!exposed) return null
  return exposed instanceof HTMLElement ? exposed : exposed.value
}

async function initMap() {
  const mapContainer = getMapContainer()
  if (!mapContainer || mapRef.value) return

  const L = await import('leaflet')
  leafletRef.value = L

  const district =
    selectedDistrict.value || findInitialDistrict(regionTree.value, currentLang.value)
  const center: [number, number] = district
    ? [district.centerLat, district.centerLng]
    : [35.6762, 139.6503]

  mapRef.value = L.map(mapContainer, {
    zoomControl: true,
    attributionControl: true,
    keyboard: false,
    inertia: false,
    minZoom: 11,
    maxZoom: 20,
    maxBoundsViscosity: 0.52,
  }).setView(center, district?.defaultZoom || 14)

  L.tileLayer(pilgrimageMapConfig.tileLayer.url, {
    maxNativeZoom: 19,
    maxZoom: 20,
    detectRetina: false,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution: pilgrimageMapConfig.tileLayer.attribution,
  }).addTo(mapRef.value)

  routeLayerRef.value = L.layerGroup().addTo(mapRef.value)
  markerLayerRef.value = L.layerGroup().addTo(mapRef.value)
  animationLayerRef.value = L.layerGroup().addTo(mapRef.value)
  mapRef.value.on('zoomend', () => {
    renderMarkers()
    renderRoutes()
  })
  applyMapZoomLimits()
  await moveMapToCurrentArea({ duration: 0 })
  mapLoading.value = false
  renderMarkers()
  renderRoutes()
  applyMapBrowseBounds()
  requestAnimationFrame(() => {
    markersVisible.value = true
  })
}

function applyMapZoomLimits() {
  const map = mapRef.value
  if (!map) return
  const minZoom = 11
  const maxZoom = selectedSpotId.value || selectedRouteId.value ? 20 : 19
  map.setMinZoom(minZoom)
  map.setMaxZoom(maxZoom)
  const currentZoom = map.getZoom()
  if (currentZoom < minZoom) map.setZoom(minZoom, { animate: false })
  if (currentZoom > maxZoom) map.setZoom(maxZoom, { animate: false })
}

function clampMapZoom(zoom: number, maxZoom = 20) {
  return Math.min(Math.max(zoom, 11), maxZoom)
}

function currentMapArea() {
  return selectedDistrict.value || selectedCity.value
}

function defaultMapZoom() {
  const fallbackZoom = selectedDistrict.value ? 14 : 12
  return clampMapZoom(currentMapArea()?.defaultZoom || fallbackZoom, 19)
}

function mapViewPadding() {
  return {
    paddingTopLeft: [56, isMobileViewport.value ? 72 : 80] as [number, number],
    paddingBottomRight: [56, 72] as [number, number],
  }
}

function clearMapBrowseBounds() {
  mapRef.value?.setMaxBounds(null)
}

function validLatLng(lat: unknown, lng: unknown): LatLngTuple | null {
  const nextLat = Number(lat)
  const nextLng = Number(lng)
  if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return null
  return [nextLat, nextLng]
}

function areaCenter() {
  const area = currentMapArea()
  return area ? validLatLng(area.centerLat, area.centerLng) : null
}

function currentSpotCoordinates() {
  if (!selectedDistrict.value) return []
  return spots.value
    .map((spot) => validLatLng(spot.displayLat, spot.displayLng))
    .filter((point): point is LatLngTuple => Boolean(point))
}

function expandedBounds(coordinates: LatLngTuple[]) {
  const L = leafletRef.value
  if (!L || coordinates.length === 0) return null

  let minLat = Math.min(...coordinates.map(([lat]) => lat))
  let maxLat = Math.max(...coordinates.map(([lat]) => lat))
  let minLng = Math.min(...coordinates.map(([, lng]) => lng))
  let maxLng = Math.max(...coordinates.map(([, lng]) => lng))

  if (minLat === maxLat) {
    minLat -= 0.006
    maxLat += 0.006
  }
  if (minLng === maxLng) {
    minLng -= 0.008
    maxLng += 0.008
  }

  const latPad = (maxLat - minLat) * MAP_BOUNDS_PADDING_RATIO
  const lngPad = (maxLng - minLng) * MAP_BOUNDS_PADDING_RATIO
  return L.latLngBounds(
    [Math.max(minLat - latPad, -85), Math.max(minLng - lngPad, -180)],
    [Math.min(maxLat + latPad, 85), Math.min(maxLng + lngPad, 180)],
  )
}

function buildMapBrowseBounds() {
  const center = areaCenter()
  const coordinates = [...(center ? [center] : []), ...currentSpotCoordinates()]
  return expandedBounds(coordinates)
}

function applyMapBrowseBounds(options: { panInside?: boolean } = {}) {
  const map = mapRef.value
  const bounds = buildMapBrowseBounds()
  if (!map || !bounds) return

  map.setMaxBounds(bounds)
  if (options.panInside) {
    map.panInsideBounds(bounds, { animate: false, ...mapViewPadding() })
  }
}

function waitForMapMove(action: () => void, timeout = 920) {
  const map = mapRef.value
  if (!map) return Promise.resolve()
  return new Promise<void>((resolve) => {
    let resolved = false
    const finish = () => {
      if (resolved) return
      resolved = true
      map.off('moveend', finish)
      resolve()
    }
    map.once('moveend', finish)
    window.setTimeout(finish, timeout)
    action()
  })
}

function moveMapToCurrentArea(options: { duration?: number } = {}) {
  const map = mapRef.value
  const L = leafletRef.value
  const center = areaCenter()
  if (!map || !L || !center) return Promise.resolve()

  applyMapZoomLimits()
  const duration = options.duration ?? 0.7
  const spotCoordinates = currentSpotCoordinates()
  const padding = mapViewPadding()

  if (spotCoordinates.length > 1) {
    const bounds = L.latLngBounds(spotCoordinates)
    if (duration <= 0) {
      map.fitBounds(bounds, {
        animate: false,
        maxZoom: defaultMapZoom(),
        ...padding,
      })
      return Promise.resolve()
    }

    return waitForMapMove(() => {
      map.fitBounds(bounds, {
        animate: true,
        duration,
        maxZoom: defaultMapZoom(),
        ...padding,
      })
    })
  }

  const targetCenter = spotCoordinates[0] || center
  const singlePointBounds = expandedBounds([targetCenter])
  if (singlePointBounds) {
    if (duration <= 0) {
      map.fitBounds(singlePointBounds, {
        animate: false,
        maxZoom: defaultMapZoom(),
        ...padding,
      })
      return Promise.resolve()
    }

    return waitForMapMove(() => {
      map.fitBounds(singlePointBounds, {
        animate: true,
        duration,
        maxZoom: defaultMapZoom(),
        ...padding,
      })
    })
  }

  if (duration <= 0) {
    map.setView(targetCenter, defaultMapZoom(), { animate: false })
    return Promise.resolve()
  }

  return waitForMapMove(() => {
    map.flyTo(targetCenter, defaultMapZoom(), { duration })
  })
}

async function transitionSelectedArea(districtId: string) {
  if (import.meta.env.SSR || suppressDistrictWatch) return
  const token = ++districtLoadToken
  stopRouteAnimation(false)
  mapTransitioning.value = true
  markersVisible.value = false
  clearMapBrowseBounds()

  if (districtId && selectedDistrict.value) {
    await loadDistrictSpots(districtId, {
      autoSelect: false,
      isActive: () => selectedDistrictId.value === districtId && token === districtLoadToken,
    })
  } else {
    spotsLoading.value = false
    selectedSpotId.value = ''
    selectedRouteId.value = ''
    spotDetailPayload.value = null
    spotsPayload.value = null
    spotsPayloadDistrictId.value = ''
    syncPilgrimageState()
  }

  if (token !== districtLoadToken) return
  applyMapZoomLimits()
  await moveMapToCurrentArea()
  if (token !== districtLoadToken) return
  applyMapBrowseBounds({ panInside: true })
  renderMarkers()
  renderRoutes()
  syncPilgrimageState()
  requestAnimationFrame(() => {
    if (token !== districtLoadToken) return
    markersVisible.value = true
    mapTransitioning.value = false
  })
}

async function setupFancybox() {
  if (import.meta.env.SSR) return
  if (!fancyboxApi) {
    fancyboxApi = (await import('@fancyapps/ui')).Fancybox
  }

  await nextTick()
  fancyboxApi.destroy()
  fancyboxApi.bind(`[data-fancybox='${galleryName.value}']`, {
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
  () => [spots.value, currentLang.value],
  () => {
    renderMarkers()
    renderRoutes()
  },
  { deep: true },
)

watch(
  () => selectedSpotId.value,
  () => {
    renderMarkers()
  },
)

watch(
  () => selectedSpotDetail.value?.id,
  () => {
    if (import.meta.env.SSR) return
    setupFancybox()
  },
)

watch(
  () => currentLang.value,
  () => {
    if (typeof document === 'undefined') return
    document.title =
      currentLang.value === 'jp'
        ? 'milet 聖地巡礼マップとルート | Echoes of milet'
        : 'milet 圣地巡礼地图与路线 | Echoes of milet'
  },
  { immediate: true },
)

onServerPrefetch(loadInitialPilgrimageData)

onMounted(async () => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  if (mapLoading.value || !selectedDistrictId.value) {
    await loadInitialPilgrimageData()
  }
  await initMap()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportMode)
  cancelAnimationFrame(resizeFrame)
  stopRouteAnimation(false)
  fancyboxApi?.destroy()
  if (mapRef.value) {
    mapRef.value.remove()
  }
})
</script>
