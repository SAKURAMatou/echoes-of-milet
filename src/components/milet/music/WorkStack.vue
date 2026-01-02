<!-- components/WorkStack.vue -->

<template>
  <div v-if="hasItems" class="relative">
    <div
      v-for="(w, i) in works"
      :key="w.id"
      class="relative min-h-[92vh] md:min-h-[96vh]"
      :style="{ zIndex: 10 + i }"
    >
      <!-- 这个“轨道”元素用于 IO 检测：进入到一定比例才认为 active -->
      <div
        class="absolute inset-x-0 top-0 h-[110vh] pointer-events-none"
        :ref="(el) => setItemEl(el as any, i)"
      />

      <!-- 卡片本体：sticky 同一个 top，后出现的卡片 z 更高 -> 叠上来 -->
      <div class="sticky top-[88px] md:top-[96px]">
        <WorkCard :work="w" :active="i === activeIndex" :stack-index="i" />
      </div>
    </div>

    <!-- 结尾留一点空间，让最后一张卡也有“停住”的感觉 -->
    <div class="h-[30vh]" />
  </div>

  <div v-else class="py-10 text-slate-500">暂无数据</div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import WorkCard from '@/components/milet/music/WorkCard.vue'
import type { Work } from '@/composables/releaseType'
import { useActiveIndex } from '@/composables/useActiveIndex'

const props = defineProps<{ works: Work[] }>()

const itemEls = ref<HTMLElement[]>([])
function setItemEl(el: Element | null, idx: number) {
  if (!el) return
  itemEls.value[idx] = el as HTMLElement
}

const { activeIndex, observe } = useActiveIndex({ threshold: 0.55 })

onMounted(() => {
  observe(itemEls)
})

watch(
  () => props.works,
  () => {
    // works 变更后重新 observe
    observe(itemEls)
  },
)

const hasItems = computed(() => props.works && props.works.length > 0)
</script>
