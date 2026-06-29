<template>
  <section
    class="rounded-lg border border-[#d9b77c]/28 bg-[#061827]/78 p-5 shadow-[0_28px_90px_-64px_rgba(3,19,34,0.95)]"
  >
    <h2 class="font-['Montserrat','sans-serif'] text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
      Performance
    </h2>

    <dl class="mt-5 grid gap-4 text-[#f3eadf]">
      <div v-for="fact in facts" :key="fact.label" class="grid gap-1">
        <dt class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d9b77c]/85">
          {{ fact.label }}
        </dt>
        <dd class="text-lg leading-7">
          {{ fact.value }}
        </dd>
      </div>
    </dl>

    <p v-if="notes" class="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-[#b8c8d5]">
      {{ notes }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  formatLiveDate,
  performanceLabel,
  selectedPerformanceNotes,
  type LiveLang,
  type LivePerformance,
} from '@/composables/liveArchive'

const props = defineProps<{
  performance: LivePerformance | null
  lang: LiveLang
}>()

const facts = computed(() => {
  const performance = props.performance
  if (!performance) return []

  return [
    { label: 'Date', value: [formatLiveDate(performance.date), performanceLabel(performance)].filter(Boolean).join(' / ') },
    { label: 'Open / Start', value: [performance.openTime, performance.startTime].filter(Boolean).join(' / ') },
    { label: 'Venue', value: performance.venueName || performance.venueAddress || '' },
    { label: 'City', value: [performance.city, performance.region].filter(Boolean).join(', ') },
  ].filter((fact) => fact.value)
})

const notes = computed(() =>
  props.performance ? selectedPerformanceNotes(props.performance, props.lang) : '',
)
</script>
