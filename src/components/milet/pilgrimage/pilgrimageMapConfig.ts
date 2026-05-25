export const pilgrimageMapConfig = {
  personalizedMarkers: {
    defaultSkinId: 'pilgrimage-marker-1',
    skins: {
      // anchor is the pixel in the marker image that should point to the map coordinate.
      // Tune x per asset when the visual arrow tip is not horizontally centered.
      'pilgrimage-marker-1': {
        id: 'pilgrimage-marker-1',
        imageUrl: '/pilgrimage/markers/pilgrimage-marker-1.webp',
        size: [96, 96] as [number, number],
        anchor: [38, 94] as [number, number],
      },
      'pilgrimage-marker-2': {
        id: 'pilgrimage-marker-2',
        imageUrl: '/pilgrimage/markers/pilgrimage-marker-2.webp',
        size: [96, 96] as [number, number],
        anchor: [38, 94] as [number, number],
      },
      'pilgrimage-marker-3': {
        id: 'pilgrimage-marker-3',
        imageUrl: '/pilgrimage/markers/pilgrimage-marker-3.webp',
        size: [96, 96] as [number, number],
        anchor: [38, 94] as [number, number],
      },
      'pilgrimage-marker-4': {
        id: 'pilgrimage-marker-4',
        imageUrl: '/pilgrimage/markers/pilgrimage-marker-4.webp',
        size: [96, 96] as [number, number],
        anchor: [38, 94] as [number, number],
      },
      'pilgrimage-marker-5': {
        id: 'pilgrimage-marker-5',
        imageUrl: '/pilgrimage/markers/pilgrimage-marker-5.webp',
        size: [96, 96] as [number, number],
        anchor: [38, 94] as [number, number],
      },
    },
  },
  mapDecorations: [
    {
      id: 'bottom-left',
      imageUrl: '/pilgrimage/decorations/bottom-left.webp',
      position: 'bottom-left',
      layout: {
        desktop: {
          size: [72, 138] as [number, number],
          offset: [18, 18] as [number, number],
        },
        mobile: {
          size: [48, 92] as [number, number],
          offset: [14, 26] as [number, number],
        },
      },
    },
    {
      id: 'bottom-right',
      imageUrl: '/pilgrimage/decorations/bottom-right.webp',
      position: 'bottom-right',
      layout: {
        desktop: {
          size: [72, 138] as [number, number],
          offset: [18, 18] as [number, number],
        },
        mobile: {
          size: [48, 92] as [number, number],
          offset: [10, 16] as [number, number],
        },
      },
    },
  ],
  tileLayer: {
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors',
  },
  routeAnimation: {
    movementSpeed: {
      metersPerSecond: 15,
    },
    replayDelayMs: 3000,
    actor: {
      imageUrl: '/pilgrimage/route/walker-dog-sprite.png',
      frameSize: [128, 72] as [number, number],
      frameCount: 8,
      fps: 8,
      syncFrameRateWithMovement: true,
      walkCycleDistanceMeters: 10,
      minCycleDurationMs: 450,
      maxCycleDurationMs: 1200,
      anchor: [64, 36] as [number, number],
      rotateWithRoute: true,
    },
  },
  routeLine: {
    color: '#5f9dcb',
    haloColor: '#fff7ed',
    arrowColor: '#4f87bd',
    curve: {
      enabled: true,
      curvature: 0.18,
      maxOffsetPx: 90,
      samplesPerSegment: 18,
    },
  },
  markerPalette: [
    {
      color: '#2f8f83',
      soft: 'rgba(94, 234, 212, 0.24)',
      hoverSoft: 'rgba(94, 234, 212, 0.34)',
      labelText: '#235f59',
      labelBorder: 'rgba(47, 143, 131, 0.38)',
    },
    {
      color: '#c45f91',
      soft: 'rgba(249, 168, 212, 0.26)',
      hoverSoft: 'rgba(249, 168, 212, 0.36)',
      labelText: '#8f3f68',
      labelBorder: 'rgba(196, 95, 145, 0.36)',
    },
    {
      color: '#4f87bd',
      soft: 'rgba(125, 211, 252, 0.24)',
      hoverSoft: 'rgba(125, 211, 252, 0.34)',
      labelText: '#2f5f8e',
      labelBorder: 'rgba(47, 95, 142, 0.38)',
    },
    {
      color: '#b68a2f',
      soft: 'rgba(252, 211, 77, 0.28)',
      hoverSoft: 'rgba(252, 211, 77, 0.38)',
      labelText: '#76591c',
      labelBorder: 'rgba(118, 89, 28, 0.38)',
    },
    {
      color: '#8a6bb8',
      soft: 'rgba(196, 181, 253, 0.26)',
      hoverSoft: 'rgba(196, 181, 253, 0.36)',
      labelText: '#614990',
      labelBorder: 'rgba(97, 73, 144, 0.38)',
    },
    {
      color: '#4f9c6d',
      soft: 'rgba(134, 239, 172, 0.24)',
      hoverSoft: 'rgba(134, 239, 172, 0.34)',
      labelText: '#2f6f47',
      labelBorder: 'rgba(47, 111, 71, 0.36)',
    },
  ],
  markerDeclutter: {
    selectedRoute: {
      // Route selection can make personalized markers crowded. Keep the action configurable:
      // "dot" keeps a compact clickable marker; "hidden" removes it from the map layer.
      outsideRouteMode: 'dot',
      routeSpotCrowdedMode: 'dot',
      routeSpotShowAllMinZoom: 18,
      keepCurrentFull: true,
      keepTerminalFull: true,
    },
    desktop: {
      showAllMinZoom: 18,
      collisionGap: {
        x: 168,
        y: 102,
      },
    },
    mobile: {
      showAllMinZoom: 18,
      collisionGap: {
        x: 110,
        y: 78,
      },
    },
  },
  photoBubble: {
    desktop: {
      minZoom: 18,
      collisionGap: {
        x: 150,
        y: 126,
      },
      bubbleSize: [142, 120] as [number, number],
    },
    mobile: {
      minZoom: 18,
      collisionGap: {
        x: 122,
        y: 104,
      },
      bubbleSize: [118, 104] as [number, number],
    },
  },
  defaultMarker: {
    iconSize: [160, 72] as [number, number],
    iconAnchor: {
      active: [80, 43] as [number, number],
      inactive: [80, 35] as [number, number],
    },
  },
  compactMarker: {
    iconSize: [24, 24] as [number, number],
    iconAnchor: [12, 12] as [number, number],
  },
} as const

export type PilgrimagePhotoBubbleViewport = keyof typeof pilgrimageMapConfig.photoBubble
