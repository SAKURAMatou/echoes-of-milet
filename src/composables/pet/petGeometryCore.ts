/**
 * Pure geometry helpers for pet pointer thresholds, viewport clamping and
 * default placement. Deliberately free of Vue/DOM imports for direct testing.
 */

export interface PetPoint {
  x: number
  y: number
}

export interface PetSize {
  width: number
  height: number
}

export interface PetViewportBox {
  left: number
  top: number
  width: number
  height: number
}

export interface PetEdgeInsets {
  left: number
  right: number
  top: number
  bottom: number
}

export const PET_DRAG_THRESHOLD_PX = 8

export const PET_MENU_VIEWPORT_MARGIN_PX = 8

export const PET_SPEECH_VIEWPORT_MARGIN_PX = 10

export function petPointerDistance(start: PetPoint, current: PetPoint): number {
  const dx = current.x - start.x
  const dy = current.y - start.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function isPetDragStarted(
  start: PetPoint,
  current: PetPoint,
  threshold = PET_DRAG_THRESHOLD_PX,
): boolean {
  const dx = current.x - start.x
  const dy = current.y - start.y
  return dx * dx + dy * dy >= threshold * threshold
}

export function clampPetPosition(
  point: PetPoint,
  hostSize: PetSize,
  box: PetViewportBox,
  insets: PetEdgeInsets,
): PetPoint {
  const minX = box.left + insets.left
  const maxX = box.left + box.width - insets.right - hostSize.width
  const minY = box.top + insets.top
  const maxY = box.top + box.height - insets.bottom - hostSize.height

  const fallbackX = box.left + Math.max(0, insets.left)
  const fallbackY = box.top + Math.max(0, insets.top)

  return {
    x: maxX >= minX ? Math.min(maxX, Math.max(minX, point.x)) : fallbackX,
    y: maxY >= minY ? Math.min(maxY, Math.max(minY, point.y)) : fallbackY,
  }
}

export function defaultPetPosition(
  box: PetViewportBox,
  hostSize: PetSize,
  insets: PetEdgeInsets,
  rightReserved = 0,
  bottomReserved = 0,
): PetPoint {
  const minX = box.left + insets.left
  const maxX = box.left + box.width - hostSize.width - Math.max(insets.right, rightReserved)
  const minY = box.top + insets.top
  const maxY = box.top + box.height - hostSize.height - Math.max(insets.bottom, bottomReserved)
  return {
    x: maxX >= minX ? maxX : minX,
    y: maxY >= minY ? maxY : minY,
  }
}

export interface PetLayoutMetricsInput {
  innerWidth: number
  innerHeight: number
  visualViewport: {
    offsetLeft: number
    offsetTop: number
    width: number
    height: number
    scale: number
  } | null
}

export function resolvePetViewportBox(input: PetLayoutMetricsInput): PetViewportBox {
  if (!input.visualViewport) {
    return { left: 0, top: 0, width: input.innerWidth, height: input.innerHeight }
  }

  return {
    left: input.visualViewport.offsetLeft,
    top: input.visualViewport.offsetTop,
    // visualViewport.width/height are already CSS pixels for the fixed layer.
    width: input.visualViewport.width,
    height: input.visualViewport.height,
  }
}

export function emptyPetInsets(): PetEdgeInsets {
  return { left: 0, right: 0, top: 0, bottom: 0 }
}

export function clampPetNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type PetSpeechBubbleHorizontal = 'left' | 'right'
export type PetSpeechBubbleVertical = 'above' | 'below'

export interface PetSpeechBubbleLayoutInput {
  viewport: PetViewportBox
  safeInsets: PetEdgeInsets
  petX: number
  petY: number
  petSize: number
  bubbleWidth: number
  bubbleHeight: number
  margin?: number
}

export interface PetSpeechBubbleLayout {
  left: number
  top: number
  horizontal: PetSpeechBubbleHorizontal
  vertical: PetSpeechBubbleVertical
}

/**
 * Places Jean's speech bubble toward the open side of the viewport, then
 * flips it when that side cannot fit. The final clamp keeps the whole bubble
 * inside the visual viewport and its safe-area insets.
 */
export function resolvePetSpeechBubbleLayout(
  input: PetSpeechBubbleLayoutInput,
): PetSpeechBubbleLayout {
  const margin = input.margin ?? PET_SPEECH_VIEWPORT_MARGIN_PX
  const insets = input.safeInsets || emptyPetInsets()
  const minX = input.viewport.left + Math.max(margin, insets.left)
  const maxX =
    input.viewport.left + input.viewport.width - Math.max(margin, insets.right) - input.bubbleWidth
  const minY = input.viewport.top + Math.max(margin, insets.top)
  const maxY =
    input.viewport.top +
    input.viewport.height -
    Math.max(margin, insets.bottom) -
    input.bubbleHeight
  const petCenterX = input.petX + input.petSize / 2
  const petCenterY = input.petY + input.petSize / 2
  const viewportCenterX = input.viewport.left + input.viewport.width / 2

  const horizontalCandidates: Record<PetSpeechBubbleHorizontal, number> = {
    left: input.petX - input.bubbleWidth + input.petSize * 0.34,
    right: input.petX + input.petSize * 0.66,
  }
  const preferredHorizontal: PetSpeechBubbleHorizontal =
    petCenterX >= viewportCenterX ? 'left' : 'right'
  const alternateHorizontal: PetSpeechBubbleHorizontal =
    preferredHorizontal === 'left' ? 'right' : 'left'
  const fitsHorizontally = (side: PetSpeechBubbleHorizontal) => {
    const value = horizontalCandidates[side]
    return value >= minX && value <= maxX
  }
  const horizontal = fitsHorizontally(preferredHorizontal)
    ? preferredHorizontal
    : fitsHorizontally(alternateHorizontal)
      ? alternateHorizontal
      : preferredHorizontal

  const verticalCandidates: Record<PetSpeechBubbleVertical, number> = {
    above: input.petY - input.bubbleHeight + input.petSize * 0.18,
    below: input.petY + input.petSize * 0.82,
  }
  const preferredVertical: PetSpeechBubbleVertical =
    petCenterY >= input.viewport.top + input.viewport.height / 2 ? 'above' : 'below'
  const alternateVertical: PetSpeechBubbleVertical =
    preferredVertical === 'above' ? 'below' : 'above'
  const fitsVertically = (side: PetSpeechBubbleVertical) => {
    const value = verticalCandidates[side]
    return value >= minY && value <= maxY
  }
  const vertical = fitsVertically(preferredVertical)
    ? preferredVertical
    : fitsVertically(alternateVertical)
      ? alternateVertical
      : preferredVertical

  return {
    left: clampPetNumber(horizontalCandidates[horizontal], minX, Math.max(minX, maxX)),
    top: clampPetNumber(verticalCandidates[vertical], minY, Math.max(minY, maxY)),
    horizontal,
    vertical,
  }
}

export interface PetRadialMenuLayoutInput {
  viewport: PetViewportBox
  safeInsets: PetEdgeInsets
  petX: number
  petY: number
  petSize: number
  itemWidth: number
  itemHeight: number
  itemCount: number
  /** Horizontal air gap between a side menu item and the pet canvas. */
  horizontalGap?: number
  /** Minimum vertical gap used to distribute menu items evenly. */
  itemGap?: number
  margin?: number
}

export interface PetRadialMenuItemLayout {
  left: number
  top: number
  originX: number
  originY: number
}

/**
 * Places quick actions on an inward-facing quarter ellipse around the pet.
 *
 * Corner layouts use equal vertical slots so adding an entry cannot leave one
 * item with a visibly different gap. Side/centre layouts use the same slot
 * size in a straight fan. The horizontal radius is derived from the pet and
 * pill widths, keeping the closest edges separated by one small gap.
 */
export function resolvePetRadialMenuLayout(
  input: PetRadialMenuLayoutInput,
): PetRadialMenuItemLayout[] {
  if (input.itemCount <= 0) return []

  const margin = input.margin ?? PET_MENU_VIEWPORT_MARGIN_PX
  const insets = input.safeInsets || emptyPetInsets()
  const minX = input.viewport.left + Math.max(margin, insets.left)
  const maxX =
    input.viewport.left + input.viewport.width - Math.max(margin, insets.right) - input.itemWidth
  const minY = input.viewport.top + Math.max(margin, insets.top)
  const maxY =
    input.viewport.top + input.viewport.height - Math.max(margin, insets.bottom) - input.itemHeight
  const petCenterX = input.petX + input.petSize / 2
  const petCenterY = input.petY + input.petSize / 2
  const viewportCenterX = input.viewport.left + input.viewport.width / 2
  const viewportCenterY = input.viewport.top + input.viewport.height / 2
  const centerDx = viewportCenterX - petCenterX
  const centerDy = viewportCenterY - petCenterY
  const centerThreshold = input.petSize * 0.35
  const inwardX = Math.abs(centerDx) <= centerThreshold ? 0 : Math.sign(centerDx)
  const inwardY = Math.abs(centerDy) <= centerThreshold ? 0 : Math.sign(centerDy)
  const horizontalGap = Math.max(0, input.horizontalGap ?? 8)
  const itemGap = Math.max(0, input.itemGap ?? 12)
  const horizontalRadius = input.petSize / 2 + input.itemWidth / 2 + horizontalGap
  const verticalStep = input.itemHeight + itemGap
  const minimumVerticalRadius = input.petSize / 2 + input.itemHeight / 2 + itemGap
  const verticalRadius = Math.max(
    minimumVerticalRadius,
    verticalStep * Math.max(1, input.itemCount - 1),
  )

  return Array.from({ length: input.itemCount }, (_, index) => {
    const progress = input.itemCount === 1 ? 0 : index / (input.itemCount - 1)
    let offsetX = 0
    let offsetY = 0

    if (inwardX !== 0 && inwardY !== 0) {
      // Equal progress produces equal vertical gaps; x follows the ellipse.
      offsetX = inwardX * horizontalRadius * Math.sqrt(Math.max(0, 1 - progress ** 2))
      offsetY = inwardY * verticalRadius * progress
    } else if (inwardX !== 0) {
      offsetX = inwardX * horizontalRadius
      offsetY = (index - (input.itemCount - 1) / 2) * verticalStep
    } else {
      const verticalDirection = inwardY || -1
      offsetY = verticalDirection * (minimumVerticalRadius + index * verticalStep)
    }

    const desiredLeft = petCenterX + offsetX - input.itemWidth / 2
    const desiredTop = petCenterY + offsetY - input.itemHeight / 2
    const left = clampPetNumber(desiredLeft, minX, Math.max(minX, maxX))
    const top = clampPetNumber(desiredTop, minY, Math.max(minY, maxY))

    return {
      left,
      top,
      originX: petCenterX - (left + input.itemWidth / 2),
      originY: petCenterY - (top + input.itemHeight / 2),
    }
  })
}
