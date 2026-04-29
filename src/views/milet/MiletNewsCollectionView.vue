<template>
  <section class="news-collection mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
    <header class="mb-8 border-b border-sky-100/80 pb-6">
      <p class="font-['Montserrat','sans-serif'] text-[12px] font-medium uppercase tracking-[.18em] text-sky-700/70">
        milet news
      </p>
      <h1 class="mt-3 font-['Cormorant_Garamond','serif'] text-4xl font-semibold leading-none text-[#1a2c50] sm:text-5xl">
        News Collection
      </h1>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
        {{ pageText.lead }}
      </p>
    </header>

    <div v-if="loading && items.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-lg border border-sky-100 bg-white/60" />
    </div>

    <div
      v-else-if="!loading && items.length === 0"
      class="rounded-lg border border-dashed border-sky-200 bg-white/60 px-6 py-12 text-center text-sm text-slate-500"
    >
      {{ pageText.empty }}
    </div>

    <div v-else class="space-y-10">
      <section
        v-for="(group, groupIndex) in groupedNews"
        :id="`news-topic-${groupIndex}`"
        :key="group.topic"
        class="scroll-mt-24"
      >
        <div class="mb-4 flex items-center gap-4">
          <h2 class="shrink-0 font-['Montserrat','sans-serif'] text-[15px] font-semibold uppercase text-[#546e7a]">
            {{ group.topic }}
          </h2>
          <div
            class="h-[3px] flex-1 rounded-full"
            :class="topicAccentClass(groupIndex)"
          />
          <span class="text-xs text-slate-400">{{ group.items.length }}</span>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <a
            v-for="item in group.items"
            :key="item.id"
            class="news-card group grid min-h-[164px] grid-cols-[104px_1fr] overflow-hidden rounded-lg border bg-white/72 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/80 sm:grid-cols-[132px_1fr]"
            :class="topicCardClass(groupIndex)"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="relative min-h-full overflow-hidden bg-sky-50">
              <img
                v-if="item.coverImage"
                :src="item.coverImage"
                :alt="item.title"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div v-else class="grid h-full min-h-[164px] place-items-center bg-gradient-to-br from-sky-50 to-pink-50 px-3 text-center">
                <span class="font-['Montserrat','sans-serif'] text-[11px] font-semibold uppercase tracking-[.18em] text-slate-400">
                  news
                </span>
              </div>
            </div>

            <div class="flex min-w-0 flex-col p-4">
              <div class="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[.12em] text-slate-400">
                <span class="truncate">{{ item.sourceHost || sourceFromUrl(item.url) }}</span>
                <time class="shrink-0 tabular-nums">{{ formatDate(item.publishDate) }}</time>
              </div>

              <h3 class="line-clamp-2 text-[15px] font-semibold leading-6 text-slate-800">
                {{ item.title }}
              </h3>
              <p class="mt-2 line-clamp-3 text-[13px] leading-6 text-slate-500">
                {{ item.summary || pageText.noSummary }}
              </p>

              <div class="mt-auto flex items-center justify-end pt-3 text-xs font-medium text-sky-700/80">
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
              </div>
            </div>
          </a>
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
import { apiRoutes } from '@/config/api'

type PublicNewsItem = {
  id: string
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

const route = useRoute()
const instance = getCurrentInstance()
const global = instance?.appContext.config.globalProperties as any

const items = ref<PublicNewsItem[]>([])
const page = ref(1)
const pageSize = ref(12)
const hasMore = ref(true)
const loading = ref(false)
const hasLoadedOnce = ref(false)
const loadMoreEl = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const pageText = computed(() => {
  const lang = global?.$lang?.lang || route.params.lang || 'zh'
  if (lang === 'ja' || lang === 'jp') {
    return {
      lead: '公開ニュースから、インタビュー、ライブ、リリース情報をテーマ別にまとめています。',
      empty: '公開中のニュースはまだありません。',
      loading: 'Loading more news...',
      end: 'no more news',
      noSummary: 'No summary yet.',
      open: 'Open article',
    }
  }

  return {
    lead: '从公开新闻中整理采访、Live、发行等主题，按发布时间持续更新。',
    empty: '暂无公开新闻。',
    loading: '正在加载更多新闻...',
    end: '没有更多新闻了',
    noSummary: '暂无摘要',
    open: '打开新闻',
  }
})

const requestLang = computed(() => (String(route.params.lang || 'zh') === 'ja' ? 'ja' : 'zh'))

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

function formatDate(value: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

function sourceFromUrl(value: string) {
  try {
    return new URL(value).hostname
  } catch {
    return value
  }
}

async function loadNews() {
  if (loading.value || !hasMore.value) return

  loading.value = true
  try {
    const response = await axiosInstance.get<PublicNewsResponse>(apiRoutes.miletNews, {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        lang: requestLang.value,
      },
    })

    if (response.success === false) {
      throw new Error(response.message || 'Failed to load news')
    }

    const nextItems = Array.isArray(response.items) ? response.items : []
    items.value = [...items.value, ...nextItems]
    hasMore.value = Boolean(response.hasMore)
    page.value += 1
  } catch (error) {
    console.error('Failed to load public news:', error)
    hasMore.value = false
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

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
  document.title = 'milet news collection'
  await loadNews()
  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.news-collection {
  color: #202632;
}

.news-card {
  text-decoration: none;
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
