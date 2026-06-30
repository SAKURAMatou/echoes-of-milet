<template>
  <section class="relative isolate overflow-hidden py-2">
    <div
      class="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#d9b77c]/34 to-transparent xl:block"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute left-1/2 top-[46%] hidden size-2 -translate-x-1/2 rounded-full bg-[#f4d397] shadow-[0_0_22px_rgba(244,211,151,0.95)] xl:block"
      aria-hidden="true"
    ></div>

    <div
      v-if="performances.length"
      class="grid gap-5 xl:grid-cols-[minmax(12rem,1fr)_minmax(22rem,34rem)_minmax(12rem,1fr)] xl:items-center"
    >
      <ol class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <li v-for="item in leftStops" :key="item.performance.id" class="min-w-0">
          <button
            type="button"
            class="group relative grid w-full min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center overflow-hidden border px-3 py-2.5 text-left transition"
            :class="routeButtonClass(item.performance.id)"
            style="clip-path: polygon(0 50%, 0.75rem 0, calc(100% - 1.25rem) 0, 100% 50%, calc(100% - 1.25rem) 100%, 0.75rem 100%)"
            @click="$emit('select', item.performance.id)"
          >
            <span class="text-center font-['Montserrat','sans-serif'] text-2xl text-[#f4d397]">
              {{ item.number }}
            </span>
            <span class="min-w-0 border-l border-[#d9b77c]/24 pl-3">
              <span class="block truncate font-serif text-xl leading-tight text-[#f3eadf]">
                {{ item.performance.city || performanceLabel(item.performance, item.index) }}
              </span>
              <span class="mt-1 block truncate text-xs text-[#d9b77c]">
                {{ formatLiveDate(item.performance.date) || performanceLabel(item.performance, item.index) }}
              </span>
            </span>
          </button>
        </li>
      </ol>

      <div class="relative mx-auto w-full max-w-[34rem]">
        <div
          class="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-[#d9b77c]/42 to-transparent"
          aria-hidden="true"
        ></div>
        <LiveMainVisualPanel
          :event="event"
          class="relative z-10 aspect-[4/5] min-h-0 shadow-[0_44px_130px_-70px_rgba(125,211,252,0.85)]"
        />
      </div>

      <ol class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <li v-for="item in rightStops" :key="item.performance.id" class="min-w-0">
          <button
            type="button"
            class="group relative grid w-full min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-center overflow-hidden border px-3 py-2.5 text-left transition"
            :class="routeButtonClass(item.performance.id)"
            style="clip-path: polygon(0 50%, 1.25rem 0, calc(100% - 0.75rem) 0, 100% 50%, calc(100% - 0.75rem) 100%, 1.25rem 100%)"
            @click="$emit('select', item.performance.id)"
          >
            <span class="text-center font-['Montserrat','sans-serif'] text-2xl text-[#f4d397]">
              {{ item.number }}
            </span>
            <span class="min-w-0 border-l border-[#d9b77c]/24 pl-3">
              <span class="block truncate font-serif text-xl leading-tight text-[#f3eadf]">
                {{ item.performance.city || performanceLabel(item.performance, item.index) }}
              </span>
              <span class="mt-1 block truncate text-xs text-[#d9b77c]">
                {{ formatLiveDate(item.performance.date) || performanceLabel(item.performance, item.index) }}
              </span>
            </span>
          </button>
        </li>
      </ol>
    </div>

    <p v-else class="rounded border border-dashed border-white/16 p-6 text-center text-sm text-[#b8c8d5]">
      {{ lang === 'ja' ? '公演情報はまだありません。' : '暂无巡演场次。' }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import LiveMainVisualPanel from '@/components/milet/live/LiveMainVisualPanel.vue'
import {
  formatLiveDate,
  performanceLabel,
  type LiveEventDetail,
  type LiveLang,
  type LivePerformance,
} from '@/composables/liveArchive'

const props = defineProps<{
  event: LiveEventDetail
  performances: LivePerformance[]
  selectedId: string
  title: string
  cityCount: number
  lang: LiveLang
}>()

defineEmits<{
  select: [id: string | number]
}>()

const routeStops = computed(() =>
  props.performances.map((performance, index) => ({
    performance,
    index,
    number: String(index + 1).padStart(2, '0'),
  })),
)
const splitIndex = computed(() => Math.ceil(routeStops.value.length / 2))
const leftStops = computed(() => routeStops.value.slice(0, splitIndex.value))
const rightStops = computed(() => routeStops.value.slice(splitIndex.value))

function routeButtonClass(id: string | number) {
  return props.selectedId === String(id)
    ? 'border-[#f4d397]/80 bg-[#d9b77c]/13 text-white shadow-[0_0_28px_-10px_rgba(244,211,151,0.88)]'
    : 'border-[#d9b77c]/36 bg-[#031322]/62 text-[#b8c8d5] hover:border-[#f4d397]/66 hover:bg-[#d9b77c]/8 hover:text-white'
}
</script>
