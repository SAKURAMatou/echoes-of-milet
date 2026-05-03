<template>
  <article class="pilgrimage-page overflow-hidden rounded-lg text-[#24323a] lg:mb-6">
    <section
      class="pilgrimage-workspace relative h-[calc(100dvh-4rem)] min-h-[620px] overflow-hidden lg:grid lg:h-[calc(100vh-7.5rem)] lg:min-h-[760px] lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-visible xl:grid-cols-[minmax(0,1fr)_400px]"
    >
      <div
        class="relative h-full min-w-0 border-b border-white/70 lg:grid lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:border-b-0 lg:border-r"
      >
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

            <div
              class="shrink-0 rounded-lg border border-white/70 bg-white/64 px-4 py-3 text-sm text-[#526670]"
            >
              <span
                class="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c9197]"
              >
                {{ pageText.currentArea }}
              </span>
              <span class="mt-1 block max-w-[190px] truncate font-medium text-[#26313a]">
                {{ selectedCity?.name || pageText.allCities }}
                <span v-if="selectedDistrict">/ {{ selectedDistrict.name }}</span>
              </span>
            </div>
          </div>
        </header>

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
        :page-text="pageText"
        :selected-spot-detail="selectedSpotDetail"
        :navigation-url="navigationUrl"
        :gallery-name="galleryName"
        :spots-loading="spotsLoading"
        @close="closeSpotDetail"
      />
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
import PilgrimageAreaControls from '@/components/milet/pilgrimage/PilgrimageAreaControls.vue'
import PilgrimageMapPane from '@/components/milet/pilgrimage/PilgrimageMapPane.vue'
import PilgrimageSpotDetailPanel from '@/components/milet/pilgrimage/PilgrimageSpotDetailPanel.vue'
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
  type PilgrimageRoute,
  type PilgrimageSpotDetail,
  type PilgrimageSpotDetailResponse,
  type PilgrimageSpotListResponse,
  type PilgrimageSpotSummary,
} from '@/composables/miletPilgrimage'
import { apiRoutes } from '@/config/api'

type LeafletModule = typeof import('leaflet')
type PilgrimageMapPaneExpose = {
  mapContainer: HTMLElement | { value: HTMLElement | null } | null
}

const MAP_BOUNDS_PADDING_RATIO = 1

const route = useRoute()
const useLocalPreviewData =
  import.meta.env.DEV && import.meta.env.VITE_USE_PILGRIMAGE_API !== 'true'
const mapPaneRef = ref<PilgrimageMapPaneExpose | null>(null)
const mapRef = shallowRef<any>(null)
const markerLayerRef = shallowRef<any>(null)
const routeLayerRef = shallowRef<any>(null)
const leafletRef = shallowRef<LeafletModule | null>(null)

const regionTree = ref<PilgrimageRegionTreeResponse>(fallbackRegionTree)
const spotsPayload = ref<PilgrimageSpotListResponse | null>(null)
const spotDetailPayload = ref<PilgrimageSpotDetailResponse | null>(null)
const selectedCityId = ref('')
const selectedDistrictId = ref('')
const selectedSpotId = ref('')
const selectedRouteId = ref('')
const usingFallbackData = ref(false)
const mapLoading = ref(true)
const spotsLoading = ref(false)
const mapTransitioning = ref(false)
const markersVisible = ref(false)
const isMobileViewport = ref(false)
let districtLoadToken = 0

const currentLang = computed(() => normalizePilgrimageLang(String(route.params.lang || 'zh')))
const pageText = computed(() => PILGRIMAGE_TEXT[currentLang.value])
const localizedTree = computed(() => getLocalizedBranch(regionTree.value, currentLang.value))
const cities = computed(() => localizedTree.value?.cities || [])
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

async function loadDistrictSpots(districtId: string, options: { autoSelect?: boolean } = {}) {
  if (!districtId) return

  const autoSelect = options.autoSelect ?? true
  spotsLoading.value = true
  selectedSpotId.value = ''
  spotDetailPayload.value = null

  if (useLocalPreviewData) {
    spotsPayload.value = fallbackSpotLists[districtId] || { zh: { spots: [] }, jp: { spots: [] } }
    usingFallbackData.value = true
    spotsLoading.value = false
    const firstSpot = spots.value[0]
    if (autoSelect && firstSpot && !isMobileViewport.value) {
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
  if (autoSelect && firstSpot && !isMobileViewport.value) {
    await selectSpot(firstSpot.id)
  }
}

async function loadSpotDetail(spotId: string) {
  if (!spotId) return

  if (useLocalPreviewData) {
    spotDetailPayload.value = fallbackSpotDetails[spotId] || {
      zh: { spot: null },
      jp: { spot: null },
    }
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

  spotDetailPayload.value = fallbackSpotDetails[spotId] || {
    zh: { spot: null },
    jp: { spot: null },
  }
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
  selectedRouteId.value = ''
}

async function selectSpot(spotId: string) {
  selectedSpotId.value = spotId
  applyMapZoomLimits()
  await loadSpotDetail(spotId)
}

async function selectRoute(routeId: string) {
  selectedRouteId.value = routeId
  applyMapZoomLimits()
  markersVisible.value = false
  renderMarkers()
  renderRoutes()
  await moveMapToDistrict({ duration: 0.45 })
  requestAnimationFrame(() => {
    markersVisible.value = true
  })
}

function closeSpotDetail() {
  selectedSpotId.value = ''
  spotDetailPayload.value = null
  applyMapZoomLimits()
  renderMarkers()
}

function updateViewportMode() {
  if (typeof window === 'undefined') return
  isMobileViewport.value = window.matchMedia('(max-width: 1023px)').matches
  requestAnimationFrame(() => {
    mapRef.value?.invalidateSize()
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
    renderRoutes()
  })
  applyMapZoomLimits()
  mapLoading.value = false
  renderMarkers()
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

function renderMarkers() {
  const L = leafletRef.value
  const markerLayer = markerLayerRef.value
  if (!L || !markerLayer) return

  markerLayer.clearLayers()

  spots.value.forEach((spot) => {
    const active = spot.id === selectedSpotId.value
    const inRoute = routeSpotIds.value.has(spot.id)
    const routeOrder = routeOrderMap.value.get(spot.id)
    const markerTitle = getSpotMarkerTitle(spot)
    const escapedTitle = escapeMapHtml(markerTitle)
    const marker = L.marker([spot.displayLat, spot.displayLng], {
      icon: L.divIcon({
        className: '',
        html: `<button class="pilgrimage-marker${active ? ' is-active' : ''}${inRoute ? ' is-route' : ''}" type="button" aria-label="${escapedTitle}"><span class="pilgrimage-marker-pin"><i></i></span>${routeOrder ? `<b>${routeOrder}</b>` : ''}<em>${escapedTitle}</em></button>`,
        iconSize: [160, 72],
        iconAnchor: active ? [80, 43] : [80, 35],
      }),
    })

    marker.on('click', () => {
      selectSpot(spot.id)
    })
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

function districtDefaultZoom() {
  return clampMapZoom(selectedDistrict.value?.defaultZoom || 14, 19)
}

function clearMapBrowseBounds() {
  mapRef.value?.setMaxBounds(null)
}

function buildMapBrowseBounds() {
  const L = leafletRef.value
  const district = selectedDistrict.value
  if (!L || !district) return null

  const coordinates =
    spots.value.length > 0
      ? spots.value.map((spot) => [spot.displayLat, spot.displayLng] as [number, number])
      : ([[district.centerLat, district.centerLng]] as [number, number][])

  let minLat = Math.min(...coordinates.map((point) => point[0]))
  let maxLat = Math.max(...coordinates.map((point) => point[0]))
  let minLng = Math.min(...coordinates.map((point) => point[1]))
  let maxLng = Math.max(...coordinates.map((point) => point[1]))

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

function applyMapBrowseBounds(options: { panInside?: boolean } = {}) {
  const map = mapRef.value
  const bounds = buildMapBrowseBounds()
  if (!map || !bounds) return

  map.setMaxBounds(bounds)
  if (options.panInside) {
    map.panInsideBounds(bounds, { animate: false })
  }
}

function moveMapToDistrict(options: { duration?: number } = {}) {
  if (!mapRef.value || !selectedDistrict.value) return Promise.resolve()
  applyMapZoomLimits()
  return new Promise<void>((resolve) => {
    let resolved = false
    const finish = () => {
      if (resolved) return
      resolved = true
      mapRef.value?.off('moveend', finish)
      resolve()
    }
    mapRef.value.once('moveend', finish)
    window.setTimeout(finish, 920)
    const bounds = buildMapBrowseBounds()
    const districtCenter = leafletRef.value?.latLng(
      selectedDistrict.value.centerLat,
      selectedDistrict.value.centerLng,
    )
    const targetCenter =
      bounds && districtCenter && !bounds.contains(districtCenter)
        ? bounds.getCenter()
        : [selectedDistrict.value.centerLat, selectedDistrict.value.centerLng]
    mapRef.value.flyTo(targetCenter, districtDefaultZoom(), { duration: options.duration ?? 0.7 })
  })
}

function moveMapToSpot() {
  if (!mapRef.value || !selectedSpotDetail.value) return
  applyMapZoomLimits()
  mapRef.value.flyTo(
    [selectedSpotDetail.value.displayLat, selectedSpotDetail.value.displayLng],
    clampMapZoom(Math.max(selectedDistrict.value?.defaultZoom || 14, 15), 20),
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
    const token = ++districtLoadToken
    mapTransitioning.value = true
    markersVisible.value = false
    clearMapBrowseBounds()
    await loadDistrictSpots(districtId, { autoSelect: false })
    if (token !== districtLoadToken) return
    applyMapZoomLimits()
    await moveMapToDistrict()
    if (token !== districtLoadToken) return
    applyMapBrowseBounds({ panInside: true })
    renderMarkers()
    renderRoutes()
    requestAnimationFrame(() => {
      if (token !== districtLoadToken) return
      markersVisible.value = true
      mapTransitioning.value = false
    })
  },
)

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
    renderMarkers()
    moveMapToSpot()
    setupFancybox()
  },
)

watch(
  () => currentLang.value,
  () => {
    document.title =
      currentLang.value === 'jp' ? 'Echoes of milet | 聖地巡礼' : 'Echoes of milet | 圣地巡礼'
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

.pilgrimage-map-shell :global(.pilgrimage-marker),
.pilgrimage-map-shell :global(.pilgrimage-route-arrow) {
  opacity: 0;
}

.pilgrimage-map-shell--markers-visible :global(.pilgrimage-marker),
.pilgrimage-map-shell--markers-visible :global(.pilgrimage-route-arrow) {
  opacity: 1;
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
}
</style>
