<template>
  <LiveDetailShell :theme-preset="payload?.displayConfig?.themePreset">
    <LiveEventDetailContent
      :payload="payload"
      :loading="loading"
      :error="error"
      :lang="lang"
      :route-lang="routeLang"
    />
  </LiveDetailShell>
</template>

<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import LiveDetailShell from '@/components/milet/live/LiveDetailShell.vue'
import LiveEventDetailContent from '@/components/milet/live/LiveEventDetailContent.vue'
import {
  fetchLiveEventDetail,
  liveEventDetailCacheKey,
  normalizeLiveLang,
  type LiveEventDetailPayload,
} from '@/composables/liveArchive'
import { useAppState } from '@/composables/useAppState'

const route = useRoute()
const appState = useAppState()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const lang = computed(() => normalizeLiveLang(routeLang.value))
const slug = computed(() => String(route.params.slug || '').trim())
const detailKey = computed(() => liveEventDetailCacheKey(slug.value, lang.value))
const payload = ref<LiveEventDetailPayload | null>(
  appState.miletLiveDetailData?.key === detailKey.value
    ? appState.miletLiveDetailData.payload
    : null,
)
const loading = ref(false)
const error = ref('')

async function loadDetail() {
  if (!slug.value) {
    error.value = 'Missing live event slug.'
    return
  }

  if (appState.miletLiveDetailData?.key === detailKey.value) {
    payload.value = appState.miletLiveDetailData.payload
    return
  }

  loading.value = true
  error.value = ''
  try {
    const nextPayload = await fetchLiveEventDetail(slug.value, lang.value)
    payload.value = nextPayload
    appState.miletLiveDetailData = { key: detailKey.value, payload: nextPayload }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Live event load failed.'
    payload.value = null
  } finally {
    loading.value = false
  }
}

function syncDocumentTitle() {
  if (typeof document === 'undefined') return
  document.title = payload.value?.event.title
    ? `${payload.value.event.title} | Echoes of milet`
    : 'Live Archive | Echoes of milet'
}

onServerPrefetch(loadDetail)

onMounted(() => {
  if (!payload.value || appState.miletLiveDetailData?.key !== detailKey.value) {
    void loadDetail()
  }
  syncDocumentTitle()
})

watch([slug, routeLang], () => {
  if (!import.meta.env.SSR) void loadDetail()
})

watch(
  () => payload.value?.event.title,
  () => syncDocumentTitle(),
)
</script>
