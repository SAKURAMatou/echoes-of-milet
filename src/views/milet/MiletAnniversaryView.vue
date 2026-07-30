<template>
  <main
    ref="pageRoot"
    class="anniversary-page relative bg-[#f8fcfb] text-[#1f2b35]"
    :class="{
      'is-archive': showArchiveIndex,
      'is-compact': !showArchiveIndex && compactMode,
      'is-stage': storyStage,
      'is-content-hidden': !chapterContentVisible,
      'is-page-hidden': !pageVisible,
    }"
    :data-anniversary-mode="showArchiveIndex ? 'archive' : compactMode ? 'compact' : 'stage'"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="anniversary-wash absolute inset-0" aria-hidden="true"></div>
    <div class="anniversary-beams absolute inset-0" aria-hidden="true"></div>
    <div
      v-if="!showArchiveIndex"
      class="anniversary-atmosphere absolute inset-0"
      :class="[
        `is-chapter-${activeChapter + 1}`,
        motionCycle % 2 === 0 ? 'is-cycle-even' : 'is-cycle-odd',
      ]"
      aria-hidden="true"
    >
      <span class="ambient-orb is-blue"></span>
      <span class="ambient-orb is-gold"></span>
      <span class="ambient-shared-echo">
        <svg
          class="ambient-shared-echo-desktop"
          viewBox="0 0 1200 720"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            class="ambient-shared-arc is-primary"
            d="M -80 530 C 170 330, 335 590, 545 430 S 925 195, 1280 350"
          />
          <path
            class="ambient-shared-arc is-secondary"
            d="M -95 580 C 150 400, 345 640, 575 475 S 930 260, 1290 395"
          />
          <g class="ambient-shared-ticks">
            <path d="M 154 411 l -8 -13" />
            <path d="M 354 500 l -5 -16" />
            <path d="M 566 453 l 4 -17" />
            <path d="M 790 310 l 9 -14" />
            <path d="M 1036 272 l 12 -11" />
          </g>
          <g class="ambient-shared-glints">
            <circle cx="154" cy="411" r="3" />
            <circle cx="566" cy="453" r="2.5" />
            <circle cx="1036" cy="272" r="3" />
          </g>
        </svg>
        <svg
          class="ambient-shared-echo-compact"
          viewBox="0 0 390 844"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            class="ambient-shared-arc is-primary"
            d="M -40 760 C 108 642, 48 438, 188 332 S 286 166, 330 24"
          />
          <path
            class="ambient-shared-arc is-secondary"
            d="M -58 806 C 116 694, 78 478, 214 376 S 296 204, 336 62"
          />
          <g class="ambient-shared-ticks">
            <path d="M 72 652 l -12 -7" />
            <path d="M 105 520 l -14 -3" />
            <path d="M 185 335 l -12 -8" />
            <path d="M 255 244 l -10 -10" />
            <path d="M 311 112 l -11 -9" />
          </g>
          <g class="ambient-shared-glints">
            <circle cx="72" cy="652" r="3" />
            <circle cx="185" cy="335" r="2.5" />
            <circle cx="311" cy="112" r="3" />
          </g>
        </svg>
      </span>
    </div>
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

    <template v-else-if="storyContentReady">
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
        :compact="compactMode"
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
          ref="releaseSection"
          :chapter="content.chapters[2]"
          :releases="content.releases"
          :active-release="activeRelease"
          :active-release-index="activeReleaseIndex"
          :lang="lang"
          :active="compactMode || activeChapter === 2"
          :compact="compactMode"
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

    <section v-else class="anniversary-data-state relative z-10" :aria-busy="loadingAnniversary">
      <div class="anniversary-data-card" role="status">
        <p class="section-eyebrow">anniversary archive</p>
        <h1 class="font-serif text-4xl text-[#1d2b36] sm:text-5xl">
          {{ loadingAnniversary ? dataStateCopy.loading : dataStateCopy.error }}
        </h1>
        <p class="mt-4 max-w-lg text-sm leading-7 text-[#60717b] sm:text-base">
          {{ loadingAnniversary ? dataStateCopy.loadingNote : dataStateCopy.errorNote }}
        </p>
        <button
          v-if="!loadingAnniversary"
          type="button"
          class="data-retry-button mt-7"
          @click="loadAnniversaryData(true)"
        >
          {{ dataStateCopy.retry }}
        </button>
      </div>
    </section>
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
import {
  usePageScroll,
  usePageScrollRestoration,
  type PageScrollFrame,
  type ScrollSnapshot,
} from '@/composables/page-scroll'
import { apiRoutes } from '@/config/api'

type ChapterInputSource = 'observer' | 'wheel' | 'keyboard' | 'pointer' | 'control' | 'restore'

interface AnniversaryPageState {
  contextKey: string
  activeChapter: number
  activeMomentId: string | null
  activeMomentIndex: number
  activeReleaseId: string | null
  activeReleaseIndex: number
  momentPaused: boolean
  photoAssembled: boolean
  currentPhotoIndex: number
}

type AnniversaryDataStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AnniversaryReleaseSectionHandle {
  measureStageOverflow(): boolean | null
}

const appState = useAppState()
const route = useRoute()
const pageScroll = usePageScroll()
const pageRoot = ref<HTMLElement | null>(null)
const releaseSection = ref<AnniversaryReleaseSectionHandle | null>(null)

const activeChapter = ref(0)
const pendingChapter = ref<number | null>(null)
const pendingChapterFocus = ref(false)
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
const viewportCompact = ref(true)
const releaseOverflowCompact = ref(false)
const compactMode = computed(() => viewportCompact.value || releaseOverflowCompact.value)
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
let chapterDelayResolve: ((completed: boolean) => void) | null = null
let compactScrollSettleTimer = 0
let wheelResetTimer = 0
let momentEchoTimer = 0
let wheelAccumulator = 0
let wheelGestureConsumed = false
let chapterObserver: IntersectionObserver | null = null
let reducedMotionQuery: MediaQueryList | null = null
let unsubscribeScrollFrame: (() => void) | null = null
let anniversaryRequestController: AbortController | null = null
let anniversaryRequestGeneration = 0
let anniversaryRequestEndpoint = ''
let chapterTransitionGeneration = 0
let photoRunToken = 0
let restorationSessionId = 0
let clearRestorationAbortHandler: (() => void) | null = null
let pendingRestoredMomentId: string | null = null
let pendingRestoredReleaseId: string | null = null
let releaseFitFrame = 0
let releaseFitGeneration = 0
let anniversaryMounted = false

const routeLang = computed(() => String(route.params.lang || 'zh'))
const routeYear = computed(() => String(route.params.year || ''))
const lang = computed(() => anniversaryLang(routeLang.value))
const fallbackPayload = buildAnniversaryPayloadFromConfig(anniversaryArchiveConfig)
const pageStateContextKey = computed(() => (routeYear.value ? `year:${routeYear.value}` : 'archive'))
const routeFallbackPayload = computed<AnniversaryApiPayload | null>(() => {
  if (!routeYear.value) return fallbackPayload
  const localRecord = anniversaryArchiveConfig.records[routeYear.value]
  if (!localRecord) return null
  return {
    ...fallbackPayload,
    latestYear: localRecord.year,
    record: localRecord,
  }
})
const initialAnniversaryEndpoint = anniversaryApiUrl()
const initialAnniversaryPayload =
  appState.miletAnniversaryData?.key === initialAnniversaryEndpoint &&
  payloadMatchesRoute(appState.miletAnniversaryData.payload)
    ? appState.miletAnniversaryData.payload
    : null
const anniversaryPayload = ref<AnniversaryApiPayload | null>(initialAnniversaryPayload)
const anniversaryDataStatus = ref<AnniversaryDataStatus>(initialAnniversaryPayload ? 'ready' : 'idle')
const resolvedAnniversaryPayload = computed(
  () => anniversaryPayload.value ?? routeFallbackPayload.value ?? fallbackPayload,
)
const loadingAnniversary = computed(() => anniversaryDataStatus.value === 'loading')
const loadedAnniversaryEndpoint = ref(initialAnniversaryPayload ? initialAnniversaryEndpoint : '')
const availableYears = computed(() =>
  resolvedAnniversaryPayload.value.recordYears?.length
    ? resolvedAnniversaryPayload.value.recordYears
    : getAvailableAnniversaryYears(anniversaryArchiveConfig),
)
const showArchiveIndex = computed(() => !routeYear.value)
const storyContentReady = computed(
  () =>
    !showArchiveIndex.value &&
    Boolean(
      (anniversaryPayload.value && payloadMatchesRoute(anniversaryPayload.value)) ||
      routeFallbackPayload.value,
    ),
)
const storyStage = computed(() => !showArchiveIndex.value && !compactMode.value)
const record = computed<AnniversaryRecord>(() =>
  resolvedAnniversaryPayload.value.record ??
  (getAnniversaryRecord(routeYear.value, anniversaryArchiveConfig) as AnniversaryRecord),
)
const content = computed(() => getAnniversaryRecordContent(record.value, lang.value))
const anniversaryNo = computed(() => record.value.anniversaryNo)
const activeMoment = computed(() => content.value.timeline[activeMomentIndex.value] ?? null)
const activeRelease = computed(() => content.value.releases[activeReleaseIndex.value] ?? null)
const pageRecordYear = computed(() => Number(routeYear.value) || record.value.year)
const pageTitle = computed(() =>
  lang.value === 'ja'
    ? `milet anniversary ${pageRecordYear.value} | Echoes of milet`
    : `milet 周年记录 ${pageRecordYear.value} | Echoes of milet`,
)
const dataStateCopy = computed(() =>
  lang.value === 'ja'
    ? {
        loading: '記念の記録を読み込んでいます',
        loadingNote: 'この年のページを準備しています。少しだけお待ちください。',
        error: 'この年の記録を表示できませんでした',
        errorNote: '前の年の内容は表示せず、正しい記録をもう一度取得できます。',
        retry: 'もう一度読み込む',
      }
    : {
        loading: '正在读取周年记录',
        loadingNote: '正在准备这一年的页面，请稍候。',
        error: '暂时无法显示这一年的记录',
        errorNote: '页面不会沿用其他年份的内容，可以重新获取正确记录。',
        retry: '重新加载',
      },
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

function payloadMatchesRoute(payload: AnniversaryApiPayload, expectedYear = routeYear.value) {
  if (!expectedYear) return true
  return payload.record.year === Number(expectedYear)
}

async function loadAnniversaryData(force = false) {
  const endpoint = anniversaryApiUrl()
  const expectedYear = routeYear.value
  if (
    !force &&
    loadedAnniversaryEndpoint.value === endpoint &&
    anniversaryPayload.value &&
    payloadMatchesRoute(anniversaryPayload.value, expectedYear)
  ) return
  if (!force && anniversaryRequestController && anniversaryRequestEndpoint === endpoint) return

  anniversaryRequestController?.abort()
  const controller = new AbortController()
  const generation = ++anniversaryRequestGeneration
  anniversaryRequestController = controller
  anniversaryRequestEndpoint = endpoint
  anniversaryDataStatus.value = 'loading'
  try {
    const response = await axiosInstance.get(endpoint, { signal: controller.signal })
    if (
      controller.signal.aborted ||
      generation !== anniversaryRequestGeneration ||
      endpoint !== anniversaryApiUrl() ||
      expectedYear !== routeYear.value
    ) return
    const payload = normalizeAnniversaryPayload(response)
    if (!payload || !payloadMatchesRoute(payload, expectedYear)) {
      throw new Error(`Invalid anniversary payload for ${endpoint}`)
    }

    const previousMomentId = pendingRestoredMomentId ?? activeMoment.value?.id ?? null
    const previousReleaseId = pendingRestoredReleaseId ?? activeRelease.value?.id ?? null
    anniversaryPayload.value = payload
    appState.miletAnniversaryData = { key: endpoint, payload }
    loadedAnniversaryEndpoint.value = endpoint
    anniversaryDataStatus.value = 'ready'
    reconcileContentState(previousMomentId, previousReleaseId)
    pendingRestoredMomentId = null
    pendingRestoredReleaseId = null
    if (typeof document !== 'undefined') document.title = pageTitle.value
  } catch (error) {
    if (!controller.signal.aborted && generation === anniversaryRequestGeneration) {
      anniversaryDataStatus.value = 'error'
      console.error('anniversary data fetch error', error)
    }
  } finally {
    if (generation === anniversaryRequestGeneration) {
      anniversaryRequestController = null
      anniversaryRequestEndpoint = ''
    }
  }
}

function clampChapter(index: number) {
  return Math.max(0, Math.min(content.value.chapters.length - 1, index))
}

function resolveContentIndex(
  items: Array<{ id: string }>,
  preferredId: string | null | undefined,
  fallbackIndex: number,
) {
  if (!items.length) return 0
  const matchedIndex = preferredId ? items.findIndex((item) => item.id === preferredId) : -1
  if (matchedIndex >= 0) return matchedIndex
  if (preferredId) return 0
  return Math.max(0, Math.min(items.length - 1, fallbackIndex))
}

function reconcileContentState(
  preferredMomentId: string | null = activeMoment.value?.id ?? null,
  preferredReleaseId: string | null = activeRelease.value?.id ?? null,
) {
  activeChapter.value = clampChapter(activeChapter.value)
  activeMomentIndex.value = resolveContentIndex(
    content.value.timeline,
    preferredMomentId,
    activeMomentIndex.value,
  )
  activeReleaseIndex.value = resolveContentIndex(
    content.value.releases,
    preferredReleaseId,
    activeReleaseIndex.value,
  )
  currentPhotoIndex.value = Math.max(
    -1,
    Math.min(content.value.photos.length - 1, currentPhotoIndex.value),
  )

  if (!content.value.timeline.length) {
    momentProgress.value = 0
    if (anniversaryMounted) clearMomentTimer()
  }
  if (!content.value.releases.length) activeReleaseIndex.value = 0
  if (!content.value.photos.length) {
    currentPhotoIndex.value = -1
    photoAssembled.value = true
    photoPlaying.value = false
    if (anniversaryMounted) {
      clearPhotoTimer()
      clearPhotoLoopTimer()
    }
  }
}

function clearChapterTimer() {
  if (chapterTimer && typeof window !== 'undefined') window.clearTimeout(chapterTimer)
  chapterTimer = 0
  chapterDelayResolve?.(false)
  chapterDelayResolve = null
}

function waitForChapterDelay(ms: number, transitionId: number) {
  return new Promise<boolean>((resolve) => {
    clearChapterTimer()
    chapterDelayResolve = resolve
    chapterTimer = window.setTimeout(() => {
      chapterTimer = 0
      chapterDelayResolve = null
      resolve(transitionId === chapterTransitionGeneration)
    }, ms)
  })
}

function cancelChapterTransition() {
  chapterTransitionGeneration += 1
  clearChapterTimer()
  chapterTransitionLocked.value = false
  chapterContentVisible.value = true
  trackTransitionEnabled.value = true
}

async function goChapter(index: number, source: ChapterInputSource = 'pointer') {
  const nextIndex = clampChapter(index)
  showNavigationHint.value = false

  if (compactMode.value) {
    cancelChapterTransition()
    if (source !== 'observer') {
      pendingChapter.value = nextIndex
      pendingChapterFocus.value = source === 'keyboard'
      await nextTick()
      const didScroll = pageScroll.scrollToAnchor(`anniversary-chapter-${content.value.chapters[nextIndex].id}`, {
        behavior: reducedMotion.value ? 'auto' : 'smooth',
        offset: 64,
      })
      if (!didScroll) finishCompactChapterNavigation()
      else scheduleCompactScrollSettle(reducedMotion.value ? 32 : 180)
    }
    return
  }

  if (nextIndex === activeChapter.value || chapterTransitionLocked.value) return
  cancelChapterTransition()
  const transitionId = chapterTransitionGeneration
  chapterTransitionLocked.value = true
  const directJump = Math.abs(nextIndex - activeChapter.value) > 1
  chapterContentVisible.value = false
  if (!(await waitForChapterDelay(reducedMotion.value ? 1 : 200, transitionId))) return

  if (directJump) trackTransitionEnabled.value = false
  activeChapter.value = nextIndex
  fragmentCycle.value += 1
  await nextTick()
  if (transitionId !== chapterTransitionGeneration) return
  if (directJump) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))
    if (transitionId !== chapterTransitionGeneration) return
    trackTransitionEnabled.value = true
  }
  chapterContentVisible.value = true
  if (!(await waitForChapterDelay(reducedMotion.value ? 1 : directJump ? 220 : 650, transitionId))) return
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
  return (
    !showArchiveIndex.value &&
    activeChapter.value === 1 &&
    chapterContentVisible.value &&
    !chapterTransitionLocked.value &&
    !restoringState.value &&
    !momentPaused.value &&
    !momentInteractionPaused.value &&
    pageVisible.value &&
    !reducedMotion.value &&
    content.value.timeline.length > 0
  )
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
  if (!content.value.timeline.length) return
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
  if (!content.value.releases.length) return
  activeReleaseIndex.value = Math.max(0, Math.min(content.value.releases.length - 1, index))
}

function canRunPhotoFilm() {
  return (
    activeChapter.value === 3 &&
    !showArchiveIndex.value &&
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

function applyLayoutModeChange(previousCompact: boolean) {
  const nextCompact = compactMode.value
  if (previousCompact === nextCompact) {
    pageScroll.invalidateMetrics()
    return
  }

  cancelChapterTransition()
  clearCompactChapterNavigation()
  trackTransitionEnabled.value = false
  nextTick(() => {
    if (!anniversaryMounted) return
    trackTransitionEnabled.value = true
    setupChapterObserver()
    if (nextCompact && !restoringState.value) {
      const chapterId = content.value.chapters[activeChapter.value]?.id
      if (chapterId) {
        pageScroll.scrollToAnchor(`anniversary-chapter-${chapterId}`, { behavior: 'auto', offset: 64 })
      }
    }
    pageScroll.invalidateMetrics()
  })
}

function cancelReleaseFitCheck() {
  releaseFitGeneration += 1
  if (releaseFitFrame && typeof window !== 'undefined') window.cancelAnimationFrame(releaseFitFrame)
  releaseFitFrame = 0
}

function syncReleaseFitMode() {
  if (viewportCompact.value || showArchiveIndex.value) return false
  const needsCompactLayout = releaseSection.value?.measureStageOverflow()
  if (needsCompactLayout == null) return false
  if (needsCompactLayout === releaseOverflowCompact.value) return true

  const previousCompact = compactMode.value
  releaseOverflowCompact.value = needsCompactLayout
  applyLayoutModeChange(previousCompact)
  return true
}

function scheduleReleaseFitCheck() {
  if (!anniversaryMounted || typeof window === 'undefined' || showArchiveIndex.value) return

  cancelReleaseFitCheck()
  const generation = releaseFitGeneration

  nextTick(() => {
    if (
      !anniversaryMounted ||
      generation !== releaseFitGeneration ||
      viewportCompact.value ||
      showArchiveIndex.value
    ) return

    releaseFitFrame = window.requestAnimationFrame(() => {
      releaseFitFrame = 0
      if (
        !anniversaryMounted ||
        generation !== releaseFitGeneration ||
        viewportCompact.value ||
        showArchiveIndex.value
      ) return

      syncReleaseFitMode()
    })
  })
}

function waitForReleaseFitFrame(signal: AbortSignal) {
  if (viewportCompact.value || showArchiveIndex.value || signal.aborted) {
    return Promise.resolve(!signal.aborted)
  }

  cancelReleaseFitCheck()
  return new Promise<boolean>((resolve) => {
    let settled = false
    const finish = (ready: boolean) => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', handleAbort)
      resolve(ready)
    }
    const frame = window.requestAnimationFrame(() => finish(true))
    const handleAbort = () => {
      window.cancelAnimationFrame(frame)
      finish(false)
    }
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

function syncViewportMode() {
  const width = window.innerWidth
  const height = window.innerHeight
  const nextViewportCompact =
    width <= 767 || height <= 640 || (height < 700 && width / Math.max(height, 1) >= 1.5)
  const previousCompact = compactMode.value
  viewportCompact.value = nextViewportCompact
  applyLayoutModeChange(previousCompact)

  if (nextViewportCompact) cancelReleaseFitCheck()
  else scheduleReleaseFitCheck()
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
        if (entries.some((entry) => entry.isIntersecting)) syncActiveChapterFromGeometry()
      },
      { root, rootMargin: '-22% 0px -48% 0px', threshold: [0.08, 0.25, 0.5] },
    )
    pageRoot.value
      ?.querySelectorAll<HTMLElement>('[id^="anniversary-chapter-"]')
      .forEach((section) => chapterObserver?.observe(section))
    syncActiveChapterFromGeometry()
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

function clearCompactScrollSettleTimer() {
  if (compactScrollSettleTimer && typeof window !== 'undefined') {
    window.clearTimeout(compactScrollSettleTimer)
  }
  compactScrollSettleTimer = 0
}

function clearCompactChapterNavigation() {
  clearCompactScrollSettleTimer()
  pendingChapter.value = null
  pendingChapterFocus.value = false
}

function finishCompactChapterNavigation() {
  clearCompactScrollSettleTimer()
  syncActiveChapterFromGeometry()
  const shouldFocus = pendingChapterFocus.value
  const settledChapter = activeChapter.value
  pendingChapter.value = null
  pendingChapterFocus.value = false
  if (shouldFocus) focusChapterHeading(settledChapter)
}

function scheduleCompactScrollSettle(delay = 140) {
  clearCompactScrollSettleTimer()
  if (pendingChapter.value == null || typeof window === 'undefined') return
  compactScrollSettleTimer = window.setTimeout(finishCompactChapterNavigation, delay)
}

function handlePageScrollFrame(frame: PageScrollFrame) {
  syncActiveChapterFromGeometry()
  if (pendingChapter.value == null) return
  if (frame.state.isScrolling) {
    clearCompactScrollSettleTimer()
    return
  }
  scheduleCompactScrollSettle()
}

function readPageState(snapshot: ScrollSnapshot): AnniversaryPageState | null {
  if (!snapshot.pageState || typeof snapshot.pageState !== 'object') return null
  const candidate = (snapshot.pageState as { anniversary?: unknown }).anniversary
  if (!candidate || typeof candidate !== 'object') return null
  const state = candidate as Partial<AnniversaryPageState>
  if (
    state.contextKey !== pageStateContextKey.value ||
    typeof state.activeChapter !== 'number'
  ) return null
  const restoredPhotoIndex = Number(state.currentPhotoIndex)
  return {
    contextKey: state.contextKey,
    activeChapter: clampChapter(state.activeChapter),
    activeMomentId: typeof state.activeMomentId === 'string' ? state.activeMomentId : null,
    activeMomentIndex: resolveContentIndex(
      content.value.timeline,
      typeof state.activeMomentId === 'string' ? state.activeMomentId : null,
      Number(state.activeMomentIndex) || 0,
    ),
    activeReleaseId: typeof state.activeReleaseId === 'string' ? state.activeReleaseId : null,
    activeReleaseIndex: resolveContentIndex(
      content.value.releases,
      typeof state.activeReleaseId === 'string' ? state.activeReleaseId : null,
      Number(state.activeReleaseIndex) || 0,
    ),
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
          contextKey: pageStateContextKey.value,
          activeChapter: activeChapter.value,
          activeMomentId: activeMoment.value?.id ?? null,
          activeMomentIndex: activeMomentIndex.value,
          activeReleaseId: activeRelease.value?.id ?? null,
          activeReleaseIndex: activeReleaseIndex.value,
          momentPaused: momentPaused.value,
          photoAssembled: photoAssembled.value,
          currentPhotoIndex: currentPhotoIndex.value,
        } satisfies AnniversaryPageState,
      },
    }
  },
  async prepare(snapshot, signal) {
    cancelChapterTransition()
    clearCompactChapterNavigation()
    clearMomentTimer()
    clearPhotoTimer()
    clearPhotoLoopTimer()
    clearAmbientLoopTimer()
    photoPlaying.value = false
    photoResetting.value = false
    const state = readPageState(snapshot)
    if (!state || signal.aborted) return
    pendingRestoredMomentId = state.activeMomentId
    pendingRestoredReleaseId = state.activeReleaseId
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
      pendingRestoredMomentId = null
      pendingRestoredReleaseId = null
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
    const fitFrameReady = await waitForReleaseFitFrame(signal)
    if (fitFrameReady) {
      syncReleaseFitMode()
      await nextTick()
    }
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
  pendingRestoredMomentId = null
  pendingRestoredReleaseId = null
  cancelChapterTransition()
  clearCompactChapterNavigation()
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
  currentPhotoIndex.value = reducedMotion.value ? content.value.photos.length - 1 : -1
  photoAssembled.value = reducedMotion.value
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

watch(
  content,
  (_value, previousContent) => {
    const previousMomentId = previousContent?.timeline[activeMomentIndex.value]?.id ?? null
    const previousReleaseId = previousContent?.releases[activeReleaseIndex.value]?.id ?? null
    reconcileContentState(previousMomentId, previousReleaseId)
  },
  { flush: 'sync' },
)

watch(
  pageTitle,
  (value) => {
    if (typeof document !== 'undefined') document.title = value
  },
  { immediate: true },
)

watch(
  () =>
    content.value.releases
      .map((release) => [release.id, release.type, release.date, release.title, release.note].join('\u001f'))
      .join('\u001e'),
  () => scheduleReleaseFitCheck(),
  { flush: 'post' },
)

watch(routeYear, (value, previous) => {
  if (value === previous) return
  anniversaryRequestController?.abort()
  resetStoryState()
  const endpoint = anniversaryApiUrl()
  const cachedPayload =
    appState.miletAnniversaryData?.key === endpoint &&
    payloadMatchesRoute(appState.miletAnniversaryData.payload, value)
      ? appState.miletAnniversaryData.payload
      : null
  anniversaryPayload.value = cachedPayload
  loadedAnniversaryEndpoint.value = cachedPayload ? endpoint : ''
  anniversaryDataStatus.value = cachedPayload ? 'ready' : 'idle'
  reconcileContentState()
  void loadAnniversaryData()
})

onServerPrefetch(() => loadAnniversaryData())

onMounted(() => {
  anniversaryMounted = true
  document.title = pageTitle.value
  void loadAnniversaryData()
  pageVisible.value = !document.hidden
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  handleReducedMotionChange(reducedMotionQuery)
  reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
  syncViewportMode()
  setupChapterObserver()
  unsubscribeScrollFrame = pageScroll.subscribeScrollFrame(handlePageScrollFrame)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', syncViewportMode)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  pageRoot.value?.addEventListener('wheel', handleWheel, { passive: false })
  if ('fonts' in document) {
    void document.fonts.ready.then(() => scheduleReleaseFitCheck())
  }
})

onBeforeUnmount(() => {
  anniversaryMounted = false
  cancelReleaseFitCheck()
  anniversaryRequestController?.abort()
  clearRestorationAbortHandler?.()
  restorationSessionId += 1
  cancelChapterTransition()
  clearCompactChapterNavigation()
  clearMomentTimer()
  clearPhotoTimer()
  clearPhotoLoopTimer()
  clearAmbientLoopTimer()
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
.anniversary-data-state { display: grid; min-height: 100dvh; place-items: center; padding: 7rem 1.25rem 3rem; }
.anniversary-data-card { width: min(100%, 42rem); border: 1px solid rgba(255,255,255,.82); border-radius: 2rem; background: rgba(255,255,255,.72); padding: clamp(1.5rem,4vw,3rem); box-shadow: 0 30px 90px -58px rgba(31,43,53,.88); backdrop-filter: blur(12px); }
.data-retry-button { min-height: 2.75rem; border: 1px solid rgba(39,109,123,.28); border-radius: 999px; background: rgba(39,109,123,.94); padding: 0 1.25rem; color: white; font-weight: 800; }
.data-retry-button:focus-visible { outline: 3px solid rgba(49,127,141,.42); outline-offset: 4px; }
.anniversary-wash { z-index: 0; background: radial-gradient(circle at 28% 22%,rgba(255,255,255,.96),transparent 28%), linear-gradient(135deg,#fff 0%,#eef8ff 46%,#f9f1d8 100%); }
.anniversary-beams { z-index: 1; background: linear-gradient(112deg,transparent 0%,transparent 22%,rgba(116,183,213,.2) 28%,transparent 44%), linear-gradient(64deg,transparent 0%,transparent 48%,rgba(221,190,95,.18) 58%,transparent 74%); opacity: .72; animation: beam-arrival 1600ms ease-out 1 both; }
.anniversary-atmosphere { z-index: 2; contain: paint; overflow: hidden; pointer-events: none; }
.ambient-orb { --orb-opacity: .48; --orb-from-x: -1.5%; --orb-from-y: 1%; position: absolute; display: block; width: clamp(20rem,36vw,36rem); aspect-ratio: 1; border-radius: 50%; opacity: var(--orb-opacity); transform: translate3d(0,0,0) scale(1); animation: ambient-orb-arrival 1800ms var(--anniversary-ease-out) 1 both; }
.ambient-orb.is-blue { left: -9%; top: 7%; background: radial-gradient(circle,rgba(255,255,255,.72) 0%,rgba(116,183,213,.2) 34%,rgba(116,183,213,.08) 57%,transparent 72%); }
.ambient-orb.is-gold { --orb-opacity: .44; --orb-from-x: 1.5%; right: -7%; top: 10%; background: radial-gradient(circle,rgba(255,255,255,.68) 0%,rgba(221,190,95,.18) 35%,rgba(221,190,95,.07) 58%,transparent 73%); animation-delay: 140ms; }
.ambient-shared-echo { --ambient-shared-opacity: .28; --ambient-shared-peak: .48; position: absolute; inset: 0; display: block; opacity: var(--ambient-shared-opacity); transform: translate3d(0,0,0) scale(1); transform-origin: center; animation-duration: 2200ms; animation-timing-function: var(--anniversary-ease-out); animation-fill-mode: both; }
.anniversary-atmosphere.is-cycle-even .ambient-shared-echo { animation-name: ambient-shared-echo-even; }
.anniversary-atmosphere.is-cycle-odd .ambient-shared-echo { animation-name: ambient-shared-echo-odd; }
.ambient-shared-echo svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
.ambient-shared-echo-compact { display: none; }
.ambient-shared-arc { fill: none; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ambient-shared-arc.is-primary { stroke: rgba(49,127,141,.22); stroke-width: 1.5; }
.ambient-shared-arc.is-secondary { stroke: rgba(116,183,213,.13); stroke-width: 1; }
.ambient-shared-ticks path { fill: none; stroke: rgba(184,145,47,.42); stroke-width: 1.35; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.ambient-shared-glints circle { fill: rgba(236,213,137,.78); stroke: rgba(255,255,255,.92); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
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
.anniversary-page.is-compact .anniversary-track :deep(.mobile-slide-shell) {
  padding-right: max(3rem, calc(env(safe-area-inset-right, 0px) + 2.5rem));
}
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
@keyframes ambient-orb-arrival { from { opacity: .08; transform: translate3d(var(--orb-from-x),var(--orb-from-y),0) scale(.9); } 48% { opacity: .58; } to { opacity: var(--orb-opacity); transform: translate3d(0,0,0) scale(1); } }
@keyframes ambient-shared-echo-even { from { opacity: .04; transform: translate3d(-1.2%,1%,0) scale(.985); } 48% { opacity: var(--ambient-shared-peak); } to { opacity: var(--ambient-shared-opacity); transform: translate3d(0,0,0) scale(1); } }
@keyframes ambient-shared-echo-odd { from { opacity: .04; transform: translate3d(-1.2%,1%,0) scale(.985); } 48% { opacity: var(--ambient-shared-peak); } to { opacity: var(--ambient-shared-opacity); transform: translate3d(0,0,0) scale(1); } }
@keyframes fragment-echo { 0% { opacity: 0; transform: rotate(var(--fragment-rotation)) scale(.7); } 22%, 64% { opacity: .58; } 100% { opacity: 0; transform: rotate(calc(var(--fragment-rotation) + 20deg)) translateY(-1.1rem) scale(1); } }
@keyframes navigation-hint { 0% { opacity: 0; transform: translate(50%,.4rem); } 20%, 78% { opacity: .86; transform: translate(50%,0); } 100% { opacity: .36; } }

@media (max-width: 767px), (max-height: 640px), (max-height: 699px) and (min-aspect-ratio: 3/2) {
  .anniversary-page:not(.is-archive) { min-height: 100dvh; height: auto; overflow: visible; }
  .anniversary-atmosphere { position: fixed; inset: 0; overflow: hidden; }
  .ambient-orb { width: min(76vw,22rem); }
  .ambient-orb.is-blue { left: -9rem; top: 8rem; }
  .ambient-orb.is-gold { right: -10rem; top: 38%; }
  .ambient-shared-echo { --ambient-shared-opacity: .23; --ambient-shared-peak: .4; right: 2.75rem; }
  .echo-fragments span:nth-child(n+5) { display: none; }
  .anniversary-track:not(.is-stage) { width: 100%; height: auto; flex-direction: column; transform: none !important; }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide) { width: 100%; height: auto; min-height: max(100svh,42rem); flex: none; }
  .anniversary-track:not(.is-stage) :deep(.mobile-slide-shell) { grid-template-columns: minmax(0,1fr); max-width: 48rem; padding-right: max(3rem, calc(env(safe-area-inset-right, 0px) + 2.5rem)); }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide-intro .mobile-slide-shell > :first-child) { order: 2; }
  .anniversary-track:not(.is-stage) :deep(.anniversary-slide-intro .mobile-slide-shell > :last-child) { order: 1; }
}

@media (max-width: 767px) and (max-aspect-ratio: 3/2) {
  .ambient-shared-echo-desktop { display: none; }
  .ambient-shared-echo-compact { display: block; }
}

.is-page-hidden .anniversary-beams,
.is-page-hidden .anniversary-atmosphere *,
.is-page-hidden .echo-fragments span { animation-play-state: paused !important; }
.is-archive .anniversary-beams { animation: none; opacity: .38; }
.is-archive .echo-fragments { display: none; }

@media (prefers-reduced-motion: reduce) {
  .anniversary-beams, .echo-fragments span, .navigation-hint, .anniversary-page *, .anniversary-page *::before, .anniversary-page *::after { animation: none !important; transition-duration: 1ms !important; transition-delay: 0ms !important; }
}
</style>
