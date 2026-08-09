<template>
  <section
    ref="wrapEl"
    class="relative mx-auto min-h-[calc(100svh-5rem)] overflow-hidden rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] px-4 py-8 text-[#1e2a35] sm:px-6 md:px-8 md:py-9"
  >
    <header
      class="timeline-hero relative isolate -mx-4 -mt-8 mb-8 overflow-hidden rounded-t-lg px-4 py-8 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:py-9"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,rgba(186,230,253,0.62),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.48))]"
      ></div>
      <div class="timeline-hero-photo pointer-events-none absolute inset-0"></div>
      <div
        class="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,27rem)] lg:items-end"
      >
        <div>
          <p
            class="font-montserrat text-xs font-semibold uppercase tracking-[0.18em] text-[#317f8d]"
          >
            CURRENT: Timeline
          </p>
          <h1 class="milet-page-title-font mt-5 text-6xl leading-none text-[#143d63] md:text-7xl">
            Timeline
          </h1>
          <p class="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600">
            milet activities archive &middot; 2019 &mdash; {{ currentYear }}
          </p>
        </div>

        <aside
          class="timeline-hero-rail relative mt-8 min-h-[5.75rem] text-[#173e63] max-md:hidden md:mt-0 md:min-h-[10rem]"
          aria-label="Timeline year range"
        >
          <div class="mb-6 flex items-center justify-end gap-4 md:mb-8">
            <span class="hidden font-serif text-base text-[#143d63] sm:inline"
              >years in archive</span
            >
            <span
              class="h-px min-w-24 flex-1 bg-[linear-gradient(90deg,rgba(184,148,68,0.82),rgba(184,148,68,0.16))]"
            ></span>
            <span
              class="grid h-2.5 w-2.5 shrink-0 rotate-45 place-items-center border border-[#b89444]/60 bg-white/80 shadow-[0_0_0_7px_rgba(255,255,255,0.36),0_18px_45px_-24px_rgba(20,61,99,0.72)]"
              aria-hidden="true"
            >
              <span class="h-1 w-1 rounded-full bg-[#b89444]/70"></span>
            </span>
          </div>
          <div class="relative px-3 pt-6 md:pt-8">
            <div
              class="absolute left-3 right-3 top-[2rem] h-px bg-[linear-gradient(90deg,rgba(184,148,68,0.18),rgba(49,127,141,0.42),rgba(184,148,68,0.24))] md:top-[2.5rem]"
            ></div>
            <div class="relative grid grid-cols-4 gap-2">
              <div
                v-for="(year, index) in timelineHeroYears"
                :key="year"
                class="grid justify-items-center gap-3"
              >
                <span
                  class="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border border-[#317f8d]/70 bg-white/90 shadow-[0_0_0_5px_rgba(255,255,255,0.58)]"
                  :class="
                    index === timelineHeroYears.length - 1 ? 'scale-110 border-[#b89444]' : ''
                  "
                >
                  <span
                    class="block h-1.5 w-1.5 rounded-full"
                    :class="
                      index === timelineHeroYears.length - 1 ? 'bg-[#b89444]' : 'bg-[#317f8d]'
                    "
                  ></span>
                </span>
                <span
                  class="font-montserrat text-xs font-semibold tabular-nums tracking-[0.08em] text-slate-600"
                >
                  {{ year }}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </header>

    <EchoAsyncState
      v-if="isLoading && !hasLoadedOnce"
      state="loading"
      :title="currentLang === 'jp' ? 'タイムラインを読み込んでいます' : '正在读取时间线'"
    />
    <EchoAsyncState
      v-else-if="timelineError && items.length === 0"
      state="error"
      :title="currentLang === 'jp' ? 'タイムラインを表示できません' : '暂时无法显示时间线'"
      :description="timelineError"
      :action-label="currentLang === 'jp' ? '再試行' : '重试'"
      :disabled="isLoading"
      @action="retryInitial"
    />
    <EchoAsyncState
      v-else-if="!isLoading && items.length === 0"
      state="empty"
      :title="currentLang === 'jp' ? '公開中の記録はまだありません' : '还没有公开的时间线记录'"
    />

    <div v-else class="relative pb-4">
      <div class="relative h-10">
        <div
          class="absolute left-0 right-0 top-4 h-px bg-[linear-gradient(90deg,transparent,rgba(184,148,68,0.72),rgba(184,148,68,0.34),transparent)]"
        ></div>
        <div
          class="absolute top-[0.42rem] z-10 flex h-5 w-12 -translate-x-1/2 items-center justify-center"
          :class="ornamentPosClass"
          aria-hidden="true"
        >
          <span
            class="absolute h-px w-12 bg-[linear-gradient(90deg,transparent,rgba(184,148,68,0.72),transparent)]"
          ></span>
          <span
            class="h-2.5 w-2.5 rotate-45 border border-[#b89444]/70 bg-white/85 shadow-[0_0_0_3px_rgba(255,255,255,0.72)]"
          ></span>
          <span class="absolute h-1 w-1 rounded-full bg-[#b89444]/58"></span>
        </div>
      </div>

      <div class="relative">
        <div class="pointer-events-none absolute top-0 h-full w-2" :class="axisPosClass">
          <div
            class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(100,116,139,0.2),rgba(49,127,141,0.42),rgba(100,116,139,0.18))]"
          ></div>
          <div
            class="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(49,127,141,0.9),rgba(125,211,252,0.52))] transition-[height] duration-200 ease-linear"
            :style="{ height: progressPct + '%' }"
          ></div>
        </div>

        <ul class="relative space-y-10 md:space-y-12">
          <li
            v-for="(it, i) in items"
            :key="timelineItemKey(it, i)"
            :ref="(el) => setItemRef(el, i)"
            :data-page-scroll-anchor="timelineAnchorId(it, i)"
            class="relative"
            :class="[
              visibleSet.has(timelineItemKey(it, i))
                ? 'translate-y-0 opacity-100'
                : 'translate-y-4 opacity-0',
              'transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            ]"
          >
            <div
              class="timeline-node absolute top-6 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-[5px] border-white bg-[#1f5f8f] shadow-[0_0_0_1px_rgba(184,148,68,0.38),0_10px_28px_-18px_rgba(20,61,99,0.9)] transition-all duration-300"
              :class="[
                dotPosClass,
                i === activeIndex
                  ? 'is-active scale-110 shadow-[0_0_0_6px_rgba(184,148,68,0.18),0_12px_30px_-18px_rgba(20,61,99,0.9)]'
                  : 'scale-100',
              ]"
            ></div>

            <span
              class="pointer-events-none absolute top-[2.12rem] hidden h-px w-9 bg-[linear-gradient(90deg,rgba(184,148,68,0.08),rgba(184,148,68,0.64))] md:block"
              :class="connectorClass(i)"
            ></span>

            <div
              class="pointer-events-none absolute top-[1.125rem] z-10 hidden h-8 w-[15rem] items-center gap-3 md:flex"
              :class="dateRailClass(i)"
            >
              <span
                class="h-px w-12 shrink-0 bg-[linear-gradient(90deg,rgba(184,148,68,0.14),rgba(184,148,68,0.72))]"
              ></span>
              <span
                class="font-montserrat text-sm font-semibold tabular-nums tracking-[0.02em] text-[#34658f]"
              >
                {{ it.event_date }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
              <div
                class="ml-10 w-[calc(100%-2.5rem)] min-w-0 max-w-[21.5rem] md:ml-0 md:w-full"
                :class="cardWrapClass(i)"
              >
                <div :class="cardClass(i)">
                  <div>
                    <div
                      class="font-montserrat text-xs font-semibold tracking-[0.08em] text-[#317f8d] md:hidden"
                    >
                      {{ it.event_date }}
                    </div>
                    <h2 class="mt-2 text-base font-bold leading-6 text-[#143d63] md:mt-0">
                      {{ it.timeline_title }}
                    </h2>
                    <FormattedPlainText
                      class="mt-3 text-sm leading-7 text-slate-600"
                      :text="it.timeline_body"
                    />
                  </div>

                </div>
                <ExtraInformationList
                  v-if="it.extraInfo?.items?.length || it.articles?.items?.length"
                  class="w-full max-w-[21.5rem] md:min-h-0"
                  :extra-info="it.extraInfo"
                  :legacy-articles="it.articles"
                  variant="timeline"
                  :lang="currentLang"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div ref="loadMoreEl" class="h-8" />

      <div v-if="isLoading && hasLoadedOnce" class="relative flex justify-center py-4">
        <div class="text-sm font-medium text-slate-500">loading...</div>
      </div>

      <div v-if="hasLoadedOnce && !hasMoreData" class="relative py-4 text-center">
        <div class="text-sm text-slate-400">no more data</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  computed,
  nextTick,
  getCurrentInstance,
  watch,
} from 'vue'
import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'
import FormattedPlainText from '@/components/FormattedPlainText.vue'
import ExtraInformationList from '@/components/milet/extra-information/ExtraInformationList.vue'
import EchoAsyncState from '@/components/interaction/EchoAsyncState.vue'
import type { RelatedArticleGroup } from '@/composables/articleType'
import type { ExtraInformationGroup } from '@/composables/extraInformation'
import {
  useBusinessAnchorScrollRestoration,
  usePageScroll,
  usePageScrollPage,
} from '@/composables/page-scroll'
import { useSiteInteraction } from '@/composables/site-interaction'

const instance = getCurrentInstance()
const global = instance?.appContext.config.globalProperties

type TimeLineResItem = {
  event_date: string
  timeline_title: string
  timeline_body: string
  link_url: string
  timeline_id?: number | string
  extraInfo?: ExtraInformationGroup
  articles?: RelatedArticleGroup
}

const displayedData = ref({ zh: [] as TimeLineResItem[], jp: [] as TimeLineResItem[] })
const wrapEl = ref<HTMLElement | null>(null)
const loadMoreEl = ref<HTMLElement | null>(null)
const currentYear = new Date().getFullYear()
const timelineHeroYears = computed(() => {
  const markerYears = [2019, 2021, 2023, currentYear]
  return Array.from(new Set(markerYears)).sort((a, b) => a - b)
})
const currentLang = computed<SupportedLang>(() => (global?.$lang?.lang === 'jp' ? 'jp' : 'zh'))

const currentPage = ref(1)
const loadedPage = ref(0)
const hasMoreData = ref(true)
const isLoading = ref(false)
const hasLoadedOnce = ref(false)
const timelineError = ref('')

const itemEls = reactive(new Map<number, HTMLElement>())
function setItemRef(el: any, idx: number) {
  if (el instanceof HTMLElement) {
    itemEls.set(idx, el)
    return
  }
  itemEls.delete(idx)
}

const visibleSet = reactive(new Set<string>())
let io: IntersectionObserver | null = null

const activeIndex = ref(0)
const pageScroll = usePageScroll()
const interaction = useSiteInteraction()
const { markScrollContentPending } = usePageScrollPage()
let unsubscribeScrollFrame: (() => void) | null = null

const progress = ref(0)
const progressPct = computed(() => Math.max(0, Math.min(100, Math.round(progress.value * 100))))

function scheduleUpdate() {
  updateActiveAndProgress()
}

function getScrollMetrics() {
  return {
    viewportTop: pageScroll.state.viewportTop,
    viewportHeight: pageScroll.state.viewportHeight,
    viewportBottom: pageScroll.state.viewportTop + pageScroll.state.viewportHeight,
  }
}

function updateActiveAndProgress() {
  const wrap = wrapEl.value
  if (!wrap || itemEls.size === 0) return

  const { viewportTop, viewportHeight } = getScrollMetrics()
  const viewportCenter = viewportTop + viewportHeight * 0.5
  let bestIdx = activeIndex.value
  let bestDist = Infinity

  for (const [idx, el] of Array.from(itemEls.entries()) as Array<[number, HTMLElement]>) {
    const r = el.getBoundingClientRect()
    const elCenter = r.top + r.height * 0.5
    const dist = Math.abs(elCenter - viewportCenter)
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = idx
    }
  }
  activeIndex.value = bestIdx

  const wrapRect = wrap.getBoundingClientRect()
  const total = wrap.scrollHeight
  const activeEl = itemEls.get(bestIdx) as HTMLElement | undefined
  if (!activeEl || total <= 0) {
    progress.value = 0
    return
  }

  const aRect = activeEl.getBoundingClientRect()
  const aCenterInWrap = aRect.top + aRect.height * 0.5 - wrapRect.top
  progress.value = Math.max(0, Math.min(1, aCenterInWrap / total))

  checkLoadMore()
}

function checkLoadMore() {
  if (isLoading.value || !hasMoreData.value) return

  const loadMoreElement = loadMoreEl.value as HTMLElement | undefined
  if (!loadMoreElement) return

  const { viewportBottom } = getScrollMetrics()
  const rect = loadMoreElement.getBoundingClientRect()
  if (rect.top < viewportBottom + 500) {
    loadMoreData()
  }
}

const axisPosClass = 'left-6 -translate-x-1/2 md:left-1/2'
const ornamentPosClass = 'left-6 md:left-1/2'
const dotPosClass = 'left-6 md:left-1/2'

function timelineAnchorId(item: TimeLineResItem, index: number) {
  return `timeline-${item.timeline_id ?? `${item.event_date}-${index}`}`
}

function timelineItemKey(item: TimeLineResItem, index: number) {
  return timelineAnchorId(item, index)
}

function observeRenderedItems() {
  if (!io) return
  io.disconnect()
  const { viewportTop, viewportBottom } = getScrollMetrics()

  for (const [index, element] of Array.from(itemEls.entries())) {
    const item = items.value[index]
    if (!item) continue
    const bounds = element.getBoundingClientRect()
    if (bounds.bottom >= viewportTop && bounds.top <= viewportBottom) {
      visibleSet.add(timelineItemKey(item, index))
    }
    io.observe(element)
  }
}

function cardWrapClass(i: number) {
  if (i % 2 === 0) {
    return 'md:col-start-1 md:justify-self-end'
  }
  return 'md:col-start-2 md:justify-self-start'
}

function connectorClass(i: number) {
  if (i % 2 === 0) {
    return 'left-[calc(50%-2.25rem)] bg-[linear-gradient(90deg,rgba(184,148,68,0.64),rgba(184,148,68,0.08))]'
  }
  return 'left-1/2'
}

function dateRailClass(i: number) {
  if (i % 2 === 0) {
    return 'left-1/2 pl-7'
  }
  return 'right-1/2 flex-row-reverse pr-7 text-right'
}

function cardClass(i: number) {
  const base =
    'group relative w-full max-w-[21.5rem] rounded-lg border bg-white/82 px-5 py-5 text-left shadow-[0_18px_45px_-36px_rgba(15,23,42,0.74)] backdrop-blur transition-all duration-300 md:min-h-[10rem]'
  const quiet = 'border-slate-200/80'
  const active =
    i === activeIndex.value
      ? 'scale-[1.018] border-[#317f8d]/48 bg-white/94 shadow-[0_26px_58px_-34px_rgba(20,61,99,0.92)] ring-4 ring-sky-100/80'
      : ''

  return `${base} ${quiet} ${active}`
}

onMounted(async () => {
  document.title = 'milet activities timeline'
  const releasePending = markScrollContentPending('timeline-initial-data')
  isLoading.value = true
  try {
    const { hasMore } = await getData(1)
    hasLoadedOnce.value = true
    hasMoreData.value = hasMore
    currentPage.value = 2
  } finally {
    isLoading.value = false
    await nextTick()
    pageScroll.invalidateMetrics()
    releasePending()
  }

  await nextTick()

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue

        for (const [idx, el] of Array.from(itemEls.entries()) as Array<[number, HTMLElement]>) {
          if (el === e.target) {
            const item = items.value[idx]
            if (item) visibleSet.add(timelineItemKey(item, idx))
            io?.unobserve(el)
            break
          }
        }
      }
    },
    { threshold: 0.15 },
  )

  observeRenderedItems()

  updateActiveAndProgress()
  unsubscribeScrollFrame = pageScroll.subscribeScrollFrame(scheduleUpdate)
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
  unsubscribeScrollFrame?.()
})

const getData = async (page: number = 1, signal?: AbortSignal) => {
  try {
    timelineError.value = ''
    const response = await axiosInstance.get(`${apiRoutes.miletTimeline}/${page}`, { signal })
    if (signal?.aborted) return { data: { zh: [], jp: [] }, hasMore: false }
    const { data, hasMore } = response.data

    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) {
        displayedData.value[k] = [...displayedData.value[k], ...data[k]]
      }
    }
    loadedPage.value = Math.max(loadedPage.value, page)
    interaction.announce(
      currentLang.value === 'jp'
        ? `${items.value.length} 件のタイムラインを表示しています`
        : `当前显示 ${items.value.length} 条时间线记录`,
    )
    return { data, hasMore }
  } catch (error) {
    if (signal?.aborted) return { data: { zh: [], jp: [] }, hasMore: false }
    console.error('Error fetching timeline data:', error)
    timelineError.value = error instanceof Error ? error.message : 'Timeline load failed.'
    interaction.announce(currentLang.value === 'jp' ? '読み込みに失敗しました' : '时间线加载失败')
    return { data: { zh: [], jp: [] }, hasMore: false }
  }
}

async function retryInitial() {
  if (isLoading.value) return
  isLoading.value = true
  timelineError.value = ''
  displayedData.value = { zh: [], jp: [] }
  currentPage.value = 1
  loadedPage.value = 0
  try {
    const { hasMore } = await getData(1)
    hasMoreData.value = hasMore
    currentPage.value = 2
    hasLoadedOnce.value = true
    await nextTick()
    pageScroll.invalidateMetrics()
    observeRenderedItems()
  } finally {
    isLoading.value = false
  }
}

useBusinessAnchorScrollRestoration({
  root: wrapEl,
  capturePageState: () => ({ loadedPage: loadedPage.value }),
  async prepare(snapshot, signal) {
    const targetPage = Number(
      (snapshot.pageState as { loadedPage?: number } | undefined)?.loadedPage,
    )
    if (!Number.isFinite(targetPage) || targetPage <= loadedPage.value) return

    for (let page = loadedPage.value + 1; page <= targetPage && !signal.aborted; page += 1) {
      const { hasMore } = await getData(page, signal)
      hasMoreData.value = hasMore
      currentPage.value = page + 1
      if (!hasMore) break
    }
    await nextTick()
    pageScroll.invalidateMetrics()
  },
})

const loadMoreData = async () => {
  if (isLoading.value || !hasMoreData.value) return

  isLoading.value = true
  try {
    const previousCount = items.value.length
    const { hasMore } = await getData(currentPage.value)

    if (hasMore) {
      currentPage.value += 1
      hasMoreData.value = hasMore
    } else {
      hasMoreData.value = false
    }

    await nextTick()
    pageScroll.invalidateMetrics()
    for (let i = previousCount; i < items.value.length; i++) {
      const el = itemEls.get(i)
      if (el && io) {
        io.observe(el)
      }
    }
    scheduleUpdate()
  } catch (error) {
    console.error('Error loading timeline data:', error)
    hasMoreData.value = false
  } finally {
    isLoading.value = false
  }
}

const items = computed<TimeLineResItem[]>(() => {
  return displayedData.value[currentLang.value]
})

watch(items, async () => {
  await nextTick()
  observeRenderedItems()
  pageScroll.invalidateMetrics()
  scheduleUpdate()
})
</script>

<style scoped>
.timeline-node.is-active::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(184, 148, 68, .5);
  border-radius: 9999px;
  animation: timeline-node-echo var(--echo-duration-route) var(--echo-ease-out) 1 both;
}
@keyframes timeline-node-echo { to { opacity: 0; transform: scale(1.7); } }
@media (prefers-reduced-motion: reduce) { .timeline-node.is-active::after { animation: none; inset: -4px; } }
</style>

<style scoped>
.timeline-hero {
  min-height: 18rem;
}

.timeline-hero-photo {
  background:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.9),
      rgba(240, 249, 255, 0.08) 34%,
      rgba(255, 255, 255, 0.03)
    ),
    url('/background/timeline-hero-bg.webp') center right / cover no-repeat;
  opacity: 0.9;
}

.timeline-hero::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: auto 2rem 1.4rem 2rem;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(184, 148, 68, 0.58),
    rgba(184, 148, 68, 0.16),
    transparent
  );
}

@media (max-width: 767px) {
  .timeline-hero {
    min-height: 15rem;
  }

  .timeline-hero-photo {
    background-position: 48% center;
    opacity: 0.4;
  }
}
</style>
