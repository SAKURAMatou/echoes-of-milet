<template>
  <section
    class="rounded-lg border border-[#d9b77c]/28 bg-[#061827]/78 p-5 shadow-[0_28px_90px_-64px_rgba(3,19,34,0.95)]"
  >
    <h2 class="font-['Montserrat','sans-serif'] text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b77c]">
      Performance
    </h2>

    <dl class="mt-5 grid gap-4 text-[#f3eadf]">
      <div v-for="fact in facts" :key="fact.label" class="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
        <span
          class="mt-0.5 grid size-10 place-items-center text-[#d9b77c]"
          aria-hidden="true"
        >
          <svg
            v-if="fact.icon === 'calendar'"
            class="size-[1.45rem]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
          <svg
            v-else-if="fact.icon === 'clock'"
            class="size-[1.45rem]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <svg
            v-else-if="fact.icon === 'venue'"
            class="size-[1.45rem]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 20h16" />
            <path d="M6 20V9l6-4 6 4v11" />
            <path d="M9 20v-6h6v6" />
            <path d="M9 10h6" />
          </svg>
          <svg
            v-else
            class="size-[1.45rem]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
        </span>
        <div class="min-w-0">
          <dt class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d9b77c]/85">
            {{ fact.label }}
          </dt>
          <dd class="mt-1 break-words text-lg leading-7">
            <a
              v-if="fact.href"
              :href="fact.href"
              target="_blank"
              rel="noopener noreferrer"
              class="underline decoration-[#d9b77c]/45 underline-offset-4 transition hover:text-[#9fd4ff] hover:decoration-[#9fd4ff]"
            >
              {{ fact.value }}
            </a>
            <template v-else>{{ fact.value }}</template>
          </dd>
        </div>
      </div>
    </dl>

    <img
      v-if="venueLineArtUrl"
      :src="venueLineArtUrl"
      alt=""
      loading="lazy"
      decoding="async"
      class="mt-4 max-h-40 w-full rounded-md border border-[#d9b77c]/16 bg-white/[0.03] object-contain p-3"
    />

    <p v-if="notes" class="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-[#b8c8d5]">
      {{ notes }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  formatLiveDate,
  normalizeExternalUrl,
  performanceLabel,
  resolveVenueLineArtUrl,
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
    {
      icon: 'calendar',
      label: 'Date',
      value: [formatLiveDate(performance.date), performanceLabel(performance)].filter(Boolean).join(' / '),
    },
    {
      icon: 'clock',
      label: 'Open / Start',
      value: [performance.openTime, performance.startTime].filter(Boolean).join(' / '),
    },
    {
      icon: 'venue',
      label: 'Venue',
      value: performance.venueName || performance.venueAddress || '',
      href: performance.venueName ? normalizeExternalUrl(performance.venueOfficialUrl) : '',
    },
    { icon: 'city', label: 'City', value: [performance.city, performance.region].filter(Boolean).join(', ') },
  ].filter((fact) => fact.value)
})

const venueLineArtUrl = computed(() => resolveVenueLineArtUrl(props.performance))

const notes = computed(() =>
  props.performance ? selectedPerformanceNotes(props.performance, props.lang) : '',
)
</script>
