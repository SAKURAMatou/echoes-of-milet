<template>
  <section ref="wrapEl" class="relative mx-auto max-w-5xl px-4 py-10">
    <!-- 中轴线：桌面居中；手机靠左 -->
    <div class="pointer-events-none absolute top-5 h-full w-2" :class="axisPosClass">
      <!-- 虚线底线（蓝色） -->
      <div
        class="absolute left-1/2 top-0 h-[calc(100%-1.5rem)] w-1 -translate-x-1/2 rounded-full"
        :class="axisBaseClass"
      ></div>

      <!-- 进度虚线（更深一点的蓝），高度随滚动 -->
      <div
        class="absolute left-1/2 top-0 w-1 -translate-x-1/2 rounded-full transition-[height] duration-200 ease-linear"
        :class="axisProgClass"
        :style="{ height: progressPct + '%' }"
      ></div>
      <!-- 上方箭头 -->
      <div
        class="absolute -top-4 left-[-6px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-blue-400"
      ></div>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="text-sm text-gray-500">加载中...</div>
    </div>

    <ul class="space-y-10">
      <li
        v-for="(it, i) in items"
        :key="i"
        :ref="(el) => setItemRef(el, i)"
        class="relative"
        :class="[
          visibleSet.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          'transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        ]"
      >
        <!-- 节点圆点：白色边框 + 中心不透明色（按 item 色） -->
        <div
          class="absolute top-6 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white shadow-sm transition-transform duration-200"
          :class="[
            dotPosClass,
            i === activeIndex ? 'scale-110' : 'scale-100',
            colorMap[it.color]?.dot,
          ]"
        ></div>

        <!-- 内容区域：手机单列（轴线左，卡片右）；桌面双列左右交替 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
          <div class="w-[90%] max-w-xl" :class="cardWrapClass(i)">
            <div :class="cardClass(i, it.color)">
              <div class="text-sm font-semibold tabular-nums" :class="colorMap[it.color]?.time">
                {{ it.event_date }}
              </div>
              <h3 class="mt-1 text-base font-bold" :class="colorMap[it.color]?.title">
                {{ it.timeline_title }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-black/70">
                {{ it.timeline_body }}
              </p>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <!-- 无限加载触发点 -->
    <div ref="loadMoreEl" class="h-2" />

    <!-- 加载完成或无更多数据提示 -->
    <div v-if="hasLoadedOnce && !hasMoreData" class="text-center py-4">
      <div class="text-sm text-gray-400">no more data</div>
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

declare global {
  interface ImportMeta {
    env: {
      VITE_URL_API_MILET_TIMELINE_ALL: string
      [key: string]: string | undefined
    }
  }
}
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties
type TimeLineResItem = {
  event_date: string
  timeline_title: string
  timeline_body: string
  link_url: string
  color: string
}

const displayedData = ref({ zh: [] as TimeLineResItem[], jp: [] as TimeLineResItem[] })
const wrapEl = ref(null)
const loadMoreEl = ref(null)
//用来决定每个item的颜色属性的随机数seed
const seed = ref(0)
// 分页相关
const currentPage = ref(1)
const hasMoreData = ref(true)
const isLoading = ref(false)
const hasLoadedOnce = ref(false)
// item DOM
const itemEls = reactive(new Map<number, HTMLElement>())
function setItemRef(el, idx) {
  if (el) itemEls.set(idx, el)
}

// reveal
const visibleSet = reactive(new Set())
let io

// active
const activeIndex = ref(0)

//滚动窗口元素
let scrollContainer: Element | null | Window = null

// progress 0~1
const progress = ref(0)
const progressPct = computed(() => Math.max(0, Math.min(100, Math.round(progress.value * 100))))

// rAF 节流
let rafId = 0
function scheduleUpdate() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    updateActiveAndProgress()
  })
}

function updateActiveAndProgress() {
  const wrap = wrapEl.value
  if (!wrap || itemEls.size === 0) return

  const viewportCenter = window.innerHeight * 0.5

  // active：离视口中心最近
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

  // progress：wrap 顶部 -> active item 中心
  const wrapRect = wrap.getBoundingClientRect()
  // 使用 scrollHeight 获取实际完整高度，包括所有加载的内容
  const total = wrap.scrollHeight

  const activeEl = itemEls.get(bestIdx) as HTMLElement | undefined
  if (!activeEl || total <= 0) {
    progress.value = 0
    return
  }
  const aRect = activeEl.getBoundingClientRect()
  const aCenterInWrap = aRect.top + aRect.height * 0.5 - wrapRect.top
  progress.value = Math.max(0, Math.min(1, aCenterInWrap / total))

  // 检查是否需要加载更多数据（距底部500px时触发）
  checkLoadMore()
}

function checkLoadMore() {
  if (isLoading.value || !hasMoreData.value) return

  const loadMoreElement = loadMoreEl.value as HTMLElement | undefined
  if (!loadMoreElement) return

  const rect = loadMoreElement.getBoundingClientRect()
  if (rect.top < window.innerHeight + 500) {
    loadMoreData()
  }
}

/** 颜色映射：点/卡片/标题跟着变（你可按站点色再微调） */
const colorMap = {
  blue: {
    dot: 'bg-sky-500/90',
    card: 'bg-sky-50/70 border-sky-200/70',
    title: 'text-sky-800',
    time: 'text-sky-700/80',
    activeRing: 'ring-sky-200/70',
  },
  orange: {
    dot: 'bg-orange-500/90',
    card: 'bg-orange-50/70 border-orange-200/70',
    title: 'text-orange-800',
    time: 'text-orange-700/80',
    activeRing: 'ring-orange-200/70',
  },
  purple: {
    dot: 'bg-violet-500/90',
    card: 'bg-violet-50/70 border-violet-200/70',
    title: 'text-violet-800',
    time: 'text-violet-700/80',
    activeRing: 'ring-violet-200/70',
  },
  pink: {
    dot: 'bg-pink-500/90',
    card: 'bg-pink-50/70 border-pink-200/70',
    title: 'text-pink-800',
    time: 'text-pink-700/80',
    activeRing: 'ring-pink-200/70',
  },
  green: {
    dot: 'bg-emerald-500/90',
    card: 'bg-emerald-50/70 border-emerald-200/70',
    title: 'text-emerald-800',
    time: 'text-emerald-700/80',
    activeRing: 'ring-emerald-200/70',
  },
}

// 轴线位置：手机 left-6；sm 及以上居中
const axisPosClass = 'left-6 sm:left-1/2 sm:-translate-x-1/2'
const dotPosClass = 'left-3 sm:left-1/2'

// 蓝色虚线：用 repeating-linear-gradient 做“虚线条纹”
const axisBaseClass =
  'bg-[repeating-linear-gradient(to_bottom,rgba(59,130,246,0.25)_0,rgba(59,130,246,0.25)_10px,transparent_10px,transparent_18px)]'
const axisProgClass =
  'bg-[repeating-linear-gradient(to_bottom,rgba(59,130,246,0.75)_0,rgba(59,130,246,0.75)_10px,transparent_10px,transparent_18px)]'

function cardWrapClass(i) {
  // 手机：统一在右侧（给轴线留出空间）
  // 桌面：左右交替
  if (i % 2 === 0) {
    return 'ml-10 sm:ml-0 sm:col-start-1 sm:justify-self-end'
  }
  return 'ml-10 sm:ml-0 sm:col-start-2 sm:justify-self-start'
}

function cardClass(i, color) {
  const base = 'rounded-2xl border px-6 py-5 shadow-sm backdrop-blur transition-all duration-200'
  const themed = colorMap[color]?.card ?? 'bg-white/70 border-black/10'
  const normal = 'hover:shadow-md'

  // active 高亮：轻微放大 + ring（跟色）
  const active =
    i === activeIndex.value
      ? `scale-[1.02] shadow-lg ring-4 ${colorMap[color]?.activeRing ?? 'ring-black/10'}`
      : ''

  return `${base} ${themed} ${normal} ${active}`
}

onMounted(async () => {
  document.title = 'milet activities timeline'
  // 找到最近的 overflow-y-auto 容器（可能是父组件或祖先）
  scrollContainer = document.querySelector('.flex-1.overflow-y-auto') || window

  // 初始化加载第一页数据
  hasLoadedOnce.value = true
  isLoading.value = true
  const { data, hasMore } = await getData(1)
  const lang = global.$lang.lang

  hasMoreData.value = hasMore
  currentPage.value = 2 // 准备加载第二页
  isLoading.value = false

  await nextTick()

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue

        for (const [idx, el] of Array.from(itemEls.entries()) as Array<[number, HTMLElement]>) {
          if (el === e.target) {
            visibleSet.add(idx)
            io.unobserve(el) // 只做一次 reveal
            break
          }
        }
      }
    },
    { threshold: 0.15 },
  )

  for (const el of Array.from(itemEls.values())) io.observe(el)

  updateActiveAndProgress()
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', scheduleUpdate, { passive: true })
    scrollContainer.addEventListener('resize', scheduleUpdate)
  }

  seed.value = Math.floor(Math.random() * Object.keys(colorMap).length) + 5
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', scheduleUpdate)
    scrollContainer.removeEventListener('resize', scheduleUpdate)
  }
  if (rafId) cancelAnimationFrame(rafId)
})

const getData = async (page: number = 1) => {
  try {
    const response = await axiosInstance.get(
      `${import.meta.env.VITE_URL_API_MILET_TIMELINE_ALL}/${page}`,
    )
    // axios 的 response.data 就是: { data: { zh: [], jp: [] }, hasMore: boolean }
    const { data, hasMore } = response.data
    //data中可能包含不是数组的k-v；把新数组添加到现有数组中，key对应
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
    const { data, hasMore } = await getData(currentPage.value)

    if (hasMore) {
      currentPage.value += 1
      hasMoreData.value = hasMore
    } else {
      hasMoreData.value = false
    }

    // 新增数据后，为新增的元素设置 IntersectionObserver
    await nextTick()
    for (let i = previousCount; i < items.value.length; i++) {
      const el = itemEls.get(i)
      if (el && io) {
        io.observe(el)
      }
    }
  } catch (error) {
    console.error('Error loading more data:', error)
    hasMoreData.value = false
  } finally {
    isLoading.value = false
  }
}

const items = computed<TimeLineResItem[]>(() => {
  return displayedData.value[global.$lang.lang].map((it, index) => ({
    ...it,
    color: Object.keys(colorMap)[(index + seed.value) % Object.keys(colorMap).length] || 'blue', // 默认颜色
  }))
})
</script>
