<template>
  <main
    class="anniversary-page relative h-dvh min-h-[620px] overflow-hidden bg-[#f8fcfb] text-[#1f2b35]"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="anniversary-wash absolute inset-0"></div>
    <div class="anniversary-beams absolute inset-0"></div>
    <div class="celebration-layer absolute inset-0" aria-hidden="true">
      <span v-for="piece in celebrationPieces" :key="piece" :class="`piece-${piece}`"></span>
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

    <section v-if="showArchiveIndex" class="relative z-10 flex h-full items-center">
      <div class="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-8">
        <div class="grid gap-10 md:grid-cols-[0.82fr_1.18fr] md:items-start">
          <div>
            <p class="section-eyebrow">anniversary archive</p>
            <h1
              class="mt-4 font-serif text-5xl leading-[0.95] text-[#1d2b36] sm:text-6xl md:text-7xl"
            >
              {{ content.archiveTitle }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-8 text-[#52636f] sm:text-lg">
              {{ content.archiveLead }}
            </p>
          </div>

          <div class="archive-list">
            <RouterLink
              v-for="year in availableYears"
              :key="year"
              :to="{ name: 'miletAnniversary', params: { lang: routeLang, year } }"
              class="archive-year-link"
            >
              <span class="archive-year-number">{{ year }}</span>
              <span class="archive-year-copy">
                <strong>{{
                  lang === 'ja' ? `${year} anniversary record` : `${year} 周年记录`
                }}</strong>
                <em>{{ lang === 'ja' ? 'Open archive story' : '进入当年的周年页面' }}</em>
              </span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <div
      v-else
      class="anniversary-track relative z-10 flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      :class="isMobileViewport ? 'is-vertical' : 'is-horizontal'"
      :style="trackTransformStyle"
    >
      <section class="anniversary-slide">
        <div
          class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-10 sm:px-8 md:grid-cols-[0.92fr_1.08fr] md:gap-14"
        >
          <div class="order-2 md:order-1">
            <p class="section-eyebrow">{{ currentChapter.eyebrow }}</p>
            <h1
              class="mt-4 font-serif text-5xl leading-[0.95] text-[#1d2b36] sm:text-6xl md:text-7xl"
            >
              {{ content.title }}
            </h1>
            <p class="mt-6 max-w-xl text-base leading-8 text-[#52636f] sm:text-lg">
              {{ content.lead }}
            </p>
            <p class="mt-3 text-sm leading-7 text-[#7d6a33]">
              {{ content.giftNote }}
            </p>
            <button class="primary-action mt-8" type="button" @click="goNext">open the year</button>
          </div>

          <div class="order-1 flex justify-center md:order-2">
            <div class="anniversary-number" aria-label="anniversary year">
              <span class="text-8xl font-semibold leading-none sm:text-9xl">{{
                anniversaryNo
              }}</span>
              <span class="mt-2 text-lg font-semibold uppercase tracking-[0.26em]"
                >anniversary</span
              >
              <span class="mt-5 max-w-[260px] text-center text-sm leading-7 text-[#52636f]">
                {{ lang === 'ja' ? 'お祝いを、やわらかい光にして。' : '把祝福放进柔和的光里。' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="anniversary-slide anniversary-slide-year">
        <div
          class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-7 px-5 pt-10 sm:px-8 md:grid-cols-[0.86fr_1.14fr] md:gap-12"
        >
          <div>
            <p class="section-eyebrow">{{ content.chapters[1].eyebrow }}</p>
            <h2 class="section-title">{{ content.chapters[1].title }}</h2>
            <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
              {{
                lang === 'ja'
                  ? '数えるためではなく、もう一度うれしかった瞬間に会うための year notes。'
                  : '不是为了数清发生了多少事，而是再见一遍那些让人心动的时刻。'
              }}
            </p>
          </div>

          <div class="year-panel">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 pr-2">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
                  {{ activeMoment.date }}
                </p>
                <h3 class="mt-3 font-serif text-3xl leading-tight text-[#263542] sm:text-4xl">
                  {{ activeMoment.title }}
                </h3>
              </div>
              <span
                class="moment-label rounded-full border border-[#d9c27b] px-3 py-1 text-xs font-semibold uppercase text-[#8a6e1b]"
              >
                {{ activeMoment.label }}
              </span>
            </div>
            <p class="mt-5 text-sm leading-7 text-[#586872] sm:text-base">
              {{ activeMoment.body }}
            </p>
            <div class="moment-progress-list" aria-hidden="true">
              <div
                v-for="(moment, index) in content.timeline"
                :key="moment.id"
                class="moment-progress"
                :class="index === activeMomentIndex ? 'is-active' : ''"
              >
                <span>{{ moment.date.replace('2025 ', '') }}</span>
                <i
                  :style="index === activeMomentIndex ? progressStyle(momentProgress) : undefined"
                ></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="anniversary-slide anniversary-slide-songs">
        <div
          class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-10 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12"
        >
          <div>
            <p class="section-eyebrow">{{ content.chapters[2].eyebrow }}</p>
            <h2 class="section-title">{{ content.chapters[2].title }}</h2>
            <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
              {{
                lang === 'ja'
                  ? '写真のように並べるのではなく、ひとつずつ spotlight に入る作品のステージ。'
                  : '不把发布物做成照片拼贴，而是让每一张封面被 spotlight 依次点亮。'
              }}
            </p>
            <div class="release-progress-list" aria-hidden="true">
              <span
                v-for="(release, index) in content.releases"
                :key="release.id"
                :class="index === activeReleaseIndex ? 'is-active' : ''"
              >
                <i
                  :style="index === activeReleaseIndex ? progressStyle(releaseProgress) : undefined"
                ></i>
              </span>
            </div>
          </div>

          <div class="release-stage">
            <div
              v-for="(release, index) in content.releases"
              :key="release.id"
              class="release-cover"
              :class="releaseClass(index)"
              @click="selectRelease(index)"
            >
              <img :src="initImgUrl(release.cover)" :alt="release.title" />
            </div>
            <div class="release-copy">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
                {{ activeRelease.type }} · {{ activeRelease.date }}
              </p>
              <h3 class="mt-2 font-serif text-4xl leading-tight text-[#1f2b35]">
                {{ activeRelease.title }}
              </h3>
              <p class="mt-3 text-sm leading-7 text-[#60717b]">{{ activeRelease.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="anniversary-slide">
        <div
          class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-5 px-5 pt-10 sm:px-8 md:grid-cols-[0.82fr_1.18fr] md:gap-10"
        >
          <div>
            <p class="section-eyebrow">{{ content.chapters[3].eyebrow }}</p>
            <h2 class="section-title">{{ content.chapters[3].title }}</h2>
            <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
              {{
                lang === 'ja'
                  ? '毎月届く milet の日を、12枚の写真でひとつの echo constellation にします。'
                  : '把每个月等来的 milet の日，拼成一个不规则的 echo constellation。'
              }}
            </p>
            <div class="mt-6 flex gap-3">
              <button class="primary-action" type="button" @click="restartPhotoFilm">replay</button>
            </div>
          </div>

          <div class="photo-stage" :class="photoAssembled ? 'is-assembled' : 'is-playing'">
            <div class="photo-center-copy" :class="photoAssembled ? 'is-visible' : ''">
              <span>Happy Anniversary</span>
              <strong>milet</strong>
            </div>
            <figure
              v-for="(photo, index) in content.photos"
              :key="photo.id"
              class="photo-frame"
              :class="photoFrameClass(index)"
              :style="photoStyle(photo)"
            >
              <img :src="initImgUrl(photo.image)" :alt="photo.alt" />
              <figcaption>
                <span>{{ photo.month }}</span>
                {{ photoAssembled ? 'milet の日' : photo.caption }}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
    </div>

    <nav v-if="!showArchiveIndex" class="chapter-nav" aria-label="Anniversary chapters">
      <button
        v-for="(chapter, index) in content.chapters"
        :key="chapter.id"
        type="button"
        :class="index === activeChapter ? 'is-active' : ''"
        @click="goChapter(index)"
      >
        <span>{{ `0${index + 1}` }}</span>
        <em>{{ chapter.eyebrow }}</em>
      </button>
    </nav>

    <button
      v-if="!showArchiveIndex"
      class="chapter-control chapter-control-prev"
      type="button"
      aria-label="Previous chapter"
      @click="goPrev"
    >
      <span class="desktop-arrow max-md:hidden">←</span>
      <span class="mobile-arrow md:hidden">↑</span>
      <em>prev</em>
    </button>
    <button
      v-if="!showArchiveIndex"
      class="chapter-control chapter-control-next"
      type="button"
      aria-label="Next chapter"
      @click="goNext"
    >
      <span class="desktop-arrow max-md:hidden">→</span>
      <span class="mobile-arrow md:hidden">↓</span>
      <em>next</em>
    </button>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
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
  type AnniversaryPhoto,
  type AnniversaryRecord,
} from '@/composables/miletAnniversary'
import { useAppState } from '@/composables/useAppState'
import { apiRoutes } from '@/config/api'

import { initImgUrl } from '@/composables/ImgUrlUtil'

const appState = useAppState()
const route = useRoute()
const activeChapter = ref(0)
const activeMomentIndex = ref(0)
const activeReleaseIndex = ref(0)
const momentProgress = ref(0)
const releaseProgress = ref(0)
const currentPhotoIndex = ref(-1)
const photoAssembled = ref(false)
const isMobileViewport = ref(false)
const touchStart = ref({ x: 0, y: 0 })
const celebrationPieces = Array.from({ length: 18 }, (_, index) => index + 1)
const momentAutoplayMs = 5200
const releaseAutoplayMs = 4400
let photoTimer = 0
let momentTimer = 0
let releaseTimer = 0

const routeLang = computed(() => String(route.params.lang || 'zh'))
const routeYear = computed(() => String(route.params.year || ''))
const lang = computed(() => anniversaryLang(routeLang.value))
const fallbackPayload = buildAnniversaryPayloadFromConfig(anniversaryArchiveConfig)
const anniversaryPayload = ref<AnniversaryApiPayload | null>(
  appState.miletAnniversaryData ?? fallbackPayload,
)
const loadingAnniversary = ref(false)
const loadedAnniversaryEndpoint = ref(appState.miletAnniversaryData ? anniversaryApiUrl() : '')
const availableYears = computed(() =>
  anniversaryPayload.value?.recordYears?.length
    ? anniversaryPayload.value.recordYears
    : getAvailableAnniversaryYears(anniversaryArchiveConfig),
)
const anniversaryMonthNow = computed(
  () =>
    anniversaryPayload.value?.isAnniversaryMonth ??
    isAnniversaryMonth(anniversaryArchiveConfig, new Date()),
)
const showArchiveIndex = computed(() => !routeYear.value && !anniversaryMonthNow.value)
const record = computed<AnniversaryRecord>(() => {
  return (
    anniversaryPayload.value?.record ??
    (getAnniversaryRecord(routeYear.value, anniversaryArchiveConfig) as AnniversaryRecord)
  )
})
const content = computed(() => getAnniversaryRecordContent(record.value, lang.value))
const anniversaryNo = computed(() => record.value.anniversaryNo)
const currentChapter = computed(() => content.value.chapters[activeChapter.value])
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

function selectRelease(index: number) {
  activeReleaseIndex.value = index
  if (activeChapter.value === 2) {
    startReleaseAutoplay()
  }
}

function releaseClass(index: number) {
  if (index === activeReleaseIndex.value) return 'is-current'
  if (index === (activeReleaseIndex.value + 1) % content.value.releases.length) return 'is-next'
  return 'is-prev'
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

function photoFrameClass(index: number) {
  return {
    'is-visible': photoAssembled.value || index <= currentPhotoIndex.value,
    'is-active': !photoAssembled.value && index === currentPhotoIndex.value,
    'is-past': !photoAssembled.value && index < currentPhotoIndex.value,
  }
}

function photoStyle(photo: AnniversaryPhoto) {
  return {
    '--x': photo.final.x,
    '--y': photo.final.y,
    '--w': photo.final.w,
    '--r': photo.final.r,
    '--mx': photo.final.mx,
    '--my': photo.final.my,
    '--mw': photo.final.mw,
    '--mr': photo.final.mr,
  }
}

function progressStyle(value: number) {
  return {
    '--progress': `${Math.max(0, Math.min(100, value))}%`,
  }
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
  if (isMobileViewport.value) {
    if (Math.abs(dy) < 44 || Math.abs(dy) < Math.abs(dx)) return
    const scrollShell = (event.target as HTMLElement | null)?.closest?.('.mobile-slide-shell')
    if (scrollShell instanceof HTMLElement && scrollShell.scrollHeight > scrollShell.clientHeight) {
      const atTop = scrollShell.scrollTop <= 2
      const atBottom =
        scrollShell.scrollTop + scrollShell.clientHeight >= scrollShell.scrollHeight - 2
      if ((dy < 0 && !atBottom) || (dy > 0 && !atTop)) return
    }
    if (dy < 0) goNext()
    else goPrev()
    return
  }

  if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy)) return
  if (dx < 0) goNext()
  else goPrev()
}

watch(activeChapter, (value) => {
  clearMomentTimer()
  clearReleaseTimer()
  clearPhotoTimer()

  if (value === 1) {
    startMomentAutoplay()
    return
  }

  if (value === 2) {
    startReleaseAutoplay()
    return
  }

  if (value === 3) {
    restartPhotoFilm()
    return
  }
})

watch(record, () => {
  activeChapter.value = 0
  activeMomentIndex.value = 0
  activeReleaseIndex.value = 0
  momentProgress.value = 0
  releaseProgress.value = 0
  currentPhotoIndex.value = -1
  photoAssembled.value = false
})

onServerPrefetch(() => loadAnniversaryData())

watch(lang, () => {
  document.title = pageTitle.value
})

watch(routeYear, () => {
  document.title = pageTitle.value
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

.piece-1 {
  left: 7%;
  animation-delay: 0.2s;
  animation-duration: 9.5s;
}
.piece-2 {
  left: 13%;
  animation-delay: 3.2s;
  animation-duration: 10.4s;
}
.piece-3 {
  left: 18%;
  animation-delay: 1.4s;
  animation-duration: 8.8s;
}
.piece-4 {
  left: 24%;
  animation-delay: 5s;
  animation-duration: 11s;
}
.piece-5 {
  left: 31%;
  animation-delay: 2.6s;
  animation-duration: 9.2s;
}
.piece-6 {
  left: 38%;
  animation-delay: 0.9s;
  animation-duration: 10.6s;
}
.piece-7 {
  left: 44%;
  animation-delay: 4.4s;
  animation-duration: 8.6s;
}
.piece-8 {
  left: 51%;
  animation-delay: 1.8s;
  animation-duration: 11.4s;
}
.piece-9 {
  left: 57%;
  animation-delay: 6.1s;
  animation-duration: 9.7s;
}
.piece-10 {
  left: 63%;
  animation-delay: 2.1s;
  animation-duration: 10.1s;
}
.piece-11 {
  left: 69%;
  animation-delay: 5.4s;
  animation-duration: 8.9s;
}
.piece-12 {
  left: 74%;
  animation-delay: 0.7s;
  animation-duration: 11.2s;
}
.piece-13 {
  left: 80%;
  animation-delay: 3.8s;
  animation-duration: 9.4s;
}
.piece-14 {
  left: 85%;
  animation-delay: 1.1s;
  animation-duration: 10.8s;
}
.piece-15 {
  left: 90%;
  animation-delay: 4.9s;
  animation-duration: 8.7s;
}
.piece-16 {
  left: 35%;
  animation-delay: 7.2s;
  animation-duration: 12s;
}
.piece-17 {
  left: 66%;
  animation-delay: 6.8s;
  animation-duration: 11.5s;
}
.piece-18 {
  left: 96%;
  animation-delay: 2.9s;
  animation-duration: 10.9s;
}

.anniversary-slide {
  display: flex;
  width: 100%;
  height: 100%;
  flex: 0 0 100%;
  align-items: center;
}

.anniversary-track.is-horizontal {
  flex-direction: row;
}

.anniversary-track.is-vertical {
  flex-direction: column;
}

.archive-list {
  display: grid;
  gap: 1rem;
}

.archive-year-link {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 1.7rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(236, 247, 250, 0.74)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.06), rgba(221, 190, 95, 0.08));
  padding: 1.15rem 1.25rem;
  box-shadow: 0 24px 64px -50px rgba(31, 43, 53, 0.8);
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.archive-year-link:hover {
  transform: translateY(-2px);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 250, 251, 0.88)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.1), rgba(221, 190, 95, 0.12));
}

.archive-year-number {
  display: inline-flex;
  min-width: 5.4rem;
  min-height: 5.4rem;
  align-items: center;
  justify-content: center;
  border-radius: 1.5rem;
  background: rgba(39, 109, 123, 0.92);
  color: white;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 2rem;
  line-height: 1;
}

.archive-year-copy strong {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1f2b35;
}

.archive-year-copy em {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  font-style: normal;
  color: #60717b;
}

.section-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #317f8d;
}

.section-title {
  margin-top: 1rem;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 3rem;
  line-height: 1;
  color: #1d2b36;
}

.primary-action {
  min-height: 2.75rem;
  border: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(235, 247, 249, 0.82)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.1));
  clip-path: polygon(0 22%, 84% 22%, 100% 50%, 84% 78%, 0 78%, 9% 50%);
  padding: 0 1.9rem 0 1.55rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #276d7b;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 48px -36px rgba(31, 43, 53, 0.9);
  transition:
    transform 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  background:
    linear-gradient(135deg, rgba(39, 109, 123, 0.96), rgba(49, 127, 141, 0.9)),
    linear-gradient(90deg, rgba(221, 190, 95, 0.24), rgba(255, 255, 255, 0));
  color: white;
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

.anniversary-number {
  position: relative;
  display: flex;
  width: min(72vw, 420px);
  aspect-ratio: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background:
    radial-gradient(
      circle at 48% 42%,
      rgba(255, 255, 255, 0.96),
      rgba(255, 255, 255, 0.56) 54%,
      rgba(221, 190, 95, 0.18)
    ),
    linear-gradient(145deg, rgba(255, 255, 255, 0.74), rgba(203, 232, 238, 0.42));
  color: #276d7b;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.84),
    0 34px 80px -50px rgba(31, 43, 53, 0.9);
}

.anniversary-number::before,
.anniversary-number::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  border: 1px solid rgba(49, 127, 141, 0.2);
  pointer-events: none;
}

.anniversary-number::before {
  inset: 8%;
  transform: rotate(-13deg);
}

.anniversary-number::after {
  inset: 17%;
  border-color: rgba(221, 190, 95, 0.28);
  transform: rotate(18deg);
  animation: ring-breathe 4.8s ease-in-out infinite;
}

.year-panel {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.62);
  padding: 1.5rem;
  box-shadow: 0 24px 70px -48px rgba(31, 43, 53, 0.85);
  backdrop-filter: blur(18px);
}

.moment-label {
  flex: 0 0 auto;
  white-space: nowrap;
}

.moment-progress-list {
  margin-top: 1.8rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.moment-progress {
  min-width: 0;
}

.moment-progress span {
  display: block;
  margin-bottom: 0.45rem;
  overflow: hidden;
  color: #7a8a94;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.moment-progress i {
  display: block;
  height: 0.32rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.12);
}

.moment-progress i::before {
  content: '';
  display: block;
  width: var(--progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #276d7b, rgba(221, 190, 95, 0.82));
}

.moment-progress.is-active span {
  color: #276d7b;
}

.release-stage {
  position: relative;
  min-height: 560px;
}

.release-stage::before {
  content: '';
  position: absolute;
  inset: 2rem 12% 6.5rem;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.92),
    rgba(49, 127, 141, 0.12) 58%,
    transparent 70%
  );
  filter: blur(1px);
}

.release-cover {
  position: absolute;
  top: 1.25rem;
  left: 50%;
  width: 46%;
  max-width: 250px;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.84);
  background: white;
  box-shadow: 0 30px 80px -44px rgba(31, 43, 53, 0.92);
  transition:
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 520ms ease,
    filter 520ms ease;
}

.release-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.release-cover.is-current {
  z-index: 3;
  opacity: 1;
  transform: translateX(-50%) scale(1.05) rotate(0deg);
}

.release-cover.is-prev {
  z-index: 1;
  opacity: 0.42;
  filter: saturate(0.72);
  transform: translateX(-112%) translateY(2.8rem) scale(0.72) rotate(-8deg);
}

.release-cover.is-next {
  z-index: 1;
  opacity: 0.42;
  filter: saturate(0.72);
  transform: translateX(12%) translateY(2.8rem) scale(0.72) rotate(8deg);
}

.release-copy {
  position: absolute;
  right: 4%;
  top: 21rem;
  bottom: auto;
  left: 4%;
  z-index: 4;
  border-top: 1px solid rgba(49, 127, 141, 0.16);
  padding-top: 1.1rem;
}

.release-progress-list {
  margin-top: 1.6rem;
  display: flex;
  width: min(20rem, 100%);
  gap: 0.55rem;
}

.release-progress-list span {
  height: 0.38rem;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.14);
}

.release-progress-list i {
  display: block;
  width: var(--progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(49, 127, 141, 0.92), rgba(221, 190, 95, 0.82));
}

.release-progress-list span:not(.is-active) i {
  width: 0;
}

.photo-stage {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(224, 244, 246, 0.42)),
    repeating-linear-gradient(
      90deg,
      rgba(49, 127, 141, 0.08) 0,
      rgba(49, 127, 141, 0.08) 1px,
      transparent 1px,
      transparent 18px
    );
  box-shadow: 0 24px 80px -52px rgba(31, 43, 53, 0.92);
}

.photo-stage::before {
  content: '';
  position: absolute;
  inset: 18% 12%;
  border: 1px solid rgba(49, 127, 141, 0.16);
  border-radius: 48% 52% 46% 54%;
  transform: rotate(-8deg);
}

.photo-center-copy {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  display: flex;
  width: 13rem;
  height: 13rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #276d7b;
  opacity: 0;
  text-align: center;
  transform: translate(-50%, -50%) scale(0.88);
  transition:
    opacity 520ms ease,
    transform 520ms ease;
}

.photo-center-copy.is-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.photo-center-copy span {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.photo-center-copy strong {
  margin-top: 0.35rem;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 3rem;
  line-height: 1;
}

.photo-frame {
  position: absolute;
  left: 50%;
  top: 52%;
  z-index: 2;
  width: 34%;
  max-width: 230px;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.86);
  background: white;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78) rotate(0deg);
  box-shadow: 0 26px 70px -46px rgba(31, 43, 53, 0.92);
  transition:
    left 740ms cubic-bezier(0.22, 1, 0.36, 1),
    top 740ms cubic-bezier(0.22, 1, 0.36, 1),
    width 740ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease,
    transform 740ms cubic-bezier(0.22, 1, 0.36, 1);
}

.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-frame figcaption {
  position: absolute;
  inset-x: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent, rgba(17, 24, 39, 0.78));
  padding: 2.8rem 0.7rem 0.7rem;
  font-size: 0.68rem;
  line-height: 1.35;
  color: white;
}

.photo-frame figcaption span {
  display: block;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.photo-frame.is-visible {
  opacity: 1;
}

.photo-frame.is-active {
  z-index: 4;
  transform: translate(-50%, -50%) scale(1) rotate(-2deg);
}

.photo-frame.is-past {
  opacity: 0.42;
  transform: translate(-50%, -50%) scale(0.62) rotate(8deg);
}

.photo-stage.is-assembled .photo-frame {
  left: var(--x);
  top: var(--y);
  width: var(--w);
  transform: rotate(var(--r));
}

.chapter-nav {
  position: absolute;
  right: 1.25rem;
  bottom: 1.1rem;
  left: 1.25rem;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.25rem;
}

.chapter-nav button {
  position: relative;
  min-width: min(22vw, 11rem);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 1.1rem 1.1rem 0.32rem 0.32rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.48)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.08));
  clip-path: polygon(0 18%, 82% 18%, 100% 50%, 82% 82%, 0 82%, 8% 50%);
  padding: 0.8rem 1.35rem 0.85rem 1.15rem;
  text-align: left;
  backdrop-filter: blur(16px);
  transform: translateY(calc((3 - var(--step, 0)) * 0.22rem));
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
}

button,
a[role='button'],
.chapter-nav button,
.chapter-control,
.primary-action,
.brand-pill {
  cursor: pointer;
}

.chapter-nav button:nth-child(1) {
  --step: 0;
}

.chapter-nav button:nth-child(2) {
  --step: 1;
}

.chapter-nav button:nth-child(3) {
  --step: 2;
}

.chapter-nav button:nth-child(4) {
  --step: 3;
}

.chapter-nav button.is-active {
  background:
    linear-gradient(135deg, rgba(39, 109, 123, 0.98), rgba(49, 127, 141, 0.86)),
    linear-gradient(90deg, rgba(221, 190, 95, 0.26), rgba(255, 255, 255, 0));
  color: white;
  transform: translateY(-0.34rem);
}

.chapter-nav button::before {
  content: '';
  position: absolute;
  right: 0.42rem;
  top: 50%;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.16);
  transform: translateY(-50%);
}

.chapter-nav button.is-active::before {
  background: rgba(255, 255, 255, 0.82);
}

.chapter-nav span {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
}

.chapter-nav em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 700;
}

.chapter-control {
  position: absolute;
  top: 50%;
  z-index: 30;
  display: flex;
  width: 5.6rem;
  min-height: 11rem;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.2);
  color: rgba(39, 109, 123, 0.86);
  text-transform: uppercase;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 70px -54px rgba(31, 43, 53, 0.95);
  transform: translateY(-50%);
  transition:
    transform 220ms ease,
    background 220ms ease,
    opacity 220ms ease;
  animation: chapter-control-breathe 3.8s ease-in-out infinite;
}

.chapter-control-prev {
  left: 1.15rem;
  border-radius: 0 999px 999px 0;
}

.chapter-control-next {
  right: 1.15rem;
  border-radius: 999px 0 0 999px;
}

.chapter-control span {
  /* display: block; */
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
}

.chapter-control em {
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.18em;
  writing-mode: vertical-rl;
}

.chapter-control:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.58);
}

.chapter-control-prev:hover {
  transform: translateY(-50%) translateX(-0.2rem);
}

.chapter-control-next:hover {
  transform: translateY(-50%) translateX(0.2rem);
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

@keyframes ring-breathe {
  0%,
  100% {
    opacity: 0.58;
    transform: rotate(18deg) scale(1);
  }

  50% {
    opacity: 1;
    transform: rotate(24deg) scale(1.04);
  }
}

@keyframes chapter-control-breathe {
  0%,
  100% {
    opacity: 0.24;
  }

  45% {
    opacity: 0.78;
  }

  70% {
    opacity: 0.42;
  }
}

@media (max-width: 767px) {
  .anniversary-page {
    min-height: 0;
  }

  .anniversary-slide {
    align-items: stretch;
    padding-bottom: 0;
  }

  .mobile-slide-shell {
    height: 100dvh;
    max-height: 100dvh;
    align-content: start;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-top: 7.8rem !important;
    padding-bottom: 10.5rem;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-slide-shell::-webkit-scrollbar {
    display: none;
  }

  .archive-year-link {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 0.8rem;
  }

  .archive-year-number {
    min-width: 4.4rem;
    min-height: 4.4rem;
    font-size: 1.7rem;
  }

  .section-title {
    font-size: 2.45rem;
  }

  .anniversary-number {
    width: min(62vw, 260px);
  }

  .year-panel {
    min-height: 25rem;
    padding: 1.1rem;
  }

  .moment-progress-list {
    gap: 0.55rem;
  }

  .release-stage {
    display: flex;
    min-height: 0;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 0;
  }

  .release-stage::before {
    inset: 0.85rem 8% 10.2rem;
  }

  .release-cover {
    top: 0;
    width: 38%;
    max-width: 170px;
  }

  .release-cover.is-current {
    transform: translateX(-50%) scale(0.96) rotate(0deg);
  }

  .release-cover.is-prev {
    transform: translateX(-106%) translateY(2.45rem) scale(0.7) rotate(-8deg);
  }

  .release-cover.is-next {
    transform: translateX(6%) translateY(2.45rem) scale(0.7) rotate(8deg);
  }

  .release-copy {
    position: relative;
    right: auto;
    top: auto;
    bottom: auto;
    left: auto;
    margin-top: 12.6rem;
    max-height: none;
    overflow: visible;
    padding-right: 0.25rem;
  }

  .photo-stage {
    min-height: 420px;
    border-radius: 1.3rem;
  }

  .photo-center-copy {
    width: 9.5rem;
    height: 9.5rem;
  }

  .photo-center-copy strong {
    font-size: 2.2rem;
  }

  .photo-frame {
    width: 46%;
  }

  .photo-stage.is-assembled .photo-frame {
    left: var(--mx);
    top: var(--my);
    width: var(--mw);
    transform: rotate(var(--mr));
  }

  .chapter-control {
    left: 50%;
    width: min(40vw, 10.5rem);
    min-height: 3.35rem;
    flex-direction: row;
    border-radius: 1.35rem 0.45rem 1.35rem 0.45rem;
    clip-path: polygon(12% 0, 88% 0, 100% 52%, 82% 100%, 18% 100%, 0 52%);
    transform: translateX(-50%);
  }

  .chapter-control em {
    writing-mode: horizontal-tb;
  }

  .chapter-control-prev {
    top: 4.65rem;
    right: auto;
  }

  .chapter-control-next {
    top: auto;
    right: auto;
    bottom: 4.95rem;
  }

  .chapter-control-prev:hover,
  .chapter-control-next:hover {
    transform: translateX(-50%);
  }

  .primary-action {
    min-height: 3rem;
    padding: 0 1.65rem 0 1.35rem;
  }
}

@media (max-width: 430px) {
  .chapter-nav {
    left: 0.55rem;
    right: 0.55rem;
    gap: 0;
  }

  .chapter-nav button {
    min-width: 25%;
    padding: 0.7rem 0.85rem 0.75rem 0.7rem;
    clip-path: polygon(0 12%, 78% 12%, 100% 50%, 78% 88%, 0 88%, 10% 50%);
  }

  .chapter-nav em {
    display: none;
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .mobile-slide-shell {
    padding-top: 7.1rem !important;
    padding-bottom: 9.4rem;
  }

  .section-title {
    font-size: 2.08rem;
  }

  .anniversary-number {
    width: min(52vw, 210px);
  }

  .year-panel {
    min-height: 0;
  }

  .release-cover {
    width: 34%;
    max-width: 145px;
  }

  .release-cover.is-prev {
    transform: translateX(-105%) translateY(2rem) scale(0.68) rotate(-8deg);
  }

  .release-cover.is-next {
    transform: translateX(5%) translateY(2rem) scale(0.68) rotate(8deg);
  }

  .release-copy {
    margin-top: 10.7rem;
  }

  .photo-stage {
    min-height: 360px;
  }

  .chapter-control {
    min-height: 3rem;
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
