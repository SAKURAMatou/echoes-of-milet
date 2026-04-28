<template>
  <article
    class="milet-home min-h-screen w-full max-w-full overflow-x-hidden rounded-lg text-[#202632]"
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
      <MiletHomeHighlight :title="sectionTitles.highlight" :items="highlights" />
      <MiletHomeEchoRoom />
      <MiletHomeTimelinePreview :title="sectionTitles.timeline" :timeline="timeline" />
      <MiletHomeGallery :title="sectionTitles.gallery" :gallery="gallery" />
      <MiletHomeOfficialLinks :official="official" />
      <MiletHomeEntryGrid :entries="entries" />
      <MiletHomeCta :title="cta.title" :button-label="cta.buttonLabel" :to="cta.to" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import MiletHomeCta from '@/components/milet/home/MiletHomeCta.vue'
import MiletHomeEchoRoom from '@/components/milet/home/MiletHomeEchoRoom.vue'
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
const loading = ref(false)

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
