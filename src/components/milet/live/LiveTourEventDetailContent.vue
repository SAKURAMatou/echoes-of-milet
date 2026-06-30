<template>
  <article class="grid gap-6">
    <section
      class="grid gap-6 overflow-hidden rounded-lg border border-[#86bde6]/24 bg-[#031322]/50 p-4 shadow-[0_34px_120px_-82px_rgba(125,211,252,0.72)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,25rem)] lg:items-center"
    >
      <div class="min-w-0">
        <p class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
          {{ formatLiveType(event.type) }}
        </p>
        <h1 class="mt-4 font-serif text-[clamp(2.9rem,7vw,5.7rem)] leading-[0.92] text-[#f3eadf]">
          {{ event.title }}
        </h1>
        <div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#d9b77c]">
          <span v-if="formatLiveDateRange(event)" class="rounded-full border border-[#d9b77c]/38 px-3 py-1">
            {{ formatLiveDateRange(event) }}
          </span>
          <span class="rounded-full border border-[#d9b77c]/38 px-3 py-1">
            {{ performances.length }} {{ lang === 'ja' ? 'Shows' : '场次' }}
          </span>
          <span v-if="cityCount" class="rounded-full border border-[#d9b77c]/38 px-3 py-1">
            {{ cityCount }} {{ lang === 'ja' ? 'Cities' : '城市' }}
          </span>
        </div>
        <p class="mt-7 max-w-2xl text-base leading-8 text-[#d8e8f3]">
          {{ event.summary || fallbackSummary }}
        </p>
      </div>

      <LiveMainVisualPanel :event="event" class="min-h-[18rem]" />
    </section>

    <section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <LiveTourRoute
        :performances="performances"
        :selected-id="selectedPerformanceId"
        :title="event.title"
        :city-count="cityCount"
        :lang="lang"
        @select="selectPerformance"
      />

      <div class="grid gap-5">
        <section class="rounded-lg border border-[#d9b77c]/24 bg-[#061827]/78 p-5">
          <p class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
            Current Stop
          </p>
          <h2 class="mt-3 font-serif text-3xl leading-tight text-[#f3eadf]">
            {{ selectedPerformance?.city || setlistSubtitle }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-[#b8c8d5]">
            {{ [selectedPerformance?.venueName, selectedPerformance?.region].filter(Boolean).join(' / ') || event.venueSummary || '-' }}
          </p>
        </section>

        <LivePerformanceFacts :performance="selectedPerformance" :lang="lang" />
      </div>
    </section>

    <LiveSetlist
      :segments="setlistSegments"
      :subtitle="setlistSubtitle"
      :lang="lang"
      @select-track="handleTrackSelect"
    />

    <LiveRelatedLinks
      :articles="payload.relatedArticles || []"
      :galleries="payload.relatedGalleries || []"
      :lang="lang"
      :route-lang="routeLang"
    />

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
import LiveMainVisualPanel from '@/components/milet/live/LiveMainVisualPanel.vue'
import LivePerformanceFacts from '@/components/milet/live/LivePerformanceFacts.vue'
import LiveRelatedLinks from '@/components/milet/live/LiveRelatedLinks.vue'
import LiveSetlist from '@/components/milet/live/LiveSetlist.vue'
import LiveTourRoute from '@/components/milet/live/LiveTourRoute.vue'
import {
  composeLiveSetlist,
  formatLiveDateRange,
  formatLiveType,
  performanceLabel,
  segmentLiveSetlist,
  type LiveEventDetailPayload,
  type LiveLang,
  type LiveSetlistItem,
} from '@/composables/liveArchive'
import type { Track } from '@/composables/releaseType'
import { apiRoutes } from '@/config/api'

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
const cityCount = computed(
  () => event.value.cityCount || new Set(performances.value.map((item) => item.city).filter(Boolean)).size,
)
const fallbackSummary = computed(() =>
  props.lang === 'ja'
    ? 'ツアーの日程、会場、setlist と関連コンテンツを記録しています。'
    : '记录这轮巡演的日程、场地、曲目与相关内容。',
)
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

function syncInitialPerformance() {
  const initial = props.payload.initialPerformanceId
  const fallback = performances.value[0]?.id
  selectedPerformanceId.value = String(initial ?? fallback ?? '')
}

function selectPerformance(id: string | number) {
  selectedPerformanceId.value = String(id)
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
      apiRoutes.miletReleaseDetail + track.showId,
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
  const showId = String(item.songTrackId || item.songWorkId || '').trim()
  if (showId) {
    trackModalTrack.value = await loadTrackDetail(emptyTrack(showId, item.displayTitle, item.duration))
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
