export const pilgrimageMapConfig = {
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
      minZoom: 18,
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
} as const

export type PilgrimagePhotoBubbleViewport = keyof typeof pilgrimageMapConfig.photoBubble
