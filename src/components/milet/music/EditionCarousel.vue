<template>
  <div class="relation h-full">
    <div
      v-if="editions[idx]?.coverUrl"
      class="absolute inset-0 bg-cover bg-center opacity-6 transition-opacity duration-300"
      :style="{ backgroundImage: `url('${initImgUrl(editions[idx]?.coverUrl)}')` }"
    ></div>

    <div class="z-10 flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div
        class="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2"
      >
        <button
          class="h-8 w-8 rounded-lg text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
          :disabled="idx === 0"
          aria-label="prev"
          @click="prev"
        >
          ‹
        </button>

        <div class="text-sm text-slate-700">
          <span class="font-medium">{{ editions[idx]?.editionName }}</span>
          <span class="ml-2 text-slate-400">({{ idx + 1 }}/{{ max }})</span>
        </div>

        <button
          class="h-8 w-8 rounded-lg text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
          :disabled="idx === max - 1"
          aria-label="next"
          @click="next"
        >
          ›
        </button>
      </div>

      <div class="flex-1 overflow-hidden min-h-0">
        <div
          class="relative flex h-full transition-transform duration-300 ease-out"
          :class="dragging ? 'transition-none' : ''"
          :style="{ transform: translateX }"
        >
          <div
            v-for="ed in editions"
            :key="ed.id"
            class="flex min-h-0 w-full shrink-0 flex-col px-3 py-3"
          >
            <div class="flex shrink-0 gap-4 text-xs text-slate-500">
              <div>{{ ed.discs.length }} Disc</div>
            </div>

            <div
              class="mt-3 flex-1 min-h-0 space-y-3 overflow-y-auto [touch-action:pan-y]"
              :class="{ 'select-none': interactionActive }"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerEnd"
              @pointercancel="handlePointerEnd"
            >
              <div v-for="disc in ed.discs" :key="disc.id">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-medium text-slate-700">
                    Disc {{ disc.no }}
                    <span v-if="disc.title" class="text-slate-400">· {{ disc.title }}</span>
                  </div>
                  <div class="text-sm text-slate-400">({{ disc.tracks.length }} tracks)</div>
                </div>

                <div class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  <div
                    v-for="t in disc.tracks"
                    :key="t.showId"
                    class="flex w-full items-stretch justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div
                      class="scrollbar-none flex min-w-0 flex-1 items-center overflow-x-auto overscroll-x-contain px-1 py-2 [touch-action:pan-y]"
                      data-inline-scroll
                    >
                      <span class="mr-2 shrink-0 text-slate-500">
                        {{ String(t.no).padStart(2, '0') }}
                      </span>
                      <span class="whitespace-nowrap">{{ t.title }}</span>
                    </div>

                    <button
                      class="mx-1 flex shrink-0 items-center justify-center rounded-xl px-3 text-xs text-slate-400 transition-colors hover:bg-slate-200 max-md:bg-slate-200"
                      @click="emit('select-track', t)"
                    >
                      {{
                        t.durationSec
                          ? `${Math.floor(t.durationSec / 60)}:${String(t.durationSec % 60).padStart(2, '0')}`
                          : 'detail'
                      }}
                      <span class="ml-1 text-xs text-slate-400">›</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { initImgUrl } from '@/composables/ImgUrlUtil'
import { useSwipe } from '@/composables/useSwipe'
import type { ReleaseEdition, Track } from '@/composables/releaseType'

const props = defineProps<{ editions: ReleaseEdition[] }>()
const emit = defineEmits<{ (e: 'select-track', t: Track): void }>()

const idx = ref(0)
const max = computed(() => props.editions.length)

const translateX = computed(() => {
  const drag = dragging.value ? dx.value : 0
  return `translateX(calc(${-idx.value * 100}% + ${drag}px))`
})

function prev() {
  if (idx.value > 0) idx.value--
}

function next() {
  if (idx.value < max.value - 1) idx.value++
}
const {
  dx,
  dragging,
  interactionActive,
  handlePointerDown,
  handlePointerMove,
  handlePointerEnd,
  reset,
} = useSwipe({
  onSwipeLeft: next,
  onSwipeRight: prev,
})

watch(
  () => props.editions,
  () => {
    idx.value = 0
    reset()
  },
)
</script>
