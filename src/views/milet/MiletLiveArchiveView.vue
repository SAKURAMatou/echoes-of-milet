<template>
  <article
    class="live-archive-page overflow-hidden rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] text-[#24323a]"
  >
    <header
      class="live-archive-hero relative isolate overflow-hidden border-b border-[#c9ddea]/70 px-4 py-8 sm:px-7 md:py-9"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_7%,rgba(186,230,253,0.64),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.5))]"
      ></div>
      <div
        class="live-archive-hero-photo pointer-events-none absolute inset-y-0 right-0 w-[58%]"
      ></div>

      <div
        class="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,28rem)] lg:items-end"
      >
        <div>
          <p
            class="font-['Montserrat','sans-serif'] text-[12px] font-semibold uppercase tracking-[.18em] text-[#317f8d]"
          >
            CURRENT: Live Archive
          </p>
          <h1 class="milet-page-title-font mt-5 text-6xl leading-none text-[#143d63] md:text-7xl">
            {{ routeLang === 'ja' ? 'Live Archive' : 'Live Archive' }}
          </h1>
          <p class="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600">
            {{
              routeLang === 'ja'
                ? '公演ごとの日付、会場、setlist と関連コンテンツを整理します。'
                : '整理演出的日期、场馆、setlist 与关联内容，把 live 的余韵留在同一个入口。'
            }}
          </p>
        </div>

        <aside
          class="live-archive-hero-rail relative mt-6 hidden min-h-[10rem] text-[#173e63] md:block lg:mt-0"
          aria-hidden="true"
        >
          <div class="absolute right-0 top-4 flex w-72 items-center gap-4">
            <span
              class="h-px flex-1 bg-[linear-gradient(90deg,rgba(184,148,68,0.14),rgba(184,148,68,0.72))]"
            ></span>
            <span
              class="grid size-2.5 rotate-45 place-items-center border border-[#b89444]/60 bg-white/82 shadow-[0_0_0_5px_rgba(255,255,255,0.38)]"
            >
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
      <form
        class="grid gap-3 rounded-lg border border-sky-100/80 bg-white/52 p-3 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.54)] backdrop-blur lg:grid-cols-[minmax(0,1fr)_14rem_10rem_auto]"
        @submit.prevent="applyFilters"
      >
        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? 'キーワード' : '关键词' }}
          </span>
          <input
            v-model.trim="keywordDraft"
            @input="scheduleFilters(320)"
            type="search"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a] outline-none transition placeholder:text-slate-400 focus:border-[#317f8d] focus:ring-4 focus:ring-sky-100"
            :placeholder="routeLang === 'ja' ? 'title / venue / city' : '标题 / 场馆 / 城市'"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? '種類' : '类型' }}
          </span>
          <select
            v-model="selectedType"
            @change="applyFilters"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a] outline-none transition focus:border-[#317f8d] focus:ring-4 focus:ring-sky-100"
          >
            <option v-for="option in liveTypeOptions" :key="option.value" :value="option.value">
              {{
                option.value === 'all'
                  ? routeLang === 'ja'
                    ? 'すべての種類'
                    : '全部类型'
                  : option.label
              }}
            </option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-xs font-semibold uppercase tracking-[0.14em] text-[#317f8d]">
            {{ routeLang === 'ja' ? '年' : '年份' }}
          </span>
          <select
            v-model="selectedYear"
            @change="applyFilters"
            class="h-11 rounded-lg border border-[#b7d6e2] bg-white/82 px-3 text-sm text-[#24323a]"
          >
            <option value="">{{ routeLang === 'ja' ? 'すべての年' : '全部年份' }}</option>
            <option v-for="year in yearOptions" :key="year" :value="String(year)">
              {{ year }}
            </option>
          </select>
        </label>

        <button
          v-echo-press
          type="submit"
          class="mt-auto h-11 rounded-lg border border-[#317f8d]/40 bg-[#317f8d] px-5 text-sm font-bold text-white shadow-[0_16px_28px_-22px_rgba(20,61,99,0.85)] transition hover:bg-[#246d7c]"
        >
          {{ routeLang === 'ja' ? '検索' : '搜索' }}
        </button>
      </form>
      <div
        v-if="hasFilters"
        data-pet-avoid
        class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#317f8d]"
      >
        <p class="break-words">{{ filterSummary }}</p>
        <button
          type="button"
          class="min-h-11 shrink-0 rounded-lg border border-sky-200 bg-white px-3"
          @click="clearFilters"
        >
          {{ routeLang === 'ja' ? '条件をクリア' : '清除筛选' }}
        </button>
      </div>
    </section>

    <section class="grid gap-4 px-4 py-6 sm:px-7">
      <div
        v-if="error && items.length"
        class="flex flex-col gap-3 rounded-lg border border-amber-200/80 bg-amber-50/78 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>
          {{
            routeLang === 'ja'
              ? '最新の条件を読み込めませんでした。現在の一覧を表示しています。'
              : '最新筛选结果加载失败，当前仍显示原有列表。'
          }}
        </p>
        <button
          v-echo-press
          type="button"
          class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white/80 px-4 font-bold text-amber-900 transition hover:bg-white"
          :disabled="loading"
          @click="applyFilters"
        >
          {{ routeLang === 'ja' ? '再試行' : '重试' }}
        </button>
      </div>
      <EchoAsyncState
        v-if="loading && !items.length"
        state="loading"
        :title="routeLang === 'ja' ? 'Live archive を読み込んでいます' : '正在读取 Live Archive'"
      />
      <EchoAsyncState
        v-else-if="error && !items.length"
        state="error"
        :title="routeLang === 'ja' ? 'Live archive を表示できません' : '暂时无法显示 Live Archive'"
        :description="error"
        :action-label="routeLang === 'ja' ? '再試行' : '重试'"
        :disabled="loading"
        @action="applyFilters"
      />
      <EchoAsyncState
        v-else-if="!items.length"
        state="empty"
        :title="
          hasFilters
            ? routeLang === 'ja'
              ? '条件に一致する公演はありません。'
              : '没有找到符合条件的演出'
            : routeLang === 'ja'
              ? 'Live archive はまだありません。'
              : '暂无演出档案'
        "
        :action-label="hasFilters ? (routeLang === 'ja' ? '条件をクリア' : '清除筛选') : ''"
        @action="clearFilters"
        :description="
          routeLang === 'ja'
            ? '条件を変えて、もう一度検索できます。'
            : '可以调整筛选条件后重新搜索。'
        "
      />

      <div v-else class="grid gap-4 lg:grid-cols-2">
        <RouterLink
          v-echo-press
          v-for="item in items"
          :key="item.id"
          :to="{ name: 'miletLiveDetail', params: { lang: routeLang, slug: item.slug } }"
          class="group grid min-w-0 overflow-hidden rounded-lg border border-[#c9ddea]/80 bg-white/78 shadow-[0_18px_54px_-44px_rgba(49,82,103,0.62)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#8bc7de] hover:bg-white/88 hover:shadow-[0_26px_70px_-46px_rgba(49,82,103,0.72)]"
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
              class="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#143d63] backdrop-blur"
              :title="formatLiveType(item.type)"
            >
              {{ formatLiveType(item.type) }}
            </span>
          </div>

          <div class="grid min-w-0 gap-3 p-4">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#317f8d]">
                {{ item.year || formatLiveDateRange(item).slice(0, 4) || 'LIVE' }}
              </p>
              <h2
                class="mt-1 line-clamp-2 break-words font-serif text-3xl leading-tight text-[#143d63] transition [overflow-wrap:anywhere] group-hover:text-[#317f8d]"
                :title="item.title"
              >
                {{ item.title }}
              </h2>
            </div>
            <p v-if="item.summary" class="line-clamp-2 text-sm leading-6 text-[#5f7178]">
              {{ item.summary }}
            </p>
            <div class="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[#546e7a]">
              <span
                v-if="formatLiveDateRange(item)"
                class="inline-flex h-8 min-w-0 max-w-full items-center overflow-hidden rounded-full bg-sky-50 px-3 leading-none"
                :title="formatLiveDateRange(item)"
              >
                <span class="truncate">{{ formatLiveDateRange(item) }}</span>
              </span>
              <span
                v-if="item.venueSummary"
                class="inline-flex h-8 min-w-0 max-w-full items-center overflow-hidden rounded-full bg-teal-50 px-3 leading-none"
                :title="item.venueSummary"
              >
                <span class="min-w-0 truncate">{{ item.venueSummary }}</span>
              </span>
              <span
                v-if="item.performanceCount"
                class="inline-flex h-8 max-w-full items-center rounded-full bg-violet-50 px-3 leading-none"
              >
                {{ item.performanceCount }} shows
              </span>
            </div>
          </div>
        </RouterLink>
      </div>

      <button
        v-echo-press
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
import { computed, onBeforeUnmount, onMounted, onServerPrefetch, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import {
  fetchLiveEventList,
  formatLiveDateRange,
  formatLiveType,
  liveEventListCacheKey,
  liveTypeOptions,
  normalizeLiveEventListType,
  normalizeLiveLang,
  resolveLiveImageUrl,
  type LiveEventListResponse,
} from '@/composables/liveArchive'
import { useAppState } from '@/composables/useAppState'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import { useSiteInteraction } from '@/composables/site-interaction'

const route = useRoute()
const router = useRouter()
const appState = useAppState()
const interaction = useSiteInteraction()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))
const lang = computed(() => normalizeLiveLang(routeLang.value))
const selectedType = ref(normalizeLiveEventListType(route.query.type))
const selectedYear = ref(String(route.query.year || ''))
const keywordDraft = ref(String(route.query.keyword || ''))
const loading = ref(false)
const error = ref('')
const pageSize = 12
const hasFilters = computed(() =>
  Boolean(selectedType.value !== 'all' || selectedYear.value || keywordDraft.value),
)
const filterSummary = computed(() =>
  [keywordDraft.value, selectedType.value === 'all' ? '' : selectedType.value, selectedYear.value]
    .filter(Boolean)
    .join(' · '),
)
let filterTimer: ReturnType<typeof setTimeout> | undefined
let listRequestGeneration = 0
const normalizedYear = computed(() => {
  const value = String(selectedYear.value ?? '').trim()
  return /^\d{4}$/.test(value) ? value : ''
})
const queryKey = computed(() =>
  liveEventListCacheKey({
    lang: lang.value,
    type: selectedType.value,
    year: normalizedYear.value,
    keyword: keywordDraft.value,
    page: 1,
    pageSize,
  }),
)
const data = ref<LiveEventListResponse | null>(
  appState.miletLiveListData?.key === queryKey.value ? appState.miletLiveListData.payload : null,
)
const items = computed(() => data.value?.items || [])
const latestKnownYear = ref(
  Math.max(
    2019,
    ...items.value.map((item) => Number(item.year) || 2019),
    Number(selectedYear.value) || 2019,
  ),
)
const yearOptions = computed(() =>
  Array.from(
    { length: Math.min(200, Math.max(0, latestKnownYear.value - 2019)) + 1 },
    (_, index) => latestKnownYear.value - index,
  ),
)
watch(items, (list) => {
  latestKnownYear.value = Math.max(
    latestKnownYear.value,
    ...list.map((item) => Number(item.year) || 2019),
  )
})
const hasMore = computed(() => (data.value?.page || 1) < (data.value?.totalPages || 1))

async function loadList(page = 1, append = false) {
  const generation = ++listRequestGeneration
  const key = liveEventListCacheKey({
    lang: lang.value,
    type: selectedType.value,
    year: normalizedYear.value,
    keyword: keywordDraft.value,
    page,
    pageSize,
  })

  if (!append && appState.miletLiveListData?.key === key) {
    data.value = appState.miletLiveListData.payload
    loading.value = false
    error.value = ''
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
    if (generation !== listRequestGeneration) return
    data.value =
      append && data.value
        ? { ...payload, items: [...data.value.items, ...payload.items] }
        : payload
    if (!append) {
      appState.miletLiveListData = { key, payload }
    }
    interaction.announce(
      routeLang.value === 'ja'
        ? `${data.value.items.length} 件の Live archive を表示しています`
        : `当前显示 ${data.value.items.length} 条 Live Archive`,
    )
  } catch (err) {
    if (generation !== listRequestGeneration) return
    error.value = err instanceof Error ? err.message : 'Live archive load failed.'
    interaction.announce(routeLang.value === 'ja' ? '読み込みに失敗しました' : '加载失败，可以重试')
  } finally {
    if (generation === listRequestGeneration) loading.value = false
  }
}

function clearFilters() {
  selectedType.value = 'all'
  selectedYear.value = ''
  keywordDraft.value = ''
  applyFilters()
}

async function applyFilters() {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = undefined
  const query = {
    ...route.query,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    year: normalizedYear.value || undefined,
    keyword: keywordDraft.value || undefined,
  }
  const target = router.resolve({ query, hash: route.hash })
  if (target.fullPath !== route.fullPath) await router.replace({ query, hash: route.hash })
  else await loadList(1)
}

function scheduleFilters(delay = 300) {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(() => {
    void applyFilters()
  }, delay)
}

function loadMore() {
  void loadList((data.value?.page || 1) + 1, true)
}

onServerPrefetch(() => loadList(1))

onMounted(() => {
  latestKnownYear.value = Math.max(latestKnownYear.value, new Date().getFullYear())
  if (!data.value || appState.miletLiveListData?.key !== queryKey.value) {
    void loadList(1)
  }
})

watch(
  () => [route.params.lang, route.query.type, route.query.year, route.query.keyword],
  () => {
    if (filterTimer) clearTimeout(filterTimer)
    selectedType.value = normalizeLiveEventListType(route.query.type)
    selectedYear.value = String(route.query.year || '')
    keywordDraft.value = String(route.query.keyword || '')
    void loadList(1)
  },
)

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer)
  listRequestGeneration += 1
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
  animation: live-archive-signal-pulse 780ms ease-out 1 both;
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
