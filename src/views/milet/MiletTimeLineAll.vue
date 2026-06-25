<template>
  <section
    ref="wrapEl"
    class="relative mx-auto min-h-[calc(100svh-5rem)] overflow-hidden rounded-lg bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)] px-4 py-8 text-[#1e2a35] backdrop-blur-xl sm:px-6 md:px-8 md:py-9"
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

    <div v-if="isLoading && !hasLoadedOnce" class="relative flex justify-center py-8">
      <div class="text-sm font-medium text-slate-500">loading...</div>
    </div>

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
            :key="`${it.event_date}-${it.timeline_title}-${i}`"
            :ref="(el) => setItemRef(el, i)"
            class="relative"
            :class="[
              visibleSet.has(i) ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
              'transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            ]"
          >
            <div
              class="absolute top-6 z-20 h-5 w-5 -translate-x-1/2 rounded-full border-[5px] border-white bg-[#1f5f8f] shadow-[0_0_0_1px_rgba(184,148,68,0.38),0_10px_28px_-18px_rgba(20,61,99,0.9)] transition-all duration-300"
              :class="[
                dotPosClass,
                i === activeIndex
                  ? 'scale-110 shadow-[0_0_0_6px_rgba(184,148,68,0.18),0_12px_30px_-18px_rgba(20,61,99,0.9)]'
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
              <div class="ml-10 md:ml-0" :class="cardWrapClass(i)">
                <component
                  :is="hasItemLink(it.link_url) ? 'button' : 'div'"
                  :type="hasItemLink(it.link_url) ? 'button' : undefined"
                  :class="cardClass(i, hasItemLink(it.link_url))"
                  :aria-label="
                    hasItemLink(it.link_url)
                      ? `Open timeline detail: ${it.timeline_title}`
                      : undefined
                  "
                  @click="handleItemClick(it.link_url)"
                >
                  <span
                    v-if="hasItemLink(it.link_url)"
                    class="absolute inset-y-0 left-0 w-[3px] rounded-l-lg bg-[#317f8d]"
                  ></span>

                  <span
                    v-if="hasItemLink(it.link_url)"
                    class="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-[#317f8d]/20 bg-white/82 text-[#317f8d] transition group-hover:border-[#317f8d]/50 group-hover:bg-sky-50"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M7 17 17 7" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>

                  <div class="pr-10">
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

                  <div
                    v-if="hasItemLink(it.link_url)"
                    class="mt-4 flex items-center gap-2 text-xs font-semibold text-[#317f8d]"
                  >
                    <span>View detail</span>
                    <span class="h-px flex-1 bg-[#317f8d]/18"></span>
                  </div>
                </component>
                <RelatedArticleList
                  v-if="it.articles?.items?.length"
                  class="w-full max-w-[21.5rem] md:min-h-0"
                  :articles="it.articles"
                  variant="timeline"
                  :limit="1"
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
import { apiRoutes, getBackendOrigin } from '@/config/api'
import FormattedPlainText from '@/components/FormattedPlainText.vue'
import RelatedArticleList from '@/components/milet/article/RelatedArticleList.vue'
import type { RelatedArticleGroup } from '@/composables/articleType'

const instance = getCurrentInstance()
const global = instance?.appContext.config.globalProperties

type TimeLineResItem = {
  event_date: string
  timeline_title: string
  timeline_body: string
  link_url: string
  timeline_id?: number | string
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
const hasMoreData = ref(true)
const isLoading = ref(false)
const hasLoadedOnce = ref(false)

const itemEls = reactive(new Map<number, HTMLElement>())
function setItemRef(el: any, idx: number) {
  if (el instanceof HTMLElement) {
    itemEls.set(idx, el)
    return
  }
  itemEls.delete(idx)
}

const visibleSet = reactive(new Set<number>())
let io: IntersectionObserver | null = null

const activeIndex = ref(0)
let scrollContainer: HTMLElement | Window = window

const progress = ref(0)
const progressPct = computed(() => Math.max(0, Math.min(100, Math.round(progress.value * 100))))

let rafId = 0
function scheduleUpdate() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    updateActiveAndProgress()
  })
}

function findScrollContainer(el: HTMLElement | null) {
  let current = el?.parentElement ?? null

  while (current) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'

    if (isScrollable) return current
    current = current.parentElement
  }

  return window
}

function getScrollMetrics() {
  if (scrollContainer instanceof HTMLElement) {
    const rect = scrollContainer.getBoundingClientRect()
    return {
      viewportTop: rect.top,
      viewportHeight: rect.height,
      viewportBottom: rect.bottom,
    }
  }

  return {
    viewportTop: 0,
    viewportHeight: window.innerHeight,
    viewportBottom: window.innerHeight,
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

function getItemHref(link: string | undefined | null) {
  const value = (link || '').trim()
  if (!value) return ''

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) return value

  const hasDomain = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?(?:\/|$|\?)/i.test(value)
  if (hasDomain) {
    return `https://${value.replace(/^https?:\/\//i, '')}`
  }

  const baseOrigin =
    (typeof window !== 'undefined' && window.location?.origin) || getBackendOrigin() || ''

  try {
    return new URL(value, baseOrigin).toString()
  } catch {
    return ''
  }
}

function handleItemClick(link: string | undefined | null) {
  const href = getItemHref(link)
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}

function hasItemLink(link: string | undefined | null) {
  return Boolean(getItemHref(link))
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

function cardClass(i: number, isClickable = false) {
  const base =
    'group relative w-full max-w-[21.5rem] rounded-lg border bg-white/82 px-5 py-5 text-left shadow-[0_18px_45px_-36px_rgba(15,23,42,0.74)] backdrop-blur transition-all duration-300 md:min-h-[10rem]'
  const quiet = 'border-slate-200/80'
  const clickable =
    'cursor-pointer border-[#317f8d]/28 hover:-translate-y-0.5 hover:border-[#317f8d]/48 hover:bg-white/92 hover:shadow-[0_24px_52px_-34px_rgba(20,61,99,0.82)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/70'
  const active =
    i === activeIndex.value
      ? 'scale-[1.018] border-[#317f8d]/48 bg-white/94 shadow-[0_26px_58px_-34px_rgba(20,61,99,0.92)] ring-4 ring-sky-100/80'
      : ''

  return `${base} ${isClickable ? clickable : quiet} ${active}`
}

onMounted(async () => {
  document.title = 'milet activities timeline'
  scrollContainer = findScrollContainer(wrapEl.value)

  isLoading.value = true
  const { hasMore } = await getData(1)
  hasLoadedOnce.value = true
  hasMoreData.value = hasMore
  currentPage.value = 2
  isLoading.value = false

  await nextTick()
  scrollContainer = findScrollContainer(wrapEl.value)

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue

        for (const [idx, el] of Array.from(itemEls.entries()) as Array<[number, HTMLElement]>) {
          if (el === e.target) {
            visibleSet.add(idx)
            io?.unobserve(el)
            break
          }
        }
      }
    },
    { threshold: 0.15 },
  )

  for (const el of Array.from(itemEls.values())) io.observe(el)

  updateActiveAndProgress()
  scrollContainer.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate)
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
  scrollContainer.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)
  if (rafId) cancelAnimationFrame(rafId)
})

const getData = async (page: number = 1) => {
  try {
    const response = await axiosInstance.get(`${apiRoutes.miletTimeline}/${page}`)
    const { data, hasMore } = response.data

    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) {
        displayedData.value[k] = [...displayedData.value[k], ...data[k]]
      }
    }
    return { data, hasMore }
  } catch (error) {
    console.error('Error fetching timeline data:', error)
    return { data: { zh: [], jp: [] }, hasMore: false }
  }
}

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
  scheduleUpdate()
})
</script>

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
