<template>
  <article class="grid gap-7">
    <section
      class="grid gap-8 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)_minmax(18rem,0.82fr)] lg:items-center"
    >
      <div class="min-w-0">
        <p
          class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--live-detail-accent)]"
        >
          {{ formatLiveType(event.type) }}
        </p>
        <h1
          class="mt-3 font-serif text-[clamp(3rem,7vw,5.6rem)] leading-[0.92] text-[var(--live-detail-title)]"
        >
          {{ event.title }}
        </h1>
        <p class="mt-2 font-serif text-2xl text-[var(--live-detail-title-soft)]">
          {{ event.artist || 'milet' }}
        </p>
        <div
          class="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[var(--live-detail-accent)]"
        >
          <span class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1">
            {{ formatLiveType(event.type) }}
          </span>
          <span
            v-if="event.year"
            class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1"
          >
            {{ event.year }}
          </span>
          <span class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1">
            {{ performances.length }} {{ lang === 'ja' ? 'Performances' : '场次' }}
          </span>
          <span
            v-if="cityCount"
            class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1"
          >
            {{ cityCount }} {{ lang === 'ja' ? 'Cities' : '城市' }}
          </span>
        </div>
        <p
          class="mt-6 max-w-2xl whitespace-pre-line text-base leading-8 text-[var(--live-detail-text)]"
        >
          {{ event.summary || fallbackSummary }}
        </p>
      </div>

      <LiveMainVisualPanel :event="event" class="mx-auto w-full max-w-sm" />
      <dl
        class="grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-surface-bg)] lg:grid-cols-1"
      >
        <div
          v-for="stat in tourStats"
          :key="stat.label"
          class="grid md:grid-cols-[auto_1fr] max-md:grid-rows-[auto_1fr] gap-1 min-h-28 md:place-items-center border-[var(--live-detail-line)] px-4 py-4 text-center lg:border-t first:lg:border-t-0"
        >
          <dt
            class="md:grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--live-detail-muted)]"
          >
            <span
              class="mx-auto grid size-9 place-items-center text-[var(--live-detail-accent)]"
              aria-hidden="true"
            >
              <svg
                class="size-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path v-if="stat.icon === 'calendar'" d="M8 2v4" />
                <path v-if="stat.icon === 'calendar'" d="M16 2v4" />
                <rect v-if="stat.icon === 'calendar'" width="18" height="18" x="3" y="4" rx="2" />
                <path v-if="stat.icon === 'calendar'" d="M3 10h18" />
                <path
                  v-if="stat.icon === 'ticket'"
                  d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6V7Z"
                />
                <path v-if="stat.icon === 'ticket'" d="M9 8h.01" />
                <path v-if="stat.icon === 'ticket'" d="M9 12h.01" />
                <path v-if="stat.icon === 'ticket'" d="M9 16h.01" />
                <path v-if="stat.icon === 'city'" d="M4 21h16" />
                <path v-if="stat.icon === 'city'" d="M6 21V8l5-4 5 4v13" />
                <path v-if="stat.icon === 'city'" d="M9 21v-6h4v6" />
                <path v-if="stat.icon === 'city'" d="M8.5 10h.01" />
                <path v-if="stat.icon === 'city'" d="M13.5 10h.01" />
              </svg>
            </span>
            <span>{{ stat.label }}</span>
          </dt>
          <div class="grid gap-1 place-items-center">
            <dd class="mt-2 font-serif text-2xl leading-tight text-[var(--live-detail-title)]">
              {{ stat.value }}
            </dd>
            <p v-if="stat.sub" class="mt-1 text-xs text-[var(--live-detail-muted)]">
              {{ stat.sub }}
            </p>
          </div>
        </div>
      </dl>
    </section>

    <section class="relative overflow-hidden rounded-lg border border-transparent py-2">
      <div class="mb-4 flex flex-wrap justify-end gap-2 text-sm">
        <div
          class="inline-flex overflow-hidden rounded-md border border-[var(--live-detail-accent-border)]"
        >
          <button
            v-for="month in monthTabs"
            :key="month.key"
            type="button"
            class="px-4 py-2 text-sm transition"
            :class="
              selectedMonth === month.key
                ? 'bg-white/10 text-[var(--live-detail-accent-strong)]'
                : 'text-[var(--live-detail-muted)] hover:text-[var(--live-detail-title)]'
            "
            :aria-pressed="selectedMonth === month.key"
            @click="selectMonth(month.key)"
          >
            {{ month.label }}
          </button>
        </div>
      </div>

      <ol v-if="visibleRouteStops.length" class="grid gap-3 md:hidden">
        <li v-for="stop in visibleRouteStops" :key="stop.performance.id">
          <button
            type="button"
            class="grid min-h-20 w-full grid-cols-[3.75rem_minmax(0,1fr)_2rem] items-center gap-3 rounded-md border p-3 text-left transition"
            :class="routeStopListClass(stop)"
            :aria-pressed="selectedPerformanceId === String(stop.performance.id)"
            @click="selectPerformance(stop.performance.id)"
          >
            <span
              class="grid size-12 place-items-center rounded-full border border-[var(--live-detail-accent-border)] font-['Montserrat','sans-serif'] text-sm font-semibold text-[var(--live-detail-accent-strong)] transition"
            >
              {{ stop.number }}
            </span>
            <span class="min-w-0">
              <span class="block truncate font-serif text-2xl text-[var(--live-detail-title)]">
                {{ stop.performance.city || performanceLabel(stop.performance, stop.index) }}
              </span>
              <span class="mt-1 block truncate text-sm text-[var(--live-detail-muted)]">
                {{ shortDate(stop.performance.date) }} ·
                {{ stop.performance.venueName || performanceLabel(stop.performance, stop.index) }}
              </span>
            </span>
            <span class="text-center text-xl text-[var(--live-detail-accent)]" aria-hidden="true"
              >›</span
            >
          </button>
        </li>
      </ol>

      <p
        v-else
        class="rounded border border-dashed border-white/16 p-6 text-center text-sm text-[var(--live-detail-muted)]"
      >
        {{ lang === 'ja' ? 'この期間の公演はありません。' : '当前月份暂无场次。' }}
      </p>

      <div class="hidden overflow-x-auto pb-2 md:block">
        <div
          class="relative min-h-[34rem] min-w-[58rem] overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.075),transparent_18rem)]"
        >
          <svg
            class="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 560"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              :d="ROUTE_PATH_D"
              fill="none"
              stroke="var(--live-detail-route)"
              stroke-width="3"
              stroke-linecap="round"
              opacity="0.72"
            />
            <path
              :d="ROUTE_PATH_D"
              fill="none"
              stroke="var(--live-detail-route)"
              stroke-width="11"
              stroke-linecap="round"
              opacity="0.08"
            />
          </svg>

          <ol>
            <li
              v-for="stop in visibleRouteStops"
              :key="stop.performance.id"
              class="absolute"
              :style="{ left: `${stop.x}%`, top: `${stop.y}%` }"
            >
              <button
                type="button"
                class="group relative grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center text-center transition"
                :class="routeStopNodeClass(stop)"
                :aria-label="`${stop.number} ${stop.performance.city || performanceLabel(stop.performance, stop.index)}`"
                :aria-pressed="selectedPerformanceId === String(stop.performance.id)"
                @click="selectPerformance(stop.performance.id)"
              >
                <span
                  class="grid size-11 place-items-center rounded-full border font-['Montserrat','sans-serif'] text-sm font-semibold transition"
                  :class="
                    selectedPerformanceId === String(stop.performance.id)
                      ? 'border-[var(--live-detail-accent-strong)] bg-[var(--live-detail-accent-strong)] text-[#031322] shadow-[0_0_34px_var(--live-detail-glow)]'
                      : 'border-[var(--live-detail-accent-border)] bg-[var(--live-detail-surface-bg)] text-[var(--live-detail-title)] group-hover:border-[var(--live-detail-accent-strong)] group-hover:bg-white/10'
                  "
                >
                  {{ stop.number }}
                </span>
                <span
                  class="pointer-events-none absolute left-1/2 flex w-32 -translate-x-1/2 flex-col items-center text-center transition"
                  :class="routeStopInfoClass(stop)"
                >
                  <span
                    class="block max-w-full truncate font-serif text-lg leading-tight text-[var(--live-detail-title)]"
                  >
                    {{ stop.performance.city || performanceLabel(stop.performance, stop.index) }}
                  </span>
                  <span class="block text-sm leading-tight text-[var(--live-detail-muted)]">{{
                    shortDate(stop.performance.date)
                  }}</span>
                </span>
              </button>
            </li>
          </ol>

          <div
            v-if="selectedRouteStop"
            class="absolute z-50 w-64 rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-panel-bg)] p-4 shadow-[0_26px_70px_-42px_var(--live-detail-glow)] transition-[left,top,transform] duration-300"
            :style="selectedStopCardStyle"
          >
            <p class="font-serif text-3xl text-[var(--live-detail-title)]">
              {{ selectedPerformance?.city || setlistSubtitle }}
            </p>
            <p class="mt-1 text-sm text-[var(--live-detail-muted)]">
              {{ selectedPerformance?.venueName || '-' }}
            </p>
            <p class="mt-4 text-sm text-[var(--live-detail-text)]">{{ selectedDateLine }}</p>
            <p class="mt-1 text-sm text-[var(--live-detail-text)]">
              OPEN {{ selectedPerformance?.openTime || '-' }} / START
              {{ selectedPerformance?.startTime || '-' }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-5 lg:grid-cols-[minmax(17rem,23rem)_minmax(0,1fr)]">
      <aside
        class="overflow-hidden rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-panel-bg)] p-5"
      >
        <p
          class="inline-flex items-center gap-2 font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--live-detail-accent)]"
        >
          <svg
            class="size-4 shrink-0"
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
          Selected Stop
        </p>
        <h2 class="mt-4 font-serif text-4xl text-[var(--live-detail-title)]">
          {{ selectedPerformance?.city || setlistSubtitle }}
        </h2>
        <dl class="mt-5 grid gap-3 text-sm text-[var(--live-detail-text)]">
          <div>{{ selectedPerformance?.venueName || '-' }}</div>
          <div>{{ selectedDateLine }}</div>
          <div>
            OPEN {{ selectedPerformance?.openTime || '-' }} / START
            {{ selectedPerformance?.startTime || '-' }}
          </div>
        </dl>
        <figure v-if="selectedVenueLineArtUrl" class="live-venue-line-art-frame mt-6 p-3">
          <img
            :src="buildStaticAssetUrl(selectedVenueLineArtUrl)"
            alt=""
            loading="lazy"
            decoding="async"
            class="live-venue-line-art-img max-h-64"
          />
        </figure>
      </aside>

      <LiveSetlist
        :segments="setlistSegments"
        :subtitle="setlistSubtitle"
        :lang="lang"
        :setlist-state="setlistState"
        :empty-message="setlistEmptyMessage"
        @select-track="handleTrackSelect"
      />
    </section>

    <LiveRelatedLinks
      :articles="payload.relatedArticles || []"
      :galleries="payload.relatedGalleries || []"
      :lang="lang"
      :route-lang="routeLang"
    />

    <p
      v-if="trackNotice"
      class="fixed bottom-5 left-1/2 z-50 w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-panel-bg)] px-4 py-3 text-center text-sm text-[var(--live-detail-title)] shadow-2xl backdrop-blur"
    >
      {{ trackNotice }}
    </p>

    <TrackModal
      v-if="trackModalMounted"
      :open="trackModalOpen"
      :track="trackModalTrack"
      @close="closeTrackModal"
    />
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'

import axiosInstance from '@/AxiosUtil'
import LiveMainVisualPanel from '@/components/milet/live/LiveMainVisualPanel.vue'
import LiveRelatedLinks from '@/components/milet/live/LiveRelatedLinks.vue'
import LiveSetlist from '@/components/milet/live/LiveSetlist.vue'
import {
  composeLiveSetlist,
  formatLiveDate,
  formatLiveDateRange,
  formatLiveType,
  liveLangRequestConfig,
  performanceLabel,
  resolveLiveSetlistState,
  resolveSetlistEmptyMessage,
  resolveLiveTrackShowId,
  resolveVenueLineArtUrl,
  segmentLiveSetlist,
  type LiveEventDetailPayload,
  type LiveLang,
  type LivePerformance,
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

type RoutePoint = {
  x: number
  y: number
}
type RouteSample = RoutePoint & {
  length: number
}
type RouteCurve = [RoutePoint, RoutePoint, RoutePoint, RoutePoint]

const ROUTE_VIEWBOX_WIDTH = 1000
const ROUTE_VIEWBOX_HEIGHT = 560
const ROUTE_SAMPLE_STEPS = 36
const ROUTE_PATH_D =
  'M80 96 C 150 30 270 102 375 94 S 610 78 790 94 C 930 108 938 220 790 236 C 650 252 440 216 276 238 C 94 262 60 388 210 410 C 344 430 510 370 670 394 C 790 412 844 472 930 430'
const ROUTE_CURVES: RouteCurve[] = [
  [
    { x: 80, y: 96 },
    { x: 150, y: 30 },
    { x: 270, y: 102 },
    { x: 375, y: 94 },
  ],
  [
    { x: 375, y: 94 },
    { x: 480, y: 86 },
    { x: 610, y: 78 },
    { x: 790, y: 94 },
  ],
  [
    { x: 790, y: 94 },
    { x: 930, y: 108 },
    { x: 938, y: 220 },
    { x: 790, y: 236 },
  ],
  [
    { x: 790, y: 236 },
    { x: 650, y: 252 },
    { x: 440, y: 216 },
    { x: 276, y: 238 },
  ],
  [
    { x: 276, y: 238 },
    { x: 94, y: 262 },
    { x: 60, y: 388 },
    { x: 210, y: 410 },
  ],
  [
    { x: 210, y: 410 },
    { x: 344, y: 430 },
    { x: 510, y: 370 },
    { x: 670, y: 394 },
  ],
  [
    { x: 670, y: 394 },
    { x: 790, y: 412 },
    { x: 844, y: 472 },
    { x: 930, y: 430 },
  ],
]
const ROUTE_SAMPLES = buildRouteSamples()
const ROUTE_TOTAL_LENGTH = ROUTE_SAMPLES[ROUTE_SAMPLES.length - 1]?.length || 0

const selectedPerformanceId = ref('')
const selectedMonth = ref('all')
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
const selectedPerformance = computed(
  () =>
    performances.value.find((item) => String(item.id) === selectedPerformanceId.value) ||
    performances.value[0] ||
    null,
)
const cityCount = computed(
  () =>
    event.value.cityCount ||
    new Set(performances.value.map((item) => item.city).filter(Boolean)).size,
)
const fallbackSummary = computed(() =>
  props.lang === 'ja'
    ? 'ツアーの日程、会場、setlist と関連コンテンツを記録しています。'
    : '记录这轮巡演的日程、场地、曲目与相关内容。',
)
const tourStats = computed(() => [
  {
    icon: 'calendar',
    label: 'Period',
    value: formatLiveDateRange(event.value) || '-',
    sub: props.lang === 'ja' ? '巡演期間' : '巡演期间',
  },
  {
    icon: 'ticket',
    label: 'Shows',
    value: String(performances.value.length || event.value.performanceCount || 0),
    sub: 'Performances',
  },
  {
    icon: 'city',
    label: 'Cities',
    value: String(cityCount.value || 0),
    sub: props.lang === 'ja' ? '都市' : '城市',
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
const selectedDateLine = computed(() =>
  selectedPerformance.value
    ? [formatLiveDate(selectedPerformance.value.date), performanceLabel(selectedPerformance.value)]
        .filter(Boolean)
        .join(' / ')
    : '',
)
const selectedVenueLineArtUrl = computed(() => resolveVenueLineArtUrl(selectedPerformance.value))
const selectedRouteStop = computed(() =>
  routeStops.value.find((stop) => String(stop.performance.id) === selectedPerformanceId.value),
)
const selectedStopCardStyle = computed(() => {
  const stop = selectedRouteStop.value
  if (!stop) return {}
  const translateX = stop.x > 72 ? 'calc(-100% - 1rem)' : stop.x < 22 ? '1rem' : '-50%'
  const translateY = stop.y > 60 ? 'calc(-100% - 3.25rem)' : '3.25rem'
  return {
    left: `${stop.x}%`,
    top: `${stop.y}%`,
    transform: `translate(${translateX}, ${translateY})`,
  }
})

const routeStops = computed(() =>
  performances.value.map((performance, index) => {
    const position = routePositionForIndex(index, performances.value.length)
    return {
      performance,
      index,
      number: String(index + 1).padStart(2, '0'),
      month: monthKey(performance.date),
      x: position.x,
      y: position.y,
    }
  }),
)
const visibleRouteStops = computed(() => routeStops.value)
const monthTabs = computed(() => {
  const months = Array.from(
    new Set(performances.value.map((item) => monthKey(item.date)).filter(Boolean)),
  )
  return [{ key: 'all', label: 'All' }, ...months.map((key) => ({ key, label: monthLabel(key) }))]
})

function monthKey(date?: string) {
  return typeof date === 'string' && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : ''
}

function monthLabel(key: string) {
  if (key === 'all') return 'All'
  const month = Number(key.slice(5, 7))
  return Number.isFinite(month) && month > 0
    ? new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(2024, month - 1, 1))
    : key
}

function shortDate(date?: string) {
  const formatted = formatLiveDate(date)
  return formatted ? formatted.slice(5) : ''
}

function syncInitialPerformance() {
  const initial = props.payload.initialPerformanceId
  const fallback = performances.value[0]?.id
  selectedPerformanceId.value = String(initial ?? fallback ?? '')
  selectedMonth.value = 'all'
}

function selectPerformance(id: string | number) {
  selectedPerformanceId.value = String(id)
}

function selectMonth(key: string) {
  selectedMonth.value = key
}

function isRouteStopDimmed(stop: { month: string; performance: LivePerformance }) {
  return (
    selectedMonth.value !== 'all' &&
    stop.month !== selectedMonth.value &&
    String(stop.performance.id) !== selectedPerformanceId.value
  )
}

function routeStopListClass(stop: { month: string; performance: LivePerformance }) {
  if (selectedPerformanceId.value === String(stop.performance.id)) {
    return 'border-[var(--live-detail-accent-strong)] bg-white/[0.08] shadow-[0_0_28px_-16px_var(--live-detail-glow)]'
  }
  if (isRouteStopDimmed(stop)) {
    return 'border-white/[0.08] bg-[var(--live-detail-surface-bg)] opacity-45 hover:opacity-75'
  }
  return 'border-white/10 bg-[var(--live-detail-surface-bg)] hover:border-[var(--live-detail-accent-border)] hover:bg-white/[0.04]'
}

function routeStopNodeClass(stop: { month: string; performance: LivePerformance }) {
  if (isRouteStopDimmed(stop)) return 'z-0 opacity-35 saturate-50 hover:opacity-75'
  if (selectedPerformanceId.value === String(stop.performance.id)) return 'z-20 opacity-100'
  return 'z-10 opacity-100'
}

function routeStopInfoClass(stop: { index: number }) {
  return (stop.index + 1) % 2 === 1 ? 'bottom-14' : 'top-14'
}

function routePositionForIndex(index: number, total: number) {
  if (total <= 0) return { x: 0, y: 0 }
  const progress = total === 1 ? 0.5 : index / (total - 1)
  const point = pointAtRouteProgress(progress)
  return {
    x: (point.x / ROUTE_VIEWBOX_WIDTH) * 100,
    y: (point.y / ROUTE_VIEWBOX_HEIGHT) * 100,
  }
}

function buildRouteSamples() {
  const samples: RouteSample[] = []
  let length = 0
  let previous = ROUTE_CURVES[0]?.[0] || { x: 0, y: 0 }
  samples.push({ ...previous, length })
  for (const curve of ROUTE_CURVES) {
    for (let step = 1; step <= ROUTE_SAMPLE_STEPS; step += 1) {
      const point = cubicPoint(curve, step / ROUTE_SAMPLE_STEPS)
      length += distanceBetween(previous, point)
      samples.push({ ...point, length })
      previous = point
    }
  }
  return samples
}

function pointAtRouteProgress(progress: number) {
  if (ROUTE_SAMPLES.length === 0) return { x: 0, y: 0 }
  const clamped = Math.min(1, Math.max(0, progress))
  const targetLength = ROUTE_TOTAL_LENGTH * clamped
  for (let index = 1; index < ROUTE_SAMPLES.length; index += 1) {
    const current = ROUTE_SAMPLES[index]
    if (current.length < targetLength) continue
    const previous = ROUTE_SAMPLES[index - 1]
    const segmentLength = current.length - previous.length
    const ratio = segmentLength > 0 ? (targetLength - previous.length) / segmentLength : 0
    return {
      x: previous.x + (current.x - previous.x) * ratio,
      y: previous.y + (current.y - previous.y) * ratio,
    }
  }
  const last = ROUTE_SAMPLES[ROUTE_SAMPLES.length - 1]
  return { x: last.x, y: last.y }
}

function cubicPoint(curve: RouteCurve, t: number) {
  const [p0, p1, p2, p3] = curve
  const inverse = 1 - t
  const inverseSquared = inverse * inverse
  const tSquared = t * t
  return {
    x:
      inverseSquared * inverse * p0.x +
      3 * inverseSquared * t * p1.x +
      3 * inverse * tSquared * p2.x +
      tSquared * t * p3.x,
    y:
      inverseSquared * inverse * p0.y +
      3 * inverseSquared * t * p1.y +
      3 * inverse * tSquared * p2.y +
      tSquared * t * p3.y,
  }
}

function distanceBetween(a: RoutePoint, b: RoutePoint) {
  return Math.hypot(b.x - a.x, b.y - a.y)
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
