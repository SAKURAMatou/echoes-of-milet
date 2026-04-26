<!-- components/StackMapDrawer.vue -->

<template>
  <div v-if="open" class="fixed inset-0 z-[500]">
    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-black/30" @click="emit('close')" />

    <!-- 抽屉 -->
    <div class="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl border p-4 md:p-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs tracking-[.18em] text-slate-500/80">STACK MAP</div>
          <div class="text-lg font-semibold mt-1">{{ pageText.stackMap.desc }}</div>
        </div>
        <button
          class="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
          @click="emit('close')"
        >
          {{ pageText.stackMap.close }}
        </button>
      </div>

      <div class="mt-4 grid gap-3">
        <button
          v-for="c in chapters"
          :key="c.key"
          class="w-full rounded-2xl border p-3 hover:bg-slate-50 text-left"
          @click="emit('jump', c.anchorId)"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-base font-medium">{{ c.title }}</div>
              <div class="text-xs text-slate-500">{{ pageText.stackMap.action }}</div>
            </div>

            <!-- 右侧缩略封面堆叠 -->
            <div class="relative h-10 w-24 shrink-0">
              <div
                v-for="(cv, i) in c.covers.slice(0, 4)"
                :key="cv.id"
                class="absolute top-0 h-10 w-10 overflow-hidden rounded-lg border bg-slate-200"
                :style="{ right: `${i * 12}px`, zIndex: 10 + i }"
                :title="cv.title"
              >
                <img v-if="cv.coverUrl" :src="cv.coverUrl" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </button>
      </div>

      <div class="h-2" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { getCurrentInstance, computed } from 'vue'
import { RELEASE_PAGE_TEXT } from '@/composables/lang/ReleaseMetaData'
const pageText = computed(() => {
  const lang = global.$lang?.lang ? global.$lang.lang : 'zh'
  return RELEASE_PAGE_TEXT[lang]
})
const { appContext } = getCurrentInstance()
const global = appContext.config.globalProperties

type CoverItem = { id: string; coverUrl?: string; title: string }
type Chapter = { key: string; title: string; anchorId: string; covers: CoverItem[] }

const props = defineProps<{ open: boolean; chapters: Chapter[] }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'jump', anchorId: string): void
}>()
</script>
