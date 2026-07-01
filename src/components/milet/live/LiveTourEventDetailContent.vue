<template>
  <article class="grid gap-6">
    <section class="relative overflow-hidden border-b border-[#d9b77c]/18 pb-5 pt-2">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(23rem,0.82fr)] lg:items-end">
        <div class="min-w-0">
          <p
            class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase text-[#d9b77c]"
          >
            {{ formatLiveType(event.type) }}
          </p>
          <h1 class="mt-3 font-serif text-5xl leading-none text-[#f3eadf] sm:text-6xl xl:text-7xl">
            {{ event.title }}
          </h1>
          <p class="mt-2 font-serif text-2xl leading-tight text-[#f3eadf]/82">
            {{ artistLine }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#d9b77c]">
            <span class="rounded-full border border-[#d9b77c]/45 px-3 py-1">
              {{ formatLiveType(event.type) }}
            </span>
            <span v-if="dateRange" class="rounded-full border border-[#d9b77c]/45 px-3 py-1">
              {{ dateRange }}
            </span>
            <span class="rounded-full border border-[#d9b77c]/45 px-3 py-1">
              {{ performances.length }} {{ lang === 'ja' ? 'Performances' : '场次' }}
            </span>
            <span v-if="cityCount" class="rounded-full border border-[#d9b77c]/45 px-3 py-1">
              {{ cityCount }} {{ lang === 'ja' ? 'Cities' : '城市' }}
            </span>
          </div>
          <p class="mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-[#d8e8f3]">
            {{ event.summary || fallbackSummary }}
          </p>
        </div>

        <dl
          class="grid grid-cols-2 rounded-lg border border-[#d9b77c]/22 bg-[#031322]/38 sm:grid-cols-4"
        >
          <div
            v-for="stat in tourStats"
            :key="stat.label"
            class="grid min-h-[7.2rem] place-items-center border-[#d9b77c]/18 px-4 py-3 text-center sm:border-l first:border-l-0"
          >
            <dt class="grid gap-2 text-[#d9b77c]">
              <span class="mx-auto grid size-9 place-items-center" aria-hidden="true">
                <svg
                  v-if="stat.icon === 'calendar'"
                  class="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                <svg
                  v-else-if="stat.icon === 'ticket'"
                  class="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6V7Z" />
                  <path d="M9 8h.01" />
                  <path d="M9 12h.01" />
                  <path d="M9 16h.01" />
                </svg>
                <svg
                  v-else-if="stat.icon === 'city'"
                  class="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 21h16" />
                  <path d="M6 21V8l5-4 5 4v13" />
                  <path d="M9 21v-6h4v6" />
                  <path d="M8.5 10h.01" />
                  <path d="M13.5 10h.01" />
                </svg>
                <svg
                  v-else
                  class="size-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 19V5" />
                  <path d="M18 19V5" />
                  <path d="M6 7h12" />
                  <path d="M6 17h12" />
                  <path d="M10 5v14" />
                  <path d="M14 5v14" />
                </svg>
              </span>
              <span class="text-xs text-[#d9b77c]/78">{{ stat.label }}</span>
            </dt>
            <dd class="mt-2 font-serif text-xl leading-tight text-[#f3eadf]">
              {{ stat.value }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <LiveTourRoute
      :event="event"
      :performances="performances"
      :selected-id="selectedPerformanceId"
      :title="event.title"
      :city-count="cityCount"
      :lang="lang"
      @select="selectPerformance"
    />

    <section
      class="rounded-lg border border-[#d9b77c]/45 bg-[#031322]/64 p-5 shadow-[0_32px_96px_-62px_rgba(244,211,151,0.82)] sm:p-6"
    >
      <div
        class="grid gap-5 lg:items-center"
        :class="
          selectedVenueLineArtUrl
            ? 'lg:grid-cols-[8rem_minmax(0,1fr)_minmax(12rem,18rem)_minmax(9rem,12rem)_minmax(12rem,1fr)]'
            : 'lg:grid-cols-[8rem_minmax(0,1fr)_minmax(12rem,18rem)_minmax(9rem,12rem)]'
        "
      >
        <div class="border-[#d9b77c]/30 lg:border-r">
          <p class="inline-flex items-center gap-2 text-sm text-[#d9b77c]">
            <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            {{ lang === 'ja' ? '選択公演' : '选中场次' }}
          </p>
          <p class="mt-2 font-['Montserrat','sans-serif'] text-6xl leading-none text-[#f4d397]">
            {{ selectedStopNumber }}
          </p>
        </div>
        <div>
          <h2 class="font-serif text-4xl leading-tight text-[#f3eadf]">
            {{ selectedPerformance?.city || setlistSubtitle }}
          </h2>
          <p class="mt-2 text-lg text-[#d8e8f3]">{{ selectedDateLine }}</p>
        </div>
        <div class="flex items-start gap-3 text-[#d8e8f3]">
          <svg
            class="mt-1 size-6 shrink-0 text-[#d9b77c]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
          <div class="min-w-0">
            <p class="break-words text-lg text-[#f3eadf]">
              <a
                v-if="selectedVenueOfficialUrl"
                :href="selectedVenueOfficialUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="underline decoration-[#d9b77c]/45 underline-offset-4 transition hover:text-[#9fd4ff] hover:decoration-[#9fd4ff]"
              >
                {{ selectedPerformance?.venueName || '-' }}
              </a>
              <template v-else>{{ selectedPerformance?.venueName || '-' }}</template>
            </p>
            <p class="mt-1 text-sm text-[#b8c8d5]">{{ selectedVenueLine }}</p>
          </div>
        </div>
        <dl
          class="grid grid-cols-2 gap-3 border-[#d9b77c]/22 text-sm text-[#d8e8f3] lg:border-l lg:pl-6"
        >
          <div>
            <dt class="font-['Montserrat','sans-serif'] text-xs uppercase text-[#d9b77c]">Open</dt>
            <dd class="mt-1 text-lg text-[#f3eadf]">{{ selectedPerformance?.openTime || '-' }}</dd>
          </div>
          <div>
            <dt class="font-['Montserrat','sans-serif'] text-xs uppercase text-[#d9b77c]">Start</dt>
            <dd class="mt-1 text-lg text-[#f3eadf]">{{ selectedPerformance?.startTime || '-' }}</dd>
          </div>
        </dl>
        <figure
          v-if="selectedVenueLineArtUrl"
          class="flex min-h-28 items-center justify-center border-[#d9b77c]/22 lg:border-l lg:pl-6"
        >
          <img
            :src="buildStaticAssetUrl(selectedVenueLineArtUrl)"
            alt=""
            loading="lazy"
            decoding="async"
            class="max-h-36 w-full rounded-md object-contain"
          />
        </figure>
      </div>

      <div
        class="mt-6 flex items-center gap-4 border-t border-[#d9b77c]/18 pt-4 text-sm font-semibold uppercase text-[#d9b77c]"
      >
        <button
          type="button"
          class="inline-flex items-center gap-2 transition hover:text-white disabled:cursor-default disabled:opacity-40"
          :disabled="performances.length < 2"
          @click="selectAdjacent(-1)"
        >
          <span aria-hidden="true">←</span>
          <span>Prev</span>
        </button>
        <span
          class="h-px flex-1 bg-gradient-to-r from-[#d9b77c]/25 via-[#f4d397]/58 to-[#d9b77c]/25"
        ></span>
        <button
          type="button"
          class="inline-flex items-center gap-2 transition hover:text-white disabled:cursor-default disabled:opacity-40"
          :disabled="performances.length < 2"
          @click="selectAdjacent(1)"
        >
          <span>Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>

    <section class="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.85fr)] xl:items-start">
      <LiveSetlist
        :segments="setlistSegments"
        :subtitle="setlistSubtitle"
        :lang="lang"
        :setlist-state="setlistState"
        :empty-message="setlistEmptyMessage"
        @select-track="handleTrackSelect"
      />

      <LiveRelatedLinks
        :articles="payload.relatedArticles || []"
        :galleries="payload.relatedGalleries || []"
        :lang="lang"
        :route-lang="routeLang"
        layout="rail"
      />
    </section>

    <p
      v-if="trackNotice"
      class="fixed bottom-5 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 rounded-lg border border-[#d9b77c]/36 bg-[#061827]/95 px-4 py-3 text-center text-sm text-[#f3eadf] shadow-2xl backdrop-blur"
    >
      {{ trackNotice }}
    </p>

    <TrackModal
      v-if="trackModalMounted"
      :open="trackModalOpen"
      :track="trackModalTrack"
      @close="closeTrackModal"
    />

    <RouterLink
      :to="{ name: 'miletLiveArchive', params: { lang: routeLang } }"
      class="mx-auto mb-4 mt-3 inline-flex items-center gap-3 text-sm font-semibold text-[#b8c8d5] transition hover:text-[#f3eadf]"
    >
      <span aria-hidden="true">←</span>
      <span>{{ lang === 'ja' ? 'Back to Live Archive' : '返回 Live Archive 列表' }}</span>
    </RouterLink>
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import LiveRelatedLinks from '@/components/milet/live/LiveRelatedLinks.vue'
import LiveSetlist from '@/components/milet/live/LiveSetlist.vue'
import LiveTourRoute from '@/components/milet/live/LiveTourRoute.vue'
import {
  composeLiveSetlist,
  formatLiveDate,
  formatLiveDateRange,
  formatLiveType,
  liveLangRequestConfig,
  normalizeExternalUrl,
  performanceLabel,
  resolveLiveSetlistState,
  resolveSetlistEmptyMessage,
  resolveLiveTrackShowId,
  resolveVenueLineArtUrl,
  segmentLiveSetlist,
  type LiveEventDetailPayload,
  type LiveLang,
  type LiveSetlistItem,
} from '@/composables/liveArchive'
import type { Track } from '@/composables/releaseType'
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'

const TrackModal = defineAsyncComponent(() => import('@/components/milet/music/TrackModal.vue'))

const props = defineProps<{
  payload: LiveEventDetailPayload
  lang: LiveLang
  routeLang: string
}>()

const selectedPerformanceId = ref('')
const trackNotice = ref('')
const trackModalOpen = ref(false)
const trackModalMounted = ref(false)
const trackModalTrack = ref<Track | null>(null)
let trackNoticeTimer = 0

const event = computed(() => props.payload.event)
const performances = computed(() =>
  [...(props.payload.performances || [])].sort(
    (a, b) => (Number(a.sortNo) || 0) - (Number(b.sortNo) || 0),
  ),
)
const selectedPerformance = computed(() => {
  return (
    performances.value.find((item) => String(item.id) === selectedPerformanceId.value) ||
    performances.value[0] ||
    null
  )
})
const selectedPerformanceIndex = computed(() => {
  const index = performances.value.findIndex(
    (item) => String(item.id) === selectedPerformanceId.value,
  )
  return index >= 0 ? index : 0
})
const cityCount = computed(
  () =>
    event.value.cityCount ||
    new Set(performances.value.map((item) => item.city).filter(Boolean)).size,
)
const dateRange = computed(() => formatLiveDateRange(event.value))
const artistLine = computed(() => event.value.artist || 'milet')
const fallbackSummary = computed(() =>
  props.lang === 'ja'
    ? 'ツアーの日程、会場、setlist と関連コンテンツを記録しています。'
    : '记录这轮巡演的日程、场地、曲目与相关内容。',
)
const tourStats = computed(() => [
  {
    icon: 'calendar',
    label: props.lang === 'ja' ? '巡演期間' : '巡演期间',
    value: dateRange.value || '-',
  },
  {
    icon: 'ticket',
    label: props.lang === 'ja' ? 'Performances' : '场次',
    value: String(performances.value.length || event.value.performanceCount || 0),
  },
  {
    icon: 'city',
    label: props.lang === 'ja' ? 'Cities' : '城市',
    value: String(cityCount.value || 0),
  },
  {
    icon: 'route',
    label: props.lang === 'ja' ? 'Tour' : '类型',
    value: formatLiveType(event.value.type),
  },
])
const selectedOverrides = computed(() => {
  const key = selectedPerformance.value?.id
  if (key === undefined || key === null) return []
  return props.payload.setlistOverridesByPerformanceId?.[String(key)] || []
})
const setlistItems = computed(() =>
  composeLiveSetlist(props.payload.eventSetlist, selectedOverrides.value),
)
const setlistSegments = computed(() => segmentLiveSetlist(setlistItems.value))
const setlistSubtitle = computed(() =>
  selectedPerformance.value ? performanceLabel(selectedPerformance.value) : '',
)
const setlistState = computed(() => resolveLiveSetlistState(props.payload))
const setlistEmptyMessage = computed(() => resolveSetlistEmptyMessage(props.payload, props.lang))
const selectedStopNumber = computed(() =>
  String(selectedPerformanceIndex.value + 1).padStart(2, '0'),
)
const selectedDateLine = computed(() => {
  const performance = selectedPerformance.value
  if (!performance) return ''
  return [formatLiveDate(performance.date), performanceLabel(performance)]
    .filter(Boolean)
    .join(' / ')
})
const selectedVenueLine = computed(() => {
  const performance = selectedPerformance.value
  if (!performance) return ''
  return [performance.city, performance.region].filter(Boolean).join(', ')
})
const selectedVenueOfficialUrl = computed(() => {
  const performance = selectedPerformance.value
  return performance?.venueName ? normalizeExternalUrl(performance.venueOfficialUrl) : ''
})
const selectedVenueLineArtUrl = computed(() => resolveVenueLineArtUrl(selectedPerformance.value))

function syncInitialPerformance() {
  const initial = props.payload.initialPerformanceId
  const fallback = performances.value[0]?.id
  selectedPerformanceId.value = String(initial ?? fallback ?? '')
}

function selectPerformance(id: string | number) {
  selectedPerformanceId.value = String(id)
}

function selectAdjacent(delta: number) {
  if (performances.value.length < 2) return
  const nextIndex =
    (selectedPerformanceIndex.value + delta + performances.value.length) % performances.value.length
  const next = performances.value[nextIndex]
  if (next) selectPerformance(next.id)
}

function emptyTrack(showId: string, title: string, duration?: string): Track {
  return {
    showId,
    no: 0,
    title,
    durationSec: parseDurationSec(duration),
    lyric: '',
    singer: '',
    lyricists: '',
    composers: '',
    arrangers: '',
    recorded_at: '',
    performers: '',
    language: '',
  }
}

function parseDurationSec(duration?: string) {
  if (!duration) return 0
  const matched = duration.match(/^(\d{1,2}):(\d{2})$/)
  if (!matched) return 0
  return Number(matched[1]) * 60 + Number(matched[2])
}

async function loadTrackDetail(track: Track) {
  try {
    const detail = await axiosInstance.get<{ code?: number; data?: Partial<Track> }>(
      `${apiRoutes.miletReleaseDetail}${track.showId}`,
      liveLangRequestConfig(props.lang),
    )
    const data = detail?.data || {}
    return {
      ...track,
      ...data,
      showId: track.showId,
      title: data.title || track.title,
      no: track.no,
      durationSec: track.durationSec,
    }
  } catch (error) {
    console.error('Failed to load live track detail:', error)
    return track
  }
}

async function handleTrackSelect(item: LiveSetlistItem) {
  const showId = resolveLiveTrackShowId(item)
  if (showId) {
    trackModalTrack.value = await loadTrackDetail(
      emptyTrack(showId, item.displayTitle, item.duration),
    )
    trackModalMounted.value = true
    trackModalOpen.value = true
    return
  }

  if (trackNoticeTimer) window.clearTimeout(trackNoticeTimer)
  trackNotice.value =
    props.lang === 'ja'
      ? `${item.displayTitle} は楽曲詳細に未連携です。`
      : `${item.displayTitle} 还没有关联歌曲详情。`
  trackNoticeTimer = window.setTimeout(() => {
    trackNotice.value = ''
  }, 2600)
}

function closeTrackModal() {
  trackModalOpen.value = false

  window.setTimeout(() => {
    if (!trackModalOpen.value) {
      trackModalMounted.value = false
      trackModalTrack.value = null
    }
  }, 320)
}

watch(
  () => props.payload,
  () => syncInitialPerformance(),
  { immediate: true },
)

onBeforeUnmount(() => {
  if (trackNoticeTimer) window.clearTimeout(trackNoticeTimer)
})
</script>
