export const pilgrimageMapConfig = {
  markerPalette: [
    {
      color: '#2f8f83',
      soft: 'rgba(47, 143, 131, 0.22)',
      hoverSoft: 'rgba(47, 143, 131, 0.3)',
      labelText: '#235f59',
    },
    {
      color: '#c98791',
      soft: 'rgba(201, 135, 145, 0.24)',
      hoverSoft: 'rgba(201, 135, 145, 0.32)',
      labelText: '#8f3f4b',
    },
    {
      color: '#4f87bd',
      soft: 'rgba(79, 135, 189, 0.22)',
      hoverSoft: 'rgba(79, 135, 189, 0.3)',
      labelText: '#2f5f8e',
    },
    {
      color: '#b68a2f',
      soft: 'rgba(182, 138, 47, 0.24)',
      hoverSoft: 'rgba(182, 138, 47, 0.32)',
      labelText: '#76591c',
    },
    {
      color: '#8a6bb8',
      soft: 'rgba(138, 107, 184, 0.22)',
      hoverSoft: 'rgba(138, 107, 184, 0.3)',
      labelText: '#614990',
    },
    {
      color: '#d4764e',
      soft: 'rgba(212, 118, 78, 0.23)',
      hoverSoft: 'rgba(212, 118, 78, 0.31)',
      labelText: '#935338',
    },
  ],
  markerDeclutter: {
    desktop: {
      showAllMinZoom: 16,
      collisionGap: {
        x: 92,
        y: 58,
      },
    },
    mobile: {
      showAllMinZoom: 16,
      collisionGap: {
        x: 82,
        y: 54,
      },
    },
  },
  photoBubble: {
    desktop: {
      minZoom: 17,
      collisionGap: {
        x: 138,
        y: 118,
      },
      iconSize: [168, 176] as [number, number],
      iconAnchor: {
        active: [84, 141] as [number, number],
        inactive: [84, 137] as [number, number],
      },
    },
    mobile: {
      minZoom: 17,
      collisionGap: {
        x: 112,
        y: 96,
      },
      iconSize: [136, 156] as [number, number],
      iconAnchor: {
        active: [68, 129] as [number, number],
        inactive: [68, 124] as [number, number],
      },
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
