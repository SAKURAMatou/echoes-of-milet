<template>
  <div class="relative">
    <button
      v-if="isClientReady"
      v-show="isShow"
      :style="{ opacity: opacityValue }"
      @click="scrollToTop"
      class="bg-blue-500 text-white rounded-lg shadow-lg opacity-0 transition-opacity duration-300 z-50 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="48px"
        width="48px"
        viewBox="0 -960 960 960"
        fill="#FFFFFF"
      >
        <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
      </svg>
    </button>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isShow = ref(false)
const opacityValue = ref(0)
const isClientReady = ref(false)
let scrollElement = null

const findScrollElement = () => {
  // 查找可滚动的容器（通常是 overflow-y-auto 的元素）
  const container = document.querySelector('.flex-1')
  return container || window
}

const scrollToTop = () => {
  if (scrollElement && scrollElement !== window) {
    scrollElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }
}

const handleScroll = () => {
  if (!scrollElement) return

  const scrollY = scrollElement.scrollTop
  const maxscroll = scrollElement.scrollHeight - scrollElement.clientHeight
  const ratio = Math.min(scrollY / (maxscroll * 0.5), 1)
  isShow.value = scrollY > 100 // 显示按钮的阈值
  opacityValue.value = ratio // 根据滚动比例设置透明度
}

onMounted(() => {
  isClientReady.value = true
  scrollElement = findScrollElement()
  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (scrollElement) {
    scrollElement.removeEventListener('scroll', handleScroll)
  }
})
</script>
