<template>
  <article
    class="milet-home min-h-screen w-full max-w-full overflow-x-clip rounded-lg text-[#202632]"
  >
    <MiletHomeHero
      :current-year="currentYear"
      :lead="heroText.lead"
      :sublead="heroText.sublead"
      :button-label="heroText.buttonLabel"
      :scroll-label="heroText.scrollLabel"
      @scroll-to-highlight="scrollToHighlight"
    />

    <div class="px-5 py-12 sm:px-8 md:px-10">
      <MiletHomeWhy :items="whyCards" />
      <MiletHomeHighlight
        :title="sectionTitles.highlight"
        :items="highlights"
        @select-music="openHighlightTrack"
      />
      <LazyHomeSection section-id="echo-room" :min-height="240" eager>
        <MiletHomeEchoRoom :section-id="null" />
      </LazyHomeSection>
      <LazyHomeSection section-id="timeline" :min-height="620" eager>
        <MiletHomeTimelinePreview
          :title="sectionTitles.timeline"
          :timeline="timeline"
          :lang="currentLang"
          :section-id="null"
        />
      </LazyHomeSection>
      <LazyHomeSection section-id="gallery" :min-height="820" eager>
        <MiletHomeGallery :title="sectionTitles.gallery" :gallery="gallery" :section-id="null" />
      </LazyHomeSection>
      <LazyHomeSection section-id="links" :min-height="960" eager>
        <MiletHomeOfficialLinks :official="official" :section-id="null" />
      </LazyHomeSection>
      <LazyHomeSection section-id="entry" :min-height="260" eager>
        <MiletHomeEntryGrid :entries="entries" :section-id="null" />
      </LazyHomeSection>
      <LazyHomeSection section-id="cta" :min-height="220" eager>
        <MiletHomeCta
          :title="cta.title"
          :button-label="cta.buttonLabel"
          :to="cta.to"
          :section-id="null"
        />
      </LazyHomeSection>
    </div>

    <TrackModal
      v-if="trackModalMounted"
      :open="trackModalOpen"
      :track="trackModalTrack"
      @close="closeTrackModal"
    />
  </article>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onServerPrefetch, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import type { MiletHomeHighlightViewItem } from '@/components/milet/home/types'
import MiletHomeHero from '@/components/milet/home/MiletHomeHero.vue'
import MiletHomeHighlight from '@/components/milet/home/MiletHomeHighlight.vue'
import MiletHomeWhy from '@/components/milet/home/MiletHomeWhy.vue'
import LazyHomeSection from '@/components/milet/home/LazyHomeSection.vue'
import {
  buildMiletHomeV2Data,
  ctaView,
  entryViewItems,
  galleryViewSection,
  highlightViewItems,
  normalizeMiletLang,
  officialViewSection,
  sectionTitleMap,
  textOf,
  timelineViewSection,
  whyViewItems,
} from '@/composables/miletHomeV2'
import type { Track, Work } from '@/composables/releaseType'
import { useAppState } from '@/composables/useAppState'
import { usePageAnchorScroll } from '@/composables/usePageAnchorScroll'
import { apiRoutes } from '@/config/api'

const appState = useAppState()
const route = useRoute()
const router = useRouter()
const { scrollToPageAnchor } = usePageAnchorScroll()
const MiletHomeCta = defineAsyncComponent(() => import('@/components/milet/home/MiletHomeCta.vue'))
const MiletHomeEchoRoom = defineAsyncComponent(
  () => import('@/components/milet/home/MiletHomeEchoRoom.vue'),
)
const MiletHomeEntryGrid = defineAsyncComponent(
  () => import('@/components/milet/home/MiletHomeEntryGrid.vue'),
)
const MiletHomeGallery = defineAsyncComponent(
  () => import('@/components/milet/home/MiletHomeGallery.vue'),
)
const MiletHomeOfficialLinks = defineAsyncComponent(
  () => import('@/components/milet/home/MiletHomeOfficialLinks.vue'),
)
const MiletHomeTimelinePreview = defineAsyncComponent(
  () => import('@/components/milet/home/MiletHomeTimelinePreview.vue'),
)
const TrackModal = defineAsyncComponent(() => import('@/components/milet/music/TrackModal.vue'))
const currentYear = new Date().getFullYear()
const miletDatas = ref<Record<string, any> | null>(appState.miletHomeData)
const loading = ref(false)
const trackModalOpen = ref(false)
const trackModalTrack = ref<Track | null>(null)
const trackModalMounted = ref(false)

const routeLang = computed(() => String(route.params.lang || 'zh'))
const currentLang = computed(() => normalizeMiletLang(routeLang.value))

function resolveMiletHomePayload(response: any) {
  if (!response || typeof response !== 'object') {
    return null
  }

  if ('code' in response && Number(response.code) !== 200) {
    return null
  }

  const payload = response.data ?? response
  return payload && typeof payload === 'object' ? payload : null
}

async function loadMiletHomeData() {
  if (miletDatas.value || loading.value) {
    return
  }

  loading.value = true
  try {
    const resJson = await axiosInstance.post(apiRoutes.miletHome)
    const payload = resolveMiletHomePayload(resJson)

    if (payload) {
      miletDatas.value = payload
      appState.miletHomeData = payload
    }
  } catch (error) {
    console.error('data fetch error', error)
  } finally {
    loading.value = false
  }
}

onServerPrefetch(loadMiletHomeData)

const homeV2 = computed(() => {
  return buildMiletHomeV2Data(miletDatas.value || {}, currentLang.value)
})

const heroText = computed(() => ({
  lead: textOf(homeV2.value?.hero.lead, currentLang.value),
  sublead: textOf(homeV2.value?.hero.sublead, currentLang.value),
  buttonLabel: textOf(homeV2.value?.hero.buttonLabel, currentLang.value),
  scrollLabel: textOf(homeV2.value?.hero.scrollLabel, currentLang.value),
}))

const sectionTitles = computed(() => {
  return sectionTitleMap(homeV2.value, currentLang.value)
})
const whyCards = computed(() => whyViewItems(homeV2.value, currentLang.value))
const highlights = computed(() =>
  highlightViewItems(homeV2.value, currentLang.value, routeLang.value),
)
const timeline = computed(() =>
  timelineViewSection(homeV2.value, currentLang.value, routeLang.value),
)
const gallery = computed(() => galleryViewSection(homeV2.value, currentLang.value, routeLang.value))
const official = computed(() => officialViewSection(homeV2.value, currentLang.value))
const entries = computed(() => entryViewItems(homeV2.value, currentLang.value, routeLang.value))
const cta = computed(() => ctaView(currentLang.value, routeLang.value))

function scrollToHighlight() {
  scrollToPageAnchor('#highlight', { behavior: 'smooth', history: 'none' })
}

function emptyTrack(showId: string, title: string): Track {
  return {
    showId,
    no: 0,
    title,
    durationSec: 0,
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

function normalizeTrackTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()[\]{}'"“”‘’.,:;!?！？。・]/g, '')
}

function titleCandidates(item: MiletHomeHighlightViewItem) {
  return Array.from(
    new Set(
      [item.trackTitle, item.title, ...item.title.split(/[\/|｜]/)]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
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
    console.error('Failed to load highlight track detail:', error)
    return track
  }
}

async function findTrackFromReleaseList(item: MiletHomeHighlightViewItem) {
  const candidates = titleCandidates(item).map(normalizeTrackTitle)
  if (candidates.length === 0) return null

  const releasePage = await axiosInstance.get<{ data?: Work[] }>(`${apiRoutes.miletRelease}2`, {
    params: { page: 1, pageSize: 60 },
  })
  const works = Array.isArray(releasePage.data) ? releasePage.data : []

  for (const work of works) {
    for (const edition of work.editions || []) {
      for (const disc of edition.discs || []) {
        for (const track of disc.tracks || []) {
          const normalizedTitle = normalizeTrackTitle(track.title || '')
          if (candidates.some((candidate) => normalizedTitle === candidate)) {
            return track as Track
          }
        }
      }
    }
  }

  return null
}

async function openHighlightTrack(item: MiletHomeHighlightViewItem) {
  try {
    const track = item.trackShowId
      ? emptyTrack(item.trackShowId, item.trackTitle || item.title)
      : await findTrackFromReleaseList(item)

    if (track?.showId) {
      trackModalTrack.value = await loadTrackDetail(track)
      trackModalMounted.value = true
      trackModalOpen.value = true
      return
    }
  } catch (error) {
    console.error('Failed to open highlight track:', error)
  }

  if (item.to) {
    await router.push(item.to)
  }
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

watchEffect(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.title =
    currentLang.value === 'ja' ? 'Echoes of milet | milet ホーム' : 'Echoes of milet | milet 首页'
})

onMounted(async () => {
  if (!miletDatas.value) {
    await loadMiletHomeData()
  }
})
</script>

<style scoped>
.milet-home {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24) 0%, rgba(246, 250, 249, 0.74) 42%),
    rgba(255, 255, 255, 0.45);
}
</style>
