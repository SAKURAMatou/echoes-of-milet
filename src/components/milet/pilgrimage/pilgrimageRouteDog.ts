// Complete painted poses preserve canine anatomy. No joints or limb textures
// are stretched, rotated, interpolated or composited at runtime.
export const routeDogConfig = {
  atlas: '/pilgrimage/route/jean-painted-walk.webp',
  size: 256,
  columns: 4,
  frames: 16,
  idleFrame: 9,
  offset: [133, 128] as const,
  ground: 244,
} as const

export function dogFrame(elapsed: number, cycleMs = 1100, walking = true) {
  if (!walking) return routeDogConfig.idleFrame
  return Math.floor((Math.max(0, elapsed) / Math.max(1, cycleMs) % 1) * routeDogConfig.frames)
}

export function createDogAnimation(image: HTMLImageElement) {
  return {
    draw(context: CanvasRenderingContext2D, elapsed: number, cycleMs: number, walking: boolean) {
      const frame = dogFrame(elapsed, cycleMs, walking)
      const { size, columns, offset } = routeDogConfig
      context.drawImage(image, (frame % columns) * size, Math.floor(frame / columns) * size,
        size, size, offset[0], offset[1], size, size)
    },
  }
}
