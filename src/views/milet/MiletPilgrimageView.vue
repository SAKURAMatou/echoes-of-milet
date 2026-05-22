<template>
  <article
    class="pilgrimage-page overflow-hidden rounded-lg bg-[image:linear-gradient(180deg,rgba(255,255,255,0.78),rgba(247,251,249,0.86)),linear-gradient(135deg,rgba(232,248,244,0.64),rgba(255,241,242,0.52))] text-[#24323a] lg:mb-6"
  >
    <section
      class="pilgrimage-workspace relative grid min-h-0 grid-rows-[auto_auto_auto] overflow-visible lg:h-[calc(100vh-7.5rem)] lg:min-h-[800px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:overflow-hidden 2xl:overflow-visible"
    >
      <header class="border-b border-white/70 px-4 py-4 sm:px-5 lg:col-span-2 lg:px-7 lg:py-5">
        <div class="grid gap-4">
          <div class="min-w-0">
            <h1 class="font-serif text-[clamp(2.4rem,4.3vw,4.1rem)] leading-none text-[#26313a]">
              {{ pageText.title }}
            </h1>
            <p class="mt-2 max-w-4xl text-sm leading-6 text-[#5f7178] lg:text-[15px]">
              {{ pageText.subtitle }}
            </p>
          </div>
        </div>
      </header>

      <div
        class="grid gap-3 border-b border-white/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-5 lg:col-start-1 lg:row-start-2 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-7"
      >
        <div
          class="rounded-lg border border-[#9bd0c8]/70 bg-[#f0fbf8]/88 px-3 py-2 shadow-[0_14px_34px_-30px_rgba(31,41,55,0.72)]"
        >
          <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2f8f83]">
            {{ pageText.dataCreditLabel }}
          </div>
          <p class="mt-1 text-[13px] leading-5 text-[#45646b]">
            {{ pageText.dataCredit }}
          </p>
        </div>

        <div
          class="min-w-0 rounded-lg border border-white/70 bg-white/64 px-3 py-2 text-sm text-[#526670]"
        >
          <span class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c9197]">
            {{ pageText.currentArea }}
          </span>
        </div>
      </div>

      <div
        class="relative h-[72svh] max-h-[820px] min-h-[620px] min-w-0 overflow-hidden border-b border-white/70 sm:h-[74svh] sm:min-h-[680px] lg:col-start-1 lg:row-start-3 lg:h-full lg:max-h-none lg:min-h-0 lg:border-b-0 lg:border-r"
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

      <PilgrimageSpotDetailPanel
        class="lg:col-start-2 lg:row-span-2 lg:row-start-2"
        :page-text="pageText"
        :selected-spot-detail="selectedSpotDetail"
        :navigation-url="navigationUrl"
        :gallery-name="galleryName"
        :spots-loading="spotsLoading"
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
import PilgrimageMapPane from '@/components/milet/pilgrimage/PilgrimageMapPane.vue'
import PilgrimageSeoSpotList from '@/components/milet/pilgrimage/PilgrimageSeoSpotList.vue'
import PilgrimageSpotDetailPanel from '@/components/milet/pilgrimage/PilgrimageSpotDetailPanel.vue'
import {
  findInitialDistrict,
  normalizePilgrimageLang,
  PILGRIMAGE_TEXT,
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
const {
  regionTree,
  spotsPayload,
  spotsPayloadDistrictId,
  spotDetailPayload,
  selectedCityId,
  selectedDistrictId,
  selectedSpotId,
  selectedRouteId,
  mapLoading,
  spotsLoading,
  cities,
  seoSpotListCities,
  selectedCity,
  selectedDistrict,
  spots,
  routes,
  selectedRoute,
  routeSpotIds,
  routeOrderMap,
  selectedSpotDetail,
  navigationUrl,
  galleryName,
  loadDistrictSpots,
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
  void transitionSelectedArea(districtId)
  syncPilgrimageState()
}

async function selectSpot(spotId: string) {
  selectedSpotId.value = spotId
  applyMapZoomLimits()
  await loadSpotDetail(spotId)
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
    inertia: false,
    minZoom: 11,
    maxZoom: 20,
    maxBoundsViscosity: 0.52,
  }).setView(center, district?.defaultZoom || 14)

  L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
    maxNativeZoom: 19,
    maxZoom: 20,
    detectRetina: false,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution: '&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors',
  }).addTo(mapRef.value)

  routeLayerRef.value = L.layerGroup().addTo(mapRef.value)
  markerLayerRef.value = L.layerGroup().addTo(mapRef.value)
  animationLayerRef.value = L.layerGroup().addTo(mapRef.value)
  mapRef.value.on('zoomend moveend', () => {
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
    paddingTopLeft: [56, isMobileViewport.value ? 96 : 236] as [number, number],
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
  () => [spots.value, selectedSpotId.value, currentLang.value],
  () => {
    renderMarkers()
    renderRoutes()
  },
  { deep: true },
)

watch(
  () => selectedSpotDetail.value?.id,
  () => {
    if (import.meta.env.SSR) return
    renderMarkers()
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
