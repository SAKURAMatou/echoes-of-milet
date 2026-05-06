<template>
  <main
    class="anniversary-page relative h-dvh min-h-[620px] overflow-hidden bg-[#f8fcfb] text-[#1f2b35]"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="anniversary-wash absolute inset-0"></div>
    <div class="anniversary-beams absolute inset-0"></div>
    <div class="celebration-layer absolute inset-0" aria-hidden="true">
      <span
        v-for="piece in celebrationPieces"
        :key="piece.id"
        :style="{ left: piece.left, animationDelay: piece.delay, animationDuration: piece.duration }"
      ></span>
    </div>
    <div class="anniversary-wave absolute inset-x-0 bottom-0 h-32"></div>

    <header
      class="absolute inset-x-0 top-0 z-30 flex min-h-16 items-center justify-between px-5 text-sm sm:px-8"
    >
      <RouterLink
        :to="{ name: 'milet', params: { lang: routeLang } }"
        class="brand-pill px-5 py-2.5 font-semibold text-[#276d7b] shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#317f8d]"
      >
        echoes of milet
      </RouterLink>
      <span
        class="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[#6a7a85] sm:block"
      >
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

    <div
      v-else
      class="anniversary-track relative z-10 flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="isMobileViewport ? 'is-vertical' : 'is-horizontal'"
      :style="trackTransformStyle"
    >
      <AnniversaryIntroSection
        :chapter="content.chapters[0]"
        :content="content"
        :anniversary-no="anniversaryNo"
        :lang="lang"
        @next="goNext"
      />

      <AnniversaryYearReviewSection
        :chapter="content.chapters[1]"
        :timeline="content.timeline"
        :active-moment="activeMoment"
        :active-moment-index="activeMomentIndex"
        :progress="momentProgress"
        :paused="momentPaused"
        :lang="lang"
        @select-moment="selectMoment"
        @toggle-pause="toggleMomentPause"
      />

      <AnniversaryReleaseSection
        :chapter="content.chapters[2]"
        :releases="content.releases"
        :active-release="activeRelease"
        :active-release-index="activeReleaseIndex"
        :progress="releaseProgress"
        :lang="lang"
        @select-release="selectRelease"
      />

      <AnniversaryPhotoSection
        :chapter="content.chapters[3]"
        :photos="content.photos"
        :current-photo-index="currentPhotoIndex"
        :assembled="photoAssembled"
        :lang="lang"
        @replay="restartPhotoFilm"
      />
    </div>

    <AnniversaryChapterNav
      v-if="!showArchiveIndex"
      :chapters="content.chapters"
      :active-chapter="activeChapter"
      @select-chapter="goChapter"
    />

    <AnniversaryChapterControls v-if="!showArchiveIndex" @prev="goPrev" @next="goNext" />
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import AnniversaryArchiveIndex from '@/components/milet/anniversary/AnniversaryArchiveIndex.vue'
import AnniversaryChapterControls from '@/components/milet/anniversary/AnniversaryChapterControls.vue'
import AnniversaryChapterNav from '@/components/milet/anniversary/AnniversaryChapterNav.vue'
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
  isAnniversaryMonth,
  normalizeAnniversaryPayload,
  type AnniversaryApiPayload,
  type AnniversaryRecord,
} from '@/composables/miletAnniversary'
import { useAppState } from '@/composables/useAppState'
import { apiRoutes } from '@/config/api'

const appState = useAppState()
const route = useRoute()

const activeChapter = ref(0)
const activeMomentIndex = ref(0)
const activeReleaseIndex = ref(0)
const momentProgress = ref(0)
const releaseProgress = ref(0)
const momentPaused = ref(false)
const currentPhotoIndex = ref(-1)
const photoAssembled = ref(false)
const isMobileViewport = ref(false)
const touchStart = ref({ x: 0, y: 0 })

const celebrationPieces = [
  { id: 1, left: '7%', delay: '0.2s', duration: '9.5s' },
  { id: 2, left: '13%', delay: '3.2s', duration: '10.4s' },
  { id: 3, left: '18%', delay: '1.4s', duration: '8.8s' },
  { id: 4, left: '24%', delay: '5s', duration: '11s' },
  { id: 5, left: '31%', delay: '2.6s', duration: '9.2s' },
  { id: 6, left: '38%', delay: '0.9s', duration: '10.6s' },
  { id: 7, left: '44%', delay: '4.4s', duration: '8.6s' },
  { id: 8, left: '51%', delay: '1.8s', duration: '11.4s' },
  { id: 9, left: '57%', delay: '6.1s', duration: '9.7s' },
  { id: 10, left: '63%', delay: '2.1s', duration: '10.1s' },
  { id: 11, left: '69%', delay: '5.4s', duration: '8.9s' },
  { id: 12, left: '74%', delay: '0.7s', duration: '11.2s' },
  { id: 13, left: '80%', delay: '3.8s', duration: '9.4s' },
  { id: 14, left: '85%', delay: '1.1s', duration: '10.8s' },
  { id: 15, left: '90%', delay: '4.9s', duration: '8.7s' },
  { id: 16, left: '35%', delay: '7.2s', duration: '12s' },
  { id: 17, left: '66%', delay: '6.8s', duration: '11.5s' },
  { id: 18, left: '96%', delay: '2.9s', duration: '10.9s' },
]

const momentAutoplayMs = 5200
const releaseAutoplayMs = 4400
let photoTimer = 0
let momentTimer = 0
let releaseTimer = 0

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
const anniversaryMonthNow = computed(
  () =>
    resolvedAnniversaryPayload.value.isAnniversaryMonth ??
    isAnniversaryMonth(anniversaryArchiveConfig, new Date()),
)
const showArchiveIndex = computed(() => !routeYear.value && !anniversaryMonthNow.value)
const record = computed<AnniversaryRecord>(() => {
  return (
    resolvedAnniversaryPayload.value.record ??
    (getAnniversaryRecord(routeYear.value, anniversaryArchiveConfig) as AnniversaryRecord)
  )
})
const content = computed(() => getAnniversaryRecordContent(record.value, lang.value))
const anniversaryNo = computed(() => record.value.anniversaryNo)
const activeMoment = computed(() => content.value.timeline[activeMomentIndex.value])
const activeRelease = computed(() => content.value.releases[activeReleaseIndex.value])
const pageTitle = computed(() =>
  lang.value === 'ja'
    ? `milet anniversary ${record.value.year} | Echoes of milet`
    : `milet 周年记录 ${record.value.year} | Echoes of milet`,
)
const trackTransformStyle = computed(() => {
  return {
    transform: isMobileViewport.value
      ? `translateY(-${activeChapter.value * 100}%)`
      : `translateX(-${activeChapter.value * 100}%)`,
  }
})

function anniversaryApiUrl() {
  return routeYear.value
    ? `${apiRoutes.miletAnniversary}/${routeYear.value}`
    : apiRoutes.miletAnniversary
}

async function loadAnniversaryData(force = false) {
  const endpoint = anniversaryApiUrl()
  if (loadingAnniversary.value || (!force && loadedAnniversaryEndpoint.value === endpoint)) {
    return
  }

  loadingAnniversary.value = true

  try {
    const response = await axiosInstance.get(endpoint)
    const payload = normalizeAnniversaryPayload(response)

    if (payload) {
      anniversaryPayload.value = payload
      appState.miletAnniversaryData = payload
      loadedAnniversaryEndpoint.value = endpoint
    }
  } catch (error) {
    console.error('anniversary data fetch error', error)
  } finally {
    loadingAnniversary.value = false
  }
}

function goChapter(index: number) {
  activeChapter.value = Math.max(0, Math.min(content.value.chapters.length - 1, index))
}

function goPrev() {
  goChapter(activeChapter.value - 1)
}

function goNext() {
  goChapter(activeChapter.value + 1)
}

function nextRelease() {
  activeReleaseIndex.value = (activeReleaseIndex.value + 1) % content.value.releases.length
}

function nextMoment() {
  activeMomentIndex.value = (activeMomentIndex.value + 1) % content.value.timeline.length
}

function selectMoment(index: number) {
  activeMomentIndex.value = Math.max(0, Math.min(content.value.timeline.length - 1, index))
  momentProgress.value = 0
  if (activeChapter.value === 1 && !momentPaused.value) {
    startMomentAutoplay()
  }
}

function toggleMomentPause() {
  momentPaused.value = !momentPaused.value
  if (momentPaused.value) {
    clearMomentTimer()
    return
  }

  if (activeChapter.value === 1) {
    startMomentAutoplay()
  }
}

function selectRelease(index: number) {
  activeReleaseIndex.value = index
  if (activeChapter.value === 2) {
    startReleaseAutoplay()
  }
}

function clearPhotoTimer() {
  if (photoTimer) {
    window.clearInterval(photoTimer)
    photoTimer = 0
  }
}

function clearMomentTimer() {
  if (momentTimer) {
    window.clearInterval(momentTimer)
    momentTimer = 0
  }
}

function clearReleaseTimer() {
  if (releaseTimer) {
    window.clearInterval(releaseTimer)
    releaseTimer = 0
  }
}

function startMomentAutoplay() {
  clearMomentTimer()
  if (momentPaused.value) return
  momentProgress.value = 0
  const step = 80
  momentTimer = window.setInterval(() => {
    momentProgress.value += (step / momentAutoplayMs) * 100
    if (momentProgress.value >= 100) {
      nextMoment()
      momentProgress.value = 0
    }
  }, step)
}

function startReleaseAutoplay() {
  clearReleaseTimer()
  releaseProgress.value = 0
  const step = 80
  releaseTimer = window.setInterval(() => {
    releaseProgress.value += (step / releaseAutoplayMs) * 100
    if (releaseProgress.value >= 100) {
      nextRelease()
      releaseProgress.value = 0
    }
  }, step)
}

function restartPhotoFilm() {
  clearPhotoTimer()
  photoAssembled.value = false
  currentPhotoIndex.value = -1
  photoTimer = window.setInterval(() => {
    if (currentPhotoIndex.value >= content.value.photos.length - 1) {
      clearPhotoTimer()
      window.setTimeout(() => {
        photoAssembled.value = true
      }, 520)
      return
    }
    currentPhotoIndex.value += 1
  }, 430)
}

function syncViewportMode() {
  if (typeof window === 'undefined') return
  isMobileViewport.value = window.innerWidth <= 767
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') goNext()
  if (event.key === 'ArrowLeft') goPrev()
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  const dx = touch.clientX - touchStart.value.x
  const dy = touch.clientY - touchStart.value.y
  if (isMobileViewport.value) return

  if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) goNext()
  else goPrev()
}

watch(activeChapter, (value) => {
  clearMomentTimer()
  clearReleaseTimer()
  clearPhotoTimer()

  if (value === 1) {
    if (!momentPaused.value) {
      startMomentAutoplay()
    }
    return
  }

  if (value === 2) {
    startReleaseAutoplay()
    return
  }

  if (value === 3) {
    restartPhotoFilm()
  }
})

watch(record, () => {
  activeChapter.value = 0
  activeMomentIndex.value = 0
  activeReleaseIndex.value = 0
  momentProgress.value = 0
  releaseProgress.value = 0
  momentPaused.value = false
  currentPhotoIndex.value = -1
  photoAssembled.value = false
})

onServerPrefetch(() => loadAnniversaryData())

watch(lang, () => {
  if (typeof document !== 'undefined') {
    document.title = pageTitle.value
  }
})

watch(routeYear, () => {
  if (typeof document !== 'undefined') {
    document.title = pageTitle.value
  }
  void loadAnniversaryData(true)
})

onMounted(() => {
  document.title = pageTitle.value
  void loadAnniversaryData()
  syncViewportMode()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', syncViewportMode)
})

onBeforeUnmount(() => {
  clearPhotoTimer()
  clearMomentTimer()
  clearReleaseTimer()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', syncViewportMode)
})
</script>

<style scoped>
.anniversary-page {
  isolation: isolate;
}

.anniversary-wash {
  z-index: 0;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.96), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #eef8ff 46%, #f9f1d8 100%);
}

.anniversary-beams {
  z-index: 1;
  background:
    linear-gradient(
      112deg,
      transparent 0%,
      transparent 22%,
      rgba(116, 183, 213, 0.2) 28%,
      transparent 44%
    ),
    linear-gradient(
      64deg,
      transparent 0%,
      transparent 48%,
      rgba(221, 190, 95, 0.18) 58%,
      transparent 74%
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0) 42px,
      rgba(255, 255, 255, 0.2) 43px,
      rgba(255, 255, 255, 0) 86px
    );
  opacity: 0.72;
  animation: beam-drift 10s ease-in-out infinite alternate;
}

.anniversary-wave {
  z-index: 2;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(49, 127, 141, 0.12) 0,
      rgba(49, 127, 141, 0.12) 1px,
      transparent 1px,
      transparent 16px
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(49, 127, 141, 0.12));
  mask-image: linear-gradient(180deg, transparent 0%, #000 28%, #000 100%);
}

.celebration-layer {
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.celebration-layer span {
  position: absolute;
  display: block;
  width: 0.72rem;
  height: 1.35rem;
  border-radius: 0.18rem;
  background: rgba(221, 190, 95, 0.5);
  box-shadow: 0 10px 24px -18px rgba(31, 43, 53, 0.8);
  opacity: 0;
  transform: translate3d(0, -3rem, 0) rotate(0deg);
  animation: confetti-fall 8.8s linear infinite;
}

.celebration-layer span:nth-child(3n) {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 0.2rem;
  background: rgba(49, 127, 141, 0.34);
  transform: translate3d(0, -3rem, 0) rotate(45deg);
}

.celebration-layer span:nth-child(4n) {
  width: 1.15rem;
  height: 0.22rem;
  border-radius: 999px;
  background: rgba(140, 72, 85, 0.24);
}

.celebration-layer span:nth-child(5n) {
  width: 0.48rem;
  height: 0.48rem;
  border: 1px solid rgba(49, 127, 141, 0.42);
  border-radius: 0;
  background: transparent;
  transform: translate3d(0, -3rem, 0) rotate(45deg);
}

:deep(.anniversary-slide) {
  display: flex;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  align-items: center;
}

:deep(.anniversary-slide > .mobile-slide-shell) {
  padding-top: 4rem;
}

.anniversary-track.is-horizontal {
  flex-direction: row;
}

.anniversary-track.is-vertical {
  flex-direction: column;
}

.brand-pill {
  border: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  font-family: Montserrat, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(236, 247, 250, 0.78)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.08));
  clip-path: polygon(0 20%, 86% 20%, 100% 50%, 86% 80%, 0 80%, 8% 50%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 14px 36px -28px rgba(31, 43, 53, 0.72);
}

.brand-pill::after {
  content: '';
  position: absolute;
  right: 0.9rem;
  top: 50%;
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.24);
  transform: translateY(-50%);
}

.brand-pill:hover::after {
  background: rgba(39, 109, 123, 0.48);
}

button,
.brand-pill {
  cursor: pointer;
}

@keyframes beam-drift {
  from {
    transform: translateX(-1.2%) skewX(-1deg);
  }

  to {
    transform: translateX(1.2%) skewX(1deg);
  }
}

@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translate3d(-1.2rem, -4rem, 0) rotate(0deg);
  }

  12% {
    opacity: 0.58;
  }

  70% {
    opacity: 0.46;
  }

  100% {
    opacity: 0;
    transform: translate3d(1.8rem, 105vh, 0) rotate(300deg);
  }
}

@media (max-width: 767px) {
  .anniversary-page {
    min-height: 0;
  }

  :deep(.anniversary-slide) {
    align-items: stretch;
    padding-bottom: 0;
  }

  :deep(.mobile-slide-shell) {
    height: 100dvh;
    max-height: 100dvh;
    align-content: start;
    row-gap: 1.6rem;
    overflow: hidden;
    overscroll-behavior: contain;
    padding-top: 9.45rem !important;
    padding-bottom: 10.5rem;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.mobile-scroll-region) {
    max-height: calc(100dvh - 23.5rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.anniversary-slide:first-child .mobile-scroll-region) {
    max-height: calc(100dvh - 36rem);
  }

  :deep(.mobile-scroll-region::-webkit-scrollbar) {
    display: none;
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  :deep(.mobile-slide-shell) {
    padding-top: 8.85rem !important;
    padding-bottom: 9.4rem;
  }

  :deep(.mobile-scroll-region) {
    max-height: calc(100dvh - 20.8rem);
  }

  :deep(.anniversary-slide:first-child .mobile-scroll-region) {
    max-height: calc(100dvh - 30rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .anniversary-beams,
  .celebration-layer span,
  .anniversary-page *,
  .anniversary-page *::before,
  .anniversary-page *::after {
    animation: none !important;
    transition-duration: 1ms !important;
  }
}
</style>
