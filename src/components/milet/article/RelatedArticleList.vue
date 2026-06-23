<template>
  <section v-if="visibleItems.length > 0" :class="rootClass">
    <button
      ref="triggerEl"
      type="button"
      :class="[triggerClass, { 'is-open': listOpen }]"
      :aria-expanded="listOpen"
      :aria-label="triggerAriaLabel"
      @click="toggleList"
    >
      <span
        class="relative z-[1] h-5 w-0.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#317f8d,rgba(125,211,252,0.28))]"
        aria-hidden="true"
      ></span>
      <span
        class="related-article-signal relative z-[1] flex h-4 w-4 shrink-0 items-center justify-center text-[0.82rem] font-bold leading-none text-[#317f8d] drop-shadow-[0_0_8px_rgba(49,127,141,0.24)]"
        aria-hidden="true"
      >
        ✦
      </span>
      <span
        class="relative z-[1] min-w-0 flex-1 truncate text-left text-sm font-semibold text-[#143d63]"
        :title="visibleItems[0]?.title"
      >
        {{ visibleItems[0]?.title }}
      </span>
      <span
        class="related-article-chevron relative z-[1] flex h-5 w-5 shrink-0 items-center justify-center text-[#317f8d] transition-transform duration-200 group-hover:text-[#143d63]"
        :class="{ 'rotate-180': listOpen }"
        aria-hidden="true"
      >
        <svg class="related-article-chevron-icon h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="listOpen"
        ref="popoverEl"
        :style="popoverStyle"
        :class="popoverClass"
      >
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
          <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#317f8d]/85">
            {{ labelText }}
          </div>
          <button
            type="button"
            class="rounded-md px-1.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close related articles"
            @click="closeList"
          >
            x
          </button>
        </div>
        <div class="max-h-[min(18rem,56vh)] overflow-y-auto p-2">
          <a
            v-for="article in allItems"
            :key="article.id"
            :href="articlePath(article)"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex min-w-0 items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
            @click="closeList"
          >
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-[#143d63]">
              {{ article.title }}
            </span>
            <span class="shrink-0 text-xs font-semibold text-[#317f8d]" aria-hidden="true">
              Open
            </span>
          </a>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { RelatedArticleGroup, RelatedArticleSummary } from '@/composables/articleType'

const props = withDefaults(
  defineProps<{
    articles?: RelatedArticleGroup | null
    variant?: 'timeline' | 'release' | 'modal' | 'chip'
    limit?: number
    lang?: SupportedLang | 'ja'
  }>(),
  {
    variant: 'timeline',
    limit: 1,
    lang: 'zh',
  },
)

const listOpen = ref(false)
const triggerEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const popoverStyle = ref<CSSProperties>({})

const allItems = computed(() => props.articles?.items || [])
const visibleItems = computed(() => allItems.value.slice(0, 1))
const articleCount = computed(() => props.articles?.count || allItems.value.length)
const hasMultiple = computed(() => articleCount.value > 1)
const labelText = computed(() => (hasMultiple.value ? `Related articles ${articleCount.value}` : 'Related article'))
const triggerAriaLabel = computed(() => {
  const title = visibleItems.value[0]?.title || 'Related article'
  return hasMultiple.value ? `${title}. Related articles ${articleCount.value}` : `${title}. Related article`
})

const rootClass = computed(() => {
  if (props.variant === 'chip') return 'relative inline-flex'
  if (props.variant === 'timeline') return 'relative mt-3'
  return 'relative'
})

const triggerClass = computed(() => {
  const base =
    'related-article-trigger group relative isolate flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100'
  if (props.variant === 'modal') {
    return `${base} border-sky-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(239,249,255,0.72))] px-3.5 py-2 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.55)] hover:-translate-y-px hover:border-[#7fc7d6]/80 hover:bg-sky-50/80 hover:shadow-[0_20px_50px_-34px_rgba(20,61,99,0.55)]`
  }
  if (props.variant === 'release') {
    return `${base} border-sky-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(239,249,255,0.64))] px-3 py-1.5 shadow-[0_12px_32px_-30px_rgba(20,61,99,0.55)] hover:-translate-y-px hover:border-[#7fc7d6]/80 hover:bg-sky-50/80`
  }
  if (props.variant === 'chip') {
    return `${base} border-sky-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(239,249,255,0.62))] px-3 py-1.5 shadow-[0_12px_32px_-30px_rgba(20,61,99,0.55)] hover:-translate-y-px hover:border-[#7fc7d6]/80 hover:bg-sky-50/80`
  }
  return `${base} border-sky-100/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(239,249,255,0.66))] px-3 py-1.5 shadow-[0_14px_38px_-32px_rgba(15,23,42,0.62)] backdrop-blur hover:-translate-y-px hover:border-[#7fc7d6]/80 hover:bg-sky-50/80 hover:shadow-[0_18px_44px_-32px_rgba(20,61,99,0.58)]`
})

const popoverClass = computed(() => {
  const widthClass = props.variant === 'modal' ? 'w-[min(26rem,calc(100vw-1.5rem))]' : 'w-[min(23rem,calc(100vw-1.5rem))]'
  return `fixed z-[1200] overflow-hidden rounded-lg border border-sky-100/90 bg-white/96 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.42)] ring-1 ring-white/70 backdrop-blur-xl ${widthClass}`
})

function articlePath(article: RelatedArticleSummary) {
  const lang = article.lang === 'ja' || props.lang === 'jp' ? 'ja' : 'zh'
  return article.url || `/${lang}/milet/articles/${article.slug}`
}

function updatePopoverPosition() {
  const trigger = triggerEl.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const viewportPadding = 12
  const width =
    props.variant === 'modal'
      ? Math.min(416, window.innerWidth - viewportPadding * 2)
      : Math.min(368, window.innerWidth - viewportPadding * 2)
  const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding)
  const belowTop = rect.bottom + 8
  const estimatedHeight = Math.min(320, 48 + allItems.value.length * 44)
  const top =
    belowTop + estimatedHeight > window.innerHeight - viewportPadding
      ? Math.max(viewportPadding, rect.top - estimatedHeight - 8)
      : belowTop
  popoverStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  }
}

async function openList() {
  listOpen.value = true
  await nextTick()
  updatePopoverPosition()
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, true)
  document.addEventListener('pointerdown', handleOutsidePointer, true)
  document.addEventListener('keydown', handleKeydown)
}

function closeList() {
  listOpen.value = false
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
  document.removeEventListener('pointerdown', handleOutsidePointer, true)
  document.removeEventListener('keydown', handleKeydown)
}

function toggleList() {
  if (listOpen.value) closeList()
  else openList()
}

function handleOutsidePointer(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (triggerEl.value?.contains(target) || popoverEl.value?.contains(target)) return
  closeList()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeList()
}

onBeforeUnmount(closeList)
</script>

<style scoped>
.related-article-trigger::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(125, 211, 252, 0.18),
    inset 0 0 18px rgba(125, 211, 252, 0.04);
  opacity: 0.55;
  animation: related-article-border-glow 5.6s ease-in-out infinite;
}

.related-article-trigger::after {
  position: absolute;
  inset: -1px;
  z-index: 0;
  pointer-events: none;
  content: '';
  background: linear-gradient(
    110deg,
    transparent 0%,
    transparent 36%,
    rgba(125, 211, 252, 0.2) 46%,
    rgba(255, 255, 255, 0.38) 50%,
    rgba(125, 211, 252, 0.16) 54%,
    transparent 64%,
    transparent 100%
  );
  transform: translateX(-125%);
  animation: related-article-sweep 5.6s ease-in-out infinite;
}

.related-article-trigger:hover::after,
.related-article-trigger:focus-visible::after,
.related-article-trigger.is-open::after {
  animation-play-state: paused;
  opacity: 0;
}

.related-article-trigger:hover::before,
.related-article-trigger:focus-visible::before,
.related-article-trigger.is-open::before {
  animation-play-state: paused;
  box-shadow:
    inset 0 0 0 1px rgba(125, 211, 252, 0.42),
    inset 0 0 20px rgba(125, 211, 252, 0.08);
  opacity: 1;
}

.related-article-signal {
  animation: related-article-pulse 3.4s ease-in-out infinite;
}

.related-article-chevron-icon {
  animation: related-article-chevron 2.8s ease-in-out infinite;
}

.related-article-trigger:hover .related-article-chevron-icon,
.related-article-trigger:focus-visible .related-article-chevron-icon,
.related-article-trigger.is-open .related-article-chevron-icon {
  animation-play-state: paused;
}

@keyframes related-article-sweep {
  0%,
  54% {
    transform: translateX(-125%);
  }
  74%,
  100% {
    transform: translateX(125%);
  }
}

@keyframes related-article-border-glow {
  0%,
  58%,
  100% {
    box-shadow:
      inset 0 0 0 1px rgba(125, 211, 252, 0.16),
      inset 0 0 16px rgba(125, 211, 252, 0.03);
    opacity: 0.5;
  }
  72% {
    box-shadow:
      inset 0 0 0 1px rgba(125, 211, 252, 0.42),
      inset 0 0 22px rgba(125, 211, 252, 0.12);
    opacity: 0.95;
  }
}

@keyframes related-article-pulse {
  0%,
  72%,
  100% {
    text-shadow: 0 0 0 rgba(49, 127, 141, 0);
    opacity: 0.82;
  }
  82% {
    text-shadow: 0 0 10px rgba(49, 127, 141, 0.42);
    opacity: 1;
  }
}

@keyframes related-article-chevron {
  0%,
  74%,
  100% {
    transform: translateY(0);
  }
  84% {
    transform: translateY(1.5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .related-article-trigger::before,
  .related-article-trigger::after,
  .related-article-signal,
  .related-article-chevron-icon {
    animation: none;
  }
}
</style>
