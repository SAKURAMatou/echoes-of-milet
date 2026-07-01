<template>
  <article
    class="live-archive-page overflow-hidden rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] text-[#24323a] backdrop-blur-xl"
  >
    <header
      class="live-archive-hero relative isolate overflow-hidden border-b border-[#c9ddea]/70 px-4 py-8 sm:px-7 md:py-9"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_7%,rgba(186,230,253,0.64),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.5))]"
      ></div>
      <div class="live-archive-hero-photo pointer-events-none absolute inset-y-0 right-0 w-[58%]"></div>

      <div class="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end">
        <div>
          <p class="font-['Montserrat','sans-serif'] text-[12px] font-semibold uppercase tracking-[.18em] text-[#317f8d]">
            CURRENT: Live Archive
          </p>
          <h1 class="milet-page-title-font mt-5 text-6xl leading-none text-[#143d63] md:text-7xl">
            {{ routeLang === 'ja' ? 'Live Archive' : 'Live Archive' }}
          </h1>
          <p class="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600">
            {{ routeLang === 'ja'
              ? '公演ごとの日付、会場、setlist と関連コンテンツを整理します。'
              : '整理演出的日期、场馆、setlist 与关联内容，把 live 的余韵留在同一个入口。' }}
          </p>
        </div>

        <aside
          class="live-archive-hero-rail relative mt-6 hidden min-h-[10rem] text-[#173e63] md:block lg:mt-0"
          aria-hidden="true"
        >
          <div class="absolute right-0 top-4 flex w-72 items-center gap-4">
            <span class="h-px flex-1 bg-[linear-gradient(90deg,rgba(184,148,68,0.14),rgba(184,148,68,0.72))]"></span>
            <span class="grid size-2.5 rotate-45 place-items-center border border-[#b89444]/60 bg-white/82 shadow-[0_0_0_5px_rgba(255,255,255,0.38)]">
              <span class="size-1 rounded-full bg-[#b89444]/70"></span>
            </span>
          </div>
          <div class="absolute bottom-3 right-5 h-24 w-72 overflow-hidden opacity-65">
            <span
              v-for="line in 9"
              :key="line"
              class="live-archive-hero-signal absolute bottom-0 h-[18px] w-px origin-bottom bg-[#317f8d]/28"
              :style="{
                left: `${line * 10}%`,
                transform: `scaleY(${0.4 + (line % 4) * 0.2})`,
                animationDelay: `${line * 90}ms`,
              }"
            ></span>
          </div>
        </aside>
      </div>
    </header>

    <section class="border-b border-[#c9ddea]/70 bg-white/48 px-4 py-4 sm:px-7">
      <div class="grid gap-3 rounded-lg border border-sky-100/80 bg-white/52 p-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.54)] backdrop-blur lg:grid-cols-[minmax(0,1fr)_14rem_10rem_auto]">
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

        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? 'Year' : '年份' }}
          </span>
          <input
            v-model.trim="selectedYear"
            type="number"
            inputmode="numeric"
            min="2010"
            :max="currentYear + 1"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a] outline-none transition placeholder:text-slate-400 focus:border-[#317f8d] focus:ring-4 focus:ring-sky-100"
            placeholder="ALL"
            @keydown.enter="applyFilters"
          />
        </label>

        <button
          type="button"
          class="mt-auto h-11 rounded-lg border border-[#317f8d]/40 bg-[#317f8d] px-5 text-sm font-bold text-white shadow-[0_16px_28px_-22px_rgba(20,61,99,0.85)] transition hover:bg-[#246d7c]"
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
          class="group grid overflow-hidden rounded-lg border border-[#c9ddea]/80 bg-white/78 shadow-[0_18px_54px_-44px_rgba(49,82,103,0.62)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#8bc7de] hover:bg-white/88 hover:shadow-[0_26px_70px_-46px_rgba(49,82,103,0.72)]"
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
            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(0deg,rgba(3,19,34,0.4),transparent)]"
            ></div>
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
              <h2 class="mt-1 font-serif text-3xl leading-tight text-[#143d63] transition group-hover:text-[#317f8d]">
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
const selectedYear = ref(String(route.query.year || ''))
const keywordDraft = ref(String(route.query.keyword || ''))
const loading = ref(false)
const error = ref('')
const pageSize = 12
const currentYear = new Date().getFullYear()
const normalizedYear = computed(() => {
  const value = selectedYear.value.trim()
  return /^\d{4}$/.test(value) ? value : ''
})
const queryKey = computed(() =>
  liveEventListUrl({
    lang: lang.value,
    type: selectedType.value,
    year: normalizedYear.value,
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
    year: normalizedYear.value,
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
      year: normalizedYear.value,
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

<style scoped>
.live-archive-hero {
  min-height: 18rem;
}

.live-archive-hero-photo {
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.94),
      rgba(240, 249, 255, 0.12) 34%,
      rgba(255, 255, 255, 0.02)
    ),
    url('/background/live-archive-hero-bg.webp') center right / cover no-repeat;
  opacity: 0.94;
}

.live-archive-hero::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: auto 2rem 1.35rem 2rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(184, 148, 68, 0.58),
    rgba(184, 148, 68, 0.16),
    transparent
  );
}

.live-archive-hero-signal {
  animation: live-archive-signal-pulse 1.9s ease-in-out infinite;
}

@keyframes live-archive-signal-pulse {
  0%,
  100% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.76;
  }
}

@media (max-width: 767px) {
  .live-archive-hero {
    min-height: 15rem;
  }

  .live-archive-hero-photo {
    inset: 0;
    width: auto;
    background-position: 58% center;
    opacity: 0.32;
  }
}
</style>
