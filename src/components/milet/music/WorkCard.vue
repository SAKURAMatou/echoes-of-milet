<template>
  <article
    class="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur transition-[transform,opacity,filter] duration-150"
    :style="styleCard"
  >
    <div class="pointer-events-none absolute inset-0" />
    <div
      class="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-slate-200/30 blur-2xl"
    />
    <div
      class="pointer-events-none absolute -left-28 -bottom-28 h-72 w-72 rounded-full bg-slate-200/20 blur-2xl"
    />

    <div class="flex h-full flex-col p-4">
      <div class="flex shrink-0 gap-4 md:gap-6">
        <div class="shrink-0">
          <div class="h-20 w-20 overflow-hidden rounded-xl bg-slate-200 md:h-28 md:w-28">
            <img
              v-if="work.coverUrl"
              :src="initImgUrl(work.coverUrl)"
              :alt="work.title"
              class="h-full w-full object-cover transition-transform duration-150"
              loading="lazy"
            />
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="mt-1 truncate text-lg font-semibold leading-snug md:text-xl">
              {{ work.title }}
            </h3>
            <span class="inline-flex rounded-full border px-2 py-0.5 text-xs text-slate-600">
              {{ typeLabel }}
            </span>
            <span
              class="inline-flex rounded-full border px-2 py-0.5 text-xs"
              :class="distributionBadgeClass"
            >
              {{ distributionLabel }}
            </span>
          </div>

          <p class="mt-0.5 flex flex-wrap truncate text-sm text-slate-600">
            <span class="pr-2">{{ pageText.workCard.artist }}: {{ work.artist }}</span>
            <span class="pr-2 md:pl-2"
              >{{ pageText.workCard.releaseDate }}: {{ work.releaseDate }}</span
            >
          </p>

          <p class="mt-2 line-clamp-2 text-sm text-slate-500">
            {{ summaryText }}
          </p>
        </div>
      </div>

      <div
        class="mt-4 min-h-0 flex-1 transition-opacity duration-150"
        :style="{ opacity: String(Math.max(0, (normalizedProgress - 0.15) / 0.25)) }"
      >
        <EditionCarousel :editions="work.editions" @select-track="openTrack" />
      </div>
    </div>
    <TrackModal :open="modalOpen" :track="modalTrack" @close="modalOpen = false" />
  </article>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import axiosInstance from '@/AxiosUtil'
import { initImgUrl } from '@/composables/ImgUrlUtil'
import { WORK_TEXT } from '@/composables/ReleaseMetaData'
import type { Track, Work } from '@/composables/releaseType'
import EditionCarousel from './EditionCarousel.vue'
import TrackModal from './TrackModal.vue'

const { appContext } = getCurrentInstance()!
const global = appContext.config.globalProperties
const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return WORK_TEXT[lang]
})

const modalOpen = ref(false)
const modalTrack = ref<Track | null>(null)
const props = defineProps<{
  work: Work
  progress: number
  nextProgress: number
  stackIndex: number
}>()

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const normalizedProgress = computed(() => clamp(props.progress))
const nextProgress = computed(() => clamp(props.nextProgress ?? 0))

const appear = computed(() => clamp((normalizedProgress.value - 0.1) / 0.9))
const covered = computed(() => nextProgress.value)

const scale = computed(() => 1 - covered.value * 0.06)
const lift = computed(() => (1 - appear.value) * 24 - covered.value * 12)
const opacity = computed(() => Math.max(0.3, 1 - covered.value * 0.75))
const blur = computed(() => covered.value * 8)

const styleCard = computed(() => ({
  transform: `translateY(${lift.value}px) scale(${scale.value})`,
  opacity: opacity.value,
  filter: `saturate(${1 + appear.value * 0.04}) blur(${blur}px)`,
}))

const typeLabel = computed(() => props.work.releaseType ?? 'RELEASE')
const isPhysical = computed(() => props.work.isPhysical !== false)
const distributionLabel = computed(() =>
  isPhysical.value ? pageText.value.workCard.physicalTag : pageText.value.workCard.streamingTag,
)
const distributionBadgeClass = computed(() =>
  isPhysical.value
    ? 'border-slate-200 bg-white/80 text-slate-600'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700',
)
const firstEditionTrackCount = computed(
  () => props.work.editions?.[0]?.discs?.reduce((sum, disc) => sum + disc.tracks.length, 0) || 0,
)
const summaryText = computed(() => {
  const editionCount = props.work.editions?.length || 0
  const trackCount = firstEditionTrackCount.value
  const workCardText = pageText.value.workCard
  const tailText = isPhysical.value ? workCardText.firstEdition : workCardText.streamingEdition
  return `${editionCount} ${workCardText.editionCount} - ${trackCount} ${workCardText.trackCount} (${tailText})`
})

async function openTrack(t: Track) {
  if (!t.lyric) {
    const detail = await axiosInstance.get(import.meta.env.VITE_URL_API_MILET_RELEASE_DETAIL + t.showId)
    if (detail && Object.keys(detail).length > 0) {
      const d = detail as Track
      t.lyric = d.lyric
      t.arrangers = d.arrangers
      t.composers = d.composers
      t.lyricists = d.lyricists
      t.recorded_at = d.recorded_at
      t.singer = d.singer
      modalOpen.value = true
    }
  } else {
    modalOpen.value = true
  }
  modalTrack.value = t
}
</script>
