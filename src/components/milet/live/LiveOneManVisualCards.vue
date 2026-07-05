<template>
  <article class="grid gap-6">
    <section
      class="grid gap-8 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,29rem)] lg:items-center"
    >
      <div class="min-w-0">
        <p
          class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--live-detail-accent)]"
        >
          Live Archive
        </p>
        <h1
          class="mt-4 font-serif text-[clamp(3.4rem,7vw,6rem)] leading-[0.92] text-[var(--live-detail-title)]"
        >
          {{ event.title }}
        </h1>
        <p class="mt-2 font-serif text-3xl leading-tight text-[var(--live-detail-title-soft)]">
          {{ event.artist || 'milet' }}
        </p>
        <div
          class="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[var(--live-detail-accent)]"
        >
          <span class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1">
            {{ formatLiveType(event.type) }}
          </span>
          <span
            v-if="selectedPerformance?.venueName"
            class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1"
          >
            {{ selectedPerformance.venueName }}
          </span>
          <span
            v-if="event.year"
            class="rounded-full border border-[var(--live-detail-accent-border)] px-3 py-1"
          >
            {{ event.year }}
          </span>
        </div>
        <p class="mt-7 max-w-2xl text-base leading-8 text-[var(--live-detail-text)]">
          {{ event.summary || fallbackSummary }}
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <a
            href="#live-performances"
            class="inline-flex min-h-11 items-center rounded-md border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-surface-bg)] px-5 text-sm font-semibold text-[var(--live-detail-title)] shadow-[0_0_34px_-20px_var(--live-detail-glow)] transition hover:border-[var(--live-detail-accent-strong)]"
          >
            {{ lang === 'ja' ? '公演を見る' : '查看场次' }}
          </a>
          <a
            href="#live-related"
            class="inline-flex min-h-11 items-center rounded-md border border-[var(--live-detail-accent-border)] px-5 text-sm font-semibold text-[var(--live-detail-accent-strong)] transition hover:bg-white/5"
          >
            {{ lang === 'ja' ? '関連コンテンツ' : '关联内容' }}
          </a>
        </div>
      </div>

      <LiveMainVisualPanel :event="event" class="lg:mx-auto lg:w-full" />
    </section>

    <section
      class="grid gap-4 rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-surface-bg)] p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div
        v-for="fact in heroFacts"
        :key="fact.label"
        class="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-[var(--live-detail-line)] py-2 lg:border-l lg:pl-5 first:lg:border-l-0 first:lg:pl-0"
      >
        <span
          class="grid size-10 place-items-center text-[var(--live-detail-accent)]"
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
            <path
              v-if="fact.icon === 'mic'"
              d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
            />
            <path v-if="fact.icon === 'mic'" d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path v-if="fact.icon === 'mic'" d="M12 19v3" />
            <path v-if="fact.icon === 'calendar'" d="M8 2v4" />
            <path v-if="fact.icon === 'calendar'" d="M16 2v4" />
            <rect v-if="fact.icon === 'calendar'" width="18" height="18" x="3" y="4" rx="2" />
            <path v-if="fact.icon === 'calendar'" d="M3 10h18" />
            <path v-if="fact.icon === 'venue'" d="M4 20h16" />
            <path v-if="fact.icon === 'venue'" d="M6 20V9l6-4 6 4v11" />
            <path v-if="fact.icon === 'venue'" d="M9 20v-6h6v6" />
            <path
              v-if="fact.icon === 'ticket'"
              d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6V7Z"
            />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="block text-xs text-[var(--live-detail-muted)]">{{ fact.label }}</span>
          <span
            class="mt-1 block break-words font-serif text-xl leading-tight text-[var(--live-detail-title)]"
            >{{ fact.value }}</span
          >
          <span v-if="fact.sub" class="mt-0.5 block text-sm text-[var(--live-detail-muted)]">{{
            fact.sub
          }}</span>
        </span>
      </div>
    </section>

    <section
      id="live-performances"
      class="grid gap-5 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]"
    >
      <aside
        class="rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-panel-bg)] p-4"
      >
        <h2
          class="inline-flex items-center gap-2 font-serif text-2xl text-[var(--live-detail-title)]"
        >
          <svg
            class="size-5 shrink-0 text-[var(--live-detail-accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6V7Z"
            />
            <path d="M9 8h.01" />
            <path d="M9 12h.01" />
            <path d="M9 16h.01" />
          </svg>
          {{ lang === 'ja' ? '公演選択' : '场次选择' }}
        </h2>
        <div class="mt-4 grid gap-3">
          <button
            v-for="(performance, index) in performances"
            :key="performance.id"
            type="button"
            class="group grid min-h-24 grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-3 rounded-md border p-4 text-left transition"
            :class="
              selectedPerformanceId === String(performance.id)
                ? 'border-[var(--live-detail-accent-strong)] bg-white/[0.07] text-[var(--live-detail-title)] shadow-[0_0_30px_-16px_var(--live-detail-glow)]'
                : 'border-white/10 text-[var(--live-detail-muted)] hover:border-[var(--live-detail-accent-border)] hover:bg-white/[0.04]'
            "
            :aria-pressed="selectedPerformanceId === String(performance.id)"
            @click="$emit('select-performance', performance.id)"
          >
            <span class="min-w-0">
              <span class="block font-serif text-2xl text-[var(--live-detail-title)]">{{
                performanceLabel(performance, index)
              }}</span>
              <span class="mt-1 block text-sm">{{ formatLiveDate(performance.date) }}</span>
              <span class="mt-1 block truncate text-xs uppercase tracking-[0.08em]">
                {{ performance.venueName || selectedVenueLine }}
              </span>
            </span>
            <span
              class="grid size-10 place-items-center rounded-full border border-[var(--live-detail-accent-border)] text-[var(--live-detail-accent-strong)] transition group-hover:translate-x-0.5"
            >
              ›
            </span>
          </button>
        </div>
      </aside>

      <section
        class="relative overflow-hidden rounded-lg border border-[var(--live-detail-accent-border)] bg-[var(--live-detail-panel-bg)] p-5 sm:p-6"
      >
        <div class="relative z-10 max-w-2xl">
          <p
            class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--live-detail-accent)]"
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
            {{ lang === 'ja' ? '選択中' : '当前场次' }}
          </p>
          <h2 class="mt-3 font-serif text-4xl leading-tight text-[var(--live-detail-title)]">
            {{ selectedPerformance ? performanceLabel(selectedPerformance) : '-' }}
          </h2>
          <p class="mt-2 text-lg text-[var(--live-detail-text)]">{{ selectedDateLine }}</p>
          <dl class="mt-6 grid gap-4 sm:grid-cols-5">
            <div>
              <dt class="text-xs uppercase text-[var(--live-detail-accent)]">Open</dt>
              <dd class="mt-1 text-xl text-[var(--live-detail-title)]">
                {{ selectedPerformance?.openTime || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase text-[var(--live-detail-accent)]">Start</dt>
              <dd class="mt-1 text-xl text-[var(--live-detail-title)]">
                {{ selectedPerformance?.startTime || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase text-[var(--live-detail-accent)]">City</dt>
              <dd class="mt-1 text-xl text-[var(--live-detail-title)]">
                {{ selectedPerformance?.city || '-' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase text-[var(--live-detail-accent)]">Venue</dt>
              <dd class="mt-1 text-xl text-[var(--live-detail-title)]">
                <a
                  v-if="selectedVenueOfficialUrl"
                  :href="selectedVenueOfficialUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="transition hover:text-[var(--live-detail-link-hover)]"
                >
                  {{ selectedPerformance?.venueName || '-' }}
                </a>
                <template v-else>{{ selectedPerformance?.venueName || '-' }}</template>
              </dd>
            </div>
            <div v-if="selectedVenueCapacity">
              <dt class="text-xs uppercase text-[var(--live-detail-accent)]">Capacity</dt>
              <dd class="mt-1 text-xl text-[var(--live-detail-title)]">
                {{ selectedVenueCapacity }}
              </dd>
            </div>
          </dl>
        </div>
        <p
          v-if="selectedPerformanceNotesText"
          class="relative z-10 mt-6 max-w-2xl whitespace-pre-line rounded-md border border-[var(--live-detail-accent-border)] bg-black/10 px-4 py-3 text-sm leading-6 text-[var(--live-detail-text)]"
        >
          {{ selectedPerformanceNotesText }}
        </p>
        <figure
          v-if="selectedVenueLineArtUrl"
          class="live-venue-line-art-frame relative z-10 mt-8 p-4 ml-4 lg:absolute lg:bottom-6 lg:right-6 lg:w-[46%]"
        >
          <img
            :src="buildStaticAssetUrl(selectedVenueLineArtUrl)"
            alt=""
            loading="lazy"
            decoding="async"
            class="live-venue-line-art-img max-h-64 lg:max-h-72"
          />
        </figure>
      </section>
    </section>

    <LiveSetlist
      :segments="setlistSegments"
      :subtitle="setlistSubtitle"
      :lang="lang"
      :setlist-state="setlistState"
      :empty-message="setlistEmptyMessage"
      @select-track="$emit('select-track', $event)"
    />

    <LiveRelatedLinks
      id="live-related"
      :articles="payload.relatedArticles || []"
      :galleries="payload.relatedGalleries || []"
      :lang="lang"
      :route-lang="routeLang"
    />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import LiveMainVisualPanel from '@/components/milet/live/LiveMainVisualPanel.vue'
import LiveRelatedLinks from '@/components/milet/live/LiveRelatedLinks.vue'
import LiveSetlist from '@/components/milet/live/LiveSetlist.vue'
import {
  formatLiveDate,
  formatLiveDateRange,
  formatLiveType,
  formatVenueSeatCapacity,
  normalizeExternalUrl,
  performanceLabel,
  resolveVenueLineArtUrl,
  selectedPerformanceNotes,
  type LiveEventDetail,
  type LiveEventDetailPayload,
  type LiveLang,
  type LivePerformance,
  type LiveSetlistItem,
  type LiveSetlistSegment,
  type LiveSetlistState,
} from '@/composables/liveArchive'
import { buildStaticAssetUrl } from '@/config/api'

const props = defineProps<{
  payload: LiveEventDetailPayload
  event: LiveEventDetail
  performances: LivePerformance[]
  selectedPerformanceId: string
  selectedPerformance: LivePerformance | null
  setlistSegments: LiveSetlistSegment[]
  setlistSubtitle: string
  setlistState: LiveSetlistState
  setlistEmptyMessage: string
  lang: LiveLang
  routeLang: string
}>()

defineEmits<{
  'select-performance': [id: string | number]
  'select-track': [item: LiveSetlistItem]
}>()

const fallbackSummary = computed(() =>
  props.lang === 'ja'
    ? 'ライブの日時、会場、setlist と関連コンテンツを記録しています。'
    : '记录这场 live 的日期、场地、曲目与相关内容。',
)

const selectedDateLine = computed(() => {
  if (!props.selectedPerformance) return ''
  return [
    formatLiveDate(props.selectedPerformance.date),
    performanceLabel(props.selectedPerformance),
  ]
    .filter(Boolean)
    .join(' / ')
})
const selectedVenueLine = computed(() =>
  [props.selectedPerformance?.city, props.selectedPerformance?.region].filter(Boolean).join(', '),
)
const selectedVenueOfficialUrl = computed(() =>
  props.selectedPerformance?.venueName
    ? normalizeExternalUrl(props.selectedPerformance.venueOfficialUrl)
    : '',
)
const selectedVenueLineArtUrl = computed(() => resolveVenueLineArtUrl(props.selectedPerformance))
const selectedPerformanceNotesText = computed(() =>
  props.selectedPerformance ? selectedPerformanceNotes(props.selectedPerformance, props.lang) : '',
)
const selectedVenueCapacity = computed(() =>
  formatVenueSeatCapacity(props.selectedPerformance, props.lang),
)

const heroFacts = computed(() => [
  {
    icon: 'mic',
    label: props.lang === 'ja' ? 'タイプ' : '类型',
    value: formatLiveType(props.event.type),
  },
  {
    icon: 'calendar',
    label: props.lang === 'ja' ? '日程' : '日期',
    value: formatLiveDateRange(props.event) || '-',
  },
  {
    icon: 'venue',
    label: props.lang === 'ja' ? '会場' : '场馆',
    value: props.selectedPerformance?.venueName || props.event.venueSummary || '-',
    sub: [selectedVenueLine.value, selectedVenueCapacity.value].filter(Boolean).join(' · '),
  },
  {
    icon: 'ticket',
    label: props.lang === 'ja' ? '公演数' : '场次数',
    value: String(props.performances.length || props.event.performanceCount || 0),
    sub: 'Shows',
  },
])
</script>
