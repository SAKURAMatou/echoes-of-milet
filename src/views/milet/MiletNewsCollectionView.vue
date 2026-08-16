<template>
  <section
    ref="newsRoot"
    class="news-collection mx-auto min-h-[calc(100svh-5rem)] w-full max-w-5xl rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] px-4 py-8 sm:px-6 sm:py-10"
  >
    <header
      class="news-hero relative isolate -mx-4 -mt-8 mb-8 overflow-hidden rounded-t-lg px-4 py-8 sm:-mx-6 sm:-mt-10 sm:px-6 sm:py-10"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_5%,rgba(186,230,253,0.6),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(240,249,255,0.5))]"
      ></div>
      <div class="news-hero-paper pointer-events-none absolute inset-y-0 right-0 w-[58%]"></div>
      <div class="relative min-h-[15rem]">
        <div class="relative z-10 max-w-3xl">
          <p
            class="font-['Montserrat','sans-serif'] text-[12px] font-semibold uppercase tracking-[.18em] text-[#317f8d]"
          >
            CURRENT: News
          </p>
          <h1
            class="milet-page-title-font mt-5 text-5xl leading-none text-[#143d63] sm:text-6xl md:text-7xl"
          >
            News Collection
          </h1>
          <p class="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-600">
            {{ pageText.lead }}
          </p>
          <p
            class="mt-4 max-w-3xl rounded-lg border border-sky-100/80 bg-white/58 px-4 py-3 text-[13px] leading-6 text-slate-500 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.64)] backdrop-blur"
          >
            {{ pageText.disclaimer }}
          </p>
        </div>

        <div
          class="news-hero-ambient pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] lg:block"
          aria-hidden="true"
        >
          <div class="absolute right-0 top-3 flex w-64 items-center gap-4">
            <span
              class="h-px flex-1 bg-[linear-gradient(90deg,rgba(184,148,68,0.16),rgba(184,148,68,0.76))]"
            ></span>
            <span
              class="h-2.5 w-2.5 rotate-45 border border-[#b89444]/60 bg-white/82 shadow-[0_0_0_5px_rgba(255,255,255,0.38)]"
            ></span>
          </div>
          <div class="absolute bottom-2 right-4 h-24 w-72 overflow-hidden opacity-65">
            <span
              v-for="line in 10"
              :key="line"
              class="news-hero-signal absolute bottom-0 h-[18px] w-px origin-bottom bg-[#317f8d]/30"
              :style="{
                left: `${line * 9}%`,
                transform: `scaleY(${0.35 + (line % 4) * 0.22})`,
                animationDelay: `${line * 90}ms`,
              }"
            ></span>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="topicTags.length > 0"
      class="topic-filter mb-8"
      :class="{
        'is-expanded': showAllTags,
        'has-topic-prev': hasTopicRailPrev,
        'has-topic-next': hasTopicRailNext,
      }"
    >
      <div ref="topicRailEl" class="topic-rail" @scroll="updateTopicRailHint">
        <button
          v-echo-press
          type="button"
          class="news-tag news-tag-all"
          :class="!selectedTag ? 'is-active' : ''"
          :style="topicTagStyle(-1)"
          @click="selectTag('')"
        >
          {{ pageText.allTags }}
        </button>
        <button
          v-echo-press
          v-for="(tag, index) in visibleTopicTags"
          :key="tag.topic"
          type="button"
          class="news-tag"
          :class="selectedTag === tag.topic ? 'is-active' : ''"
          :style="topicTagStyle(index)"
          :title="tag.topic"
          @click="selectTag(tag.topic)"
        >
          <span>{{ tag.topic }}</span>
          <em>{{ tag.count }}</em>
        </button>
        <button
          v-if="hasHiddenTopicTags"
          type="button"
          class="topic-more"
          :aria-expanded="showAllTags"
          @click="toggleTopicPanel"
        >
          <span>{{ showAllTags ? 'Less' : `+${hiddenTopicCount}` }}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      <button
        v-if="!showAllTags && hasTopicRailPrev"
        type="button"
        class="topic-scroll-control topic-scroll-control-prev"
        aria-label="Scroll topics left"
        @click="scrollTopicRail('prev')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        v-if="!showAllTags && hasTopicRailNext"
        type="button"
        class="topic-scroll-control topic-scroll-control-next"
        aria-label="Scroll topics right"
        @click="scrollTopicRail('next')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>

    <div
      v-if="loadError && items.length"
      class="mb-6 flex flex-col gap-3 rounded-lg border border-amber-200/80 bg-amber-50/78 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{{ pageText.error }} {{ loadError }}</p>
      <button
        v-echo-press
        type="button"
        class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white/80 px-4 font-bold text-amber-900 transition hover:bg-white"
        :disabled="loading"
        @click="retryNews"
      >
        {{ pageText.retry }}
      </button>
    </div>

    <EchoAsyncState
      v-if="loading && items.length === 0"
      state="loading"
      :title="pageText.loading"
    />
    <EchoAsyncState
      v-else-if="loadError && items.length === 0"
      state="error"
      :title="pageText.error"
      :description="loadError"
      :action-label="pageText.retry"
      :disabled="loading"
      @action="retryNews"
    />
    <EchoAsyncState
      v-else-if="!loading && items.length === 0"
      state="empty"
      :title="selectedTag ? pageText.filteredEmpty : pageText.empty"
      :description="selectedTag ? pageText.clearHint : ''"
      :action-label="selectedTag ? pageText.clear : ''"
      @action="selectTag('')"
    />

    <div v-else class="space-y-10">
      <section
        v-for="(group, groupIndex) in groupedNews"
        :id="`news-topic-${groupIndex}`"
        :key="group.topic"
        class="scroll-mt-24"
      >
        <div class="mb-4 flex items-center gap-4">
          <button
            type="button"
            class="shrink-0 font-['Montserrat','sans-serif'] text-[15px] font-semibold uppercase text-[#546e7a] transition hover:text-sky-700"
            :title="pageText.filterByTopic"
            @click="selectTag(group.topic)"
          >
            {{ group.topic }}
          </button>
          <div class="h-[3px] flex-1 rounded-full" :class="topicAccentClass(groupIndex)" />
          <span class="text-xs text-slate-400">{{ group.items.length }}</span>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-echo-press
            v-for="item in group.items"
            :key="item.id"
            :data-page-scroll-anchor="`news-${item.id}`"
            class="news-card group grid min-h-[164px] grid-cols-[104px_1fr] overflow-hidden rounded-lg border bg-white/72 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[132px_1fr]"
            :class="topicCardClass(groupIndex)"
          >
            <a
              class="relative min-h-full overflow-hidden bg-sky-50"
              :href="item.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${pageText.open}: ${item.title}`"
            >
              <img
                v-if="item.coverImage"
                :src="buildStaticAssetUrl(item.coverImage)"
                :alt="item.title"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div
                v-else
                class="grid h-full min-h-[164px] place-items-center bg-gradient-to-br from-sky-50 to-pink-50 px-3 text-center"
              >
                <span
                  class="font-['Montserrat','sans-serif'] text-[11px] font-semibold uppercase tracking-[.18em] text-slate-400"
                >
                  news
                </span>
              </div>
            </a>

            <div class="flex min-w-0 flex-col p-4">
              <div
                class="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[.12em] text-slate-400"
              >
                <button
                  type="button"
                  class="truncate transition hover:text-sky-700"
                  :title="pageText.filterByTopic"
                  @click="selectTag(item.topic || 'General')"
                >
                  {{ item.topic || 'General' }}
                </button>
                <time class="shrink-0 tabular-nums">{{ formatDate(item.publishDate) }}</time>
              </div>

              <a
                class="line-clamp-2 text-left text-[15px] font-semibold leading-6 text-slate-800 transition hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ item.title }}
              </a>
              <p class="mt-2 line-clamp-3 text-[13px] leading-6 text-slate-500">
                {{ item.summary || pageText.noSummary }}
              </p>

              <a
                class="mt-auto flex items-center justify-end pt-3 text-xs font-medium text-sky-700/80"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{{ pageText.open }}</span>
                <svg
                  class="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7" />
                  <path d="M9 7h8v8" />
                </svg>
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div ref="loadMoreEl" class="h-10" />

    <div v-if="loading && items.length > 0" class="py-5 text-center text-sm text-slate-400">
      {{ pageText.loading }}
    </div>
    <div v-else-if="hasLoadedOnce && !hasMore" class="py-5 text-center text-sm text-slate-400">
      {{ pageText.end }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import axiosInstance from '@/AxiosUtil'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import { apiRoutes, buildStaticAssetUrl } from '@/config/api'
import {
  useBusinessAnchorScrollRestoration,
  usePageScroll,
  usePageScrollPage,
} from '@/composables/page-scroll'
import { useSiteInteraction } from '@/composables/site-interaction'

type PublicNewsItem = {
  id: number
  lang: 'zh-CN' | 'ja-JP' | 'en-US'
  title: string
  url: string
  publishDate: string
  summary: string
  coverImage: string
  sourceHost: string
  topic: string
}

type PublicNewsResponse = {
  success?: boolean
  items?: PublicNewsItem[]
  hasMore?: boolean
  page?: number
  pageSize?: number
  totalPages?: number
  message?: string
}

type PublicNewsTopic = {
  topic: string
  count: number
  sortOrder?: number
}

type PublicNewsTopicsResponse = {
  success?: boolean
  items?: PublicNewsTopic[]
  message?: string
}

const route = useRoute()
const pageScroll = usePageScroll()
const interaction = useSiteInteraction()
const { markScrollContentPending } = usePageScrollPage()
const newsRoot = ref<HTMLElement | null>(null)
const instance = getCurrentInstance()
const global = instance?.appContext.config.globalProperties as any

const items = ref<PublicNewsItem[]>([])
const topicTags = ref<PublicNewsTopic[]>([])
const page = ref(1)
const pageSize = ref(12)
const hasMore = ref(true)
const loading = ref(false)
const hasLoadedOnce = ref(false)
const loadError = ref('')
const loadMoreEl = ref<HTMLElement | null>(null)
const topicRailEl = ref<HTMLElement | null>(null)
const selectedTag = ref('')
const showAllTags = ref(false)
const hasTopicRailPrev = ref(false)
const hasTopicRailNext = ref(false)

let observer: IntersectionObserver | null = null
let topicResizeObserver: ResizeObserver | null = null

const pageText = computed(() => {
  const lang = global?.$lang?.lang || route.params.lang || 'zh'
  if (lang === 'ja' || lang === 'jp') {
    return {
      lead: '公開ニュースからインタビュー、ライブ、リリース情報をテーマごとに整理しています。',
      empty: '公開中のニュースはまだありません。',
      filteredEmpty: 'この topic のニュースはまだありません。',
      loading: 'Loading more news...',
      end: 'no more news',
      noSummary: 'No summary yet.',
      open: 'Open article',
      allTags: 'All',
      filterByTopic: 'Filter by this topic',
      error: 'ニュースを表示できませんでした。',
      retry: '再試行',
      clear: 'すべて表示',
      clearHint: 'topic フィルターを解除して、すべてのニュースを確認できます。',
      disclaimer:
        'このページは公開ニュースリンクの収集と紹介を目的としており、ニュース本文の保存や転載は行いません。全文は元のニュースページでご確認ください。',
    }
  }

  return {
    lead: '从公开新闻中整理采访、Live、发行等主题，按发布时间持续更新。',
    empty: '暂无公开新闻。',
    filteredEmpty: '当前 topic 下暂无新闻。',
    loading: '正在加载更多新闻...',
    end: '没有更多新闻了',
    noSummary: '暂无摘要',
    open: '打开新闻',
    allTags: '全部',
    filterByTopic: '按这个 topic 筛选',
    error: '暂时无法显示新闻',
    retry: '重试',
    clear: '查看全部',
    clearHint: '清除 topic 筛选后可以查看全部新闻。',
    disclaimer:
      '本页仅用于收藏和转引公开新闻链接，不保存、不转载新闻正文内容；完整内容请以原始新闻页面为准。',
  }
})

const groupedNews = computed(() => {
  const groups = new Map<string, PublicNewsItem[]>()

  for (const item of items.value) {
    const topic = item.topic?.trim() || 'General'
    const list = groups.get(topic) || []
    list.push(item)
    groups.set(topic, list)
  }

  return Array.from(groups.entries()).map(([topic, groupItems]) => ({
    topic,
    items: [...groupItems].sort((a, b) => comparePublishDate(b.publishDate, a.publishDate)),
  }))
})

const topicPreviewLimit = 10

const visibleTopicTags = computed(() =>
  showAllTags.value ? topicTags.value : topicTags.value.slice(0, topicPreviewLimit),
)

const hiddenTopicCount = computed(() => Math.max(0, topicTags.value.length - topicPreviewLimit))

const hasHiddenTopicTags = computed(() => topicTags.value.length > topicPreviewLimit)

function comparePublishDate(a: string, b: string) {
  return new Date(a || 0).getTime() - new Date(b || 0).getTime()
}

function topicAccentClass(index: number) {
  return ['bg-sky-200/80', 'bg-pink-200/80', 'bg-emerald-200/80', 'bg-amber-200/80'][index % 4]
}

function topicCardClass(index: number) {
  return [
    'border-sky-100/90 hover:border-sky-200',
    'border-pink-100/90 hover:border-pink-200',
    'border-emerald-100/90 hover:border-emerald-200',
    'border-amber-100/90 hover:border-amber-200',
  ][index % 4]
}

function topicTagStyle(index: number) {
  const palette = [
    ['rgba(14, 165, 233, 0.28)', 'rgba(240, 249, 255, 0.82)', '#075985', 'rgba(2, 132, 199, 0.14)'],
    [
      'rgba(236, 72, 153, 0.24)',
      'rgba(253, 242, 248, 0.82)',
      '#9d174d',
      'rgba(219, 39, 119, 0.13)',
    ],
    ['rgba(16, 185, 129, 0.24)', 'rgba(236, 253, 245, 0.82)', '#047857', 'rgba(5, 150, 105, 0.13)'],
    ['rgba(245, 158, 11, 0.25)', 'rgba(255, 251, 235, 0.84)', '#92400e', 'rgba(217, 119, 6, 0.14)'],
    ['rgba(99, 102, 241, 0.22)', 'rgba(238, 242, 255, 0.82)', '#3730a3', 'rgba(79, 70, 229, 0.13)'],
    [
      'rgba(20, 184, 166, 0.24)',
      'rgba(240, 253, 250, 0.82)',
      '#0f766e',
      'rgba(13, 148, 136, 0.13)',
    ],
  ]
  const color = palette[Math.max(0, index) % palette.length]
  return {
    '--tag-border': color[0],
    '--tag-bg': color[1],
    '--tag-text': color[2],
    '--tag-active-bg': color[3],
  }
}

function formatDate(value: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

function resetNewsList() {
  items.value = []
  page.value = 1
  hasMore.value = true
  hasLoadedOnce.value = false
  loadError.value = ''
}

async function selectTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? '' : tag
  resetNewsList()
  await loadNews()
  await nextTick()
  updateTopicRailHint()
}

async function loadNewsTopics() {
  try {
    const response = await axiosInstance.get<PublicNewsTopicsResponse>(apiRoutes.miletNewsTopics)
    if (response.success === false) {
      throw new Error(response.message || 'Failed to load news topics')
    }
    topicTags.value = Array.isArray(response.items)
      ? [...response.items].sort(
          (a, b) =>
            Number(a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              Number(b.sortOrder ?? Number.MAX_SAFE_INTEGER) || a.topic.localeCompare(b.topic),
        )
      : []
    await nextTick()
    updateTopicRailHint()
  } catch (error) {
    console.error('Failed to load public news topics:', error)
    topicTags.value = []
  }
}

function updateTopicRailHint() {
  const rail = topicRailEl.value
  if (!rail || showAllTags.value) {
    hasTopicRailPrev.value = false
    hasTopicRailNext.value = false
    return
  }

  hasTopicRailPrev.value = rail.scrollLeft > 4
  hasTopicRailNext.value = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4
}

function scrollTopicRail(direction: 'prev' | 'next') {
  const rail = topicRailEl.value
  if (!rail) return

  const distance = Math.max(220, Math.floor(rail.clientWidth * 0.72))
  rail.scrollBy({
    left: direction === 'next' ? distance : -distance,
    behavior: 'smooth',
  })
  window.setTimeout(updateTopicRailHint, 260)
}

async function toggleTopicPanel() {
  showAllTags.value = !showAllTags.value
  await nextTick()
  updateTopicRailHint()
}

function setupTopicRailObserver() {
  topicResizeObserver?.disconnect()
  if (!topicRailEl.value || typeof ResizeObserver === 'undefined') return

  topicResizeObserver = new ResizeObserver(() => {
    updateTopicRailHint()
  })
  topicResizeObserver.observe(topicRailEl.value)
}

async function loadNews(signal?: AbortSignal) {
  if (loading.value || !hasMore.value) return

  loading.value = true
  loadError.value = ''
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }

    const response = await axiosInstance.get<PublicNewsResponse>(apiRoutes.miletNews, {
      params,
      signal,
    })
    if (signal?.aborted) return

    if (response.success === false) {
      throw new Error(response.message || 'Failed to load news')
    }

    const nextItems = Array.isArray(response.items) ? response.items : []
    items.value = [...items.value, ...nextItems]
    hasMore.value = Boolean(response.hasMore)
    page.value += 1
    interaction.announce(
      global?.$lang?.lang === 'jp'
        ? `${items.value.length} 件のニュースを表示しています`
        : `当前显示 ${items.value.length} 条新闻`,
    )
  } catch (error) {
    if (signal?.aborted) return
    console.error('Failed to load public news:', error)
    loadError.value = error instanceof Error ? error.message : pageText.value.error
    hasMore.value = false
    interaction.announce(pageText.value.error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

function retryNews() {
  hasMore.value = true
  void loadNews()
}

useBusinessAnchorScrollRestoration({
  root: newsRoot,
  capturePageState: () => ({
    loadedPage: Math.max(0, page.value - 1),
    selectedTag: selectedTag.value,
  }),
  async prepare(snapshot, signal) {
    const pageState = snapshot.pageState as
      | { loadedPage?: number; selectedTag?: string }
      | undefined
    const targetTag = pageState?.selectedTag || ''
    const targetPage = Number(pageState?.loadedPage)

    if (targetTag !== selectedTag.value) {
      selectedTag.value = targetTag
      resetNewsList()
    }
    while (
      Number.isFinite(targetPage) &&
      page.value <= targetPage &&
      hasMore.value &&
      !signal.aborted
    ) {
      await loadNews(signal)
    }
    await nextTick()
    pageScroll.invalidateMetrics()
  },
})

function setupObserver() {
  observer?.disconnect()
  if (!loadMoreEl.value) return

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadNews()
      }
    },
    { rootMargin: '360px 0px' },
  )
  observer.observe(loadMoreEl.value)
}

onMounted(async () => {
  const releasePending = markScrollContentPending('news-initial-data')
  document.title = 'milet news collection'
  try {
    await Promise.all([loadNewsTopics(), loadNews()])
    await nextTick()
    setupTopicRailObserver()
    updateTopicRailHint()
    setupObserver()
    pageScroll.invalidateMetrics()
  } finally {
    releasePending()
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  topicResizeObserver?.disconnect()
})
</script>

<style scoped>
.news-collection {
  color: #202632;
}

.news-card {
  text-decoration: none;
}

.news-hero {
  min-height: 20rem;
}

.news-hero-paper {
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.92),
      rgba(240, 249, 255, 0.1) 34%,
      rgba(255, 255, 255, 0.03)
    ),
    url('/background/news-hero-bg.webp') center right / cover no-repeat;
  opacity: 0.9;
}

.news-hero::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: auto 2rem 1.4rem 2rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(184, 148, 68, 0.48),
    rgba(184, 148, 68, 0.12),
    transparent
  );
}

.news-hero-signal {
  animation: news-signal-pulse 820ms ease-out 1 both;
}

.topic-filter {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(186, 230, 253, 0.72);
  border-radius: 0.75rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 252, 255, 0.72)),
    rgba(255, 255, 255, 0.64);
  padding: 0.75rem;
}

.topic-rail {
  display: flex;
  max-height: 6.9rem;
  align-items: center;
  gap: 0.55rem;
  overflow: hidden;
  overflow-x: auto;
  padding-right: 3.25rem;
  padding-bottom: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.topic-rail::-webkit-scrollbar {
  display: none;
}

.topic-filter.is-expanded .topic-rail {
  max-height: none;
  flex-wrap: wrap;
  overflow-x: visible;
  padding-right: 0;
}

.topic-scroll-control {
  position: absolute;
  top: 0.75rem;
  bottom: 0.75rem;
  z-index: 4;
  display: grid;
  width: 3.45rem;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(49, 127, 141, 0.78);
  cursor: pointer;
  padding: 0;
}

.topic-scroll-control::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.topic-scroll-control svg {
  position: relative;
  z-index: 1;
  width: 1.28rem;
  height: 1.28rem;
  filter: drop-shadow(0 2px 7px rgba(49, 127, 141, 0.26));
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.topic-scroll-control-prev {
  left: 0.75rem;
}

.topic-scroll-control-next {
  right: 0.75rem;
}

.topic-scroll-control-prev::before {
  background: linear-gradient(270deg, rgba(255, 255, 255, 0), rgba(249, 252, 255, 0.98) 66%);
}

.topic-scroll-control-next::before {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(249, 252, 255, 0.98) 66%);
}

.topic-scroll-control-prev svg {
  animation: topic-prev-hint 720ms ease-in-out 2;
}

.topic-scroll-control-next svg {
  animation: topic-next-hint 720ms ease-in-out 2;
}

.news-tag {
  display: inline-flex;
  max-width: min(100%, 22rem);
  flex: 0 0 auto;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  border: 1px solid var(--tag-border, rgba(125, 211, 252, 0.45));
  border-radius: 999px;
  background: var(--tag-bg, rgba(240, 249, 255, 0.72));
  padding: 0.46rem 0.78rem;
  color: var(--tag-text, #47606d);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.news-tag-all,
.news-tag-all.is-active {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #ffffff;
  box-shadow: 0 0 0 0.45rem #ffffff;
}

.news-tag.is-active {
  border-color: currentColor;
  background: var(--tag-active-bg, rgba(2, 132, 199, 0.1));
  color: var(--tag-text, #075985);
  box-shadow: inset 0 0 0 1px currentColor;
}

.news-tag span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-tag em {
  flex: 0 0 auto;
  font-style: normal;
  color: #7a93a1;
}

.topic-more {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.3rem;
  min-height: 2.05rem;
  border: 1px solid rgba(100, 116, 139, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  padding: 0 0.72rem;
  color: #425866;
  font-size: 0.76rem;
  font-weight: 800;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.topic-more svg {
  width: 0.9rem;
  height: 0.9rem;
  transition: transform 160ms ease;
}

.topic-more[aria-expanded='true'] svg {
  transform: rotate(180deg);
}

@media (hover: hover) and (pointer: fine) {
  .news-tag:hover {
    border-color: currentColor;
    background: var(--tag-active-bg, rgba(2, 132, 199, 0.1));
  }

  .topic-more:hover {
    border-color: rgba(14, 116, 144, 0.3);
    background: rgba(240, 249, 255, 0.94);
    color: #075985;
  }

  .topic-scroll-control:hover {
    color: rgba(14, 116, 144, 0.96);
  }

  .topic-scroll-control-prev:hover svg {
    transform: translateX(-0.12rem);
  }

  .topic-scroll-control-next:hover svg {
    transform: translateX(0.12rem);
  }
}

@keyframes topic-prev-hint {
  0%,
  100% {
    opacity: 0.28;
    transform: translate(0.1rem, 0);
  }

  45% {
    opacity: 0.95;
    transform: translate(-0.16rem, 0);
  }
}

@keyframes topic-next-hint {
  0%,
  100% {
    opacity: 0.28;
    transform: translate(-0.1rem, 0);
  }

  45% {
    opacity: 0.95;
    transform: translate(0.16rem, 0);
  }
}

@keyframes news-signal-pulse {
  0%,
  100% {
    opacity: 0.36;
  }

  50% {
    opacity: 0.74;
  }
}

@media (max-width: 640px) {
  .topic-filter {
    margin-right: -1rem;
    margin-left: -1rem;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
    padding-right: 1rem;
    padding-left: 1rem;
  }

  .topic-scroll-control {
    top: 0;
    right: 0;
    bottom: 0;
    width: 3.85rem;
  }

  .topic-scroll-control-prev {
    left: 0;
    right: auto;
  }

  .topic-scroll-control-next {
    left: auto;
    right: 0;
  }

  .topic-scroll-control-prev::before {
    background: linear-gradient(270deg, rgba(255, 255, 255, 0), rgba(249, 252, 255, 0.98) 58%);
  }

  .topic-scroll-control-next::before {
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(249, 252, 255, 0.98) 58%);
  }

  .topic-rail {
    max-height: 6.4rem;
    padding-right: 3.65rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .topic-rail::-webkit-scrollbar {
    display: none;
  }

  .topic-filter.is-expanded .topic-rail {
    padding-right: 0;
  }

  .news-tag-all,
  .news-tag-all.is-active {
    background: #ffffff;
    box-shadow: 0 0 0 0.55rem #ffffff;
  }
}

.line-clamp-2,
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.line-clamp-3 {
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
</style>
