import type { ComputedRef, Ref, ShallowRef } from 'vue'

import { pilgrimageMapConfig } from '@/components/milet/pilgrimage/pilgrimageMapConfig'
import { buildStaticAssetUrl } from '@/config/api'
import type {
  PilgrimageRoute,
  PilgrimageSpotDetail,
  PilgrimageSpotSummary,
} from '@/composables/miletPilgrimage'

type LeafletModule = typeof import('leaflet')
type Point = { x: number; y: number }

interface UsePilgrimageMapRenderingOptions {
  leafletRef: ShallowRef<LeafletModule | null>
  mapRef: ShallowRef<any>
  markerLayerRef: ShallowRef<any>
  routeLayerRef: ShallowRef<any>
  spots: ComputedRef<PilgrimageSpotSummary[]>
  selectedSpotId: Ref<string>
  selectedSpotDetail: ComputedRef<PilgrimageSpotDetail | null>
  selectedRoute: ComputedRef<PilgrimageRoute | null>
  routeSpotIds: ComputedRef<Set<string>>
  routeOrderMap: ComputedRef<Map<string, number>>
  isMobileViewport: Ref<boolean>
  selectSpot: (spotId: string) => void | Promise<void>
}

function escapeMapHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stableHash(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function spotMarkerStyle(spot: PilgrimageSpotSummary) {
  const palette = pilgrimageMapConfig.markerPalette
  const color = palette[stableHash(spot.id || spot.title) % palette.length] || palette[0]
  return [
    `--spot-color:${color.color}`,
    `--spot-soft:${color.soft}`,
    `--spot-hover-soft:${color.hoverSoft}`,
    `--spot-label-text:${color.labelText}`,
  ].join(';')
}

export function usePilgrimageMapRendering(options: UsePilgrimageMapRenderingOptions) {
  function getSpotMarkerTitle(spot: PilgrimageSpotSummary) {
    return options.selectedSpotDetail.value?.id === spot.id
      ? options.selectedSpotDetail.value.title
      : spot.title
  }

  function spotMarkerCollisionPoint(spot: PilgrimageSpotSummary) {
    const map = options.mapRef.value
    if (!map) return null
    return map.latLngToContainerPoint([spot.displayLat, spot.displayLng])
  }

  function shouldShowPhotoBubble(
    spot: PilgrimageSpotSummary,
    active: boolean,
    occupiedPoints: Point[],
  ) {
    if (!spot.coverImageUrl || !options.mapRef.value) return false

    const zoom = options.mapRef.value.getZoom()
    const bubbleConfig = options.isMobileViewport.value
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

  function spotMarkerDisplayMode(
    spot: PilgrimageSpotSummary,
    active: boolean,
    inRoute: boolean,
    occupiedPoints: Point[],
  ) {
    const map = options.mapRef.value
    if (!map) return 'full'

    const point = spotMarkerCollisionPoint(spot)
    if (!point) return 'full'

    if (active || inRoute) {
      occupiedPoints.push({ x: point.x, y: point.y })
      return 'full'
    }

    if (options.selectedRoute.value) return 'dot'

    const declutterConfig = options.isMobileViewport.value
      ? pilgrimageMapConfig.markerDeclutter.mobile
      : pilgrimageMapConfig.markerDeclutter.desktop

    if (map.getZoom() >= declutterConfig.showAllMinZoom) return 'full'

    const crowded = occupiedPoints.some(
      (occupied) =>
        Math.abs(occupied.x - point.x) < declutterConfig.collisionGap.x &&
        Math.abs(occupied.y - point.y) < declutterConfig.collisionGap.y,
    )

    if (!crowded) {
      occupiedPoints.push({ x: point.x, y: point.y })
      return 'full'
    }

    return 'dot'
  }

  function photoMarkerLayout(active: boolean) {
    const bubbleConfig = options.isMobileViewport.value
      ? pilgrimageMapConfig.photoBubble.mobile
      : pilgrimageMapConfig.photoBubble.desktop

    return {
      iconSize: bubbleConfig.iconSize,
      iconAnchor: active ? bubbleConfig.iconAnchor.active : bubbleConfig.iconAnchor.inactive,
    }
  }

  function renderMarkers() {
    const L = options.leafletRef.value
    const markerLayer = options.markerLayerRef.value
    if (!L || !markerLayer) return

    markerLayer.clearLayers()

    const occupiedMarkerPoints: Point[] = []
    const occupiedPhotoPoints: Point[] = []
    const orderedSpots = options.spots.value.slice().sort((a, b) => {
      if (a.id === options.selectedSpotId.value) return -1
      if (b.id === options.selectedSpotId.value) return 1
      return (
        (options.routeOrderMap.value.get(a.id) || 9999) -
        (options.routeOrderMap.value.get(b.id) || 9999)
      )
    })

    orderedSpots.forEach((spot) => {
      const active = spot.id === options.selectedSpotId.value
      const inRoute = options.routeSpotIds.value.has(spot.id)
      const routeOrder = options.routeOrderMap.value.get(spot.id)
      const displayMode = spotMarkerDisplayMode(spot, active, inRoute, occupiedMarkerPoints)

      const markerTitle = getSpotMarkerTitle(spot)
      const escapedTitle = escapeMapHtml(markerTitle)
      const markerStyle = spotMarkerStyle(spot)
      const compact = displayMode === 'dot'
      const showPhotoBubble =
        !compact && shouldShowPhotoBubble(spot, active, occupiedPhotoPoints)
      const coverImage = showPhotoBubble
        ? `<span class="pilgrimage-marker-card" aria-hidden="true"><img src="${escapeMapHtml(buildStaticAssetUrl(spot.coverImageUrl))}" alt="" loading="lazy" decoding="async" /></span>`
        : ''
      const layout = compact
        ? {
            iconSize: pilgrimageMapConfig.compactMarker.iconSize,
            iconAnchor: pilgrimageMapConfig.compactMarker.iconAnchor,
          }
        : showPhotoBubble
          ? photoMarkerLayout(active)
          : {
              iconSize: pilgrimageMapConfig.defaultMarker.iconSize,
              iconAnchor: active
                ? pilgrimageMapConfig.defaultMarker.iconAnchor.active
                : pilgrimageMapConfig.defaultMarker.iconAnchor.inactive,
            }
      const markerHtml = compact
        ? `<button class="pilgrimage-marker is-compact" style="${markerStyle}" type="button" aria-label="${escapedTitle}"><span class="pilgrimage-marker-dot" aria-hidden="true"></span></button>`
        : `<button class="pilgrimage-marker${active ? ' is-active' : ''}${inRoute ? ' is-route' : ''}${showPhotoBubble ? ' is-photo-visible' : ''}" style="${markerStyle}" type="button" aria-label="${escapedTitle}">${coverImage}<span class="pilgrimage-marker-pin"><i></i></span>${routeOrder ? `<b>${routeOrder}</b>` : ''}<em>${escapedTitle}</em></button>`
      const marker = L.marker([spot.displayLat, spot.displayLng], {
        icon: L.divIcon({
          className: '',
          html: markerHtml,
          iconSize: layout.iconSize,
          iconAnchor: layout.iconAnchor,
        }),
      })

      marker.on('click', () => {
        void options.selectSpot(spot.id)
      })
      if (active) {
        marker.setZIndexOffset(1000)
      } else if (showPhotoBubble) {
        marker.setZIndexOffset(500)
      } else if (compact) {
        marker.setZIndexOffset(-100)
      }
      marker.addTo(markerLayer)
    })
  }

  function renderRoutes() {
    const L = options.leafletRef.value
    const routeLayer = options.routeLayerRef.value
    const map = options.mapRef.value
    if (!L || !routeLayer || !map) return

    routeLayer.clearLayers()
    const routeItem = options.selectedRoute.value
    if (!routeItem) return

    const spotMap = new Map(options.spots.value.map((spot) => [spot.id, spot]))
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
      const from = map.latLngToLayerPoint(point)
      const to = map.latLngToLayerPoint(nextPoint)
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

  return {
    renderMarkers,
    renderRoutes,
  }
}
