<template>
  <LiveDetailShell>
    <div
      class="relative z-20 mx-auto max-w-7xl px-4 pt-4 sm:px-7"
      aria-live="polite"
    >
      <div class="rounded-lg border border-[#d9b77c]/32 bg-[#d9b77c]/10 px-4 py-3 text-sm text-[#f3eadf]">
        {{ routeLang === 'ja' ? 'Live Archive preview' : 'Live Archive 预览' }}
      </div>
    </div>
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
  fetchLiveEventPreview,
  livePreviewUrl,
  normalizeLiveLang,
  type LiveEventDetailPayload,
} from '@/composables/liveArchive'
import { useAppState } from '@/composables/useAppState'

const route = useRoute()
const appState = useAppState()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const lang = computed(() => normalizeLiveLang(routeLang.value))
const previewId = computed(() => String(route.params.previewId || '').trim())
const token = computed(() => String(route.query.token || '').trim())
const previewKey = computed(() => livePreviewUrl(previewId.value, token.value, lang.value))
const payload = ref<LiveEventDetailPayload | null>(
  appState.miletLivePreviewData?.key === previewKey.value
    ? appState.miletLivePreviewData.payload
    : null,
)
const loading = ref(false)
const error = ref('')

async function loadPreview() {
  if (!previewId.value || !token.value) {
    error.value =
      routeLang.value === 'ja'
        ? 'Preview link is missing token. Please generate a new preview link in admin.'
        : '预览链接缺少 token，请在管理端重新生成预览链接。'
    return
  }

  if (appState.miletLivePreviewData?.key === previewKey.value) {
    payload.value = appState.miletLivePreviewData.payload
    return
  }

  loading.value = true
  error.value = ''
  try {
    const nextPayload = await fetchLiveEventPreview(previewId.value, token.value, lang.value)
    payload.value = nextPayload
    appState.miletLivePreviewData = { key: previewKey.value, payload: nextPayload }
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : routeLang.value === 'ja'
          ? 'Preview has expired. Please generate a new preview link.'
          : '预览已失效，请在管理端重新生成预览链接。'
    payload.value = null
  } finally {
    loading.value = false
  }
}

function syncDocumentTitle() {
  if (typeof document === 'undefined') return
  document.title = payload.value?.event.title
    ? `${payload.value.event.title} preview | Echoes of milet`
    : 'Live Archive preview | Echoes of milet'
}

onServerPrefetch(loadPreview)

onMounted(() => {
  if (!payload.value && appState.miletLivePreviewData?.key !== previewKey.value) {
    void loadPreview()
  }
  syncDocumentTitle()
})

watch([previewId, token, routeLang], () => {
  if (!import.meta.env.SSR) void loadPreview()
})

watch(
  () => payload.value?.event.title,
  () => syncDocumentTitle(),
)
</script>
