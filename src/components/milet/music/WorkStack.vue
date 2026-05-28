<template>
  <div
    v-if="hasItems"
    :class="
      viewMode === 'shelf'
        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
        : 'space-y-3'
    "
  >
    <WorkCard
      v-for="(work, index) in works"
      :key="work.id"
      :work="work"
      :variant="index === 0 && viewMode === 'list' ? 'featured' : 'compact'"
      :expanded="expandedWorkId === work.id"
      :view-mode="viewMode"
      @toggle-expand="toggleExpand"
    />
  </div>

  <div v-else class="rounded-lg border border-dashed border-sky-200/80 bg-white/54 px-5 py-10 text-center text-sm text-slate-500">
    {{ emptyText }}
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WorkCard from './WorkCard.vue'
import type { Work } from '@/composables/releaseType'

const props = withDefaults(
  defineProps<{
    works: Work[]
    viewMode?: 'list' | 'shelf'
    emptyText: string
  }>(),
  {
    viewMode: 'list',
  },
)

const expandedWorkId = ref<string | null>(null)
const hasItems = computed(() => props.works.length > 0)

function toggleExpand(workId: string) {
  expandedWorkId.value = expandedWorkId.value === workId ? null : workId
}

watch(
  () => props.works.map((work) => work.id).join(','),
  () => {
    if (expandedWorkId.value && !props.works.some((work) => work.id === expandedWorkId.value)) {
      expandedWorkId.value = null
    }
  },
)
</script>
