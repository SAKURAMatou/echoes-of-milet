<template>
  <div
    v-if="performances.length > 1"
    class="grid gap-2 rounded-lg border border-[#86bde6]/30 bg-[#041827]/70 p-1.5 shadow-[0_20px_70px_-54px_rgba(125,211,252,0.75)] sm:grid-cols-2 lg:grid-cols-3"
  >
    <button
      v-for="(performance, index) in performances"
      :key="performance.id"
      type="button"
      class="flex min-h-16 min-w-0 items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition"
      :class="
        selectedId === String(performance.id)
          ? 'border-[#9fd4ff]/80 bg-[#09243a] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_40px_-34px_rgba(159,212,255,0.9)]'
          : 'border-transparent text-[#b8c8d5] hover:border-[#d9b77c]/32 hover:bg-white/5 hover:text-white'
      "
      @click="$emit('select', performance.id)"
    >
      <span class="min-w-0">
        <span class="block truncate font-serif text-xl leading-none">
          {{ formatLiveDate(performance.date) || performanceLabel(performance, index) }}
        </span>
        <span class="mt-1 block truncate text-xs font-semibold uppercase tracking-[0.13em] text-[#d9b77c]">
          {{ performanceLabel(performance, index) }}
        </span>
      </span>
      <span v-if="selectedId === String(performance.id)" class="text-[#d9b77c]" aria-hidden="true">
        ✦
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  formatLiveDate,
  performanceLabel,
  type LivePerformance,
} from '@/composables/liveArchive'

defineProps<{
  performances: LivePerformance[]
  selectedId: string
}>()

defineEmits<{
  select: [id: string | number]
}>()
</script>
