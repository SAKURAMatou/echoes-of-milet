<template>
  <div
    v-if="clientMounted"
    ref="hostRootRef"
    data-pet-host
    class="pet-host-layer fixed inset-0 z-[40] pointer-events-none"
    :aria-hidden="!petVisible"
  >
    <template v-if="petVisible && currentMeta">
      <div class="pet-host-spot absolute" :style="spotStyle">
        <PetAvatar
          ref="avatarCompRef"
          :action="currentAction"
          :animation-generation="state.animation.generation"
          :playback="state.animation.playback"
          :aria-controls="menuId"
          :aria-expanded="state.menuOpen"
          :meta="currentMeta"
          :sheet-ready="state.assets[currentAction].sheet === 'ready'"
          :static-src="staticSrcForAction"
          :size-px="hostSizePx"
          :dragging="state.dragging"
          :label="petButtonLabel"
          :motion-enabled="motionEnabled"
          :document-visible="documentVisible"
          @complete="pet.completeAnimation"
        />
      </div>
      <PetSpeechBubble
        :visible="state.speech.visible"
        :message="speechText"
        :generation="state.speech.generation"
        :lang="urlLang"
        :pet-x="petPosition.x"
        :pet-y="petPosition.y"
        :pet-size="hostSizePx"
        :viewport="viewportBox"
        :safe-insets="safeInsets"
        :is-mobile="isMobileViewport"
      />
      <PetQuickMenu
        :open="state.menuOpen"
        :menu-id="menuId"
        :text="menuText"
        :lang="urlLang"
        :pet-x="petPosition.x"
        :pet-y="petPosition.y"
        :pet-size="hostSizePx"
        :viewport="viewportBox"
        :safe-insets="safeInsets"
        :is-mobile="isMobileViewport"
        @navigate="onMenuNavigate"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'

import PetAvatar from './PetAvatar.vue'
import PetQuickMenu from './PetQuickMenu.vue'
import PetSpeechBubble from './PetSpeechBubble.vue'

import { PET_ANIMATION_ASSETS } from '@/assets/pet'
import {
  PET_CORE_PRELOAD_ACTIONS,
  PET_ATTENTION_RESUME_SUPPRESS_MS,
  PET_DEFAULT_BOTTOM_PX,
  PET_DEFAULT_EDGE_PX,
  PET_DEFAULT_RIGHT_DESKTOP_PX,
  PET_DEFAULT_RIGHT_MOBILE_PX,
  PET_HOST_SIZE_DESKTOP_PX,
  PET_HOST_SIZE_MOBILE_PX,
  PET_MENU_DELAY_MS,
  PET_MOBILE_MAX_WIDTH_PX,
  PET_LOOK_ACTION_BY_DIRECTION,
} from '@/config/pet'
import { PET_TEXT } from '@/composables/lang/pet'
import {
  clampPetPosition,
  defaultPetPosition,
  emptyPetInsets,
  resolvePetViewportBox,
  type PetEdgeInsets,
  type PetPoint,
  type PetViewportBox,
} from '@/composables/pet/petGeometryCore'
import { usePetHostControls } from '@/composables/pet/petInjection'
import { createPetPointerController } from '@/composables/pet/usePetPointer'
import { createPetProximityController } from '@/composables/pet/usePetProximity'
import type {
  PetAction,
  PetAssetStatus,
  PetLookDirection,
  PetUrlLang,
} from '@/composables/pet/petTypes'
import { useSiteInteraction } from '@/composables/site-interaction'
import { toSupportedLang } from '@/composables/useLangRoute'

type PetAvatarExpose = {
  getElement: () => HTMLElement | null
  focus: () => void
}

const pet = usePetHostControls()
const state = pet.state
const route = useRoute()
const interaction = useSiteInteraction()
const menuId = useId()

const clientMounted = ref(false)
const mounted = ref(false)
const disposed = ref(false)
const hostRootRef = ref<HTMLElement | null>(null)
const avatarCompRef = ref<PetAvatarExpose | null>(null)
const isMobileViewport = ref(false)
const viewportBox = ref<PetViewportBox>({ left: 0, top: 0, width: 0, height: 0 })
const safeInsets = ref<PetEdgeInsets>(emptyPetInsets())
const placed = ref(false)

const urlLang = computed<PetUrlLang>(() =>
  String(route.params.lang || 'zh') === 'ja' ? 'ja' : 'zh',
)
const copyLang = computed(() => (toSupportedLang(urlLang.value) === 'jp' ? 'jp' : 'zh'))
const petText = computed(() => PET_TEXT[copyLang.value])
const petButtonLabel = computed(() => petText.value.petButtonLabel)
const speechText = computed(() => {
  const key = state.speech.messageKey
  return key ? petText.value.speech[key] : ''
})
const menuText = computed(() => ({
  menuLabel: petText.value.menuLabel,
  items: petText.value.items,
}))

const currentAction = computed<PetAction>(() => state.animation.action)
const currentMeta = computed(() => PET_ANIMATION_ASSETS[currentAction.value])
const hostSizePx = computed(() =>
  isMobileViewport.value ? PET_HOST_SIZE_MOBILE_PX : PET_HOST_SIZE_DESKTOP_PX,
)
const hostSize = computed(() => ({ width: hostSizePx.value, height: hostSizePx.value }))
const petPosition = computed(() => state.position)
const spotStyle = computed(() => ({
  transform: `translate3d(${petPosition.value.x}px, ${petPosition.value.y}px, 0)`,
  width: `${hostSizePx.value}px`,
  height: `${hostSizePx.value}px`,
}))
const motionEnabled = computed(() => interaction.state.motionEnabled)
const documentVisible = computed(() => interaction.state.documentVisible)
const petVisible = computed(
  () =>
    mounted.value &&
    clientMounted.value &&
    state.staticReady &&
    !state.paused &&
    state.route.mode !== 'hidden' &&
    documentVisible.value,
)

const staticSrcForAction = computed(() => {
  const action = currentAction.value
  const actionStaticReady = state.assets[action].static === 'ready'
  if (actionStaticReady) return PET_ANIMATION_ASSETS[action].staticSrc
  const idleStaticReady = state.assets.idle.static === 'ready'
  return idleStaticReady ? PET_ANIMATION_ASSETS.idle.staticSrc : ''
})

let pointerController: ReturnType<typeof createPetPointerController> | null = null
let proximityController: ReturnType<typeof createPetProximityController> | null = null
let pointerElement: HTMLElement | null = null
let pointerGrabOffset: PetPoint | null = null
let menuTimer: ReturnType<typeof setTimeout> | null = null
let fullscreenRelease: (() => void) | null = null
let cleanupListeners: Array<() => void> = []
const assetJobs = new Map<string, Promise<boolean>>()
let initialAssetLoadStarted = false

function clearMenuTimer() {
  if (menuTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(menuTimer)
  }
  menuTimer = null
}

function petButtonElement(): HTMLElement | null {
  return avatarCompRef.value?.getElement() ?? null
}

function focusPet() {
  const exposed = avatarCompRef.value
  if (exposed?.focus) {
    exposed.focus()
    return
  }
  petButtonElement()?.focus({ preventScroll: true })
}

function readSafeInsets(): PetEdgeInsets {
  if (typeof document === 'undefined' || typeof CSS === 'undefined') {
    return emptyPetInsets()
  }
  const probe = document.createElement('div')
  probe.style.position = 'fixed'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.width = '0'
  probe.style.height = '0'
  probe.style.paddingTop = 'env(safe-area-inset-top, 0px)'
  probe.style.paddingRight = 'env(safe-area-inset-right, 0px)'
  probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)'
  probe.style.paddingLeft = 'env(safe-area-inset-left, 0px)'
  document.body.appendChild(probe)
  const styles = window.getComputedStyle(probe)
  const parse = (value: string) => Math.max(0, Number.parseFloat(value) || 0)
  const insets = {
    top: parse(styles.paddingTop),
    right: parse(styles.paddingRight),
    bottom: parse(styles.paddingBottom),
    left: parse(styles.paddingLeft),
  }
  probe.remove()
  return insets
}

function clampInsets(): PetEdgeInsets {
  return {
    left: PET_DEFAULT_EDGE_PX + safeInsets.value.left,
    top: PET_DEFAULT_EDGE_PX + safeInsets.value.top,
    right: PET_DEFAULT_EDGE_PX + safeInsets.value.right,
    bottom: PET_DEFAULT_EDGE_PX + safeInsets.value.bottom,
  }
}

function measureViewport() {
  if (typeof window === 'undefined' || disposed.value) return
  isMobileViewport.value = window.matchMedia(`(max-width: ${PET_MOBILE_MAX_WIDTH_PX}px)`).matches
  viewportBox.value = resolvePetViewportBox({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    visualViewport: window.visualViewport
      ? {
          offsetLeft: window.visualViewport.offsetLeft || 0,
          offsetTop: window.visualViewport.offsetTop || 0,
          width: window.visualViewport.width,
          height: window.visualViewport.height,
          scale: window.visualViewport.scale || 1,
        }
      : null,
  })
  safeInsets.value = readSafeInsets()
  const rightReserved =
    (isMobileViewport.value ? PET_DEFAULT_RIGHT_MOBILE_PX : PET_DEFAULT_RIGHT_DESKTOP_PX) +
    safeInsets.value.right
  const bottomReserved = PET_DEFAULT_BOTTOM_PX + safeInsets.value.bottom
  const insets = clampInsets()

  if (!placed.value) {
    const next = defaultPetPosition(
      viewportBox.value,
      hostSize.value,
      insets,
      rightReserved,
      bottomReserved,
    )
    pet.setPosition(next)
    placed.value = true
  } else {
    pet.setPosition(clampPetPosition(petPosition.value, hostSize.value, viewportBox.value, insets))
  }
}

function currentClampedPoint(point: PetPoint): PetPoint {
  return clampPetPosition(point, hostSize.value, viewportBox.value, clampInsets())
}

function scheduleMenuOpenAfterActivation() {
  clearMenuTimer()
  if (pet.state.menuOpen || !petVisible.value || disposed.value) return
  menuTimer = window.setTimeout(() => {
    menuTimer = null
    if (!disposed.value && mounted.value && petVisible.value && !pet.state.paused) {
      pet.openMenu()
    }
  }, PET_MENU_DELAY_MS)
}

function onMenuNavigate() {
  clearMenuTimer()
  pet.closeMenu()
}

function detachPointer() {
  clearMenuTimer()
  if (pointerController) {
    pointerController.detach()
  }
  pointerController = null
  pointerElement = null
  pointerGrabOffset = null
}

const adjacentLookDirections: Record<PetLookDirection, readonly PetLookDirection[]> = {
  left: ['leftUp'],
  leftUp: ['left', 'up'],
  up: ['leftUp', 'rightUp'],
  rightUp: ['up', 'right'],
  right: ['rightUp'],
}

async function ensureAttentionAssets(direction: PetLookDirection) {
  const directions = [direction, ...adjacentLookDirections[direction]]
  await Promise.allSettled(
    directions.map((item) => ensureAsset(PET_LOOK_ACTION_BY_DIRECTION[item], ['sheet', 'static'])),
  )
  proximityController?.reevaluate()
}

function suppressAttention() {
  proximityController?.suppress(PET_ATTENTION_RESUME_SUPPRESS_MS)
  pet.endAttention()
}

function syncPointerAttachment() {
  const button = petButtonElement()
  if (!mounted.value || !petVisible.value || !button || disposed.value) {
    detachPointer()
    return
  }
  if (pointerController && pointerElement === button) return
  detachPointer()
  pointerElement = button
  pointerController = createPetPointerController(
    {
      onPointerDown(point) {
        suppressAttention()
        const current = petPosition.value
        pointerGrabOffset = {
          x: point.x - current.x,
          y: point.y - current.y,
        }
      },
      onSingleActivate() {
        const wasOpen = pet.state.menuOpen
        pet.playDirectReaction('single')
        if (!wasOpen) scheduleMenuOpenAfterActivation()
      },
      onDoubleActivate() {
        clearMenuTimer()
        suppressAttention()
        pet.playDirectReaction('double')
      },
      onLongPress() {
        clearMenuTimer()
        suppressAttention()
        pet.playDirectReaction('longPress')
      },
      onDragStart(point) {
        clearMenuTimer()
        suppressAttention()
        if (!pointerGrabOffset) {
          pointerGrabOffset = {
            x: hostSizePx.value / 2,
            y: hostSizePx.value / 2,
          }
        }
        pet.beginDrag(
          currentClampedPoint({
            x: point.x - pointerGrabOffset.x,
            y: point.y - pointerGrabOffset.y,
          }),
        )
      },
      onDragMove(point) {
        clearMenuTimer()
        if (!pointerGrabOffset) return
        pet.updateDragPosition(
          currentClampedPoint({
            x: point.x - pointerGrabOffset.x,
            y: point.y - pointerGrabOffset.y,
          }),
        )
      },
      onDragEnd(commit) {
        clearMenuTimer()
        proximityController?.suppress(PET_ATTENTION_RESUME_SUPPRESS_MS)
        pointerGrabOffset = null
        pet.endDrag(commit)
      },
    },
    {
      doubleClickEnabled: () => window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    },
  )
  pointerController.attach(button)
}

function setupProximity() {
  if (typeof window === 'undefined' || proximityController) return
  proximityController = createPetProximityController({
    getPetPosition: () => ({ ...petPosition.value }),
    getPetSize: () => hostSizePx.value,
    enabled: () =>
      mounted.value &&
      petVisible.value &&
      motionEnabled.value &&
      !state.paused &&
      !state.menuOpen &&
      !state.dragging,
    canBeginAttention: () =>
      state.animation.action === 'idle' && state.attention.phase === 'inactive',
    isAttentionActive: () => state.attention.phase !== 'inactive',
    onBegin: (direction) => pet.beginAttention(direction),
    onUpdate: (direction) => pet.updateAttention(direction),
    onEnd: () => pet.endAttention(),
    onPreload: (direction) => void ensureAttentionAssets(direction),
  })
  proximityController.attach()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!pet.state.menuOpen || disposed.value) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (hostRootRef.value?.contains(target)) return
  clearMenuTimer()
  pet.closeMenu()
}

function onDocumentFocusIn(event: FocusEvent) {
  if (!pet.state.menuOpen) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (hostRootRef.value?.contains(target)) return
  clearMenuTimer()
  pet.closeMenu()
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !pet.state.menuOpen || disposed.value) return
  event.preventDefault()
  clearMenuTimer()
  pet.closeMenu()
  void nextTick(() => {
    if (!disposed.value && petVisible.value) focusPet()
  })
}

function updateFullscreenState() {
  if (disposed.value) return
  const fullscreenElement = typeof document !== 'undefined' ? document.fullscreenElement : null
  if (fullscreenElement && !fullscreenRelease) {
    fullscreenRelease = pet.suspend('native-fullscreen')
  } else if (!fullscreenElement && fullscreenRelease) {
    fullscreenRelease()
    fullscreenRelease = null
  }
}

function loadAssetUrl(
  url: string,
  action: PetAction,
  kind: keyof PetAssetStatus,
): Promise<boolean> {
  if (!mounted.value || disposed.value) return Promise.resolve(false)
  pet.setAssetStatus(action, { [kind]: 'loading' } as Partial<PetAssetStatus>)
  return new Promise<boolean>((resolve) => {
    const image = new Image()
    let settled = false
    image.decoding = 'async'
    image.onload = () => {
      if (settled) return
      settled = true
      const success = mounted.value && !disposed.value
      if (success) {
        pet.setAssetStatus(action, { [kind]: 'ready' } as Partial<PetAssetStatus>)
      }
      resolve(success)
    }
    image.onerror = () => {
      if (settled) return
      settled = true
      const success = mounted.value && !disposed.value
      if (success) {
        pet.setAssetStatus(action, { [kind]: 'error' } as Partial<PetAssetStatus>)
      }
      resolve(false)
    }
    image.src = url
  })
}

function ensureAsset(action: PetAction, kinds: Array<keyof PetAssetStatus> = ['sheet', 'static']) {
  const requested = kinds.filter((kind) => state.assets[action][kind] === 'none')
  if (requested.length === 0 || disposed.value) return Promise.resolve()
  const jobs = requested.map((kind) => {
    const jobKey = `${action}:${kind}`
    const existing = assetJobs.get(jobKey)
    if (existing) return existing
    const job = loadAssetUrl(
      PET_ANIMATION_ASSETS[action][kind === 'sheet' ? 'src' : 'staticSrc'],
      action,
      kind,
    ).finally(() => {
      assetJobs.delete(jobKey)
    })
    assetJobs.set(jobKey, job)
    return job
  })
  return Promise.allSettled(jobs).then(() => undefined)
}

async function loadIdleAndPreloads() {
  if (disposed.value || !mounted.value || state.route.mode === 'hidden') return
  const idle = PET_ANIMATION_ASSETS.idle
  let idleVisualReady = state.assets.idle.static === 'ready' || state.assets.idle.sheet === 'ready'

  if (state.assets.idle.static === 'none') {
    const staticReady = await loadAssetUrl(idle.staticSrc, 'idle', 'static')
    idleVisualReady = staticReady || state.assets.idle.sheet === 'ready'
  }
  if (disposed.value || !mounted.value) return

  if (!idleVisualReady && state.assets.idle.sheet === 'none') {
    const sheetReady = await loadAssetUrl(idle.src, 'idle', 'sheet')
    idleVisualReady = idleVisualReady || sheetReady
  }
  if (disposed.value || !mounted.value) return

  // The coordinator only needs the static flag to expose the host; even a
  // fully failed idle pair must leave the accessible navigation button behind.
  pet.setStaticReady(true)
  if (disposed.value || !mounted.value) return

  if (motionEnabled.value) {
    await ensureAsset('idle', ['sheet'])
  }
  if (disposed.value || !mounted.value) return

  const preloads = PET_CORE_PRELOAD_ACTIONS.filter((action) => action !== 'idle')
  await Promise.allSettled(
    preloads.map((action) =>
      ensureAsset(action, motionEnabled.value ? ['sheet', 'static'] : ['static']),
    ),
  )
}

function maybeLoadInitialAssets() {
  if (
    disposed.value ||
    !mounted.value ||
    initialAssetLoadStarted ||
    state.route.mode === 'hidden' ||
    !documentVisible.value
  ) {
    return
  }
  initialAssetLoadStarted = true
  void loadIdleAndPreloads()
}

function setupViewportListeners() {
  if (typeof window === 'undefined') return
  const onMeasure = () => {
    if (!disposed.value) measureViewport()
  }
  window.addEventListener('resize', onMeasure, { passive: true })
  window.visualViewport?.addEventListener('resize', onMeasure, { passive: true })
  window.visualViewport?.addEventListener('scroll', onMeasure, { passive: true })
  cleanupListeners.push(() => {
    window.removeEventListener('resize', onMeasure)
    window.visualViewport?.removeEventListener('resize', onMeasure)
    window.visualViewport?.removeEventListener('scroll', onMeasure)
  })
}

function setupInteractionListeners() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  document.addEventListener('focusin', onDocumentFocusIn)
  document.addEventListener('keydown', onDocumentKeyDown)
  document.addEventListener('fullscreenchange', updateFullscreenState)
  window.addEventListener('fullscreenerror', updateFullscreenState)
  cleanupListeners.push(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
    document.removeEventListener('focusin', onDocumentFocusIn)
    document.removeEventListener('keydown', onDocumentKeyDown)
    document.removeEventListener('fullscreenchange', updateFullscreenState)
    window.removeEventListener('fullscreenerror', updateFullscreenState)
  })
}

function disconnectPetHost() {
  if (disposed.value && cleanupListeners.length === 0 && !pointerController) {
    return
  }
  clearMenuTimer()
  detachPointer()
  proximityController?.detach()
  proximityController = null
  fullscreenRelease?.()
  fullscreenRelease = null
  cleanupListeners.splice(0).forEach((cleanup) => cleanup())
  placed.value = false
}

watch(petVisible, () => syncPointerAttachment(), { flush: 'post' })

watch(
  () => [state.animation.action, state.attention.phase] as const,
  ([action]) => {
    if (!mounted.value || disposed.value) return
    if (action !== 'idle') {
      void ensureAsset(action, motionEnabled.value ? ['sheet', 'static'] : ['static'])
    }
    proximityController?.reevaluate()
  },
)

watch(
  () => [state.paused, state.route.mode] as const,
  () => {
    if (!mounted.value || disposed.value) return
    if (state.paused || state.route.mode === 'hidden') {
      detachPointer()
    }
    proximityController?.reevaluate()
    maybeLoadInitialAssets()
  },
)

watch(
  () => state.menuOpen,
  (open) => {
    if (!open) clearMenuTimer()
  },
)

watch(
  () => route.fullPath,
  () => {
    if (!mounted.value || disposed.value) return
    clearMenuTimer()
    pet.closeMenu()
    detachPointer()
    void nextTick(syncPointerAttachment)
  },
)

watch(
  () => [interaction.state.motionEnabled, interaction.state.documentVisible] as const,
  ([motion, visible]) => {
    if (!mounted.value || disposed.value) return
    pet.syncEnvironment(motion, visible)
    if (visible && !state.paused && state.route.mode !== 'hidden') {
      maybeLoadInitialAssets()
    }
    proximityController?.reevaluate()
  },
)

onMounted(() => {
  clientMounted.value = true
  mounted.value = true
  measureViewport()
  setupViewportListeners()
  setupInteractionListeners()
  setupProximity()
  pet.syncEnvironment(interaction.state.motionEnabled, interaction.state.documentVisible)
  const disconnect = pet.connect()
  cleanupListeners.push(disconnect)
  updateFullscreenState()
  maybeLoadInitialAssets()
  void nextTick(syncPointerAttachment)
})

onBeforeUnmount(() => {
  disposed.value = true
  disconnectPetHost()
})
</script>

<style scoped>
.pet-host-spot {
  will-change: transform;
}

.pet-host-hit {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
