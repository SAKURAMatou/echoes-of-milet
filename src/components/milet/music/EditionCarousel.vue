<!-- src/components/milet/EditionCarousel.vue -->
<template>
  <div class="rounded-xl border border-slate-200 bg-white flex flex-col h-full">
    <!-- 顶部：版本轮播控制（固定） -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-slate-100 shrink-0">
      <button
        class="h-8 w-8 rounded-lg hover:bg-slate-100 disabled:opacity-40"
        :disabled="idx === 0"
        @click="prev"
        aria-label="prev"
      >
        ‹
      </button>

      <div class="text-sm text-slate-700">
        <span class="font-medium">{{ editions[idx]?.editionName }}</span>
        <span class="text-slate-400 ml-2">({{ idx + 1 }}/{{ max }})</span>
      </div>

      <button
        class="h-8 w-8 rounded-lg hover:bg-slate-100 disabled:opacity-40"
        :disabled="idx === max - 1"
        @click="next"
        aria-label="next"
      >
        ›
      </button>
    </div>

    <!-- 只切换的内容区域 -->
    <div
      class="overflow-hidden flex-1 min-h-0"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="onPointerUp"
    >
      <div
        class="flex transition-transform duration-300 ease-out h-full"
        :class="dragging ? 'transition-none' : ''"
        :style="{ transform: translateX }"
      >
        <div
          v-for="ed in editions"
          :key="ed.id"
          class="w-full shrink-0 px-3 py-3 flex flex-col min-h-0"
        >
          <div class="text-xs text-slate-500 flex gap-4 shrink-0">
            <div>発売日：{{ ed.releaseDate }}</div>
            <div>収録：{{ ed.discs.length }} Disc</div>
          </div>

          <div class="mt-3 space-y-3 overflow-y-auto flex-1 min-h-0">
            <div v-for="disc in ed.discs" :key="disc.id">
              <div class="text-sm font-medium text-slate-700">
                Disc {{ disc.no }}
                <span v-if="disc.title" class="text-slate-400">· {{ disc.title }}</span>
              </div>

              <div class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
                <button
                  v-for="t in disc.tracks"
                  :key="t.id"
                  class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                  @click="emit('select-track', t)"
                >
                  <div class="min-w-0">
                    <span class="text-slate-500 mr-2">{{ String(t.no).padStart(2, '0') }}</span>
                    <span class="truncate">{{ t.title }}</span>
                  </div>
                  <div class="text-xs text-slate-400 ml-3">
                    {{
                      t.durationSec
                        ? `${Math.floor(t.durationSec / 60)}:${String(t.durationSec % 60).padStart(2, '0')}`
                        : ''
                    }}
                    <span class="ml-2">›</span>
                  </div>
                </button>
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
import { useSwipe } from '@/composables/useSwipe'
import type { ReleaseEdition, Track } from '@/composables/releaseType'

const props = defineProps<{ editions: ReleaseEdition[] }>()
const emit = defineEmits<{ (e: 'select-track', t: Track): void }>()

const idx = ref(0)
const max = computed(() => props.editions.length)

const { dx, dragging, onPointerDown, onPointerMove, onPointerUp } = useSwipe()

const translateX = computed(() => {
  // 拖动时跟随手指一点点移动（扁平化，别做 3D）
  const drag = dragging.value ? dx.value : 0
  return `translateX(calc(${-idx.value * 100}% + ${drag}px))`
})

function prev() {
  if (idx.value > 0) idx.value--
}
function next() {
  if (idx.value < max.value - 1) idx.value++
}

function handlePointerUp() {
  // 阈值：容器宽度的约 25%（这里用 px 简化，实际可读 clientWidth）
  const threshold = 80
  if (dx.value > threshold) prev()
  else if (dx.value < -threshold) next()
  onPointerUp()
}

watch(
  () => props.editions,
  () => {
    idx.value = 0
  },
)
</script>
