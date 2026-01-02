<!-- src/components/milet/WorkCard.vue -->
<template>
  <article
    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur transition duration-200"
    :class="active ? 'shadow-lg' : 'shadow-sm opacity-95 scale-[0.985]'"
  >
    <!-- 背景弱装饰（可删） -->
    <div
      class="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-slate-200/30 blur-2xl"
    />

    <div class="p-4 md:p-6">
      <div class="flex gap-4 md:gap-6">
        <div class="shrink-0">
          <div class="h-20 w-20 md:h-28 md:w-28 overflow-hidden rounded-xl bg-slate-200">
            <img
              v-if="work.coverUrl"
              :src="work.coverUrl"
              :alt="work.title"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex rounded-full border px-2 py-0.5 text-xs text-slate-600">
              {{ typeLabel }}
            </span>
          </div>

          <h3 class="mt-1 text-lg md:text-xl font-semibold leading-snug truncate">
            {{ work.title }}
          </h3>
          <p class="mt-0.5 text-sm text-slate-600 truncate">{{ work.artist }}</p>

          <!-- 摘要行：堆叠时要短 -->
          <p class="mt-2 text-sm text-slate-500 line-clamp-2">
            {{ work.editions?.length || 0 }} editions ·
            {{ work.editions?.[0]?.discs?.reduce((s, d) => s + d.tracks.length, 0) || 0 }} tracks
            (first edition)
          </p>
        </div>
      </div>

      <!-- Edition 轮播：你原组件继续用 -->
      <div class="mt-4">
        <EditionCarousel :editions="work.editions" />
      </div>

      <div class="mt-4 flex items-center justify-end gap-2">
        <button class="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">详情</button>
        <button class="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">曲目</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import EditionCarousel from './EditionCarousel.vue'
import TrackModal from './TrackModal.vue'
import type { Track, Work } from '@/composables/releaseType'

const props = defineProps<{
  work: Work
  active: boolean
  stackIndex: number
}>()
const typeLabel = computed(() => {
  switch (props.work.releaseType) {
    case 'ALBUM':
      return 'Album'
    case 'EP':
      return 'EP'
    case 'SINGLE':
      return 'Single'
    case 'LIVE_BD':
      return 'Live BD'
    case 'LIVE_DVD':
      return 'Live DVD'
    default:
      return props.work.releaseType
  }
})

const modalOpen = ref(false)
const modalTrack = ref<Track | null>(null)

function openTrack(t: Track) {
  modalTrack.value = t
  modalOpen.value = true
}
</script>
