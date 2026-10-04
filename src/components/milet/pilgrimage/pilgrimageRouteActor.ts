// Sixteen poses preserve the approved illustration's detailed raster artwork.
// The route owns the only animation clock; this renderer never schedules frames.
import { createDogAnimation, dogFrame, routeDogConfig } from './pilgrimageRouteDog'
import { humanClips, humanHands, idleHumanClip, idleHumanHand } from './pilgrimageRouteHumanClips'
export const routeActorAssets = {
  walk: '/pilgrimage/route/milet-jean-walk.webp',
  idle: '/pilgrimage/route/milet-jean-idle.webp',
  size: 384,
  columns: 4,
  frames: 16,
} as const

export function actorFacing(angle: number, previous = 1) {
  const horizontal = Math.cos((angle * Math.PI) / 180)
  return Math.abs(horizontal) < 0.16 ? previous : horizontal < 0 ? -1 : 1
}

export function actorFrame(elapsed: number, cycleMs = 1100) {
  const phase = Math.max(0, elapsed) / Math.max(1, cycleMs)
  return Math.floor((phase % 1) * routeActorAssets.frames)
}

export function routeClockDelta(now: number, previous: number, paused: boolean) {
  // A throttled/background tab must not jump across the route on return.
  return paused ? 0 : Math.min(64, Math.max(0, now - previous))
}

function loadArtwork(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

export function createRouteActor(element: HTMLElement) {
  const canvas = element.querySelector('canvas')
  const context = canvas?.getContext('2d')
  let walk: HTMLImageElement | null = null
  let idle: HTMLImageElement | null = null
  let dog: HTMLImageElement | null = null
  let dogAnimation: ReturnType<typeof createDogAnimation> | null = null
  let facing = 1
  let previousKey = ''
  const ready = Promise.all([
    loadArtwork(routeActorAssets.walk), loadArtwork(routeActorAssets.idle), loadArtwork(routeDogConfig.atlas),
  ]).then(([walkImage, idleImage, dogImage]) => {
    walk = walkImage
    idle = idleImage
    dog = dogImage
    dogAnimation = dogImage ? createDogAnimation(dogImage) : null
    return Boolean(context && (idle || walk))
  })

  return {
    ready,
    render(elapsed: number, angle: number, activity = 1, cycleMs = 1100) {
      if (!canvas || !context || (!idle && !walk)) return
      facing = actorFacing(angle, facing)
      const resting = activity <= 0 || !walk
      const frame = resting ? 0 : actorFrame(elapsed, cycleMs)
      const dogTick = dogFrame(elapsed, cycleMs, !resting)
      const key = `${resting}:${frame}:${dog ? dogTick : 0}:${facing}`
      if (key === previousKey) return
      previousKey = key
      element.dataset.pose = resting ? 'idle' : 'walk'
      element.dataset.frame = String(frame)
      element.dataset.facing = facing < 0 ? 'left' : 'right'
      element.dataset.dogPhase = String(dogTick)
      const source = resting ? (idle || walk)! : walk!
      const size = routeActorAssets.size
      const sourceX = source === walk ? (frame % routeActorAssets.columns) * size : 0
      const sourceY = source === walk ? Math.floor(frame / routeActorAssets.columns) * size : 0
      context.clearRect(0, 0, size, size)
      context.save()
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      if (facing < 0) {
        context.translate(size, 0)
        context.scale(-1, 1)
      }
      if (dogAnimation) {
        dogAnimation.draw(context, elapsed, cycleMs, !resting)
        const hand = source === idle ? idleHumanHand : humanHands[frame]
        context.beginPath()
        context.moveTo(hand[0], hand[1])
        context.bezierCurveTo(hand[0] + 27, hand[1] + 68, 263, 290, 302, 288)
        context.strokeStyle = '#799989'
        context.lineWidth = 2.4
        context.lineCap = 'round'
        context.stroke()
        // Draw original human pixels through the measured silhouette. This
        // excludes the old dog's cut-off poses without redrawing the person.
        context.save()
        const clip = source === idle ? idleHumanClip : humanClips[frame]
        context.beginPath()
        context.moveTo(clip[0][0], clip[0][1])
        clip.slice(1).forEach(point => context.lineTo(point[0], point[1]))
        context.closePath()
        context.clip()
        context.drawImage(source, sourceX, sourceY, size, size, 0, 0, size, size)
        context.restore()
      } else {
        context.drawImage(source, sourceX, sourceY, size, size, 0, 0, size, size)
      }
      context.restore()
    },
  }
}
