<template>
  <div
    :id="sectionId"
    ref="root"
    class="lazy-home-section"
    data-allow-mismatch="children"
  >
    <slot v-if="shouldRender" />
    <div
      v-else
      class="lazy-home-section__placeholder"
      :style="placeholderStyle"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    sectionId?: string
    eager?: boolean
    minHeight?: number
    rootMargin?: string
  }>(),
  {
    sectionId: undefined,
    eager: false,
    minHeight: 320,
    rootMargin: '520px 0px',
  },
)

const root = ref<HTMLElement | null>(null)
const shouldRender = ref(import.meta.env.SSR || props.eager)
let observer: IntersectionObserver | null = null

const placeholderStyle = computed(() => ({
  minHeight: `${props.minHeight}px`,
}))

onMounted(() => {
  if (shouldRender.value) {
    return
  }

  if (!('IntersectionObserver' in window)) {
    shouldRender.value = true
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) {
        return
      }

      shouldRender.value = true
      observer?.disconnect()
      observer = null
    },
    {
      rootMargin: props.rootMargin,
    },
  )

  if (root.value) {
    observer.observe(root.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.lazy-home-section__placeholder {
  contain: layout paint style;
}
</style>
