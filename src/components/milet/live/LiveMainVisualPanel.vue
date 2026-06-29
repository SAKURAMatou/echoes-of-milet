<template>
  <figure
    class="relative overflow-hidden rounded-lg border border-[#d9b77c]/40 bg-[#061a2a] shadow-[0_28px_90px_-54px_rgba(64,126,170,0.92)]"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="imageAlt"
      class="h-full min-h-[18rem] w-full object-cover"
      :class="{ 'object-contain p-3': fitMode === 'contain' }"
    />
    <div
      v-else
      class="grid min-h-[18rem] place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(125,211,252,0.28),transparent_12rem),linear-gradient(135deg,#061827,#031322)] text-center"
    >
      <span class="font-serif text-4xl text-[#d9b77c]">Live Archive</span>
    </div>
    <figcaption
      v-if="credit"
      class="absolute bottom-3 right-3 rounded bg-[#031322]/72 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[#d8e8f3] backdrop-blur"
    >
      {{ credit }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { resolveLiveImageUrl, type LiveEventDetail, type LiveImage } from '@/composables/liveArchive'

const props = defineProps<{
  event: LiveEventDetail
}>()

const imageUrl = computed(() => resolveLiveImageUrl(props.event.mainVisual))
const visual = computed(() =>
  props.event.mainVisual && typeof props.event.mainVisual === 'object'
    ? (props.event.mainVisual as LiveImage)
    : null,
)
const imageAlt = computed(
  () => visual.value?.alt || props.event.mainVisualAlt || props.event.title || 'Live visual',
)
const credit = computed(() => visual.value?.credit || props.event.mainVisualCredit || '')
const fitMode = computed(() => visual.value?.fitMode || props.event.mainVisualFitMode || 'cover')
</script>
