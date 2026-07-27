<template>
  <nav
    v-if="items.length"
    class="overflow-auto rounded-lg border border-[rgba(171,209,223,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(240,249,255,0.72)),radial-gradient(circle_at_100%_0,rgba(186,230,253,0.35),transparent_8rem)] p-4 pr-3 shadow-[0_18px_44px_-36px_rgba(20,61,99,0.55)] [backdrop-filter:blur(16px)] [scrollbar-color:rgba(49,127,141,0.36)_transparent] [scrollbar-width:thin]"
    :class="
      variant === 'mobile'
        ? 'max-h-[min(56svh,25rem)] border-0 bg-transparent p-3 shadow-none [backdrop-filter:none]'
        : 'max-h-[calc(100svh-6.25rem)]'
    "
    aria-label="Article contents"
  >
    <div
      class="mb-3.5 h-0.5 w-11 rounded-full bg-[linear-gradient(90deg,#317f8d,rgba(186,230,253,0.2))]"
      aria-hidden="true"
    ></div>
    <div class="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#143d63]">
      {{ title }}
    </div>
    <a
      v-for="item in items"
      :key="`${item.id}-${item.order}`"
      class="block rounded-r-md border-l-2 border-l-[rgba(49,127,141,0.18)] px-2.5 py-1.5 text-[0.82rem] leading-[1.45] text-[#5b6c78] no-underline transition hover:border-l-[#317f8d] hover:bg-[rgba(236,248,251,0.9)] hover:text-[#143d63]"
      :class="tocLinkLevelClass(item.level)"
      :href="`#${item.id}`"
      @click="handleClick($event, item)"
    >
      {{ item.text }}
    </a>
  </nav>
</template>

<script setup lang="ts">
import type { ArticleTocItem } from '@/composables/articleType'
import { usePageAnchorScroll } from '@/composables/usePageAnchorScroll'

withDefaults(
  defineProps<{
    items: ArticleTocItem[]
    title?: string
    variant?: 'side' | 'mobile'
  }>(),
  {
    title: 'Contents',
    variant: 'side',
  },
)

const { scrollToPageAnchor } = usePageAnchorScroll()

function handleClick(event: MouseEvent, item: ArticleTocItem) {
  event.preventDefault()
  scrollToPageAnchor(item.id, { history: 'replace' })
}

function tocLinkLevelClass(level: number) {
  if (level <= 1) return 'font-semibold'
  if (level === 2) return 'pl-3.5'
  if (level === 3) return 'pl-5'
  return 'pl-7 text-[0.78rem]'
}
</script>
