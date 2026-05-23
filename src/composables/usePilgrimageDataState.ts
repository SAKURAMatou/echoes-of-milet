import { computed, ref, type ComputedRef, type Ref } from 'vue'

import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'
import {
  buildNavigationUrl,
  fallbackRegionTree,
  fallbackSpotDetails,
  fallbackSpotLists,
  findInitialDistrict,
  getLocalizedBranch,
  type PilgrimageCity,
  type PilgrimageDistrict,
  type PilgrimageLang,
  type PilgrimageMarkerSkin,
  type PilgrimageRegionTreeResponse,
  type PilgrimageRoute,
  type PilgrimageSpotDetail,
  type PilgrimageSpotDetailResponse,
  type PilgrimageSpotListResponse,
  type PilgrimageSpotSummary,
  type PilgrimageSsrPayload,
} from '@/composables/miletPilgrimage'
import { useAppState } from '@/composables/useAppState'

interface LoadDistrictSpotsOptions {
  autoSelect?: boolean
  isActive?: () => boolean
}

interface UsePilgrimageDataStateOptions {
  currentLang: ComputedRef<PilgrimageLang>
  isMobileViewport: Ref<boolean>
  autoSelectSpot?: (spotId: string) => void | Promise<void>
}

function unwrapPayload<T>(response: any): T | null {
  if (!response || typeof response !== 'object') return null
  if ('code' in response && Number(response.code) !== 200) return null
  const payload = response.data ?? response
  return payload && typeof payload === 'object' ? (payload as T) : null
}

export function usePilgrimageDataState(options: UsePilgrimageDataStateOptions) {
  const appState = useAppState()
  const initialPilgrimageData = appState.miletPilgrimageData

  const regionTree = ref<PilgrimageRegionTreeResponse>(
    initialPilgrimageData?.regionTree || fallbackRegionTree,
  )
  const markerSkins = ref<PilgrimageMarkerSkin[]>(
    initialPilgrimageData?.markerSkins || initialPilgrimageData?.regionTree?.markerSkins || [],
  )
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

  const localizedTree = computed(() => getLocalizedBranch(regionTree.value, options.currentLang.value))
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
              : fallbackSpotLists[district.id]?.[options.currentLang.value].spots || [],
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
  const localizedSpots = computed(() => getLocalizedBranch(spotsPayload.value, options.currentLang.value))
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
    getLocalizedBranch(spotDetailPayload.value, options.currentLang.value),
  )
  const selectedSpotDetail = computed<PilgrimageSpotDetail | null>(
    () => localizedSpotDetail.value?.spot || null,
  )
  const navigationUrl = computed(() =>
    selectedSpotDetail.value ? buildNavigationUrl(selectedSpotDetail.value) : '#',
  )
  const galleryName = computed(() => `pilgrimage-photos-${selectedSpotDetail.value?.id || 'empty'}`)

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

  function findDistrictById(districtId: string, lang: PilgrimageLang = options.currentLang.value) {
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
      markerSkins: markerSkins.value,
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
    const district = findInitialDistrict(regionTree.value, options.currentLang.value)
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
      markerSkins.value =
        appState.miletPilgrimageData.markerSkins ||
        appState.miletPilgrimageData.regionTree.markerSkins ||
        []
      usingFallbackData.value = appState.miletPilgrimageData.usingFallbackData
      return
    }

    try {
      const response = await axiosInstance.get(apiRoutes.miletPilgrimageRegionTree)
      const payload = unwrapPayload<PilgrimageRegionTreeResponse>(response)
      if (payload?.zh?.cities?.length || payload?.jp?.cities?.length) {
        regionTree.value = payload
        markerSkins.value = payload.markerSkins || []
        usingFallbackData.value = false
        syncPilgrimageState()
        return
      }
    } catch (error) {
      console.warn('Failed to load pilgrimage region tree, using fallback data.', error)
    }

    regionTree.value = fallbackRegionTree
    markerSkins.value = []
    usingFallbackData.value = true
    syncPilgrimageState()
  }

  async function loadDistrictSpots(
    districtId: string,
    loadOptions: LoadDistrictSpotsOptions = {},
  ) {
    if (!districtId) return

    const autoSelect = loadOptions.autoSelect ?? true
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
        if (autoSelect && firstSpot && !options.isMobileViewport.value) {
          await options.autoSelectSpot?.(firstSpot.id)
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
      if (loadOptions.isActive && !loadOptions.isActive()) return
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
      if (loadOptions.isActive && !loadOptions.isActive()) return
      console.warn('Failed to load pilgrimage spots, using fallback data.', error)
      applyDistrictSpotPayload(districtId, fallbackSpotListPayload(districtId))
      usingFallbackData.value = true
      syncPilgrimageState()
    } finally {
      if (!loadOptions.isActive || loadOptions.isActive()) {
        spotsLoading.value = false
      }
    }

    if (loadOptions.isActive && !loadOptions.isActive()) return
    const firstSpot = spots.value[0]
    if (autoSelect && firstSpot && !options.isMobileViewport.value) {
      await options.autoSelectSpot?.(firstSpot.id)
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
    await loadRegionTree()
    const district = applyInitialDistrictSelection()
    if (district) {
      await loadDistrictSpots(district.id, { autoSelect: false })
    }
    mapLoading.value = false
    syncPilgrimageState()
  }

  return {
    regionTree,
    markerSkins,
    spotsPayload,
    spotsPayloadDistrictId,
    spotDetailPayload,
    selectedCityId,
    selectedDistrictId,
    selectedSpotId,
    selectedRouteId,
    usingFallbackData,
    mapLoading,
    spotsLoading,
    localizedTree,
    cities,
    seoSpotListCities,
    selectedCity,
    selectedDistrict,
    localizedSpots,
    spots,
    routes,
    selectedRoute,
    routeSpotIds,
    routeOrderMap,
    localizedSpotDetail,
    selectedSpotDetail,
    navigationUrl,
    galleryName,
    findDistrictById,
    loadDistrictSpots,
    loadSpotDetail,
    loadInitialPilgrimageData,
    syncPilgrimageState,
  }
}
