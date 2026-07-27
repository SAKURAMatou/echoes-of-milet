<template>
  <div
    v-if="hasItems"
    :class="
      viewMode === 'shelf'
        ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
        : 'space-y-3'
    "
  >
    <div
      v-for="(work, index) in works"
      :key="work.id"
      data-release-card
      :data-release-id="work.id"
      :data-page-scroll-anchor="`release-${work.id}`"
      :data-release-terminal="work.id === terminalWorkId ? 'true' : undefined"
      :data-terminal-pinned="work.id === pinnedTerminalWorkId ? 'true' : undefined"
      :data-release-passed="passedWorkIds.includes(work.id) ? 'true' : undefined"
      class="release-work-wrapper relative"
    >
      <WorkCard
        :work="work"
        :variant="index === 0 && viewMode === 'list' ? 'featured' : 'compact'"
        :expanded="expandedWorkId === work.id"
        :view-mode="viewMode"
        @toggle-expand="toggleExpand"
      />
      <span
        data-release-fold-sentinel
        :data-release-id="work.id"
        :data-release-terminal-read-sentinel="work.id === terminalWorkId ? 'true' : undefined"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        aria-hidden="true"
      />
    </div>
  </div>

  <div
    v-else
    class="rounded-lg border border-dashed border-sky-200/80 bg-white/54 px-5 py-10 text-center text-sm text-slate-500"
  >
    {{ emptyText }}
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import WorkCard from './WorkCard.vue'
import type { Work } from '@/composables/releaseType'

const props = withDefaults(
  defineProps<{
    works: Work[]
    viewMode?: 'list' | 'shelf'
    emptyText: string
    terminalWorkId?: string | null
    pinnedTerminalWorkId?: string | null
    passedWorkIds?: string[]
  }>(),
  {
    viewMode: 'list',
    terminalWorkId: null,
    pinnedTerminalWorkId: null,
    passedWorkIds: () => [],
  },
)

const emit = defineEmits<{
  (event: 'expanded-change', workId: string | null): void
}>()

const expandedWorkId = ref<string | null>(null)
const hasItems = computed(() => props.works.length > 0)

function toggleExpand(workId: string) {
  expandedWorkId.value = expandedWorkId.value === workId ? null : workId
  emit('expanded-change', expandedWorkId.value)
}

watch(
  () => props.works.map((work) => work.id).join(','),
  () => {
    if (expandedWorkId.value && !props.works.some((work) => work.id === expandedWorkId.value)) {
      expandedWorkId.value = null
      emit('expanded-change', null)
    }
  },
)

onBeforeUnmount(() => emit('expanded-change', null))
</script>
