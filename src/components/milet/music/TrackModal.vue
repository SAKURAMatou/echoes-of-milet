<!-- src/components/milet/TrackModal.vue -->
<template>
  <teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[999]">
      <div class="absolute inset-0 bg-slate-900/30" @click="emit('close')"></div>

      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-2xl rounded-2xl bg-white border border-slate-200">
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div class="font-semibold truncate">{{ title }}</div>
            <button class="h-8 w-8 rounded-lg hover:bg-slate-100" @click="emit('close')">✕</button>
          </div>

          <div class="px-4 py-3 text-xs text-slate-500 flex flex-col gap-1.5">
            <div class="flex gap-2">
              <span>演唱：{{ track.singer }}</span
              ><span>作词：{{ track.lyricists }}</span> <span> 作曲：{{ track.composers }} </span
              ><span v-if="track.arrangers">编曲：{{ track.arrangers }}</span>
            </div>
            <div class="">
              <span>首发日：{{ track.recorded_at }}</span>
            </div>
          </div>

          <div class="px-4 pb-4">
            <div
              class="rounded-xl border border-slate-100 bg-slate-50 p-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-6"
            >
              {{ track.lyric }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { Track } from '@/composables/releaseType'

const props = defineProps<{ open: boolean; track: Track | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

// watch(
//   () => props.open,
//   async (v) => {
//     if (!v || !props.track) return
//     // TODO: 换成 API：GET /tracks/:id
//     lyrics.value = '（这里加载歌词…）\n\n君は夜を越えて…\n...'
//   },
// )

const title = computed(() => props.track?.title ?? '')
</script>
