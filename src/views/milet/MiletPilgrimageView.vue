<template>
  <article class="pilgrimage-page overflow-hidden rounded-lg text-[#24323a] lg:mb-6">
    <section
      class="pilgrimage-workspace relative grid h-[calc(100svh-4rem)] min-h-[680px] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden lg:h-[calc(100vh-7.5rem)] lg:min-h-[800px] 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-rows-[auto_auto_minmax(0,1fr)] 2xl:overflow-visible"
    >
      <header class="border-b border-white/70 px-4 py-4 sm:px-5 lg:px-7 lg:py-5 2xl:col-span-2">
        <div class="grid gap-4">
          <div class="min-w-0">
            <h1
              class="font-serif text-[clamp(2.4rem,4.3vw,4.1rem)] leading-none text-[#26313a]"
            >
              {{ pageText.title }}
            </h1>
            <p class="mt-2 max-w-4xl text-sm leading-6 text-[#5f7178] lg:text-[15px]">
              {{ pageText.subtitle }}
            </p>
          </div>
        </div>
      </header>

      <div class="grid gap-3 border-b border-white/70 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-5 lg:px-7 2xl:col-start-1 2xl:row-start-2 2xl:grid-cols-[minmax(0,1fr)_240px]">
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
          <span
            class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c9197]"
          >
            {{ pageText.currentArea }}
          </span>
          <span class="mt-1 block truncate font-medium text-[#26313a]">
            {{ selectedCity?.name || pageText.allCities }}
            <span v-if="selectedDistrict">/ {{ selectedDistrict.name }}</span>
          </span>
        </div>
      </div>

      <div
        class="relative min-h-0 min-w-0 overflow-hidden border-b border-white/70 2xl:col-start-1 2xl:row-start-3 2xl:border-b-0 2xl:border-r"
      >
        <PilgrimageAreaControls
          :page-text="pageText"
          :cities="cities"
          :selected-city="selectedCity"
          :selected-district="selectedDistrict"
          :selected-city-id="selectedCityId"
          :selected-district-id="selectedDistrictId"
          :routes="routes"
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
        class="2xl:col-start-2 2xl:row-span-2 2xl:row-start-2"
        :page-text="pageText"
        :selected-spot-detail="selectedSpotDetail"
        :navigation-url="navigationUrl"
        :gallery-name="galleryName"
        :spots-loading="spotsLoading"
        @close="closeSpotDetail"
      />
    </section>

    <PilgrimageSeoSpotList
      :cities="seoSpotListCities"
      :lang="currentLang"
    />
  </article>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

import { computed, nextTick, onBeforeUnmount, onMounted, onServerPrefetch, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import PilgrimageAreaControls from '@/components/milet/pilgrimage/PilgrimageAreaControls.vue'
import PilgrimageMapPane from '@/components/milet/pilgrimage/PilgrimageMapPane.vue'
import PilgrimageSeoSpotList from '@/components/milet/pilgrimage/PilgrimageSeoSpotList.vue'
import PilgrimageSpotDetailPanel from '@/components/milet/pilgrimage/PilgrimageSpotDetailPanel.vue'
import { pilgrimageMapConfig } from '@/components/milet/pilgrimage/pilgrimageMapConfig'
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
  type PilgrimageLang,
  type PilgrimageRegionTreeResponse,
  type PilgrimageRoute,
  type PilgrimageSpotDetail,
  type PilgrimageSpotDetailResponse,
  type PilgrimageSpotListResponse,
  type PilgrimageSpotSummary,
  type PilgrimageSsrPayload,
} from '@/composables/miletPilgrimage'
import { useAppState } from '@/composables/useAppState'
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'

type LeafletModule = typeof import('leaflet')
type PilgrimageMapPaneExpose = {
  mapContainer: HTMLElement | { value: HTMLElement | null } | null
}

const MAP_BOUNDS_PADDING_RATIO = 1

const appState = useAppState()
const initialPilgrimageData = appState.miletPilgrimageData
const route = useRoute()
const mapPaneRef = ref<PilgrimageMapPaneExpose | null>(null)
const mapRef = shallowRef<any>(null)
const markerLayerRef = shallowRef<any>(null)
const routeLayerRef = shallowRef<any>(null)
const leafletRef = shallowRef<LeafletModule | null>(null)

const regionTree = ref<PilgrimageRegionTreeResponse>(initialPilgrimageData?.regionTree || fallbackRegionTree)
const spotsPayload = ref<PilgrimageSpotListResponse | null>(
  initialPilgrimageData?.selectedDistrictId
    ? initialPilgrimageData.spotsByDistrictId[initialPilgrimageData.selectedDistrictId] || null
    : null,
)
const spotsPayloadDistrictId = ref(
  spotsPayload.value ? initialPilgrimageData?.selectedDistrictId || '' : '',
)
const spotPayloadCache = new Map<string, PilgrimageSpotListResponse>(
  Object.entries(initialPilgrimageData?.spotsByDistrictId || {}),
)
const spotDetailPayload = ref<PilgrimageSpotDetailResponse | null>(
  initialPilgrimageData?.selectedSpotId
    ? initialPilgrimageData.spotDetailsBySpotId[initialPilgrimageData.selectedSpotId] || null
    : null,
)
const selectedCityId = ref(initialPilgrimageData?.selectedCityId || '')
const selectedDistrictId = ref(initialPilgrimageData?.selectedDistrictId || '')
const selectedSpotId = ref(initialPilgrimageData?.selectedSpotId || '')
const selectedRouteId = ref('')
const usingFallbackData = ref(initialPilgrimageData?.usingFallbackData || false)
const mapLoading = ref(!initialPilgrimageData?.regionTree)
const spotsLoading = ref(false)
const mapTransitioning = ref(false)
const markersVisible = ref(false)
const isMobileViewport = ref(false)
let districtLoadToken = 0
let resizeFrame = 0
let lastViewportWidth = 0
let suppressDistrictWatch = false
let fancyboxApi: typeof import('@fancyapps/ui')['Fancybox'] | null = null

const currentLang = computed(() => normalizePilgrimageLang(String(route.params.lang || 'zh')))
const pageText = computed(() => PILGRIMAGE_TEXT[currentLang.value])
const localizedTree = computed(() => getLocalizedBranch(regionTree.value, currentLang.value))
const cities = computed(() => localizedTree.value?.cities || [])
const seoSpotListCities = computed(() =>
  cities.value
    .map((city) => ({
      id: city.id,
      name: city.name,
      countryCode: city.countryCode,
      districts: city.districts
        .map((district) => ({
          ...district,
          spots: district.spots?.length
            ? district.spots
            : fallbackSpotLists[district.id]?.[currentLang.value].spots || [],
        }))
        .filter((district) => district.spots.length > 0),
    }))
    .filter((city) => city.districts.length > 0),
)
const selectedCity = computed<PilgrimageCity | null>(
  () => cities.value.find((city) => city.id === selectedCityId.value) || cities.value[0] || null,
)
const selectedDistrict = computed<PilgrimageDistrict | null>(() => {
  return (
    selectedCity.value?.districts.find((district) => district.id === selectedDistrictId.value) ||
    null
  )
})
const localizedSpots = computed(() => getLocalizedBranch(spotsPayload.value, currentLang.value))
const spots = computed<PilgrimageSpotSummary[]>(() => localizedSpots.value?.spots || [])
const routes = computed<PilgrimageRoute[]>(() => localizedSpots.value?.routes || [])
const selectedRoute = computed(
  () => routes.value.find((item) => item.id === selectedRouteId.value) || null,
)
const routeSpotIds = computed(
  () => new Set(selectedRoute.value?.spots.map((item) => item.spotId) || []),
)
const routeOrderMap = computed(() => {
  const map = new Map<string, number>()
  selectedRoute.value?.spots.forEach((item, index) => {
    map.set(item.spotId, index + 1)
  })
  return map
})
const localizedSpotDetail = computed(() =>
  getLocalizedBranch(spotDetailPayload.value, currentLang.value),
)
const selectedSpotDetail = computed<PilgrimageSpotDetail | null>(
  () => localizedSpotDetail.value?.spot || null,
)
const navigationUrl = computed(() =>
  selectedSpotDetail.value ? buildNavigationUrl(selectedSpotDetail.value) : '#',
)
const galleryName = computed(() => `pilgrimage-photos-${selectedSpotDetail.value?.id || 'empty'}`)

type LatLngTuple = [number, number]

function unwrapPayload<T>(response: any): T | null {
  if (!response || typeof response !== 'object') return null
  if ('code' in response && Number(response.code) !== 200) return null
  const payload = response.data ?? response
  return payload && typeof payload === 'object' ? (payload as T) : null
}

function fallbackSpotListPayload(districtId: string): PilgrimageSpotListResponse {
  return (
    spotListPayloadFromRegionTree(districtId) ||
    fallbackSpotLists[districtId] || { zh: { spots: [] }, jp: { spots: [] } }
  )
}

function applyDistrictSpotPayload(districtId: string, payload: PilgrimageSpotListResponse) {
  spotsPayload.value = payload
  spotsPayloadDistrictId.value = districtId
  spotPayloadCache.set(districtId, payload)
}

function findDistrictById(districtId: string, lang: PilgrimageLang = currentLang.value) {
  const treeCities = getLocalizedBranch(regionTree.value, lang)?.cities || []
  for (const city of treeCities) {
    const district = city.districts.find((item) => item.id === districtId)
    if (district) return district
  }
  return null
}

function spotListPayloadFromRegionTree(districtId: string): PilgrimageSpotListResponse | null {
  const zhSpots = findDistrictById(districtId, 'zh')?.spots || []
  const jpSpots = findDistrictById(districtId, 'jp')?.spots || []
  if (zhSpots.length === 0 && jpSpots.length === 0) return null
  return {
    zh: { spots: zhSpots },
    jp: { spots: jpSpots },
  }
}

function spotPayloadHasRouteData(payload: PilgrimageSpotListResponse) {
  return (['zh', 'jp'] as const).every((lang) =>
    Array.isArray(getLocalizedBranch(payload, lang)?.routes),
  )
}

function spotPayloadMatchesDistrict(districtId: string, payload?: PilgrimageSpotListResponse) {
  if (!payload) return false
  let hasDistrict = false
  for (const lang of ['zh', 'jp'] as const) {
    const district = findDistrictById(districtId, lang)
    const cachedSpots = getLocalizedBranch(payload, lang)?.spots || []
    if (!district) {
      if (cachedSpots.length > 0) return false
      continue
    }

    hasDistrict = true
    const expectedSpotIds = district?.spots?.map((spot) => spot.id).filter(Boolean) || []

    if (expectedSpotIds.length > 0) {
      const cachedSpotIds = new Set(cachedSpots.map((spot) => spot.id))
      if (
        cachedSpotIds.size !== expectedSpotIds.length ||
        !expectedSpotIds.every((spotId) => cachedSpotIds.has(spotId))
      ) {
        return false
      }
      continue
    }

    if (district && Number(district.spotCount) !== cachedSpots.length) return false
  }

  return hasDistrict
}

function isActiveDistrictLoad(districtId: string, token?: number) {
  return selectedDistrictId.value === districtId && (!token || token === districtLoadToken)
}

function currentPilgrimageState(): PilgrimageSsrPayload {
  const spotsByDistrictId = Object.fromEntries(spotPayloadCache)
  const spotDetailsBySpotId = {
    ...(appState.miletPilgrimageData?.spotDetailsBySpotId || {}),
  }

  if (spotsPayloadDistrictId.value && spotsPayload.value) {
    spotsByDistrictId[spotsPayloadDistrictId.value] = spotsPayload.value
    spotPayloadCache.set(spotsPayloadDistrictId.value, spotsPayload.value)
  }
  if (selectedSpotId.value && spotDetailPayload.value) {
    spotDetailsBySpotId[selectedSpotId.value] = spotDetailPayload.value
  }

  return {
    regionTree: regionTree.value,
    spotsByDistrictId,
    spotDetailsBySpotId,
    selectedCityId: selectedCityId.value,
    selectedDistrictId: selectedDistrictId.value,
    selectedSpotId: selectedSpotId.value,
    usingFallbackData: usingFallbackData.value,
  }
}

function syncPilgrimageState() {
  appState.miletPilgrimageData = currentPilgrimageState()
}

function applyInitialDistrictSelection() {
  const district = findInitialDistrict(regionTree.value, currentLang.value)
  if (district) {
    selectedCityId.value = district.cityId
    selectedDistrictId.value = district.id
    return district
  }

  selectedCityId.value = cities.value[0]?.id || ''
  selectedDistrictId.value = ''
  return null
}

async function loadRegionTree() {
  if (appState.miletPilgrimageData?.regionTree) {
    regionTree.value = appState.miletPilgrimageData.regionTree
    usingFallbackData.value = appState.miletPilgrimageData.usingFallbackData
    return
  }

  try {
    const response = await axiosInstance.get(apiRoutes.miletPilgrimageRegionTree)
    const payload = unwrapPayload<PilgrimageRegionTreeResponse>(response)
    if (payload?.zh?.cities?.length || payload?.jp?.cities?.length) {
      regionTree.value = payload
      usingFallbackData.value = false
      syncPilgrimageState()
      return
    }
  } catch (error) {
    console.warn('Failed to load pilgrimage region tree, using fallback data.', error)
  }

  regionTree.value = fallbackRegionTree
  usingFallbackData.value = true
  syncPilgrimageState()
}

async function loadDistrictSpots(
  districtId: string,
  options: { autoSelect?: boolean; transitionToken?: number } = {},
) {
  if (!districtId) return

  const autoSelect = options.autoSelect ?? true
  const transitionToken = options.transitionToken
  spotsLoading.value = true
  selectedSpotId.value = ''
  spotDetailPayload.value = null

  const cachedPayload = spotPayloadCache.get(districtId)
  if (spotPayloadMatchesDistrict(districtId, cachedPayload)) {
    applyDistrictSpotPayload(districtId, cachedPayload)
    usingFallbackData.value = appState.miletPilgrimageData?.usingFallbackData || false
    syncPilgrimageState()
    if (spotPayloadHasRouteData(cachedPayload)) {
      spotsLoading.value = false
      const firstSpot = spots.value[0]
      if (autoSelect && firstSpot && !isMobileViewport.value) {
        await selectSpot(firstSpot.id)
      }
      return
    }
  }

  const treePayload = spotListPayloadFromRegionTree(districtId)
  if (!spotPayloadMatchesDistrict(districtId, spotsPayload.value) && treePayload) {
    applyDistrictSpotPayload(districtId, treePayload)
    syncPilgrimageState()
  }

  if (!spotPayloadMatchesDistrict(districtId, spotsPayload.value)) {
    spotsPayload.value = null
    spotsPayloadDistrictId.value = ''
  }

  try {
    const response = await axiosInstance.get(
      `${apiRoutes.miletPilgrimageDistrictSpots}/${districtId}/spots`,
    )
    if (!isActiveDistrictLoad(districtId, transitionToken)) return
    const payload = unwrapPayload<PilgrimageSpotListResponse>(response)
    if (payload) {
      applyDistrictSpotPayload(districtId, payload)
      usingFallbackData.value = false
      syncPilgrimageState()
    } else {
      applyDistrictSpotPayload(districtId, fallbackSpotListPayload(districtId))
      usingFallbackData.value = true
      syncPilgrimageState()
    }
  } catch (error) {
    if (!isActiveDistrictLoad(districtId, transitionToken)) return
    console.warn('Failed to load pilgrimage spots, using fallback data.', error)
    applyDistrictSpotPayload(districtId, fallbackSpotListPayload(districtId))
    usingFallbackData.value = true
    syncPilgrimageState()
  } finally {
    if (isActiveDistrictLoad(districtId, transitionToken)) {
      spotsLoading.value = false
    }
  }

  if (!isActiveDistrictLoad(districtId, transitionToken)) return
  const firstSpot = spots.value[0]
  if (autoSelect && firstSpot && !isMobileViewport.value) {
    await selectSpot(firstSpot.id)
  }
}

async function loadSpotDetail(spotId: string) {
  if (!spotId) return

  const cachedPayload = appState.miletPilgrimageData?.spotDetailsBySpotId[spotId]
  if (cachedPayload) {
    spotDetailPayload.value = cachedPayload
    usingFallbackData.value = appState.miletPilgrimageData?.usingFallbackData || false
    syncPilgrimageState()
    return
  }

  try {
    const response = await axiosInstance.get(`${apiRoutes.miletPilgrimageSpot}/${spotId}`)
    const payload = unwrapPayload<PilgrimageSpotDetailResponse>(response)
    if (payload) {
      spotDetailPayload.value = payload
      usingFallbackData.value = false
      syncPilgrimageState()
      return
    }
  } catch (error) {
    console.warn('Failed to load pilgrimage spot detail, using fallback data.', error)
  }

  spotDetailPayload.value = fallbackSpotDetails[spotId] || {
    zh: { spot: null },
    jp: { spot: null },
  }
  usingFallbackData.value = true
  syncPilgrimageState()
}

async function loadInitialPilgrimageData() {
  suppressDistrictWatch = true
  try {
    await loadRegionTree()
    const district = applyInitialDistrictSelection()
    if (district) {
      await loadDistrictSpots(district.id, { autoSelect: false })
    }
    mapLoading.value = false
    syncPilgrimageState()
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
  selectedRouteId.value = routeId
  applyMapZoomLimits()
  renderMarkers()
  renderRoutes()
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

function escapeMapHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSpotMarkerTitle(spot: PilgrimageSpotSummary) {
  return selectedSpotDetail.value?.id === spot.id ? selectedSpotDetail.value.title : spot.title
}

function spotMarkerCollisionPoint(spot: PilgrimageSpotSummary) {
  const map = mapRef.value
  if (!map) return null
  return map.latLngToContainerPoint([spot.displayLat, spot.displayLng])
}

function shouldShowPhotoBubble(
  spot: PilgrimageSpotSummary,
  active: boolean,
  occupiedPoints: Array<{ x: number; y: number }>,
) {
  if (!spot.coverImageUrl || !mapRef.value) return false

  const zoom = mapRef.value.getZoom()
  const bubbleConfig = isMobileViewport.value
    ? pilgrimageMapConfig.photoBubble.mobile
    : pilgrimageMapConfig.photoBubble.desktop
  if (zoom < bubbleConfig.minZoom) return false

  const point = spotMarkerCollisionPoint(spot)
  if (!point) return false

  const crowded = occupiedPoints.some(
    (occupied) =>
      Math.abs(occupied.x - point.x) < bubbleConfig.collisionGap.x &&
      Math.abs(occupied.y - point.y) < bubbleConfig.collisionGap.y,
  )

  if (!crowded || active) {
    occupiedPoints.push({ x: point.x, y: point.y })
    return true
  }

  return false
}

function photoMarkerLayout(active: boolean) {
  const bubbleConfig = isMobileViewport.value
    ? pilgrimageMapConfig.photoBubble.mobile
    : pilgrimageMapConfig.photoBubble.desktop

  return {
    iconSize: bubbleConfig.iconSize,
    iconAnchor: active ? bubbleConfig.iconAnchor.active : bubbleConfig.iconAnchor.inactive,
  }
}

function renderMarkers() {
  const L = leafletRef.value
  const markerLayer = markerLayerRef.value
  if (!L || !markerLayer) return

  markerLayer.clearLayers()

  const occupiedPhotoPoints: Array<{ x: number; y: number }> = []
  const orderedSpots = spots.value.slice().sort((a, b) => {
    if (a.id === selectedSpotId.value) return -1
    if (b.id === selectedSpotId.value) return 1
    return (routeOrderMap.value.get(a.id) || 9999) - (routeOrderMap.value.get(b.id) || 9999)
  })

  orderedSpots.forEach((spot) => {
    const active = spot.id === selectedSpotId.value
    const inRoute = routeSpotIds.value.has(spot.id)
    const routeOrder = routeOrderMap.value.get(spot.id)
    const markerTitle = getSpotMarkerTitle(spot)
    const escapedTitle = escapeMapHtml(markerTitle)
    const showPhotoBubble = shouldShowPhotoBubble(spot, active, occupiedPhotoPoints)
    const coverImage = showPhotoBubble
      ? `<span class="pilgrimage-marker-card" aria-hidden="true"><img src="${escapeMapHtml(buildStaticAssetUrl(spot.coverImageUrl))}" alt="" loading="lazy" decoding="async" /></span>`
      : ''
    const layout = showPhotoBubble
      ? photoMarkerLayout(active)
      : {
          iconSize: pilgrimageMapConfig.defaultMarker.iconSize,
          iconAnchor: active
            ? pilgrimageMapConfig.defaultMarker.iconAnchor.active
            : pilgrimageMapConfig.defaultMarker.iconAnchor.inactive,
        }
    const marker = L.marker([spot.displayLat, spot.displayLng], {
      icon: L.divIcon({
        className: '',
        html: `<button class="pilgrimage-marker${active ? ' is-active' : ''}${inRoute ? ' is-route' : ''}${showPhotoBubble ? ' is-photo-visible' : ''}" type="button" aria-label="${escapedTitle}">${coverImage}<span class="pilgrimage-marker-pin"><i></i></span>${routeOrder ? `<b>${routeOrder}</b>` : ''}<em>${escapedTitle}</em></button>`,
        iconSize: layout.iconSize,
        iconAnchor: layout.iconAnchor,
      }),
    })

    marker.on('click', () => {
      selectSpot(spot.id)
    })
    if (active) {
      marker.setZIndexOffset(1000)
    } else if (showPhotoBubble) {
      marker.setZIndexOffset(500)
    }
    marker.addTo(markerLayer)
  })
}

function renderRoutes() {
  const L = leafletRef.value
  const routeLayer = routeLayerRef.value
  if (!L || !routeLayer) return

  routeLayer.clearLayers()
  const routeItem = selectedRoute.value
  if (!routeItem) return

  const spotMap = new Map(spots.value.map((spot) => [spot.id, spot]))
  const points = routeItem.spots
    .map((item) => spotMap.get(item.spotId))
    .filter(Boolean)
    .map((spot) => [spot!.displayLat, spot!.displayLng] as [number, number])

  if (points.length < 2) return
  L.polyline(points, {
    color: routeItem.color || '#2f8f83',
    weight: 5,
    opacity: 0.78,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(routeLayer)

  points.slice(0, -1).forEach((point, index) => {
    const nextPoint = points[index + 1]
    if (!nextPoint) return
    const midPoint: [number, number] = [
      (point[0] + nextPoint[0]) / 2,
      (point[1] + nextPoint[1]) / 2,
    ]
    const from = mapRef.value.latLngToLayerPoint(point)
    const to = mapRef.value.latLngToLayerPoint(nextPoint)
    const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
    L.marker(midPoint, {
      interactive: false,
      icon: L.divIcon({
        className: '',
        html: `<span class="pilgrimage-route-arrow" style="--route-color:${routeItem.color || '#2f8f83'}; transform: rotate(${angle}deg)">&#10148;</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(routeLayer)
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
  const coordinates = [
    ...(center ? [center] : []),
    ...currentSpotCoordinates(),
  ]
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
  mapTransitioning.value = true
  markersVisible.value = false
  clearMapBrowseBounds()

  if (districtId && selectedDistrict.value) {
    await loadDistrictSpots(districtId, { autoSelect: false, transitionToken: token })
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
        ? 'milet 聖地巡礼マップ | Echoes of milet'
        : 'milet 圣地巡礼地图 | Echoes of milet'
  },
  { immediate: true },
)

onServerPrefetch(loadInitialPilgrimageData)

onMounted(async () => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  if (!appState.miletPilgrimageData?.regionTree || !selectedDistrictId.value) {
    await loadInitialPilgrimageData()
  }
  await initMap()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportMode)
  cancelAnimationFrame(resizeFrame)
  fancyboxApi?.destroy()
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

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  background: #e9f2ef;
  font-family: inherit;
}

:deep(.leaflet-control-zoom) {
  margin-top: 186px;
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
  display: block;
  height: 72px;
  width: 160px;
  border: 0;
  background: transparent;
  padding: 0;
  place-items: center;
  cursor: pointer;
  transition:
    opacity 240ms ease,
    transform 160ms ease,
    filter 160ms ease;
}

:global(.pilgrimage-marker.is-photo-visible) {
  height: 176px;
  width: 168px;
}

.pilgrimage-map-shell :global(.pilgrimage-marker),
.pilgrimage-map-shell :global(.pilgrimage-route-arrow) {
  opacity: 0;
}

.pilgrimage-map-shell--markers-visible :global(.pilgrimage-marker),
.pilgrimage-map-shell--markers-visible :global(.pilgrimage-route-arrow) {
  opacity: 1;
}

:global(.pilgrimage-marker-card) {
  position: absolute;
  left: 50%;
  top: 0;
  width: 132px;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 38px -22px rgba(31, 41, 55, 0.78);
  padding: 4px;
  pointer-events: none;
}

:global(.pilgrimage-marker-card::after) {
  position: absolute;
  left: 50%;
  bottom: -7px;
  height: 14px;
  width: 14px;
  transform: translateX(-50%) rotate(45deg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.92);
  border-right: 1px solid rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.92);
  content: '';
}

:global(.pilgrimage-marker-card img) {
  position: relative;
  z-index: 1;
  display: block;
  height: 88px;
  width: 100%;
  border-radius: 7px;
  object-fit: cover;
}

:global(.pilgrimage-marker-pin) {
  position: absolute;
  left: 50%;
  top: 0;
  display: grid;
  height: 34px;
  width: 34px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 999px 999px 999px 6px;
  background: #fff;
  box-shadow: 0 16px 32px -18px rgba(31, 41, 55, 0.75);
  transform: translateX(-50%) rotate(-45deg);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;
}

:global(.pilgrimage-marker.is-photo-visible .pilgrimage-marker-pin) {
  top: 102px;
}

:global(.pilgrimage-marker-pin i) {
  height: 13px;
  width: 13px;
  border-radius: 999px;
  background: #6fb8ad;
  transform: rotate(45deg);
}

:global(.pilgrimage-marker b) {
  position: absolute;
  left: calc(50% + 9px);
  top: -7px;
  display: grid;
  height: 20px;
  min-width: 20px;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #c98791;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 10px 20px -14px rgba(31, 41, 55, 0.9);
}

:global(.pilgrimage-marker em) {
  position: absolute;
  left: 50%;
  top: 41px;
  max-width: 138px;
  transform: translateX(-50%);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 30px -24px rgba(31, 41, 55, 0.82);
  color: #33474f;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  padding: 3px 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.pilgrimage-marker.is-photo-visible em) {
  top: 143px;
}

:global(.pilgrimage-marker.is-active .pilgrimage-marker-pin) {
  height: 42px;
  width: 42px;
  background: #fff1f2;
  box-shadow: 0 20px 40px -18px rgba(143, 63, 75, 0.72);
}

:global(.pilgrimage-marker.is-active .pilgrimage-marker-pin i) {
  height: 16px;
  width: 16px;
  background: #c98791;
}

:global(.pilgrimage-marker.is-active em) {
  top: 48px;
  border-color: rgba(255, 241, 242, 0.94);
  background: rgba(255, 241, 242, 0.94);
  color: #8f3f4b;
}

:global(.pilgrimage-marker.is-photo-visible.is-active em) {
  top: 150px;
}

:global(.pilgrimage-marker.is-route .pilgrimage-marker-pin i) {
  background: #2f8f83;
}

:global(.pilgrimage-route-arrow) {
  display: grid;
  height: 28px;
  width: 28px;
  place-items: center;
  color: var(--route-color, #2f8f83);
  font-size: 21px;
  line-height: 1;
  text-shadow:
    0 1px 0 #fff,
    0 -1px 0 #fff,
    1px 0 0 #fff,
    -1px 0 0 #fff,
    0 10px 22px rgba(31, 41, 55, 0.28);
}

@media (max-width: 1023px) {
  .pilgrimage-page {
    min-height: auto;
  }

  :deep(.leaflet-control-zoom) {
    margin-top: 96px;
  }

  :global(.pilgrimage-marker.is-photo-visible) {
    height: 156px;
    width: 136px;
  }

  :global(.pilgrimage-marker-card) {
    width: 112px;
  }

  :global(.pilgrimage-marker-card img) {
    height: 72px;
  }

  :global(.pilgrimage-marker.is-photo-visible .pilgrimage-marker-pin) {
    top: 91px;
  }

  :global(.pilgrimage-marker.is-photo-visible em) {
    top: 132px;
    max-width: 118px;
  }

  :global(.pilgrimage-marker.is-photo-visible.is-active em) {
    top: 138px;
  }
}
</style>
