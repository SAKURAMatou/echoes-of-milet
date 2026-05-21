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
          offset: [10, 12] as [number, number],
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
          offset: [10, 12] as [number, number],
        },
      },
    },
  ],
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
      anchor: [64, 36] as [number, number],
      rotateWithRoute: true,
    },
  },
  markerPalette: [
    {
      color: '#2f8f83',
      soft: 'rgba(47, 143, 131, 0.22)',
      hoverSoft: 'rgba(47, 143, 131, 0.3)',
      labelText: '#235f59',
      labelBorder: 'rgba(35, 95, 89, 0.38)',
    },
    {
      color: '#c98791',
      soft: 'rgba(201, 135, 145, 0.24)',
      hoverSoft: 'rgba(201, 135, 145, 0.32)',
      labelText: '#8f3f4b',
      labelBorder: 'rgba(143, 63, 75, 0.38)',
    },
    {
      color: '#4f87bd',
      soft: 'rgba(79, 135, 189, 0.22)',
      hoverSoft: 'rgba(79, 135, 189, 0.3)',
      labelText: '#2f5f8e',
      labelBorder: 'rgba(47, 95, 142, 0.38)',
    },
    {
      color: '#b68a2f',
      soft: 'rgba(182, 138, 47, 0.24)',
      hoverSoft: 'rgba(182, 138, 47, 0.32)',
      labelText: '#76591c',
      labelBorder: 'rgba(118, 89, 28, 0.38)',
    },
    {
      color: '#8a6bb8',
      soft: 'rgba(138, 107, 184, 0.22)',
      hoverSoft: 'rgba(138, 107, 184, 0.3)',
      labelText: '#614990',
      labelBorder: 'rgba(97, 73, 144, 0.38)',
    },
    {
      color: '#d4764e',
      soft: 'rgba(212, 118, 78, 0.23)',
      hoverSoft: 'rgba(212, 118, 78, 0.31)',
      labelText: '#935338',
      labelBorder: 'rgba(147, 83, 56, 0.38)',
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
      showAllMinZoom: 17,
      collisionGap: {
        x: 168,
        y: 102,
      },
    },
    mobile: {
      showAllMinZoom: 17,
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
        x: 138,
        y: 118,
      },
      bubbleSize: [132, 112] as [number, number],
    },
    mobile: {
      minZoom: 18,
      collisionGap: {
        x: 112,
        y: 96,
      },
      bubbleSize: [112, 98] as [number, number],
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
