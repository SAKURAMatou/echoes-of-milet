<template>
  <button
    v-if="isClientReady"
    v-show="isShow"
    type="button"
    :style="{ opacity: opacityValue }"
    class="rounded-lg bg-blue-500 text-white shadow-lg transition-opacity duration-300 cursor-pointer"
    aria-label="Back to top"
    @click="scrollToTop"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="48px"
      width="48px"
      viewBox="0 -960 960 960"
      fill="#FFFFFF"
      aria-hidden="true"
    >
      <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
    </svg>
  </button>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const isShow = ref(false)
const opacityValue = ref(0)
const isClientReady = ref(false)

let scrollElement = null
let mediaQuery = null
let scrollFrame = 0

function isWindowScrollTarget(target) {
  return !target || target === window
}

function getScrollTop(target) {
  if (isWindowScrollTarget(target)) {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  }

  return target.scrollTop || 0
}

function getScrollableDistance(target) {
  if (isWindowScrollTarget(target)) {
    const doc = document.documentElement
    return Math.max(doc.scrollHeight - window.innerHeight, 0)
  }

  return Math.max(target.scrollHeight - target.clientHeight, 0)
}

function findScrollElement() {
  if (typeof window === 'undefined') return null

  if (window.matchMedia('(max-width: 767px)').matches) {
    return window
  }

  return document.querySelector('[data-page-scroll-container]') || window
}

function bindScrollTarget() {
  const nextScrollElement = findScrollElement()

  if (scrollElement === nextScrollElement) {
    updateScrollState()
    return
  }

  if (scrollElement) {
    scrollElement.removeEventListener('scroll', handleScroll)
  }

  scrollElement = nextScrollElement

  if (scrollElement) {
    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
  }

  updateScrollState()
}

function scrollToTop() {
  const target = findScrollElement()

  if (isWindowScrollTarget(target)) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
    return
  }

  target.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

function updateScrollState() {
  const target = scrollElement || findScrollElement()
  const scrollTop = getScrollTop(target)
  const scrollableDistance = getScrollableDistance(target)
  const ratio = scrollableDistance > 0 ? Math.min(scrollTop / (scrollableDistance * 0.5), 1) : 0

  isShow.value = scrollTop > 100
  opacityValue.value = ratio
}

function handleScroll() {
  if (scrollFrame) return

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateScrollState()
  })
}

onMounted(async () => {
  isClientReady.value = true
  await nextTick()

  mediaQuery = window.matchMedia('(max-width: 767px)')
  mediaQuery.addEventListener('change', bindScrollTarget)
  bindScrollTarget()
})

onUnmounted(() => {
  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
  }

  if (scrollElement) {
    scrollElement.removeEventListener('scroll', handleScroll)
  }

  if (mediaQuery) {
    mediaQuery.removeEventListener('change', bindScrollTarget)
  }
})
</script>
