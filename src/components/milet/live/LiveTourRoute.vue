<template>
  <section class="rounded-lg border border-[#86bde6]/24 bg-[#041827]/72 p-5 shadow-[0_28px_90px_-64px_rgba(35,104,149,0.95)]">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
      <div>
        <p class="font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
          Tour Route
        </p>
        <h2 class="mt-2 font-serif text-3xl leading-none text-[#f3eadf]">
          {{ title }}
        </h2>
      </div>
      <div class="grid grid-cols-2 gap-3 text-right text-xs text-[#b8c8d5]">
        <div>
          <span class="block font-['Montserrat','sans-serif'] text-lg font-semibold text-[#f3eadf]">{{ performances.length }}</span>
          <span>{{ lang === 'ja' ? 'Shows' : '场次' }}</span>
        </div>
        <div>
          <span class="block font-['Montserrat','sans-serif'] text-lg font-semibold text-[#f3eadf]">{{ cityCount }}</span>
          <span>{{ lang === 'ja' ? 'Cities' : '城市' }}</span>
        </div>
      </div>
    </div>

    <ol v-if="performances.length" class="relative mt-5 grid gap-3 md:grid-cols-2 md:gap-x-5">
      <li
        v-for="(performance, index) in performances"
        :key="performance.id"
        class="min-w-0"
        :class="index % 2 === 1 ? 'md:mt-6' : ''"
      >
        <button
          type="button"
          class="group grid w-full min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] gap-3 rounded-lg border p-3 text-left transition"
          :class="
            selectedId === String(performance.id)
              ? 'border-[#d9b77c]/75 bg-[#d9b77c]/10 text-white shadow-[0_20px_52px_-38px_rgba(217,183,124,0.9)]'
              : 'border-white/10 bg-white/[0.025] text-[#b8c8d5] hover:border-[#86bde6]/42 hover:bg-white/[0.055] hover:text-white'
          "
          @click="$emit('select', performance.id)"
        >
          <span
            class="grid size-11 place-items-center rounded-md border font-['Montserrat','sans-serif'] text-xs font-semibold"
            :class="selectedId === String(performance.id) ? 'border-[#d9b77c]/60 text-[#d9b77c]' : 'border-white/14 text-[#91a9ba]'"
          >
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="min-w-0">
            <span class="block truncate font-serif text-2xl leading-none text-[#f3eadf]">
              {{ performance.city || performanceLabel(performance, index) }}
            </span>
            <span class="mt-1 block truncate text-xs text-[#d9b77c]">
              {{ formatLiveDate(performance.date) || performanceLabel(performance, index) }}
            </span>
            <span class="mt-2 block truncate text-sm">
              {{ performance.venueName || performance.region || '-' }}
            </span>
          </span>
        </button>
      </li>
    </ol>

    <p v-else class="mt-5 rounded border border-dashed border-white/16 p-6 text-center text-sm text-[#b8c8d5]">
      {{ lang === 'ja' ? '公演情報はまだありません。' : '暂无巡演场次。' }}
    </p>
  </section>
</template>

<script setup lang="ts">
import {
  formatLiveDate,
  performanceLabel,
  type LiveLang,
  type LivePerformance,
} from '@/composables/liveArchive'

defineProps<{
  performances: LivePerformance[]
  selectedId: string
  title: string
  cityCount: number
  lang: LiveLang
}>()

defineEmits<{
  select: [id: string | number]
}>()
</script>
