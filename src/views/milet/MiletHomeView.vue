<template>
  <article class="milet-home rounded-lg min-h-screen text-[#202632]">
    <template v-if="!loading && homeV2">
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
        <MiletHomeHighlight :title="sectionTitles.highlight" :items="highlights" />
        <MiletHomeTimelinePreview :title="sectionTitles.timeline" :timeline="timeline" />
        <MiletHomeGallery :title="sectionTitles.gallery" :gallery="gallery" />
        <MiletHomeOfficialLinks :official="official" />
        <MiletHomeEntryGrid :entries="entries" />
        <MiletHomeCta :title="cta.title" :button-label="cta.buttonLabel" :to="cta.to" />
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import MiletHomeCta from '@/components/milet/home/MiletHomeCta.vue'
import MiletHomeEntryGrid from '@/components/milet/home/MiletHomeEntryGrid.vue'
import MiletHomeGallery from '@/components/milet/home/MiletHomeGallery.vue'
import MiletHomeHero from '@/components/milet/home/MiletHomeHero.vue'
import MiletHomeHighlight from '@/components/milet/home/MiletHomeHighlight.vue'
import MiletHomeOfficialLinks from '@/components/milet/home/MiletHomeOfficialLinks.vue'
import MiletHomeTimelinePreview from '@/components/milet/home/MiletHomeTimelinePreview.vue'
import MiletHomeWhy from '@/components/milet/home/MiletHomeWhy.vue'
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
import { useAppState } from '@/composables/useAppState'
import { apiRoutes } from '@/config/api'

const appState = useAppState()
const route = useRoute()
const currentYear = new Date().getFullYear()
const miletDatas = ref<Record<string, any> | null>(appState.miletHomeData)
const loading = ref(!miletDatas.value)

const routeLang = computed(() => String(route.params.lang || 'zh'))
const currentLang = computed(() => normalizeMiletLang(routeLang.value))

async function loadMiletHomeData() {
  if (miletDatas.value) {
    loading.value = false
    return
  }

  try {
    const resJson = await axiosInstance.post(apiRoutes.miletHome)

    if (resJson.code === 200) {
      miletDatas.value = resJson.data
      appState.miletHomeData = resJson.data
    }
  } catch (error) {
    console.error('data fetch error', error)
  } finally {
    loading.value = false
  }
}

onServerPrefetch(loadMiletHomeData)

const homeV2 = computed(() => {
  if (!miletDatas.value) {
    return null
  }

  return buildMiletHomeV2Data(miletDatas.value, currentLang.value)
})

const heroText = computed(() => ({
  lead: textOf(homeV2.value?.hero.lead, currentLang.value),
  sublead: textOf(homeV2.value?.hero.sublead, currentLang.value),
  buttonLabel: textOf(homeV2.value?.hero.buttonLabel, currentLang.value),
  scrollLabel: textOf(homeV2.value?.hero.scrollLabel, currentLang.value),
}))

const sectionTitles = computed(() => {
  if (!homeV2.value) {
    return {
      highlight: { kicker: 'highlight', title: '', subtitle: '' },
      timeline: { kicker: 'timeline', title: '', subtitle: '' },
      gallery: { kicker: 'gallery', title: '', subtitle: '' },
    }
  }

  return sectionTitleMap(homeV2.value, currentLang.value)
})
const whyCards = computed(() => (homeV2.value ? whyViewItems(homeV2.value, currentLang.value) : []))
const highlights = computed(() =>
  homeV2.value ? highlightViewItems(homeV2.value, currentLang.value, routeLang.value) : [],
)
const timeline = computed(() =>
  homeV2.value
    ? timelineViewSection(homeV2.value, currentLang.value, routeLang.value)
    : { items: [], moreLabel: '', moreTo: '#' },
)
const gallery = computed(() =>
  homeV2.value
    ? galleryViewSection(homeV2.value, currentLang.value, routeLang.value)
    : { items: [], moreLabel: '', moreTo: '#' },
)
const official = computed(() =>
  homeV2.value
    ? officialViewSection(homeV2.value, currentLang.value)
    : {
        title: '',
        body: '',
        instagramProfileUrl: '',
        twitterProfileUrl: '',
        sites: [],
      },
)
const entries = computed(() =>
  homeV2.value ? entryViewItems(homeV2.value, currentLang.value, routeLang.value) : [],
)
const cta = computed(() =>
  homeV2.value
    ? ctaView(currentLang.value, routeLang.value)
    : { title: '', buttonLabel: '', to: '#' },
)

function scrollToHighlight() {
  document.getElementById('highlight')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
