<template>
  <article
    class="release-card group relative overflow-hidden rounded-lg border border-white/70 bg-white/86 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.72)] ring-1 ring-sky-100/50 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-sky-200/80"
    :class="viewMode === 'shelf' ? 'h-full' : ''"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(186,230,253,0.36),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.88),rgba(240,249,255,0.48))]"
    ></div>

    <div
      class="relative grid"
      :class="
        viewMode === 'shelf'
          ? 'grid-cols-1 gap-2.5 p-2.5 sm:p-3'
          : 'grid-cols-1 gap-4 p-3 sm:grid-cols-[minmax(132px,0.44fr)_minmax(0,1fr)] sm:p-4 lg:grid-cols-[minmax(168px,0.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(200px,0.82fr)_minmax(220px,0.9fr)_minmax(320px,1.24fr)] xl:items-stretch xl:gap-5'
      "
    >
      <div class="flex min-w-0" :class="viewMode === 'shelf' ? '' : 'sm:items-start xl:h-full'">
        <div
          class="relative w-full overflow-hidden rounded-md border border-white/80 bg-slate-100 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.82)]"
          :class="
            viewMode === 'shelf' ? 'aspect-square' : 'aspect-square sm:max-w-[220px] xl:max-w-none'
          "
        >
          <img
            v-if="activeCover"
            :src="activeCover"
            :alt="activeCoverAlt"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
            loading="lazy"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-xs text-slate-400">
            {{ pageText.workCard.previewLabel }}
          </div>
          <div
            v-if="variant === 'featured'"
            class="absolute left-0 top-0 bg-[#b89444] px-2.5 py-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-white shadow-sm"
          >
            {{ releaseTypeLabel }}
          </div>
        </div>
      </div>

      <div class="min-w-0" :class="viewMode === 'shelf' ? 'px-1 pb-1' : 'flex flex-col xl:h-full'">
        <div
          class="flex flex-wrap items-center gap-2 font-medium text-[#317f8d]"
          :class="viewMode === 'shelf' ? 'text-[10px]' : 'text-[11px]'"
        >
          <span>{{ releaseTypeLabel }}</span>
          <span class="h-1 w-1 rounded-full bg-sky-300"></span>
          <span>{{ distributionLabel }}</span>
        </div>

        <h3
          class="mt-2 font-serif text-[#143d63]"
          :class="
            viewMode === 'shelf'
              ? 'line-clamp-2 text-xl leading-tight'
              : variant === 'featured'
                ? 'text-4xl leading-none md:text-[2.35rem] xl:text-[2.65rem]'
                : 'text-2xl leading-tight'
          "
        >
          {{ work.title }}
        </h3>
        <p
          class="mt-1 text-slate-600"
          :class="viewMode === 'shelf' ? 'truncate text-xs' : 'text-sm'"
        >
          {{ work.artist }}
        </p>

        <div
          class="flex flex-wrap text-xs text-slate-600"
          :class="viewMode === 'shelf' ? 'mt-3  gap-1.5' : 'mt-4  gap-x-4 gap-y-2'"
        >
          <div class="min-w-[5.25rem] border-l border-cyan-700/15 pl-3">
            <span
              class="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500/80"
            >
              {{ pageText.workCard.releaseDate }}
            </span>
            <strong
              class="mt-1 block font-montserrat leading-[1.15] tabular-nums text-[#143d63]"
              :class="viewMode === 'shelf' ? 'text-sm' : 'text-base'"
            >
              {{ activeReleaseDate }}
            </strong>
          </div>
          <div class="min-w-[3.5rem] border-l border-cyan-700/15 pl-3">
            <span
              class="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500/80"
            >
              {{ pageText.workCard.editionsLabel }}
            </span>
            <strong
              class="mt-1 block font-montserrat leading-[1.15] tabular-nums text-[#143d63]"
              :class="viewMode === 'shelf' ? 'text-sm' : 'text-base'"
            >
              {{ editions.length || 1 }}
            </strong>
          </div>
          <div class="min-w-[3.5rem] border-l border-cyan-700/15 pl-3">
            <span
              class="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-500/80"
            >
              {{ pageText.workCard.tracksLabel }}
            </span>
            <strong
              class="mt-1 block font-montserrat leading-[1.15] tabular-nums text-[#143d63]"
              :class="viewMode === 'shelf' ? 'text-sm' : 'text-base'"
            >
              {{ activeTrackCount }}
            </strong>
          </div>
        </div>

        <div v-if="editions.length > 0" :class="viewMode === 'shelf' ? 'mt-3' : 'mt-4'">
          <div
            class="mb-2 text-xs font-medium text-slate-500"
            :class="viewMode === 'shelf' ? 'sr-only' : ''"
          >
            {{ pageText.workCard.selectedEditionLabel }}
          </div>
          <div
            class="scrollbar-none flex gap-2 pb-1 flex-wrap overflow-visible"
            :class="viewMode === 'shelf' ? '' : ' xl:max-h-[5.5rem] xl:overflow-y-auto xl:pr-1'"
          >
            <button
              v-for="(edition, index) in editions"
              :key="edition.id"
              type="button"
              class="shrink-0 whitespace-normal break-words rounded-md border font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              :class="[
                viewMode === 'shelf'
                  ? 'max-w-[8.5rem] px-2 py-1.5 text-[11px] leading-4'
                  : 'max-w-full px-3 py-2 text-xs leading-5 sm:max-w-[11.5rem]',
                index === activeEditionIndex
                  ? 'border-[#317f8d] bg-[#317f8d] text-white shadow-[0_10px_24px_-18px_rgba(49,127,141,0.9)]'
                  : 'border-slate-200 bg-white/82 text-slate-600 hover:border-sky-200 hover:bg-sky-50',
              ]"
              @click="activeEditionIndex = index"
            >
              {{ edition.editionName }}
            </button>
          </div>
        </div>
      </div>

      <div
        class="min-w-0 rounded-md border border-sky-100/80 bg-white/62 p-3"
        :class="
          viewMode === 'shelf'
            ? 'hidden'
            : 'sm:col-span-2 xl:col-span-1 xl:flex xl:h-full xl:flex-col'
        "
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-[#164c72]">
            {{ pageText.workCard.previewLabel }}
          </div>
          <button
            v-if="variant !== 'featured'"
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white/82 text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-[#317f8d]"
            :aria-label="expanded ? pageText.workCard.collapseLabel : pageText.workCard.expandLabel"
            @click="emit('toggleExpand', work.id)"
          >
            <svg
              viewBox="0 0 16 16"
              class="h-4 w-4 transition"
              :class="expanded ? 'rotate-90' : ''"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 3.5 10.5 8 6 12.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          v-if="activeDiscs.length > 1"
          class="scrollbar-none mb-2 flex max-w-full snap-x snap-proximity gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [touch-action:pan-x]"
        >
          <button
            v-for="(disc, index) in activeDiscs"
            :key="disc.id"
            type="button"
            class="max-w-[10rem] shrink-0 snap-start whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition"
            :class="
              index === activeDiscIndex
                ? 'border-[#317f8d] bg-[#317f8d] text-white'
                : 'border-slate-200 bg-white/76 text-slate-500 hover:border-sky-200 hover:bg-sky-50'
            "
            @click="selectDisc(index)"
          >
            {{ discLabel(disc, index) }}
          </button>
        </div>

        <div
          v-if="previewTracks.length > 0"
          class="release-track-list divide-y divide-slate-100/90"
          :class="{
            'max-h-[min(20rem,52vh)] overflow-y-auto overscroll-contain pr-1': showAllTracks,
          }"
        >
          <button
            v-for="track in previewTracks"
            :key="track.showId"
            type="button"
            class="flex w-full items-center gap-3 py-2 text-left text-sm text-slate-700 transition hover:text-[#317f8d]"
            @click="openTrack(track)"
          >
            <span class="w-7 shrink-0 text-xs text-slate-400">
              {{ String(track.no).padStart(2, '0') }}
            </span>
            <span class="min-w-0 flex-1 truncate">{{ track.title }}</span>
            <span v-if="track.durationSec" class="text-xs text-slate-400">
              {{ formatDuration(track.durationSec) }}
            </span>
          </button>
        </div>
        <div v-else class="py-5 text-sm text-slate-400">
          {{ pageText.workCard.detailLabel }}
        </div>

        <button
          v-if="activeTrackCount > previewTracks.length"
          type="button"
          class="mt-3 text-xs font-semibold text-[#317f8d] transition hover:text-[#143d63]"
          @click="showAllTracks = true"
        >
          + {{ activeTrackCount - previewTracks.length }} {{ pageText.workCard.tracksLabel }}
        </button>
        <button
          v-else-if="showAllTracks && activeTrackCount > compactTrackLimit"
          type="button"
          class="mt-3 text-xs font-semibold text-slate-500 transition hover:text-[#143d63]"
          @click="showAllTracks = false"
        >
          {{ pageText.workCard.collapseLabel }}
        </button>
      </div>
    </div>

    <TrackModal
      v-if="modalMounted"
      :open="modalOpen"
      :track="modalTrack"
      @close="closeTrackModal"
    />
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, getCurrentInstance, ref, watch } from 'vue'
import axiosInstance from '@/AxiosUtil'
import { initImgUrl } from '@/composables/ImgUrlUtil'
import { apiRoutes } from '@/config/api'
import { WORK_TEXT } from '@/composables/lang/ReleaseMetaData'
import type { Disc, ReleaseEdition, Track, Work } from '@/composables/releaseType'

const TrackModal = defineAsyncComponent(() => import('./TrackModal.vue'))

const props = withDefaults(
  defineProps<{
    work: Work
    variant?: 'featured' | 'compact'
    expanded?: boolean
    viewMode?: 'list' | 'shelf'
  }>(),
  {
    variant: 'compact',
    expanded: false,
    viewMode: 'list',
  },
)

const emit = defineEmits<{
  (event: 'toggleExpand', workId: string): void
}>()

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageText = computed(() => {
  const lang = global.$lang?.lang === 'jp' ? 'jp' : 'zh'
  return WORK_TEXT[lang]
})

const modalOpen = ref(false)
const modalMounted = ref(false)
const modalTrack = ref<Track | null>(null)
const activeEditionIndex = ref(0)
const activeDiscIndex = ref(0)
const showAllTracks = ref(false)

const editions = computed(() => props.work.editions || [])
const activeEdition = computed<ReleaseEdition | null>(() => {
  return editions.value[activeEditionIndex.value] || editions.value[0] || null
})
const activeCover = computed(() => {
  const cover = activeEdition.value?.coverUrl || props.work.coverUrl || ''
  return cover ? initImgUrl(cover) : ''
})
const activeCoverAlt = computed(() => activeEdition.value?.editionName || props.work.title)
const activeReleaseDate = computed(() => activeEdition.value?.releaseDate || props.work.releaseDate)
const activeDiscs = computed(() => activeEdition.value?.discs || [])
const activeDisc = computed(
  () => activeDiscs.value[activeDiscIndex.value] || activeDiscs.value[0] || null,
)
const activeTracks = computed(() => activeDisc.value?.tracks || [])
const activeTrackCount = computed(() => activeTracks.value.length)
const compactTrackLimit = computed(() => (props.variant === 'featured' || props.expanded ? 6 : 3))
const previewTracks = computed(() => {
  return showAllTracks.value
    ? activeTracks.value
    : activeTracks.value.slice(0, compactTrackLimit.value)
})
const releaseTypeLabel = computed(() => props.work.releaseType || 'RELEASE')
const isPhysical = computed(() => props.work.isPhysical !== false)
const distributionLabel = computed(() =>
  isPhysical.value ? pageText.value.workCard.physicalTag : pageText.value.workCard.streamingTag,
)

watch(
  () => props.work.id,
  () => {
    activeEditionIndex.value = 0
    activeDiscIndex.value = 0
    showAllTracks.value = false
  },
)

watch(
  () => editions.value.length,
  (length) => {
    if (activeEditionIndex.value >= length) {
      activeEditionIndex.value = 0
    }
  },
)

watch(
  () => activeEditionIndex.value,
  () => {
    activeDiscIndex.value = 0
    showAllTracks.value = false
  },
)

watch(
  () => activeDiscs.value.length,
  (length) => {
    if (activeDiscIndex.value >= length) {
      activeDiscIndex.value = 0
    }
  },
)

function getDiscNumber(disc: Disc, index = activeDiscIndex.value) {
  return disc.discNo ?? disc.no ?? index + 1
}

function discLabel(disc: Disc, index: number) {
  if (disc.isVirtual) {
    return pageText.value.workCard.streamingEdition
  }

  const title = disc.title ? ` / ${disc.title}` : ''
  return `${pageText.value.workCard.discLabel} ${getDiscNumber(disc, index)}${title}`
}

function selectDisc(index: number) {
  activeDiscIndex.value = index
  showAllTracks.value = false
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

async function openTrack(t: Track) {
  if (!t.lyric || !t.listenData) {
    const detail = await axiosInstance.get<{ data?: Partial<Track> }>(
      apiRoutes.miletReleaseDetail + t.showId,
    )
    if (detail && Object.keys(detail).length > 0) {
      const d = detail.data || {}
      t.lyric = d.lyric || t.lyric
      t.arrangers = d.arrangers || t.arrangers
      t.composers = d.composers || t.composers
      t.lyricists = d.lyricists || t.lyricists
      t.recorded_at = d.recorded_at || t.recorded_at
      t.singer = d.singer || t.singer
      t.listenData = d.listenData || t.listenData
    }
  }
  modalTrack.value = t
  modalMounted.value = true
  modalOpen.value = true
}

function closeTrackModal() {
  modalOpen.value = false

  window.setTimeout(() => {
    if (!modalOpen.value) {
      modalMounted.value = false
      modalTrack.value = null
    }
  }, 320)
}
</script>
