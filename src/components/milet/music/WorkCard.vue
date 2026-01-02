<template>
  <article
    class="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur transition-[transform,opacity,filter] duration-150"
    :style="styleCard"
  >
    <div class="pointer-events-none absolute inset-0" />
    <div
      class="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-slate-200/30 blur-2xl"
    />
    <div
      class="pointer-events-none absolute -left-28 -bottom-28 h-72 w-72 rounded-full bg-slate-200/20 blur-2xl"
    />

    <div class="h-full p-4 flex flex-col">
      <div class="flex gap-4 md:gap-6 shrink-0">
        <div class="shrink-0">
          <div class="h-20 w-20 md:h-28 md:w-28 overflow-hidden rounded-xl bg-slate-200">
            <img
              v-if="work.coverUrl"
              :src="work.coverUrl"
              :alt="work.title"
              class="h-full w-full object-cover transition-transform duration-150"
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

          <p class="mt-2 text-sm text-slate-500 line-clamp-2">
            {{ work.editions?.length || 0 }} editions ·
            {{ work.editions?.[0]?.discs?.reduce((s, d) => s + d.tracks.length, 0) || 0 }}
            tracks (first edition)
          </p>
        </div>
      </div>

      <div
        class="mt-4 transition-opacity duration-150 flex-1 min-h-0"
        :style="{ opacity: String(Math.max(0, (normalizedProgress - 0.15) / 0.25)) }"
      >
        <EditionCarousel :editions="work.editions" @select-track="openTrack" />
      </div>
    </div>
    <TrackModal :open="modalOpen" :track="modalTrack" @close="modalOpen = false" />
  </article>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import EditionCarousel from './EditionCarousel.vue'
import type { Work, Track } from '@/composables/releaseType'
import TrackModal from './TrackModal.vue'

const modalOpen = ref(false)
const modalTrack = ref<Track | null>(null)
const props = defineProps<{
  work: Work
  progress: number
  nextProgress: number
  stackIndex: number
}>()

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const normalizedProgress = computed(() => clamp(props.progress))
const nextProgress = computed(() => clamp(props.nextProgress ?? 0))

const appear = computed(() => clamp((normalizedProgress.value - 0.1) / 0.9))
const covered = computed(() => nextProgress.value)

const scale = computed(() => 1 - covered.value * 0.06)
const lift = computed(() => (1 - appear.value) * 24 - covered.value * 12)
const opacity = computed(() => Math.max(0.3, 1 - covered.value * 0.75))
const blur = computed(() => covered.value * 8)

const styleCard = computed(() => ({
  transform: `translateY(${lift.value}px) scale(${scale.value})`,
  opacity: opacity.value,
  filter: `saturate(${1 + appear.value * 0.04}) blur(${blur}px)`,
}))

const typeLabel = computed(() => props.work.releaseType ?? 'RELEASE')

function openTrack(t: Track) {
  modalTrack.value = t
  modalOpen.value = true
}
</script>
