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
import { computed, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
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
import { usePet } from '@/composables/pet'

const route = useRoute()
const appState = useAppState()
const pet = usePet()
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
let componentMounted = false
let liveDetailRequestId = 0

function notifyLiveOpenIfValid(requestedRouteGeneration: number) {
  if (import.meta.env.SSR || !componentMounted) return
  const current = payload.value
  const currentSlug = slug.value
  if (
    !current ||
    !current.event ||
    !currentSlug ||
    current.event.slug !== currentSlug ||
    loading.value ||
    error.value
  ) {
    return
  }
  if (pet.state.route.generation !== requestedRouteGeneration) return
  const contentId = current.event.id ?? current.event.slug
  pet.react('live.open', {
    contentId: String(contentId),
    routeGeneration: requestedRouteGeneration,
  })
}

function requestStillCurrent(
  requestId: number,
  requestedSlug: string,
  requestedLang: string,
  requestedRouteGeneration: number,
  requestedFullPath: string,
) {
  return Boolean(
    requestId === liveDetailRequestId &&
      componentMounted &&
      slug.value === requestedSlug &&
      lang.value === requestedLang &&
      pet.state.route.generation === requestedRouteGeneration &&
      route.fullPath === requestedFullPath,
  )
}

async function loadDetail() {
  if (!slug.value) {
    error.value = 'Missing live event slug.'
    return
  }

  const requestId = ++liveDetailRequestId
  const requestedSlug = slug.value
  const requestedLang = lang.value
  const requestedRouteGeneration = pet.state.route.generation
  const requestedFullPath = route.fullPath

  if (appState.miletLiveDetailData?.key === detailKey.value) {
    payload.value = appState.miletLiveDetailData.payload
    error.value = ''
    loading.value = false
    if (componentMounted) {
      notifyLiveOpenIfValid(requestedRouteGeneration)
    }
    return
  }

  loading.value = true
  error.value = ''
  let loadedCurrentPayload = false
  try {
    const nextPayload = await fetchLiveEventDetail(slug.value, lang.value)
    if (
      !requestStillCurrent(
        requestId,
        requestedSlug,
        requestedLang,
        requestedRouteGeneration,
        requestedFullPath,
      )
    ) {
      return
    }
    payload.value = nextPayload
    appState.miletLiveDetailData = { key: detailKey.value, payload: nextPayload }
    loadedCurrentPayload = true
  } catch (err) {
    if (
      !requestStillCurrent(
        requestId,
        requestedSlug,
        requestedLang,
        requestedRouteGeneration,
        requestedFullPath,
      )
    ) {
      return
    }
    error.value = err instanceof Error ? err.message : 'Live event load failed.'
    payload.value = null
  } finally {
    if (requestId === liveDetailRequestId) {
      loading.value = false
      if (loadedCurrentPayload) {
        notifyLiveOpenIfValid(requestedRouteGeneration)
      }
    }
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
  componentMounted = true
  void loadDetail()
  syncDocumentTitle()
})

watch([slug, routeLang], () => {
  if (!import.meta.env.SSR && componentMounted) void loadDetail()
})

onBeforeUnmount(() => {
  componentMounted = false
  liveDetailRequestId += 1
})

watch(
  () => payload.value?.event.title,
  () => syncDocumentTitle(),
)
</script>
