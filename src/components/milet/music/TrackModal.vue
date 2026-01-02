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

          <div class="px-4 py-3 text-xs text-slate-500">作词：xxx　作曲：yyy　编曲：zzz</div>

          <div class="px-4 pb-4">
            <div
              class="rounded-xl border border-slate-100 bg-slate-50 p-3 max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-6"
            >
              {{ lyrics }}
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

const lyrics = ref<string>('')

watch(
  () => props.open,
  async (v) => {
    if (!v || !props.track) return
    // TODO: 换成 API：GET /tracks/:id
    lyrics.value = '（这里加载歌词…）\n\n君は夜を越えて…\n...'
  },
)

const title = computed(() => props.track?.title ?? '')
</script>
