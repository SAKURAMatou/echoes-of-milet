<template>
  <article class="overflow-hidden rounded-lg text-[#24323a]">
    <header class="border-b border-[#c9ddea]/70 px-4 py-7 sm:px-7">
      <p class="font-['Montserrat','sans-serif'] text-[12px] font-semibold uppercase tracking-[.18em] text-[#317f8d]">
        Live Archive
      </p>
      <h1 class="milet-page-title-font mt-4 text-5xl leading-none text-[#143d63] sm:text-6xl md:text-7xl">
        {{ routeLang === 'ja' ? 'Live Archive' : 'Live Archive' }}
      </h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-[#5f7178]">
        {{ routeLang === 'ja'
          ? '公演ごとの日付、会場、setlist と関連コンテンツを整理します。'
          : '整理演出的日期、场馆、setlist 与关联内容，把 live 的余韵留在同一个入口。' }}
      </p>
    </header>

    <section class="border-b border-[#c9ddea]/70 bg-white/42 px-4 py-4 sm:px-7">
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto]">
        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? 'Keyword' : '关键词' }}
          </span>
          <input
            v-model.trim="keywordDraft"
            type="search"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a] outline-none transition placeholder:text-slate-400 focus:border-[#317f8d] focus:ring-4 focus:ring-sky-100"
            :placeholder="routeLang === 'ja' ? 'title / venue / city' : '标题 / 场馆 / 城市'"
            @keydown.enter="applyFilters"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? 'Type' : '类型' }}
          </span>
          <select
            v-model="selectedType"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a] outline-none transition focus:border-[#317f8d] focus:ring-4 focus:ring-sky-100"
            @change="applyFilters"
          >
            <option v-for="option in liveTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <button
          type="button"
          class="mt-auto h-11 rounded-lg border border-[#317f8d]/40 bg-[#f0fdfa]/70 px-5 text-sm font-bold text-[#1d6564] transition hover:bg-[#ccfbf1]/70"
          @click="applyFilters"
        >
          {{ routeLang === 'ja' ? 'Search' : '搜索' }}
        </button>
      </div>
    </section>

    <section class="grid gap-4 px-4 py-6 sm:px-7">
      <div
        v-if="loading && !items.length"
        class="rounded-lg border border-dashed border-[#b7d6e2] bg-white/62 p-8 text-center text-sm text-[#5f7178]"
      >
        loading...
      </div>
      <div
        v-else-if="error && !items.length"
        class="rounded-lg border border-dashed border-rose-200 bg-rose-50/70 p-8 text-center text-sm text-rose-700"
      >
        {{ error }}
      </div>
      <div
        v-else-if="!items.length"
        class="rounded-lg border border-dashed border-[#b7d6e2] bg-white/62 p-8 text-center text-sm text-[#5f7178]"
      >
        {{ routeLang === 'ja' ? 'Live archive はまだありません。' : '暂无 live archive。' }}
      </div>

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <RouterLink
          v-for="item in items"
          :key="item.id"
          :to="{ name: 'miletLiveDetail', params: { lang: routeLang, slug: item.slug } }"
          class="group grid overflow-hidden rounded-lg border border-[#c9ddea]/80 bg-white/76 shadow-[0_18px_54px_-44px_rgba(49,82,103,0.62)] transition hover:-translate-y-0.5 hover:border-[#8bc7de] hover:shadow-[0_26px_70px_-46px_rgba(49,82,103,0.72)]"
        >
          <div class="relative aspect-[16/9] overflow-hidden bg-[#edf7fb]">
            <img
              v-if="resolveLiveImageUrl(item.mainVisual)"
              :src="resolveLiveImageUrl(item.mainVisual)"
              :alt="item.mainVisualAlt || item.title"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            />
            <div v-else class="grid h-full place-items-center font-serif text-3xl text-[#317f8d]">
              Live Archive
            </div>
            <span
              class="absolute left-3 top-3 rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#143d63] backdrop-blur"
            >
              {{ formatLiveType(item.type) }}
            </span>
          </div>

          <div class="grid gap-3 p-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#317f8d]">
                {{ item.year || formatLiveDateRange(item).slice(0, 4) || 'LIVE' }}
              </p>
              <h2 class="mt-1 font-serif text-3xl leading-tight text-[#143d63]">
                {{ item.title }}
              </h2>
            </div>
            <p v-if="item.summary" class="line-clamp-2 text-sm leading-6 text-[#5f7178]">
              {{ item.summary }}
            </p>
            <div class="flex flex-wrap gap-2 text-xs text-[#546e7a]">
              <span v-if="formatLiveDateRange(item)" class="rounded-full bg-sky-50 px-2.5 py-1">
                {{ formatLiveDateRange(item) }}
              </span>
              <span v-if="item.venueSummary" class="rounded-full bg-teal-50 px-2.5 py-1">
                {{ item.venueSummary }}
              </span>
              <span v-if="item.performanceCount" class="rounded-full bg-violet-50 px-2.5 py-1">
                {{ item.performanceCount }} shows
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <button
        v-if="hasMore"
        type="button"
        class="mx-auto mt-2 rounded-lg border border-[#317f8d]/40 bg-white/72 px-5 py-2.5 text-sm font-bold text-[#317f8d] transition hover:bg-sky-50 disabled:cursor-wait disabled:opacity-60"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? 'loading...' : routeLang === 'ja' ? 'More' : '加载更多' }}
      </button>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  fetchLiveEventList,
  formatLiveDateRange,
  formatLiveType,
  liveEventListUrl,
  liveTypeOptions,
  normalizeLiveLang,
  resolveLiveImageUrl,
  type LiveEventListResponse,
} from '@/composables/liveArchive'
import { useAppState } from '@/composables/useAppState'

const route = useRoute()
const appState = useAppState()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const lang = computed(() => normalizeLiveLang(routeLang.value))
const selectedType = ref(String(route.query.type || 'all'))
const keywordDraft = ref(String(route.query.keyword || ''))
const loading = ref(false)
const error = ref('')
const pageSize = 12
const queryKey = computed(() =>
  liveEventListUrl({
    lang: lang.value,
    type: selectedType.value,
    keyword: keywordDraft.value,
    page: 1,
    pageSize,
  }),
)
const data = ref<LiveEventListResponse | null>(
  appState.miletLiveListData?.key === queryKey.value
    ? appState.miletLiveListData.payload
    : null,
)
const items = computed(() => data.value?.items || [])
const hasMore = computed(() => (data.value?.page || 1) < (data.value?.totalPages || 1))

async function loadList(page = 1, append = false) {
  const key = liveEventListUrl({
    lang: lang.value,
    type: selectedType.value,
    keyword: keywordDraft.value,
    page,
    pageSize,
  })

  if (!append && appState.miletLiveListData?.key === key) {
    data.value = appState.miletLiveListData.payload
    return
  }

  loading.value = true
  error.value = ''
  try {
    const payload = await fetchLiveEventList({
      lang: lang.value,
      type: selectedType.value,
      keyword: keywordDraft.value,
      page,
      pageSize,
    })
    data.value = append && data.value ? { ...payload, items: [...data.value.items, ...payload.items] } : payload
    if (!append) {
      appState.miletLiveListData = { key, payload }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Live archive load failed.'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  void loadList(1)
}

function loadMore() {
  void loadList((data.value?.page || 1) + 1, true)
}

onServerPrefetch(() => loadList(1))

onMounted(() => {
  if (!data.value || appState.miletLiveListData?.key !== queryKey.value) {
    void loadList(1)
  }
  document.title = 'Live Archive | Echoes of milet'
})

watch(routeLang, () => {
  void loadList(1)
})
</script>
