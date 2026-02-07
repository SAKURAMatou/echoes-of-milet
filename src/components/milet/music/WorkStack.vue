<template>
  <div v-if="hasItems" class="relative overflow-visible">
    <div
      v-for="(work, index) in props.works"
      :key="work.id"
      class="relative h-[80vh]"
      :style="getStackItemStyle(index)"
    >
      <div class="absolute inset-x-0 top-0 h-full" :ref="(el) => setTrackEl(el as any, index)" />
      <div class="sticky ttop-0 h-full">
        <WorkCard
          :work="work"
          :progress="progresses[index] ?? 0"
          :next-progress="progresses[index + 1] ?? 0"
          :stack-index="index"
        />
      </div>
    </div>

    <div class="h-[10vh]" />
  </div>

  <div v-else class="py-10 text-slate-500">no data</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import WorkCard from './WorkCard.vue'
import type { Work, Track } from '@/composables/releaseType'

const props = defineProps<{ works: Work[] }>()

const hasItems = computed(() => props.works.length > 0)
const progresses = ref<number[]>([])
const trackEls = ref<HTMLElement[]>([])
const rafId = ref<number | null>(null)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 0)

const overlapOffset = 0 // 单位是 vh，数值越大重叠区域越高

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const setTrackEl = (el: HTMLElement | null, index: number) => {
  trackEls.value[index] = el ?? ({} as HTMLElement)
  scheduleUpdate()
}

const updateProgress = () => {
  const list = props.works.map((_, index) => {
    const el = trackEls.value[index]
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    if (!rect.height) return 0
    const raw = (viewportHeight.value - rect.top) / rect.height
    return clamp(raw)
  })
  progresses.value = list
  rafId.value = null
}

const scheduleUpdate = () => {
  if (rafId.value === null) {
    rafId.value = requestAnimationFrame(updateProgress)
  }
}

const onScroll = () => scheduleUpdate()
const onResize = () => {
  viewportHeight.value = typeof window !== 'undefined' ? window.innerHeight : viewportHeight.value
  scheduleUpdate()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
  }
  scheduleUpdate()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
  }
  if (rafId.value) {
    cancelAnimationFrame(rafId.value)
  }
})

watch(
  () => props.works.length,
  (len) => {
    trackEls.value.length = len
    progresses.value.length = len
    scheduleUpdate()
  },
  { immediate: true },
)

const getStackItemStyle = (index: number) => {
  const style: Record<string, string> = {
    zIndex: `${10 + index}`,
  }
  if (index > 0) {
    style.marginTop = `-${overlapOffset}vh`
  }
  return style
}
</script>
