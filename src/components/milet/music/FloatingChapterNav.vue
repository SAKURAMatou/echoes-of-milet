<!-- components/FloatingChapterNav.vue  个性化浮动胶囊-->

<template>
  <div class="fixed right-3 md:right-6 top-[90px] md:top-[110px] z-[300]">
    <div class="flex flex-col items-end gap-2">
      <!-- 主胶囊 -->
      <!-- <button
        class="max-md:hidden rounded-full border bg-white/80 backdrop-blur px-3 py-2 shadow-sm hover:bg-white"
        @click="toggle"
      >
        <div class="text-xs text-slate-500 leading-none">Chapter</div>
        <div class="text-sm font-medium leading-snug">
          {{ chapters[current]?.title }}
        </div>
      </button> -->

      <!-- 二级：地图入口 -->
      <button
        class="md:hidden rounded-full border bg-white/80 backdrop-blur px-3 py-2 shadow-sm hover:bg-white text-sm"
        @click="emit('open-map')"
      >
        Stack Map
      </button>

      <!-- 展开列表 -->
      <!-- <div
        v-if="open"
        class="w-[220px] rounded-2xl border bg-white/90 backdrop-blur shadow-lg overflow-hidden"
      >
        <button
          v-for="(c, idx) in chapters"
          :key="c.key"
          class="w-full text-left px-4 py-3 hover:bg-slate-50"
          :class="idx === current ? 'bg-slate-50' : ''"
          @click="jump(c.anchorId, idx)"
        >
          <div class="text-sm font-medium">{{ c.title }}</div>
          <div class="text-xs text-slate-500">{{ c.subtitle }}</div>
        </button>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ref, onMounted, onUnmounted } from 'vue'

// type Chapter = { key: string; title: string; subtitle?: string; anchorId: string }

// const props = defineProps<{ chapters: Chapter[] }>()
const emit = defineEmits<{
  (e: 'jump', anchorId: string): void
  (e: 'open-map'): void
}>()

// const open = ref(false)
// const current = ref(0)
// let scrollContainer: Element | null | Window = null

// function toggle() {
//   open.value = !open.value
// }
// function jump(anchorId: string, idx: number) {
//   current.value = idx
//   open.value = false
//   emit('jump', anchorId)
// }

// // 轻量：滚动时根据章节的 DOM 顶部位置粗略更新 current（不依赖顶部Tab）
// function onScroll() {
//   if (!scrollContainer) return

//   let scrollY = 0
//   if (scrollContainer === window) {
//     // window 特殊处理
//     scrollY = window.scrollY
//   } else {
//     // Element 容器
//     scrollY = (scrollContainer as Element).scrollTop
//   }

//   const mid = scrollY + window.innerHeight * 0.35
//   let best = 0

//   props.chapters.forEach((c, idx) => {
//     const el = document.getElementById(c.anchorId)
//     if (!el) return
//     const top = el.getBoundingClientRect().top + scrollY
//     if (top <= mid) best = idx
//   })

//   current.value = best
// }

// onMounted(() => {
//   // 找到最近的 overflow-y-auto 容器（可能是父组件或祖先）
//   scrollContainer = document.querySelector('.flex-1.overflow-y-auto') || window

//   if (scrollContainer) {
//     scrollContainer.addEventListener('scroll', onScroll, { passive: true })
//     // 初始化一次
//     onScroll()
//   }
// })

// onUnmounted(() => {
//   if (scrollContainer) {
//     scrollContainer.removeEventListener('scroll', onScroll)
//   }
// })
</script>
