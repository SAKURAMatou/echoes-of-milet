<template>
  <section :id="sectionId || undefined" class="mt-16 scroll-mt-24">
    <MiletHomeSectionTitle :kicker="title.kicker" :title="title.title" :subtitle="title.subtitle" />

    <div
      class="relative mt-8 overflow-hidden rounded-lg border border-white/70 bg-white/58 px-5 py-8 shadow-[0_18px_54px_-44px_rgba(31,41,55,0.8)] backdrop-blur"
    >
      <div class="pointer-events-none absolute left-7 top-8 h-[calc(100%-4rem)] w-2">
        <div
          class="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(to_bottom,rgba(49,127,141,0.24)_0,rgba(49,127,141,0.24)_10px,transparent_10px,transparent_18px)]"
        ></div>
        <div
          class="absolute -top-4 left-[-6px] h-0 w-0 border-b-[14px] border-l-[10px] border-r-[10px] border-b-[#6baeba] border-l-transparent border-r-transparent"
        ></div>
      </div>

      <ol class="space-y-7 pl-8">
        <li v-for="item in timeline.items" :key="item.id" class="relative">
          <div
            class="absolute left-[-20px] top-8 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white shadow-sm"
            :class="timelineColor(item.color).dot"
          ></div>

          <div
            class="group block rounded-lg border border-transparent px-4 py-3 transition duration-200 hover:border-white/80 hover:bg-white/62 hover:shadow-sm"
          >
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
              <time
                class="min-w-[86px] text-sm font-semibold tabular-nums"
                :class="timelineColor(item.color).time"
              >
                {{ item.dateLabel }}
              </time>
              <div>
                <h3 class="mt-1 text-base font-bold" :class="timelineColor(item.color).title">
                  {{ item.title }}
                </h3>
                <p class="mt-3 text-sm leading-7 text-black/70">{{ item.body }}</p>
              </div>
            </div>
          </div>
        </li>
      </ol>

      <div class="mt-8 pl-8 text-center">
        <RouterLink
          :to="timeline.moreTo"
          class="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/70 bg-[linear-gradient(90deg,rgba(255,255,255,0.82),rgba(238,248,250,0.76),rgba(255,255,255,0.82))] px-5 text-sm font-semibold text-[#317f8d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:w-auto"
        >
          {{ timeline.moreLabel }}
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MiletHomeSectionTitle from './MiletHomeSectionTitle.vue'
import type {
  MiletHomeSectionTitleView,
  MiletHomeTimelineViewSection,
  TimelineColor,
} from './types'

withDefaults(
  defineProps<{
    title: MiletHomeSectionTitleView
    timeline: MiletHomeTimelineViewSection
    sectionId?: string | null
  }>(),
  {
    sectionId: 'timeline',
  },
)

const timelineColorMap = {
  blue: {
    dot: 'bg-sky-500/90',
    title: 'text-sky-800',
    time: 'text-sky-700/80',
  },
  pink: {
    dot: 'bg-pink-500/90',
    title: 'text-pink-800',
    time: 'text-pink-700/80',
  },
  green: {
    dot: 'bg-emerald-500/90',
    title: 'text-emerald-800',
    time: 'text-emerald-700/80',
  },
  violet: {
    dot: 'bg-violet-500/90',
    title: 'text-violet-800',
    time: 'text-violet-700/80',
  },
  yellow: {
    dot: 'bg-yellow-400/90',
    title: 'text-yellow-800',
    time: 'text-yellow-700/80',
  },
  orange: {
    dot: 'bg-orange-400/90',
    title: 'text-orange-800',
    time: 'text-orange-700/80',
  },
} as const

function timelineColor(color: TimelineColor) {
  return timelineColorMap[color] ?? timelineColorMap.blue
}
</script>
