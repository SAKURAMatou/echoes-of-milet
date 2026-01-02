<!-- src/components/milet/ReleaseSection.vue -->

<template>
  <section :id="anchorId" class="pt-5 md:pt-2">
    <header class="mb-6 md:mb-8">
      <div class="flex items-end justify-between gap-4">
        <div>
          <div class="text-xs tracking-[.18em] text-slate-500/80 select-none">RELEASES</div>
          <h2 class="mt-1 text-2xl md:text-3xl font-semibold">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
        </div>
      </div>
    </header>

    <WorkStack :works="works" />
  </section>
</template>
<script setup lang="ts">
import WorkStack from './WorkStack.vue'
import type { Work } from '@/composables/releaseType'

defineProps<{ title: string; subtitle?: string; works: Work[]; anchorId: string }>()
</script>
