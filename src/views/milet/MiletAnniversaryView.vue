<template>
  <main
    ref="pageRoot"
    class="anniversary-page relative bg-[#f8fcfb] text-[#1f2b35]"
    :class="{
      'is-archive': showArchiveIndex,
      'is-compact': !showArchiveIndex && compactMode,
      'is-stage': storyStage,
      'is-content-hidden': !chapterContentVisible,
    }"
    :data-anniversary-mode="showArchiveIndex ? 'archive' : compactMode ? 'compact' : 'stage'"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="anniversary-wash absolute inset-0" aria-hidden="true"></div>
    <div class="anniversary-beams absolute inset-0" aria-hidden="true"></div>
    <div class="echo-fragments absolute inset-0" aria-hidden="true">
      <span
        v-for="fragment in echoFragments"
        :key="`${fragment.id}-${fragmentCycle}`"
        :class="`is-${fragment.kind}`"
        :style="fragment.style"
      ></span>
    </div>
    <div class="anniversary-wave absolute inset-x-0 bottom-0 h-32" aria-hidden="true"></div>

    <header class="anniversary-header z-40 flex min-h-16 items-center justify-between px-5 text-sm sm:px-8">
      <RouterLink
        :to="{ name: 'milet', params: { lang: routeLang } }"
        class="brand-pill px-5 py-2.5 font-semibold text-[#276d7b] shadow-sm transition focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#317f8d]"
      >
        echoes of milet
      </RouterLink>
      <span class="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[#6a7a85] sm:block">
        anniversary gift
      </span>
    </header>

    <AnniversaryArchiveIndex
      v-if="showArchiveIndex"
      :content="content"
      :available-years="availableYears"
      :route-lang="routeLang"
      :lang="lang"
    />

    <template v-else>
      <AnniversaryChapterNav
        :chapters="content.chapters"
        :active-chapter="activeChapter"
        :compact="compactMode"
        :lang="lang"
        @select-chapter="goChapter"
      />

      <AnniversaryEchoRibbon
        :active-chapter="activeChapter"
        :chapter-count="content.chapters.length"
        :motion-cycle="motionCycle"
      />

      <div
        class="anniversary-track relative z-10 flex"
        :class="{ 'is-compact': compactMode, 'is-stage': storyStage, 'no-track-transition': !trackTransitionEnabled }"
        :style="trackTransformStyle"
      >
        <AnniversaryIntroSection
          :chapter="content.chapters[0]"
          :content="content"
          :anniversary-no="anniversaryNo"
          :lang="lang"
          :active="compactMode || activeChapter === 0"
          :motion-active="activeChapter === 0"
          :motion-cycle="motionCycle"
          :play-entrance="introMotionPlayed"
          @next="goChapter(1, 'control')"
        />

        <AnniversaryYearReviewSection
          :chapter="content.chapters[1]"
          :timeline="content.timeline"
          :active-moment="activeMoment"
          :active-moment-index="activeMomentIndex"
          :progress="momentProgress"
          :paused="momentPaused"
          :lang="lang"
          :active="compactMode || activeChapter === 1"
          :moment-echo-key="momentEchoKey"
          :manual-echo-active="manualEchoActive"
          @select-moment="selectMoment"
          @toggle-pause="toggleMomentPause"
          @interaction-pause="pauseForInteraction"
          @interaction-resume="resumeFromInteraction"
        />

        <AnniversaryReleaseSection
          :chapter="content.chapters[2]"
          :releases="content.releases"
          :active-release="activeRelease"
          :active-release-index="activeReleaseIndex"
          :lang="lang"
          :active="compactMode || activeChapter === 2"
          :motion-active="activeChapter === 2"
          :motion-cycle="motionCycle"
          @select-release="selectRelease"
        />

        <AnniversaryPhotoSection
          :chapter="content.chapters[3]"
          :photos="content.photos"
          :current-photo-index="currentPhotoIndex"
          :assembled="photoAssembled"
          :resetting="photoResetting"
          :lang="lang"
          :route-lang="routeLang"
          :anniversary-no="anniversaryNo"
          :active="compactMode || activeChapter === 3"
          :motion-active="activeChapter === 3"
          @replay="replayPhotoFilm"
          @interaction-pause="pausePhotoInteraction"
          @interaction-resume="resumePhotoInteraction"
        />
      </div>

      <AnniversaryChapterControls
        v-if="storyStage"
        :at-start="activeChapter === 0"
        :at-end="activeChapter === content.chapters.length - 1"
        :lang="lang"
        @prev="goChapter(activeChapter - 1, 'control')"
        @next="goChapter(activeChapter + 1, 'control')"
      />

      <p v-if="storyStage && showNavigationHint" class="navigation-hint" aria-hidden="true">
        {{ lang === 'ja' ? 'スクロール / 矢印キーで章をめぐる' : '滚动 / 方向键浏览章节' }}
      </p>
      <p class="sr-only" aria-live="polite">{{ chapterAnnouncement }}</p>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import AnniversaryArchiveIndex from '@/components/milet/anniversary/AnniversaryArchiveIndex.vue'
import AnniversaryChapterControls from '@/components/milet/anniversary/AnniversaryChapterControls.vue'
import AnniversaryChapterNav from '@/components/milet/anniversary/AnniversaryChapterNav.vue'
import AnniversaryEchoRibbon from '@/components/milet/anniversary/AnniversaryEchoRibbon.vue'
import AnniversaryIntroSection from '@/components/milet/anniversary/AnniversaryIntroSection.vue'
import AnniversaryPhotoSection from '@/components/milet/anniversary/AnniversaryPhotoSection.vue'
import AnniversaryReleaseSection from '@/components/milet/anniversary/AnniversaryReleaseSection.vue'
import AnniversaryYearReviewSection from '@/components/milet/anniversary/AnniversaryYearReviewSection.vue'
import {
  anniversaryArchiveConfig,
  anniversaryLang,
  buildAnniversaryPayloadFromConfig,
  getAvailableAnniversaryYears,
  getAnniversaryRecord,
  getAnniversaryRecordContent,
  normalizeAnniversaryPayload,
  type AnniversaryApiPayload,
  type AnniversaryRecord,
} from '@/composables/miletAnniversary'
import { useAppState } from '@/composables/useAppState'
import { usePageScroll, usePageScrollRestoration, type ScrollSnapshot } from '@/composables/page-scroll'
import { apiRoutes } from '@/config/api'

type ChapterInputSource = 'observer' | 'wheel' | 'keyboard' | 'pointer' | 'control' | 'restore'

interface AnniversaryPageState {
  activeChapter: number
  activeMomentIndex: number
  activeReleaseIndex: number
  momentPaused: boolean
  photoAssembled: boolean
  currentPhotoIndex: number
}

const appState = useAppState()
const route = useRoute()
const pageScroll = usePageScroll()
const pageRoot = ref<HTMLElement | null>(null)

const activeChapter = ref(0)
const activeMomentIndex = ref(0)
const activeReleaseIndex = ref(0)
const momentProgress = ref(0)
const momentPaused = ref(false)
const momentInteractionPaused = ref(false)
const momentEchoKey = ref(0)
const manualEchoActive = ref(false)
const currentPhotoIndex = ref(-1)
const photoAssembled = ref(false)
const photoPlaying = ref(false)
const photoResetting = ref(false)
const photoInteractionPaused = ref(false)
const compactMode = ref(true)
const reducedMotion = ref(false)
const pageVisible = ref(true)
const introMotionPlayed = ref(false)
const restoringState = ref(false)
const chapterContentVisible = ref(true)
const trackTransitionEnabled = ref(true)
const chapterTransitionLocked = ref(false)
const showNavigationHint = ref(true)
const fragmentCycle = ref(0)
const motionCycle = ref(0)
const touchStart = ref({ x: 0, y: 0 })

const momentAutoplayMs = 5200
const photoStepMs = 420
const photoLoopDelayMs = 5600
const ambientLoopMs = 7600
let momentTimer = 0
let photoTimer = 0
let photoLoopTimer = 0
let ambientLoopTimer = 0
let chapterTimer = 0
let wheelResetTimer = 0
let momentEchoTimer = 0
let wheelAccumulator = 0
let wheelGestureConsumed = false
let chapterObserver: IntersectionObserver | null = null
let reducedMotionQuery: MediaQueryList | null = null
let unsubscribeScrollFrame: (() => void) | null = null
let anniversaryRequestController: AbortController | null = null
let anniversaryRequestGeneration = 0
let photoRunToken = 0
let restorationSessionId = 0
let clearRestorationAbortHandler: (() => void) | null = null

const routeLang = computed(() => String(route.params.lang || 'zh'))
const routeYear = computed(() => String(route.params.year || ''))
const lang = computed(() => anniversaryLang(routeLang.value))
const fallbackPayload = buildAnniversaryPayloadFromConfig(anniversaryArchiveConfig)
const anniversaryPayload = ref<AnniversaryApiPayload | null>(appState.miletAnniversaryData)
const resolvedAnniversaryPayload = computed(() => anniversaryPayload.value ?? fallbackPayload)
const loadingAnniversary = ref(false)
const loadedAnniversaryEndpoint = ref(appState.miletAnniversaryData ? anniversaryApiUrl() : '')
const availableYears = computed(() =>
  resolvedAnniversaryPayload.value.recordYears?.length
    ? resolvedAnniversaryPayload.value.recordYears
    : getAvailableAnniversaryYears(anniversaryArchiveConfig),
)
const showArchiveIndex = computed(() => !routeYear.value)
const storyStage = computed(() => !showArchiveIndex.value && !compactMode.value)
const record = computed<AnniversaryRecord>(() =>
  resolvedAnniversaryPayload.value.record ??
  (getAnniversaryRecord(routeYear.value, anniversaryArchiveConfig) as AnniversaryRecord),
)
const content = computed(() => getAnniversaryRecordContent(record.value, lang.value))
const anniversaryNo = computed(() => record.value.anniversaryNo)
const activeMoment = computed(() => content.value.timeline[activeMomentIndex.value])
const activeRelease = computed(() => content.value.releases[activeReleaseIndex.value])
const pageTitle = computed(() =>
  lang.value === 'ja'
    ? `milet anniversary ${record.value.year} | Echoes of milet`
    : `milet 周年记录 ${record.value.year} | Echoes of milet`,
)
const chapterAnnouncement = computed(() => {
  if (showArchiveIndex.value) return ''
  const chapter = content.value.chapters[activeChapter.value]
  return lang.value === 'ja'
    ? `${activeChapter.value + 1}章、${chapter.title}`
    : `第 ${activeChapter.value + 1} 章，${chapter.title}`
})
const trackTransformStyle = computed(() => ({
  transform: storyStage.value ? `translate3d(-${activeChapter.value * 100}%, 0, 0)` : 'none',
}))

const echoFragments = computed(() => {
  let seed = record.value.year * 97 + anniversaryNo.value * 31
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const kinds = ['wave', 'tick', 'ring', 'light'] as const
  return Array.from({ length: 8 }, (_, index) => ({
    id: `${record.value.year}-${index}`,
    kind: kinds[index % kinds.length],
    style: {
      left: `${5 + next() * 90}%`,
      top: `${12 + next() * 76}%`,
      '--fragment-delay': `${Math.round(next() * 420)}ms`,
      '--fragment-rotation': `${Math.round(next() * 80 - 40)}deg`,
    },
  }))
})

function anniversaryApiUrl() {
  return routeYear.value ? `${apiRoutes.miletAnniversary}/${routeYear.value}` : apiRoutes.miletAnniversary
}

async function loadAnniversaryData(force = false) {
  const endpoint = anniversaryApiUrl()
  if (!force && (loadingAnniversary.value || loadedAnniversaryEndpoint.value === endpoint)) return
  anniversaryRequestController?.abort()
  const controller = new AbortController()
  const generation = ++anniversaryRequestGeneration
  anniversaryRequestController = controller
  loadingAnniversary.value = true
  try {
    const response = await axiosInstance.get(endpoint, { signal: controller.signal })
    if (controller.signal.aborted || generation !== anniversaryRequestGeneration) return
    const payload = normalizeAnniversaryPayload(response)
    if (payload) {
      anniversaryPayload.value = payload
      appState.miletAnniversaryData = payload
      loadedAnniversaryEndpoint.value = endpoint
    }
  } catch (error) {
    if (!controller.signal.aborted) console.error('anniversary data fetch error', error)
  } finally {
    if (generation === anniversaryRequestGeneration) {
      loadingAnniversary.value = false
      anniversaryRequestController = null
    }
  }
}

function clampChapter(index: number) {
  return Math.max(0, Math.min(content.value.chapters.length - 1, index))
}

function clearChapterTimer() {
  if (chapterTimer) window.clearTimeout(chapterTimer)
  chapterTimer = 0
}

function waitForChapterDelay(ms: number) {
  return new Promise<void>((resolve) => {
    clearChapterTimer()
    chapterTimer = window.setTimeout(() => {
      chapterTimer = 0
      resolve()
    }, ms)
  })
}

async function goChapter(index: number, source: ChapterInputSource = 'pointer') {
  const nextIndex = clampChapter(index)
  showNavigationHint.value = false

  if (compactMode.value) {
    activeChapter.value = nextIndex
    fragmentCycle.value += 1
    if (source !== 'observer') {
      await nextTick()
      pageScroll.scrollToAnchor(`anniversary-chapter-${content.value.chapters[nextIndex].id}`, {
        behavior: reducedMotion.value ? 'auto' : 'smooth',
        offset: 64,
      })
      if (source === 'keyboard') window.setTimeout(() => focusChapterHeading(nextIndex), 260)
    }
    return
  }

  if (nextIndex === activeChapter.value || chapterTransitionLocked.value) return
  chapterTransitionLocked.value = true
  const directJump = Math.abs(nextIndex - activeChapter.value) > 1
  chapterContentVisible.value = false
  await waitForChapterDelay(reducedMotion.value ? 1 : 200)

  if (directJump) trackTransitionEnabled.value = false
  activeChapter.value = nextIndex
  fragmentCycle.value += 1
  await nextTick()
  if (directJump) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    trackTransitionEnabled.value = true
  }
  chapterContentVisible.value = true
  await waitForChapterDelay(reducedMotion.value ? 1 : directJump ? 220 : 650)
  chapterTransitionLocked.value = false
  if (source === 'keyboard' || source === 'control') focusChapterHeading(nextIndex)
  syncTimers()
}

function focusChapterHeading(index: number) {
  const id = content.value.chapters[index]?.id
  if (!id) return
  pageRoot.value
    ?.querySelector<HTMLElement>(`#anniversary-chapter-${id} [data-anniversary-heading]`)
    ?.focus({ preventScroll: true })
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-scroll-region], [data-scroll-contain]',
    ),
  )
}

function handleWheel(event: WheelEvent) {
  if (!storyStage.value || event.ctrlKey || isInteractiveTarget(event.target)) return
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
  if (!delta) return

  if (wheelResetTimer) window.clearTimeout(wheelResetTimer)
  wheelResetTimer = window.setTimeout(() => {
    wheelAccumulator = 0
    wheelGestureConsumed = false
  }, 190)

  if (wheelGestureConsumed || chapterTransitionLocked.value) {
    event.preventDefault()
    return
  }

  wheelAccumulator += delta
  if (Math.abs(wheelAccumulator) < 78) return
  const direction = wheelAccumulator > 0 ? 1 : -1
  const destination = activeChapter.value + direction
  wheelAccumulator = 0
  if (destination < 0 || destination >= content.value.chapters.length) return
  wheelGestureConsumed = true
  event.preventDefault()
  void goChapter(destination, 'wheel')
}

function handleKeydown(event: KeyboardEvent) {
  if (!storyStage.value || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (isInteractiveTarget(event.target)) return
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const destination = activeChapter.value + (event.key === 'ArrowRight' ? 1 : -1)
  if (destination < 0 || destination >= content.value.chapters.length) return
  event.preventDefault()
  void goChapter(destination, 'keyboard')
}

function handleTouchStart(event: TouchEvent) {
  if (!storyStage.value || isInteractiveTarget(event.target)) return
  const touch = event.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(event: TouchEvent) {
  if (!storyStage.value || isInteractiveTarget(event.target)) return
  const touch = event.changedTouches[0]
  const dx = touch.clientX - touchStart.value.x
  const dy = touch.clientY - touchStart.value.y
  if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return
  void goChapter(activeChapter.value + (dx < 0 ? 1 : -1), 'pointer')
}

function clearMomentTimer() {
  if (momentTimer) window.clearInterval(momentTimer)
  momentTimer = 0
}

function clearPhotoTimer() {
  photoRunToken += 1
  if (photoTimer) window.clearTimeout(photoTimer)
  photoTimer = 0
}

function clearPhotoLoopTimer() {
  if (photoLoopTimer) window.clearTimeout(photoLoopTimer)
  photoLoopTimer = 0
}

function clearAmbientLoopTimer() {
  if (ambientLoopTimer) window.clearInterval(ambientLoopTimer)
  ambientLoopTimer = 0
}

function canRunMomentTimer() {
  return activeChapter.value === 1 && !momentPaused.value && !momentInteractionPaused.value && pageVisible.value && !reducedMotion.value
}

function startMomentAutoplay() {
  clearMomentTimer()
  if (!canRunMomentTimer()) return
  const step = 80
  momentTimer = window.setInterval(() => {
    momentProgress.value += (step / momentAutoplayMs) * 100
    if (momentProgress.value >= 100) {
      activeMomentIndex.value = (activeMomentIndex.value + 1) % content.value.timeline.length
      momentProgress.value = 0
    }
  }, step)
}

function selectMoment(index: number) {
  activeMomentIndex.value = Math.max(0, Math.min(content.value.timeline.length - 1, index))
  momentProgress.value = 0
  momentPaused.value = true
  momentEchoKey.value += 1
  manualEchoActive.value = true
  if (momentEchoTimer) window.clearTimeout(momentEchoTimer)
  momentEchoTimer = window.setTimeout(() => {
    manualEchoActive.value = false
    momentEchoTimer = 0
  }, 540)
  clearMomentTimer()
}

function toggleMomentPause() {
  momentPaused.value = !momentPaused.value
  if (momentPaused.value) clearMomentTimer()
  else startMomentAutoplay()
}

function pauseForInteraction() {
  momentInteractionPaused.value = true
  clearMomentTimer()
}

function resumeFromInteraction() {
  momentInteractionPaused.value = false
  startMomentAutoplay()
}

function selectRelease(index: number) {
  activeReleaseIndex.value = Math.max(0, Math.min(content.value.releases.length - 1, index))
}

function canRunPhotoFilm() {
  return (
    activeChapter.value === 3 &&
    chapterContentVisible.value &&
    !chapterTransitionLocked.value &&
    !restoringState.value &&
    pageVisible.value &&
    !reducedMotion.value &&
    !photoInteractionPaused.value &&
    content.value.photos.length > 0
  )
}

function schedulePhotoLoop() {
  clearPhotoLoopTimer()
  if (!photoAssembled.value || !canRunPhotoFilm()) return
  const runToken = photoRunToken
  photoLoopTimer = window.setTimeout(() => {
    photoLoopTimer = 0
    if (runToken !== photoRunToken || !canRunPhotoFilm()) return
    restartPhotoFilm()
  }, photoLoopDelayMs)
}

function continuePhotoFilm() {
  clearPhotoTimer()
  if (!photoPlaying.value || !canRunPhotoFilm()) return
  const runToken = photoRunToken
  const revealNext = () => {
    if (runToken !== photoRunToken || !canRunPhotoFilm()) return
    if (currentPhotoIndex.value >= content.value.photos.length - 1) {
      clearPhotoTimer()
      photoPlaying.value = false
      photoAssembled.value = true
      schedulePhotoLoop()
      return
    }
    currentPhotoIndex.value += 1
    photoTimer = window.setTimeout(revealNext, photoStepMs)
  }
  photoTimer = window.setTimeout(revealNext, photoStepMs)
}

function restartPhotoFilm() {
  clearPhotoTimer()
  clearPhotoLoopTimer()
  if (reducedMotion.value) {
    currentPhotoIndex.value = content.value.photos.length - 1
    photoAssembled.value = true
    photoPlaying.value = false
    photoResetting.value = false
    return
  }
  photoResetting.value = true
  photoAssembled.value = false
  currentPhotoIndex.value = -1
  photoPlaying.value = false
  const resetRunToken = photoRunToken
  nextTick(() => {
    window.requestAnimationFrame(() => {
      if (resetRunToken !== photoRunToken) return
      photoResetting.value = false
      if (!canRunPhotoFilm()) return
      photoPlaying.value = true
      continuePhotoFilm()
    })
  })
}

function replayPhotoFilm() {
  photoInteractionPaused.value = false
  restartPhotoFilm()
}

function pausePhotoInteraction() {
  photoInteractionPaused.value = true
  clearPhotoTimer()
  clearPhotoLoopTimer()
  photoResetting.value = false
}

function resumePhotoInteraction() {
  photoInteractionPaused.value = false
  syncTimers()
}

function canRunAmbientMotion() {
  return !showArchiveIndex.value && pageVisible.value && !reducedMotion.value
}

function restartAmbientMotion() {
  clearAmbientLoopTimer()
  if (!canRunAmbientMotion()) return
  motionCycle.value += 1
  fragmentCycle.value += 1
  ambientLoopTimer = window.setInterval(() => {
    motionCycle.value += 1
    fragmentCycle.value += 1
  }, ambientLoopMs)
}

function syncTimers() {
  clearMomentTimer()
  clearPhotoTimer()
  clearPhotoLoopTimer()
  photoResetting.value = false
  if (canRunMomentTimer()) startMomentAutoplay()
  if (!canRunPhotoFilm()) return
  if (photoPlaying.value || (!photoAssembled.value && currentPhotoIndex.value < content.value.photos.length - 1)) {
    photoPlaying.value = true
    continuePhotoFilm()
    return
  }
  if (!photoAssembled.value) {
    photoPlaying.value = false
    photoAssembled.value = true
  }
  schedulePhotoLoop()
}

function syncViewportMode() {
  const width = window.innerWidth
  const height = window.innerHeight
  const nextCompact = width <= 767 || height <= 640 || (height < 700 && width / Math.max(height, 1) >= 1.5)
  if (compactMode.value !== nextCompact) {
    compactMode.value = nextCompact
    chapterContentVisible.value = true
    trackTransitionEnabled.value = false
    nextTick(() => {
      trackTransitionEnabled.value = true
      setupChapterObserver()
      if (nextCompact) {
        pageScroll.scrollToAnchor(`anniversary-chapter-${content.value.chapters[activeChapter.value].id}`, { behavior: 'auto', offset: 64 })
      }
      pageScroll.invalidateMetrics()
    })
  }
}

function setupChapterObserver() {
  chapterObserver?.disconnect()
  chapterObserver = null
  if (!compactMode.value || showArchiveIndex.value || typeof IntersectionObserver === 'undefined') return
  nextTick(() => {
    const target = pageScroll.getTarget()
    const root = target?.kind === 'element' ? target.target : null
    chapterObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const index = content.value.chapters.findIndex((chapter) => visible.target.id === `anniversary-chapter-${chapter.id}`)
        if (index >= 0 && index !== activeChapter.value) void goChapter(index, 'observer')
      },
      { root, rootMargin: '-22% 0px -48% 0px', threshold: [0.08, 0.25, 0.5] },
    )
    pageRoot.value?.querySelectorAll<HTMLElement>('[id^="anniversary-chapter-"]').forEach((section) => chapterObserver?.observe(section))
  })
}

function syncActiveChapterFromGeometry() {
  if (!compactMode.value || showArchiveIndex.value) return
  const viewportLine = pageScroll.state.viewportTop + Math.min(180, pageScroll.state.viewportHeight * 0.34)
  const sections = Array.from(
    pageRoot.value?.querySelectorAll<HTMLElement>('[id^="anniversary-chapter-"]') ?? [],
  )
  const activeIndex = sections.findIndex((section) => {
    const rect = section.getBoundingClientRect()
    return rect.top <= viewportLine && rect.bottom > viewportLine
  })
  if (activeIndex >= 0 && activeIndex !== activeChapter.value) {
    activeChapter.value = activeIndex
    fragmentCycle.value += 1
  }
}

function readPageState(snapshot: ScrollSnapshot): AnniversaryPageState | null {
  if (!snapshot.pageState || typeof snapshot.pageState !== 'object') return null
  const candidate = (snapshot.pageState as { anniversary?: unknown }).anniversary
  if (!candidate || typeof candidate !== 'object') return null
  const state = candidate as Partial<AnniversaryPageState>
  if (typeof state.activeChapter !== 'number') return null
  const restoredPhotoIndex = Number(state.currentPhotoIndex)
  return {
    activeChapter: clampChapter(state.activeChapter),
    activeMomentIndex: Math.max(0, Math.min(content.value.timeline.length - 1, Number(state.activeMomentIndex) || 0)),
    activeReleaseIndex: Math.max(0, Math.min(content.value.releases.length - 1, Number(state.activeReleaseIndex) || 0)),
    momentPaused: Boolean(state.momentPaused),
    photoAssembled: state.photoAssembled !== false,
    currentPhotoIndex: Math.max(
      -1,
      Math.min(content.value.photos.length - 1, Number.isFinite(restoredPhotoIndex) ? restoredPhotoIndex : -1),
    ),
  }
}

usePageScrollRestoration({
  capture() {
    return {
      top: pageScroll.state.top,
      max: pageScroll.state.max,
      capturedAt: Date.now(),
      pageState: {
        anniversary: {
          activeChapter: activeChapter.value,
          activeMomentIndex: activeMomentIndex.value,
          activeReleaseIndex: activeReleaseIndex.value,
          momentPaused: momentPaused.value,
          photoAssembled: photoAssembled.value,
          currentPhotoIndex: currentPhotoIndex.value,
        } satisfies AnniversaryPageState,
      },
    }
  },
  async prepare(snapshot, signal) {
    const state = readPageState(snapshot)
    if (!state || signal.aborted) return
    clearRestorationAbortHandler?.()
    const sessionId = ++restorationSessionId
    const previousState = {
      activeChapter: activeChapter.value,
      activeMomentIndex: activeMomentIndex.value,
      activeReleaseIndex: activeReleaseIndex.value,
      momentPaused: momentPaused.value,
      photoAssembled: photoAssembled.value,
      currentPhotoIndex: currentPhotoIndex.value,
      photoPlaying: photoPlaying.value,
      photoResetting: photoResetting.value,
      photoInteractionPaused: photoInteractionPaused.value,
      introMotionPlayed: introMotionPlayed.value,
      showNavigationHint: showNavigationHint.value,
    }
    const previousTrackTransitionEnabled = trackTransitionEnabled.value
    let sessionSettled = false
    const detachAbortHandler = () => signal.removeEventListener('abort', handleAbort)
    const clearAbortHandler = () => {
      if (sessionSettled) return
      sessionSettled = true
      detachAbortHandler()
      if (clearRestorationAbortHandler === clearAbortHandler) clearRestorationAbortHandler = null
    }
    const rollback = async () => {
      if (sessionSettled) return
      sessionSettled = true
      detachAbortHandler()
      if (clearRestorationAbortHandler === clearAbortHandler) clearRestorationAbortHandler = null
      activeChapter.value = previousState.activeChapter
      activeMomentIndex.value = previousState.activeMomentIndex
      activeReleaseIndex.value = previousState.activeReleaseIndex
      momentPaused.value = previousState.momentPaused
      photoAssembled.value = previousState.photoAssembled
      currentPhotoIndex.value = previousState.currentPhotoIndex
      photoPlaying.value = previousState.photoPlaying
      photoResetting.value = previousState.photoResetting
      photoInteractionPaused.value = previousState.photoInteractionPaused
      introMotionPlayed.value = previousState.introMotionPlayed
      showNavigationHint.value = previousState.showNavigationHint
      await nextTick()
      if (sessionId !== restorationSessionId) return
      restoringState.value = false
      trackTransitionEnabled.value = previousTrackTransitionEnabled
      syncTimers()
      restartAmbientMotion()
    }
    function handleAbort() {
      void rollback()
    }
    clearRestorationAbortHandler = clearAbortHandler
    signal.addEventListener('abort', handleAbort, { once: true })
    restoringState.value = true
    showNavigationHint.value = false
    introMotionPlayed.value = true
    activeChapter.value = state.activeChapter
    activeMomentIndex.value = state.activeMomentIndex
    activeReleaseIndex.value = state.activeReleaseIndex
    momentPaused.value = state.momentPaused
    photoAssembled.value = true
    currentPhotoIndex.value = content.value.photos.length - 1
    photoPlaying.value = false
    photoResetting.value = false
    photoInteractionPaused.value = false
    trackTransitionEnabled.value = false
    await nextTick()
    if (signal.aborted) {
      await rollback()
      return
    }
  },
  restore(snapshot) {
    clearRestorationAbortHandler?.()
    if (showArchiveIndex.value || compactMode.value) pageScroll.restoreSnapshot(snapshot, { behavior: 'auto' })
    else pageScroll.scrollToTop({ behavior: 'auto' })
    trackTransitionEnabled.value = true
    restoringState.value = false
    window.requestAnimationFrame(() => {
      syncTimers()
      restartAmbientMotion()
    })
    return true
  },
})

function resetStoryState() {
  clearRestorationAbortHandler?.()
  restorationSessionId += 1
  clearMomentTimer()
  clearPhotoTimer()
  clearPhotoLoopTimer()
  clearAmbientLoopTimer()
  activeChapter.value = 0
  activeMomentIndex.value = 0
  activeReleaseIndex.value = 0
  momentProgress.value = 0
  momentPaused.value = false
  momentInteractionPaused.value = false
  currentPhotoIndex.value = -1
  photoAssembled.value = false
  photoPlaying.value = false
  photoResetting.value = false
  photoInteractionPaused.value = false
  restoringState.value = false
  introMotionPlayed.value = false
  chapterContentVisible.value = true
  pageScroll.scrollToTop({ behavior: 'auto' })
  nextTick(() => {
    pageRoot.value?.querySelectorAll<HTMLElement>('[data-scroll-region]').forEach((region) => region.scrollTo({ top: 0, behavior: 'auto' }))
    setupChapterObserver()
    window.requestAnimationFrame(() => {
      introMotionPlayed.value = !reducedMotion.value
      restartAmbientMotion()
    })
  })
}

function handleVisibilityChange() {
  pageVisible.value = !document.hidden
  syncTimers()
  if (pageVisible.value) restartAmbientMotion()
  else clearAmbientLoopTimer()
}

function handleReducedMotionChange(event: MediaQueryListEvent | MediaQueryList) {
  reducedMotion.value = event.matches
  if (reducedMotion.value) {
    clearMomentTimer()
    clearPhotoTimer()
    clearPhotoLoopTimer()
    clearAmbientLoopTimer()
    photoPlaying.value = false
    photoResetting.value = false
    currentPhotoIndex.value = content.value.photos.length - 1
    photoAssembled.value = true
  } else {
    introMotionPlayed.value = true
    syncTimers()
    restartAmbientMotion()
  }
}

watch(activeChapter, (value, previous) => {
  if (restoringState.value) {
    clearMomentTimer()
    clearPhotoTimer()
    clearPhotoLoopTimer()
    clearAmbientLoopTimer()
    return
  }
  if (value === 3 && previous !== 3 && !reducedMotion.value) restartPhotoFilm()
  else syncTimers()
  restartAmbientMotion()
})

watch(lang, () => {
  if (typeof document !== 'undefined') document.title = pageTitle.value
})

watch(routeYear, (value, previous) => {
  if (typeof document !== 'undefined') document.title = pageTitle.value
  void loadAnniversaryData(true)
  if (value !== previous) resetStoryState()
})

onServerPrefetch(() => loadAnniversaryData())

onMounted(() => {
  document.title = pageTitle.value
  void loadAnniversaryData()
  pageVisible.value = !document.hidden
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  handleReducedMotionChange(reducedMotionQuery)
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  syncViewportMode()
  setupChapterObserver()
  unsubscribeScrollFrame = pageScroll.subscribeScrollFrame(syncActiveChapterFromGeometry)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', syncViewportMode)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  pageRoot.value?.addEventListener('wheel', handleWheel, { passive: false })
})

onBeforeUnmount(() => {
  anniversaryRequestController?.abort()
  clearRestorationAbortHandler?.()
  restorationSessionId += 1
  clearMomentTimer()
  clearPhotoTimer()
  clearPhotoLoopTimer()
  clearAmbientLoopTimer()
  clearChapterTimer()
  if (wheelResetTimer) window.clearTimeout(wheelResetTimer)
  if (momentEchoTimer) window.clearTimeout(momentEchoTimer)
  chapterObserver?.disconnect()
  unsubscribeScrollFrame?.()
  reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', syncViewportMode)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  pageRoot.value?.removeEventListener('wheel', handleWheel)
})
</script>

<style scoped>
.anniversary-page {
  --anniversary-exit-duration: 200ms;
  --anniversary-track-duration: 650ms;
  --anniversary-enter-duration: 220ms;
  --anniversary-micro-duration: 180ms;
  --anniversary-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  isolation: isolate;
  width: 100%;
  overflow-x: clip;
}

.anniversary-page.is-stage { height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; }
.anniversary-page.is-archive, .anniversary-page.is-compact { min-height: 100dvh; overflow: visible; }
.anniversary-header { position: absolute; inset: 0 0 auto; pointer-events: none; }
.anniversary-header .brand-pill { pointer-events: auto; }
.is-archive .anniversary-header, .is-compact .anniversary-header { position: relative; }
.anniversary-wash { z-index: 0; background: radial-gradient(circle at 28% 22%,rgba(255,255,255,.96),transparent 28%), linear-gradient(135deg,#fff 0%,#eef8ff 46%,#f9f1d8 100%); }
.anniversary-beams { z-index: 1; background: linear-gradient(112deg,transparent 0%,transparent 22%,rgba(116,183,213,.2) 28%,transparent 44%), linear-gradient(64deg,transparent 0%,transparent 48%,rgba(221,190,95,.18) 58%,transparent 74%); opacity: .72; animation: beam-arrival 1600ms ease-out 1 both; }
.anniversary-wave { z-index: 2; background: repeating-linear-gradient(90deg,rgba(49,127,141,.12) 0,rgba(49,127,141,.12) 1px,transparent 1px,transparent 16px), linear-gradient(180deg,rgba(255,255,255,0),rgba(49,127,141,.12)); mask-image: linear-gradient(180deg,transparent 0%,#000 28%,#000 100%); pointer-events: none; }
.echo-fragments { z-index: 3; overflow: hidden; pointer-events: none; }
.echo-fragments span { position: absolute; display: block; opacity: 0; transform: rotate(var(--fragment-rotation)); animation: fragment-echo 1700ms var(--anniversary-ease-out) var(--fragment-delay) 1 both; }
.echo-fragments .is-wave { width: 1.7rem; height: .18rem; border-radius: 999px; background: rgba(49,127,141,.28); box-shadow: .45rem .32rem 0 rgba(49,127,141,.13); }
.echo-fragments .is-tick { width: 1px; height: 1.4rem; background: rgba(184,145,47,.35); }
.echo-fragments .is-ring { width: .85rem; height: .85rem; border: 1px solid rgba(49,127,141,.3); border-radius: 50%; }
.echo-fragments .is-light { width: .42rem; height: .42rem; border-radius: 50%; background: rgba(255,255,255,.9); box-shadow: 0 0 12px rgba(221,190,95,.58); }

.anniversary-track.is-stage { width: 100%; height: 100%; flex-direction: row; transition: transform var(--anniversary-track-duration) var(--anniversary-ease-out); }
.anniversary-track.no-track-transition { transition: none; }
.anniversary-track.is-compact { width: 100%; flex-direction: column; }
:deep(.anniversary-slide) { display: flex; width: 100%; flex: 0 0 100%; align-items: center; }
.anniversary-track.is-stage :deep(.anniversary-slide) {
  box-sizing: border-box;
  height: 100%;
  padding-block: 5.5rem 3rem;
}
.anniversary-track.is-stage :deep(.mobile-slide-shell) { max-height: 100%; padding-block: 0; }
.anniversary-track.is-compact :deep(.anniversary-slide) { min-height: max(100svh, 42rem); align-items: center; padding: 2.75rem 0 5rem; }
.anniversary-track.is-compact :deep(.mobile-slide-shell) { padding-top: 0; }
.is-content-hidden :deep(.anniversary-slide:not([aria-hidden='true']) .anniversary-copy),
.is-content-hidden :deep(.anniversary-slide:not([aria-hidden='true']) .anniversary-body),
.is-content-hidden :deep(.anniversary-slide:not([aria-hidden='true']) .anniversary-actions) { opacity: 0; transform: translateY(6px); transition-duration: var(--anniversary-exit-duration); }
:deep(.anniversary-copy), :deep(.anniversary-body), :deep(.anniversary-actions) { transition: opacity var(--anniversary-enter-duration) ease, transform var(--anniversary-enter-duration) var(--anniversary-ease-out); }
:deep(.anniversary-body) { transition-delay: 50ms; }
:deep(.anniversary-actions) { transition-delay: 100ms; }
.brand-pill { border: none; position: relative; display: inline-flex; min-height: 2.75rem; align-items: center; font-family: Montserrat,sans-serif; font-size: 1.1rem; background: linear-gradient(135deg,rgba(255,255,255,.94),rgba(236,247,250,.84)); clip-path: polygon(0 20%,86% 20%,100% 50%,86% 80%,0 80%,8% 50%); box-shadow: 0 14px 36px -28px rgba(31,43,53,.72); }
.brand-pill::after { content: ''; position: absolute; right: .9rem; top: 50%; width: .42rem; height: .42rem; border-radius: 50%; background: rgba(39,109,123,.24); transform: translateY(-50%); }
.navigation-hint { position: absolute; right: 50%; bottom: 1rem; z-index: 30; border-radius: 999px; background: rgba(255,255,255,.78); padding: .55rem 1rem; color: #60717b; font-size: .7rem; font-weight: 700; letter-spacing: .08em; transform: translateX(50%); animation: navigation-hint 2.4s ease-out 1 both; }
button, .brand-pill { cursor: pointer; }
@keyframes beam-arrival { from { opacity: 0; transform: translateX(-1.2%); } to { opacity: .72; transform: translateX(0); } }
@keyframes fragment-echo { 0% { opacity: 0; transform: rotate(var(--fragment-rotation)) scale(.7); } 22%, 64% { opacity: .58; } 100% { opacity: 0; transform: rotate(calc(var(--fragment-rotation) + 20deg)) translateY(-1.1rem) scale(1); } }
@keyframes navigation-hint { 0% { opacity: 0; transform: translate(50%,.4rem); } 20%, 78% { opacity: .86; transform: translate(50%,0); } 100% { opacity: .36; } }

@media (max-width: 767px), (max-height: 640px), (max-height: 699px) and (min-aspect-ratio: 3/2) {
  .anniversary-page:not(.is-archive) { min-height: 100dvh; height: auto; overflow: visible; }
  .anniversary-track:not(.is-stage) { width: 100%; height: auto; flex-direction: column; transform: none !important; }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide) { width: 100%; height: auto; min-height: max(100svh,42rem); flex: none; }
  .anniversary-track:not(.is-stage) :deep(.mobile-slide-shell) { grid-template-columns: minmax(0,1fr); max-width: 48rem; }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide-intro .mobile-slide-shell > :first-child) { order: 2; }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide-intro .mobile-slide-shell > :last-child) { order: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .anniversary-beams, .echo-fragments span, .navigation-hint, .anniversary-page *, .anniversary-page *::before, .anniversary-page *::after { animation: none !important; transition-duration: 1ms !important; transition-delay: 0ms !important; }
}
</style>
