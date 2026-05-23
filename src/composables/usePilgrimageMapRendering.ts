import type { ComputedRef, Ref, ShallowRef } from 'vue'

import { pilgrimageMapConfig } from '@/components/milet/pilgrimage/pilgrimageMapConfig'
import { buildStaticAssetUrl } from '@/config/api'
import type {
  PilgrimageMarkerSkin,
  PilgrimageRoute,
  PilgrimageSpotDetail,
  PilgrimageSpotSummary,
} from '@/composables/miletPilgrimage'

type LeafletModule = typeof import('leaflet')
type Point = { x: number; y: number }
type LatLngTuple = [number, number]
type SpotMarkerDisplayMode = 'full' | 'dot' | 'hidden'
type MarkerSkin = PilgrimageMarkerSkin & {
  fallbackImageUrl?: string
}
type MarkerIconLayout = {
  iconSize: [number, number]
  iconAnchor: [number, number]
  labelTop: number
  labelLeft: number
  labelWidth: number
  labelHeight: number
  markerTop: number
  markerLeft: number
  markerPointerX: number
  photoWidth: number
  photoHeight: number
}

interface UsePilgrimageMapRenderingOptions {
  leafletRef: ShallowRef<LeafletModule | null>
  mapRef: ShallowRef<any>
  markerLayerRef: ShallowRef<any>
  routeLayerRef: ShallowRef<any>
  animationLayerRef: ShallowRef<any>
  spots: ComputedRef<PilgrimageSpotSummary[]>
  markerSkins: Ref<PilgrimageMarkerSkin[]>
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

function normalizeMarkerDisplayMode(value: string): SpotMarkerDisplayMode {
  return value === 'hidden' ? 'hidden' : 'dot'
}

function spotMarkerStyle(spot: PilgrimageSpotSummary) {
  const palette = pilgrimageMapConfig.markerPalette
  const color = palette[stableHash(spot.id || spot.title) % palette.length] || palette[0]
  return [
    `--spot-color:${color.color}`,
    `--spot-soft:${color.soft}`,
    `--spot-hover-soft:${color.hoverSoft}`,
    `--spot-label-text:${color.labelText}`,
    `--spot-label-border:${color.labelBorder}`,
  ].join(';')
}

function markerTitleMetrics(title: string, layout: MarkerIconLayout) {
  const length = Math.max(1, Array.from(title).length)
  const maxLines = 2
  const charsPerLine = Math.max(3, Math.floor(layout.labelWidth / 7.2))
  const overflowRatio = length / Math.max(1, charsPerLine * maxLines)
  const fontSize = Math.max(9, Math.min(12, 11.5 / Math.max(1, overflowRatio * 0.9)))
  return { fontSize, lineHeight: 1.08, maxLines }
}

function personalizedMarkerStyle(
  spot: PilgrimageSpotSummary,
  skin: MarkerSkin,
  title: string,
  layout: MarkerIconLayout,
) {
  const metrics = markerTitleMetrics(title, layout)
  return [
    spotMarkerStyle(spot),
    `--marker-icon-width:${layout.iconSize[0]}px`,
    `--marker-icon-height:${layout.iconSize[1]}px`,
    `--marker-width:${skin.size[0]}px`,
    `--marker-height:${skin.size[1]}px`,
    `--marker-top:${layout.markerTop}px`,
    `--marker-left:${layout.markerLeft}px`,
    `--marker-pointer-x:${layout.markerPointerX}px`,
    `--marker-label-top:${layout.labelTop}px`,
    `--marker-label-left:${layout.labelLeft}px`,
    `--marker-label-width:${layout.labelWidth}px`,
    `--marker-label-height:${layout.labelHeight}px`,
    `--marker-photo-width:${layout.photoWidth}px`,
    `--marker-photo-height:${layout.photoHeight}px`,
    `--marker-label-lines:${metrics.maxLines}`,
    `--marker-label-font-size:${metrics.fontSize.toFixed(2)}px`,
    `--marker-label-line-height:${metrics.lineHeight}`,
  ].join(';')
}

function personalizedMarkerLayout(
  skin: MarkerSkin,
  showPhotoBubble: boolean,
  mobile: boolean,
): MarkerIconLayout {
  const labelWidth = mobile ? 104 : 118
  const labelHeight = mobile ? 28 : 30
  const labelGap = mobile ? 3 : 4

  if (!showPhotoBubble) {
    const iconWidth = Math.max(skin.size[0], labelWidth)
    const markerTop = labelHeight + labelGap
    const markerLeft = Math.round((iconWidth - skin.size[0]) / 2)
    const labelLeft = Math.round((iconWidth - labelWidth) / 2)
    return {
      iconSize: [iconWidth, markerTop + skin.size[1]] as [number, number],
      iconAnchor: [markerLeft + skin.anchor[0], markerTop + skin.anchor[1]] as [
        number,
        number,
      ],
      labelTop: 0,
      labelLeft,
      labelWidth,
      labelHeight,
      markerTop,
      markerLeft,
      markerPointerX: markerLeft + skin.anchor[0],
      photoWidth: 0,
      photoHeight: 0,
    }
  }

  const bubbleConfig = mobile
    ? pilgrimageMapConfig.photoBubble.mobile
    : pilgrimageMapConfig.photoBubble.desktop
  const bubbleGap = mobile ? 8 : 9
  const iconWidth = Math.max(bubbleConfig.bubbleSize[0], labelWidth, skin.size[0])
  const labelTop = bubbleConfig.bubbleSize[1] + bubbleGap
  const markerTop = labelTop + labelHeight + labelGap
  const markerLeft = Math.round((iconWidth - skin.size[0]) / 2)
  const labelLeft = Math.round((iconWidth - labelWidth) / 2)

  return {
    iconSize: [iconWidth, markerTop + skin.size[1]] as [number, number],
    iconAnchor: [markerLeft + skin.anchor[0], markerTop + skin.anchor[1]] as [
      number,
      number,
    ],
    labelTop,
    labelLeft,
    labelWidth,
    labelHeight,
    markerTop,
    markerLeft,
    markerPointerX: markerLeft + skin.anchor[0],
    photoWidth: bubbleConfig.bubbleSize[0],
    photoHeight: bubbleConfig.bubbleSize[1],
  }
}

function buildPersonalizedMarkerHtml(options: {
  active: boolean
  inRoute: boolean
  routeOrder?: number
  routeSpotCount: number
  escapedTitle: string
  markerStyle: string
  skin: MarkerSkin
  routeCurrent: boolean
  routePassed: boolean
  coverImageUrl?: string
}) {
  const isStart = options.routeOrder === 1
  const isEnd =
    Boolean(options.routeOrder) &&
    options.routeSpotCount > 0 &&
    options.routeOrder === options.routeSpotCount
  const routeOrder = options.routeOrder
    ? `<b class="pilgrimage-route-order">${options.routeOrder}</b>`
    : ''
  const terminalLabel = isStart
    ? '<span class="pilgrimage-route-terminal is-start">START</span>'
    : isEnd
      ? '<span class="pilgrimage-route-terminal is-end">END</span>'
      : ''
  const classes = [
    'pilgrimage-marker',
    'pilgrimage-marker--personalized',
    options.active ? 'is-active' : '',
    options.inRoute ? 'is-route' : '',
    isStart ? 'is-route-start' : '',
    isEnd ? 'is-route-end' : '',
    options.routeCurrent ? 'is-route-current' : '',
    options.routePassed ? 'is-route-passed' : '',
    options.coverImageUrl ? 'is-photo-visible' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const photoBubble = options.coverImageUrl
    ? `<span class="pilgrimage-marker-photo-bubble"><span class="pilgrimage-marker-photo-frame" style="--marker-photo-image:url('${escapeMapHtml(options.coverImageUrl)}')" aria-hidden="true"></span></span>`
    : ''
  const fallbackAttr =
    options.skin.fallbackImageUrl && options.skin.fallbackImageUrl !== options.skin.imageUrl
      ? ` data-fallback-src="${escapeMapHtml(options.skin.fallbackImageUrl)}" onerror="var f=this.dataset.fallbackSrc;if(f&&this.src!==f){this.dataset.fallbackSrc='';this.src=f;}"`
      : ''

  return `<button class="${classes}" style="${options.markerStyle}" type="button" aria-label="${options.escapedTitle}">${photoBubble}<span class="pilgrimage-marker-label"><span class="pilgrimage-marker-label-text">${options.escapedTitle}</span></span><span class="pilgrimage-marker-skin" aria-hidden="true"><img src="${escapeMapHtml(options.skin.imageUrl)}" alt="" loading="lazy" decoding="async"${fallbackAttr} /></span>${routeOrder}${terminalLabel}</button>`
}

export function usePilgrimageMapRendering(options: UsePilgrimageMapRenderingOptions) {
  let animationFrame = 0
  let replayTimer = 0
  let animationToken = 0
  let actorMarker: any = null
  let activeAnimationRouteId = ''
  let currentRouteOrder: number | null = null
  let passedRouteOrders = new Set<number>()

  function localMarkerSkins() {
    return Object.values(pilgrimageMapConfig.personalizedMarkers.skins) as MarkerSkin[]
  }

  function resolveMarkerImageUrl(imageUrl: string) {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('/pilgrimage/')) return imageUrl
    return buildStaticAssetUrl(imageUrl)
  }

  function markerSkinFallback(id: string) {
    const markerConfig = pilgrimageMapConfig.personalizedMarkers
    return (
      markerConfig.skins[id as keyof typeof markerConfig.skins] ||
      markerConfig.skins[markerConfig.defaultSkinId]
    )
  }

  function apiMarkerSkins() {
    return options.markerSkins.value
      .filter((skin) => skin.id && skin.imageUrl && skin.size?.length === 2 && skin.anchor?.length === 2)
      .map((skin) => {
        const fallback = markerSkinFallback(skin.id)
        return {
          ...skin,
          imageUrl: resolveMarkerImageUrl(skin.imageUrl),
          size: [Number(skin.size[0]) || 96, Number(skin.size[1]) || 96] as [number, number],
          anchor: [Number(skin.anchor[0]) || 48, Number(skin.anchor[1]) || 94] as [number, number],
          fallbackImageUrl: fallback.imageUrl,
        }
      })
  }

  function resolveMarkerSkin(spot: PilgrimageSpotSummary): MarkerSkin {
    const markerConfig = pilgrimageMapConfig.personalizedMarkers
    const apiSkins = apiMarkerSkins()
    const specifiedSkin = spot.markerSkinId
      ? apiSkins.find((skin) => skin.id === spot.markerSkinId)
      : null
    if (specifiedSkin) return specifiedSkin

    const skins = apiSkins.length > 0 ? apiSkins : localMarkerSkins()
    return (
      skins[stableHash(spot.id || spot.title) % skins.length] ||
      markerConfig.skins[markerConfig.defaultSkinId]
    )
  }

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

  function spotMarkerDisplayMode(
    spot: PilgrimageSpotSummary,
    active: boolean,
    inRoute: boolean,
    routeOrder: number | undefined,
    routeSpotCount: number,
    occupiedPoints: Point[],
  ): SpotMarkerDisplayMode {
    const map = options.mapRef.value
    if (!map) return 'full'

    const point = spotMarkerCollisionPoint(spot)
    if (!point) return 'full'

    if (active) {
      occupiedPoints.push({ x: point.x, y: point.y })
      return 'full'
    }

    if (options.selectedRoute.value) {
      const routeDeclutterConfig = pilgrimageMapConfig.markerDeclutter.selectedRoute
      if (!inRoute) return normalizeMarkerDisplayMode(routeDeclutterConfig.outsideRouteMode)

      if (map.getZoom() >= routeDeclutterConfig.routeSpotShowAllMinZoom) return 'full'

      const declutterConfig = options.isMobileViewport.value
        ? pilgrimageMapConfig.markerDeclutter.mobile
        : pilgrimageMapConfig.markerDeclutter.desktop
      const crowded = occupiedPoints.some(
        (occupied) =>
          Math.abs(occupied.x - point.x) < declutterConfig.collisionGap.x &&
          Math.abs(occupied.y - point.y) < declutterConfig.collisionGap.y,
      )
      const terminalRouteSpot =
        routeOrder === 1 || (routeSpotCount > 0 && routeOrder === routeSpotCount)
      const currentRouteSpot = Boolean(routeOrder && currentRouteOrder === routeOrder)
      if (
        (routeDeclutterConfig.keepTerminalFull && terminalRouteSpot) ||
        (routeDeclutterConfig.keepCurrentFull && currentRouteSpot)
      ) {
        occupiedPoints.push({ x: point.x, y: point.y })
        return 'full'
      }

      if (!crowded) {
        occupiedPoints.push({ x: point.x, y: point.y })
        return 'full'
      }

      return normalizeMarkerDisplayMode(routeDeclutterConfig.routeSpotCrowdedMode)
    }

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

  function shouldShowPhotoBubble(
    spot: PilgrimageSpotSummary,
    active: boolean,
    occupiedPoints: Point[],
  ) {
    if (!spot.coverImageUrl) return false

    const map = options.mapRef.value
    if (!map) return false

    const bubbleConfig = options.isMobileViewport.value
      ? pilgrimageMapConfig.photoBubble.mobile
      : pilgrimageMapConfig.photoBubble.desktop
    if (map.getZoom() < bubbleConfig.minZoom) return false

    const point = spotMarkerCollisionPoint(spot)
    if (!point) return false

    if (active) {
      occupiedPoints.push({ x: point.x, y: point.y })
      return true
    }

    const crowded = occupiedPoints.some(
      (occupied) =>
        Math.abs(occupied.x - point.x) < bubbleConfig.collisionGap.x &&
        Math.abs(occupied.y - point.y) < bubbleConfig.collisionGap.y,
    )

    if (!crowded) {
      occupiedPoints.push({ x: point.x, y: point.y })
      return true
    }

    return false
  }

  function renderMarkers() {
    const L = options.leafletRef.value
    const markerLayer = options.markerLayerRef.value
    if (!L || !markerLayer) return

    markerLayer.clearLayers()

    const occupiedMarkerPoints: Point[] = []
    const occupiedPhotoPoints: Point[] = []
    const routeSpotCount = options.selectedRoute.value?.spots.length || 0
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
      const displayMode = spotMarkerDisplayMode(
        spot,
        active,
        inRoute,
        routeOrder,
        routeSpotCount,
        occupiedMarkerPoints,
      )
      if (displayMode === 'hidden') return

      const markerTitle = getSpotMarkerTitle(spot)
      const escapedTitle = escapeMapHtml(markerTitle)
      const markerSkin = resolveMarkerSkin(spot)
      const compact = displayMode === 'dot'
      const showPhotoBubble = !compact && shouldShowPhotoBubble(spot, active, occupiedPhotoPoints)
      const markerLayout = personalizedMarkerLayout(
        markerSkin,
        showPhotoBubble,
        options.isMobileViewport.value,
      )
      const markerStyle = personalizedMarkerStyle(spot, markerSkin, markerTitle, markerLayout)
      const layout = compact
        ? {
            iconSize: pilgrimageMapConfig.compactMarker.iconSize,
            iconAnchor: pilgrimageMapConfig.compactMarker.iconAnchor,
          }
        : markerLayout
      const markerHtml = compact
        ? `<button class="pilgrimage-marker is-compact" style="${markerStyle}" type="button" aria-label="${escapedTitle}"><span class="pilgrimage-marker-dot" aria-hidden="true"></span></button>`
        : buildPersonalizedMarkerHtml({
            active,
            inRoute,
            routeOrder,
            routeSpotCount,
            escapedTitle,
            markerStyle,
            skin: markerSkin,
            routeCurrent: Boolean(routeOrder && currentRouteOrder === routeOrder),
            routePassed: Boolean(routeOrder && passedRouteOrders.has(routeOrder)),
            coverImageUrl: showPhotoBubble ? buildStaticAssetUrl(spot.coverImageUrl) : undefined,
          })
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
      } else if (compact) {
        marker.setZIndexOffset(-100)
      } else if (inRoute) {
        marker.setZIndexOffset(360)
      }
      marker.addTo(markerLayer)
    })
  }

  function routePoints(routeItem: PilgrimageRoute | null) {
    if (!routeItem) return []
    const spotMap = new Map(options.spots.value.map((spot) => [spot.id, spot]))
    return routeItem.spots
      .map((item) => spotMap.get(item.spotId))
      .filter(Boolean)
      .map((spot) => [spot!.displayLat, spot!.displayLng] as LatLngTuple)
  }

  function renderRoutes() {
    const L = options.leafletRef.value
    const routeLayer = options.routeLayerRef.value
    const map = options.mapRef.value
    if (!L || !routeLayer || !map) return

    routeLayer.clearLayers()
    const routeItem = options.selectedRoute.value
    if (!routeItem) return

    const points = routePoints(routeItem)

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
      const midPoint: LatLngTuple = [
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

  function routeActorTransform(angle: number) {
    if (angle > 90) {
      return { angle: angle - 180, scaleX: -1 }
    }
    if (angle < -90) {
      return { angle: angle + 180, scaleX: -1 }
    }
    return { angle, scaleX: 1 }
  }

  function routeActorCycleDurationSeconds(frameCount: number) {
    const routeAnimation = pilgrimageMapConfig.routeAnimation
    const actor = routeAnimation.actor
    const fixedDuration = frameCount / Math.max(1, actor.fps)
    if (!actor.syncFrameRateWithMovement) return fixedDuration

    const metersPerSecond = Math.max(1, routeAnimation.movementSpeed.metersPerSecond)
    const cycleDistanceMeters = Math.max(1, actor.walkCycleDistanceMeters)
    const minDuration = Math.min(actor.minCycleDurationMs, actor.maxCycleDurationMs) / 1000
    const maxDuration = Math.max(actor.minCycleDurationMs, actor.maxCycleDurationMs) / 1000
    const linkedDuration = cycleDistanceMeters / metersPerSecond
    return Math.min(maxDuration, Math.max(minDuration, linkedDuration))
  }

  function actorIconHtml(angle = 0) {
    const actor = pilgrimageMapConfig.routeAnimation.actor
    const frameCount = Math.max(1, actor.frameCount)
    const duration = routeActorCycleDurationSeconds(frameCount)
    const runDistance = frameCount * actor.frameSize[0]
    const transform = actor.rotateWithRoute ? routeActorTransform(angle) : { angle: 0, scaleX: 1 }
    return `<span class="pilgrimage-route-actor" style="--route-actor-image:url('${escapeMapHtml(actor.imageUrl)}'); --route-actor-width:${actor.frameSize[0]}px; --route-actor-height:${actor.frameSize[1]}px; --route-actor-frame-count:${frameCount}; --route-actor-duration:${duration}s; --route-actor-run-distance:-${runDistance}px; --route-actor-angle:${transform.angle}deg; --route-actor-scale-x:${transform.scaleX};"><span class="pilgrimage-route-actor-sprite" aria-hidden="true"></span></span>`
  }

  function setActorAngle(angle: number) {
    const actor = actorMarker?.getElement?.()?.querySelector?.('.pilgrimage-route-actor') as
      | HTMLElement
      | null
    if (!actor) return
    const transform = pilgrimageMapConfig.routeAnimation.actor.rotateWithRoute
      ? routeActorTransform(angle)
      : { angle: 0, scaleX: 1 }
    actor.style.setProperty('--route-actor-angle', `${transform.angle}deg`)
    actor.style.setProperty('--route-actor-scale-x', String(transform.scaleX))
  }

  function routeSegmentAngle(fromPoint: LatLngTuple, toPoint: LatLngTuple) {
    const map = options.mapRef.value
    if (!map) return 0
    const from = map.latLngToLayerPoint(fromPoint)
    const to = map.latLngToLayerPoint(toPoint)
    return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI)
  }

  function routeSegmentDistanceMeters(fromPoint: LatLngTuple, toPoint: LatLngTuple) {
    const map = options.mapRef.value
    if (!map) return 0
    return map.distance(fromPoint, toPoint)
  }

  function routeAnimationTimeline(points: LatLngTuple[]) {
    const metersPerSecond = Math.max(
      1,
      pilgrimageMapConfig.routeAnimation.movementSpeed.metersPerSecond,
    )
    const metersPerMs = metersPerSecond / 1000
    const segments = points.slice(0, -1).map((from, index) => {
      const to = points[index + 1]
      const distance = Math.max(1, routeSegmentDistanceMeters(from, to))
      return {
        from,
        to,
        duration: distance / metersPerMs,
        startedAt: 0,
      }
    })

    let totalDuration = 0
    segments.forEach((segment) => {
      segment.startedAt = totalDuration
      totalDuration += segment.duration
    })

    return { segments, totalDuration }
  }

  function updateRouteAnimationState(nextCurrent: number, nextPassed: Set<number>) {
    const sameCurrent = currentRouteOrder === nextCurrent
    const samePassed =
      passedRouteOrders.size === nextPassed.size &&
      [...passedRouteOrders].every((order) => nextPassed.has(order))
    currentRouteOrder = nextCurrent
    passedRouteOrders = nextPassed
    if (!sameCurrent || !samePassed) {
      renderMarkers()
    }
  }

  function clearActorMarker() {
    if (actorMarker && options.animationLayerRef.value) {
      options.animationLayerRef.value.removeLayer(actorMarker)
    }
    actorMarker = null
  }

  function stopRouteAnimation(renderAfterStop = true) {
    animationToken += 1
    activeAnimationRouteId = ''
    currentRouteOrder = null
    passedRouteOrders = new Set<number>()
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }
    if (replayTimer) {
      window.clearTimeout(replayTimer)
      replayTimer = 0
    }
    clearActorMarker()
    options.animationLayerRef.value?.clearLayers()
    if (renderAfterStop) {
      renderMarkers()
    }
  }

  function startRouteAnimation() {
    const L = options.leafletRef.value
    const map = options.mapRef.value
    const animationLayer = options.animationLayerRef.value
    const routeItem = options.selectedRoute.value
    const points = routePoints(routeItem)

    stopRouteAnimation(false)
    if (!L || !map || !animationLayer || !routeItem || points.length < 2) {
      renderMarkers()
      return
    }

    const token = ++animationToken
    activeAnimationRouteId = routeItem.id
    const actor = pilgrimageMapConfig.routeAnimation.actor
    const timeline = routeAnimationTimeline(points)
    const totalDuration = timeline.totalDuration

    actorMarker = L.marker(points[0], {
      interactive: false,
      zIndexOffset: 1200,
      icon: L.divIcon({
        className: '',
        html: actorIconHtml(routeSegmentAngle(points[0], points[1])),
        iconSize: actor.frameSize,
        iconAnchor: actor.anchor,
      }),
    }).addTo(animationLayer)

    const playCycle = () => {
      if (token !== animationToken || options.selectedRoute.value?.id !== activeAnimationRouteId) return
      const startedAt = window.performance.now()
      updateRouteAnimationState(1, new Set([1]))

      const tick = (now: number) => {
        if (token !== animationToken || options.selectedRoute.value?.id !== activeAnimationRouteId) return

        const elapsed = totalDuration > 0 ? Math.min(now - startedAt, totalDuration) : 0
        const segmentIndex = Math.min(
          timeline.segments.length - 1,
          Math.max(
            0,
            timeline.segments.findIndex((segment, index) => {
              const nextSegment = timeline.segments[index + 1]
              return !nextSegment || elapsed < nextSegment.startedAt
            }),
          ),
        )
        const segment = timeline.segments[segmentIndex]
        const segmentElapsed = elapsed - segment.startedAt
        const segmentProgress =
          elapsed >= totalDuration ? 1 : Math.min(1, segmentElapsed / segment.duration)
        const from = segment.from
        const to = segment.to
        const nextPosition: LatLngTuple = [
          from[0] + (to[0] - from[0]) * segmentProgress,
          from[1] + (to[1] - from[1]) * segmentProgress,
        ]
        const currentOrder =
          elapsed >= totalDuration
            ? points.length
            : segmentProgress > 0.86
              ? segmentIndex + 2
              : segmentIndex + 1
        const passed = new Set<number>()
        for (let order = 1; order <= Math.min(currentOrder, points.length); order += 1) {
          passed.add(order)
        }

        actorMarker?.setLatLng(nextPosition)
        setActorAngle(routeSegmentAngle(from, to))
        updateRouteAnimationState(currentOrder, passed)

        if (elapsed >= totalDuration) {
          replayTimer = window.setTimeout(() => {
            if (
              token === animationToken &&
              options.selectedRoute.value?.id === activeAnimationRouteId
            ) {
              playCycle()
            }
          }, pilgrimageMapConfig.routeAnimation.replayDelayMs)
          return
        }

        animationFrame = window.requestAnimationFrame(tick)
      }

      animationFrame = window.requestAnimationFrame(tick)
    }

    playCycle()
  }

  return {
    renderMarkers,
    renderRoutes,
    startRouteAnimation,
    stopRouteAnimation,
  }
}
