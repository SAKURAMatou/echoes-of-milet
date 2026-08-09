<template>
  <section v-if="items.length" :class="rootClass">
    <button
      ref="triggerEl"
      type="button"
      :class="[triggerClass, { 'is-open': listOpen, 'is-reminding': reminderActive }]"
      :aria-expanded="listOpen"
      :aria-controls="popoverId"
      aria-haspopup="true"
      :aria-label="triggerAriaLabel"
      @click="toggleList"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
      @focusin="focused = true"
      @focusout="handleTriggerFocusOut"
    >
      <span
        class="relative z-[1] h-5 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-[#d6ad55] to-[#9b6d18]"
        aria-hidden="true"
      ></span>
      <span
        class="extra-information-signal relative z-[1] flex h-4 w-4 shrink-0 items-center justify-center text-[0.82rem] font-bold leading-none text-[#a4731f]"
        aria-hidden="true"
      >
        ✦
      </span>
      <span
        class="relative z-[1] min-w-0 flex-1 truncate text-left text-sm font-semibold text-[#143d63]"
        :title="triggerLabel || items[0]?.title"
      >
        {{ triggerLabel || items[0]?.title }}
      </span>
      <span
        class="relative z-[1] shrink-0 rounded-full border border-[#d9b45f]/45 bg-white/75 px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#946517] shadow-[0_6px_16px_-12px_rgba(180,130,35,0.72)]"
        :title="countTitle"
      >
        {{ countText }}
      </span>
      <svg
        class="relative z-[1] h-3.5 w-3.5 shrink-0 text-[#a4731f] transition-transform duration-200"
        :class="{ 'rotate-180': listOpen }"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Teleport to="body" :disabled="inlineMode">
      <div
        v-if="listOpen"
        :id="popoverId"
        ref="popoverEl"
        :style="inlineMode ? undefined : popoverStyle"
        :class="popoverClass"
        role="region"
        :aria-label="sectionLabel"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @focusin="focused = true"
        @focusout="handlePopoverFocusOut"
      >
        <div
          class="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="h-1.5 w-1.5 rotate-45 border border-[#b89444]/70 bg-[#f7e9bf]"
              aria-hidden="true"
            ></span>
            <span
              class="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f5525]"
            >
              {{ sectionLabel }} · {{ countText }}
            </span>
          </div>
          <button
            ref="closeEl"
            type="button"
            class="grid min-h-11 min-w-11 place-items-center rounded-md px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9b45f]/45"
            :aria-label="closeLabel"
            @click="closeList(true)"
          >
            ×
          </button>
        </div>

        <div class="max-h-[min(27rem,66vh)] space-y-2 overflow-y-auto p-2.5">
          <component
            :is="item.linkScope === 'internal' ? RouterLink : 'a'"
            v-for="item in items"
            :key="`${item.type}:${item.id}`"
            v-bind="linkBindings(item)"
            class="extra-information-card group grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-white p-2.5 text-left shadow-[0_16px_38px_-32px_rgba(15,23,42,0.48)] transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4"
            :class="cardClass(item.type)"
            @click="closeList(false)"
          >
            <span class="relative h-[4.25rem] w-[5.5rem] overflow-hidden rounded-md bg-slate-100">
              <img
                v-if="item.coverImage"
                :src="item.coverImage"
                :alt="item.title"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
              <span
                v-else
                class="grid h-full w-full place-items-center bg-gradient-to-br text-[10px] font-bold uppercase tracking-[0.12em]"
                :class="placeholderClass(item.type)"
              >
                {{ resourceLabel(item.type) }}
              </span>
              <span
                class="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold leading-none shadow-sm backdrop-blur"
                :class="badgeClass(item.type)"
              >
                {{ resourceLabel(item.type) }}
              </span>
            </span>

            <span class="min-w-0">
              <span class="block line-clamp-2 text-sm font-semibold leading-5 text-[#143d63]">
                {{ item.title }}
              </span>
              <span
                v-if="item.summary"
                class="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500"
              >
                {{ item.summary }}
              </span>
              <span
                class="mt-1 block truncate text-[10px] font-medium text-slate-400"
                :title="item.url"
              >
                {{ item.url }}
              </span>
            </span>

            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/15 text-sm transition group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              {{ item.linkScope === 'external' ? '↗' : '›' }}
            </span>
          </component>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { RouterLink } from 'vue-router'

import type {
  ExtraInformationGroup,
  ExtraInformationItem,
  ExtraInformationResourceType,
} from '@/composables/extraInformation'
import type { RelatedArticleGroup } from '@/composables/articleType'
import { resolveLiveImageUrl } from '@/composables/liveArchive'

type LegacyArticle = {
  id: string | number
  slug?: string
  title: string
  summary?: string
  url?: string
  coverImage?: unknown
  coverImageUrl?: string
  coverUrl?: string
  coverUrlAccess?: string
}

type LegacyGallery = {
  id: string | number
  galleryId?: string | number
  slug?: string
  title: string
  description?: string
  url?: string
  coverImage?: unknown
  coverImageUrl?: string
  coverUrl?: string
  coverUrlAccess?: string
}

const props = withDefaults(
  defineProps<{
    extraInfo?: ExtraInformationGroup | null
    legacyArticles?: RelatedArticleGroup | LegacyArticle[] | null
    legacyGalleries?: LegacyGallery[] | null
    variant?: 'timeline' | 'release' | 'modal' | 'chip' | 'live'
    lang?: SupportedLang | 'ja'
    triggerLabel?: string
    floating?: boolean
  }>(),
  {
    extraInfo: null,
    legacyArticles: null,
    legacyGalleries: null,
    variant: 'timeline',
    lang: 'zh',
    triggerLabel: '',
    floating: false,
  },
)

const listOpen = ref(false)
const popoverId = `extra-information-${useId()}`
const mobileInline = ref(false)
const inlineMode = computed(() => mobileInline.value && !props.floating)
const reminderActive = ref(false)
const hovered = ref(false)
const focused = ref(false)
const inViewport = ref(false)
const pageVisible = ref(true)
const triggerEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const closeEl = ref<HTMLButtonElement | null>(null)
const popoverStyle = ref<CSSProperties>({})

let intersectionObserver: IntersectionObserver | null = null
let mobileMediaQuery: MediaQueryList | null = null
let reminderTimer: ReturnType<typeof setTimeout> | null = null
let reminderEndTimer: ReturnType<typeof setTimeout> | null = null

const routeLang = computed(() => (props.lang === 'jp' ? 'ja' : props.lang))
const isJapanese = computed(() => props.lang === 'ja' || props.lang === 'jp')

const legacyArticleItems = computed<LegacyArticle[]>(() => {
  if (Array.isArray(props.legacyArticles)) return props.legacyArticles
  return props.legacyArticles?.items || []
})

const items = computed<ExtraInformationItem[]>(() => {
  if (props.extraInfo?.items?.length) return props.extraInfo.items

  const articles = legacyArticleItems.value.map((article) => ({
    type: 'article' as const,
    id: String(article.id),
    title: article.title,
    summary: article.summary || '',
    coverImage: resolveLegacyCover(article),
    url: article.url || `/${routeLang.value}/milet/articles/${article.slug || article.id}`,
    linkScope: 'internal' as const,
  }))
  const galleries = (props.legacyGalleries || []).map((gallery) => ({
    type: 'gallery' as const,
    id: String(gallery.id),
    title: gallery.title,
    summary: gallery.description || '',
    coverImage: resolveLegacyCover(gallery),
    url:
      gallery.url ||
      `/${routeLang.value}/milet/galleryDetail/${gallery.galleryId || gallery.slug || gallery.id}`,
    linkScope: 'internal' as const,
  }))
  return [...articles, ...galleries]
})

const totalCount = computed(() => props.extraInfo?.count || items.value.length)
const countText = computed(() => `${totalCount.value}${isJapanese.value ? '件' : '项'}`)
const countTitle = computed(() =>
  isJapanese.value ? `${totalCount.value}件の関連情報` : `${totalCount.value} 项额外信息`,
)
const sectionLabel = computed(() => (isJapanese.value ? '関連情報' : '额外信息'))
const closeLabel = computed(() => (isJapanese.value ? '関連情報を閉じる' : '关闭额外信息'))
const triggerAriaLabel = computed(() => {
  const title = props.triggerLabel || items.value[0]?.title || sectionLabel.value
  return isJapanese.value
    ? `${title}。関連情報は${totalCount.value}件あります`
    : `${title}，共 ${totalCount.value} 项额外信息`
})

const rootClass = computed(() => {
  if (props.variant === 'chip') {
    return 'relative inline-flex min-w-0 max-w-full flex-col items-stretch'
  }
  if (props.variant === 'timeline') return 'relative mt-3 min-w-0 max-w-full'
  return 'relative min-w-0 max-w-full'
})

const triggerClass = computed(() => {
  const base =
    'extra-information-trigger group relative isolate flex min-h-11 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border border-[#cda54d]/65 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(253,248,232,0.84))] text-left shadow-[0_14px_38px_-32px_rgba(111,79,18,0.72)] transition duration-200 hover:-translate-y-px hover:border-[#b88628]/80 hover:bg-[#fffaf0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8cc83]/35'
  if (props.variant === 'modal') return `${base} px-3.5 py-2`
  if (props.variant === 'live') return `${base} px-3.5 py-2.5`
  return `${base} px-3 py-1.5`
})

const popoverClass = computed(() => {
  const base =
    'z-[1200] overflow-hidden rounded-xl border border-[#d9b77c]/45 bg-white/96 shadow-[0_30px_90px_-38px_rgba(15,23,42,0.52)] ring-1 ring-white/80 backdrop-blur-xl'
  if (inlineMode.value) return `${base} relative mt-2 w-full max-w-full`
  if (props.variant === 'modal' || props.variant === 'live') {
    return `${base} fixed w-[min(30rem,calc(100vw-1.5rem))]`
  }
  return `${base} fixed w-[min(27rem,calc(100vw-1.5rem))]`
})

const canRemind = computed(
  () =>
    inViewport.value && pageVisible.value && !hovered.value && !focused.value && !listOpen.value,
)

function resolveLegacyCover(value: LegacyArticle | LegacyGallery) {
  return resolveLiveImageUrl(
    (value.coverImage ||
      value.coverImageUrl ||
      value.coverUrlAccess ||
      value.coverUrl ||
      '') as never,
  )
}

function resourceLabel(type: ExtraInformationResourceType) {
  if (isJapanese.value) {
    if (type === 'article') return '記事'
    if (type === 'gallery') return 'アルバム'
    return 'リンク'
  }
  if (type === 'article') return '文章'
  if (type === 'gallery') return '相册'
  return '链接'
}

function cardClass(type: ExtraInformationResourceType) {
  if (type === 'article')
    return 'border-violet-100 hover:border-violet-300 hover:bg-violet-50/55 focus-visible:ring-violet-100 text-violet-600'
  if (type === 'gallery')
    return 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/55 focus-visible:ring-emerald-100 text-emerald-600'
  return 'border-sky-100 hover:border-sky-300 hover:bg-sky-50/55 focus-visible:ring-sky-100 text-[#317f8d]'
}

function placeholderClass(type: ExtraInformationResourceType) {
  if (type === 'article') return 'from-violet-50 to-fuchsia-100 text-violet-600'
  if (type === 'gallery') return 'from-emerald-50 to-teal-100 text-emerald-700'
  return 'from-slate-50 to-sky-100 text-[#317f8d]'
}

function badgeClass(type: ExtraInformationResourceType) {
  if (type === 'article') return 'text-violet-600'
  if (type === 'gallery') return 'text-emerald-700'
  return 'text-[#317f8d]'
}

function linkBindings(item: ExtraInformationItem) {
  if (item.linkScope === 'internal') {
    return { to: item.url, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
}

function clearReminderTimers() {
  if (reminderTimer) clearTimeout(reminderTimer)
  if (reminderEndTimer) clearTimeout(reminderEndTimer)
  reminderTimer = null
  reminderEndTimer = null
  reminderActive.value = false
}

function scheduleReminder() {
  clearReminderTimers()
  if (!canRemind.value) return
  reminderTimer = setTimeout(() => {
    reminderTimer = null
    if (!canRemind.value) return
    reminderActive.value = true
    reminderEndTimer = setTimeout(() => {
      reminderEndTimer = null
      reminderActive.value = false
      scheduleReminder()
    }, 700)
  }, 5000)
}

function updatePopoverPosition() {
  const trigger = triggerEl.value
  if (!trigger || typeof window === 'undefined') return
  const rect = trigger.getBoundingClientRect()
  const viewportPadding = 12
  const width = Math.min(
    props.variant === 'modal' || props.variant === 'live' ? 480 : 432,
    window.innerWidth - viewportPadding * 2,
  )
  const left = Math.min(
    Math.max(viewportPadding, rect.left),
    window.innerWidth - width - viewportPadding,
  )
  const measuredHeight = popoverEl.value?.getBoundingClientRect().height || 0
  const popoverHeight = Math.min(
    measuredHeight || Math.min(460, 58 + items.value.length * 96),
    window.innerHeight - viewportPadding * 2,
  )
  const belowTop = rect.bottom + 8
  const top =
    belowTop + popoverHeight > window.innerHeight - viewportPadding
      ? Math.max(viewportPadding, rect.top - popoverHeight - 8)
      : belowTop
  popoverStyle.value = { left: `${left}px`, top: `${top}px` }
}

function addDesktopPositionListeners() {
  if (inlineMode.value) return
  updatePopoverPosition()
  window.addEventListener('resize', updatePopoverPosition)
  window.addEventListener('scroll', updatePopoverPosition, true)
}

function removeDesktopPositionListeners() {
  window.removeEventListener('resize', updatePopoverPosition)
  window.removeEventListener('scroll', updatePopoverPosition, true)
}

function handleMobileMediaChange(event: MediaQueryListEvent | MediaQueryList) {
  mobileInline.value = event.matches
  popoverStyle.value = {}
  if (!listOpen.value) return
  removeDesktopPositionListeners()
  if (!inlineMode.value) {
    void nextTick(addDesktopPositionListeners)
  }
}

async function openList() {
  listOpen.value = true
  await nextTick()
  addDesktopPositionListeners()
  document.addEventListener('pointerdown', handleOutsidePointer, true)
  document.addEventListener('keydown', handleKeydown)
  closeEl.value?.focus()
}

function closeList(restoreFocus = false) {
  listOpen.value = false
  if (typeof window !== 'undefined') {
    removeDesktopPositionListeners()
    document.removeEventListener('pointerdown', handleOutsidePointer, true)
    document.removeEventListener('keydown', handleKeydown)
  }
  if (restoreFocus) triggerEl.value?.focus()
}

function toggleList() {
  if (listOpen.value) closeList()
  else void openList()
}

function handleOutsidePointer(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target || triggerEl.value?.contains(target) || popoverEl.value?.contains(target)) return
  closeList()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeList(true)
}

function handleTriggerFocusOut() {
  nextTick(() => {
    focused.value = Boolean(
      triggerEl.value?.contains(document.activeElement) ||
        popoverEl.value?.contains(document.activeElement),
    )
  })
}

function handlePopoverFocusOut() {
  handleTriggerFocusOut()
}

function handleVisibilityChange() {
  pageVisible.value = document.visibilityState === 'visible'
}

watch(canRemind, scheduleReminder)

onMounted(() => {
  pageVisible.value = document.visibilityState === 'visible'
  document.addEventListener('visibilitychange', handleVisibilityChange)
  mobileMediaQuery = window.matchMedia('(max-width: 767px)')
  handleMobileMediaChange(mobileMediaQuery)
  mobileMediaQuery.addEventListener('change', handleMobileMediaChange)
  if ('IntersectionObserver' in window && triggerEl.value) {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport.value = Boolean(entry?.isIntersecting)
      },
      { threshold: 0.15 },
    )
    intersectionObserver.observe(triggerEl.value)
  } else {
    inViewport.value = true
  }
})

onBeforeUnmount(() => {
  closeList()
  clearReminderTimers()
  intersectionObserver?.disconnect()
  mobileMediaQuery?.removeEventListener('change', handleMobileMediaChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.extra-information-trigger::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(202, 153, 54, 0.18),
    inset 0 0 18px rgba(217, 180, 95, 0.05);
  opacity: 0.7;
}

.extra-information-trigger::after {
  position: absolute;
  inset: -1px;
  z-index: 0;
  pointer-events: none;
  content: '';
  background: linear-gradient(
    110deg,
    transparent 0%,
    transparent 35%,
    rgba(224, 178, 75, 0.16) 45%,
    rgba(255, 255, 255, 0.58) 50%,
    rgba(224, 178, 75, 0.18) 55%,
    transparent 65%,
    transparent 100%
  );
  opacity: 0;
  transform: translateX(-125%);
}

.extra-information-trigger.is-reminding::before {
  animation: extra-information-border-glow 700ms ease-out both;
}

.extra-information-trigger.is-reminding::after {
  opacity: 1;
  animation: extra-information-sweep 700ms ease-out both;
}

.extra-information-trigger.is-reminding .extra-information-signal {
  animation: extra-information-pulse 700ms ease-out both;
}

.extra-information-trigger:hover::after,
.extra-information-trigger:focus-visible::after,
.extra-information-trigger.is-open::after {
  animation: none;
  opacity: 0;
}

@keyframes extra-information-sweep {
  from {
    transform: translateX(-125%);
  }
  to {
    transform: translateX(125%);
  }
}

@keyframes extra-information-border-glow {
  0%,
  100% {
    box-shadow:
      inset 0 0 0 1px rgba(202, 153, 54, 0.18),
      inset 0 0 16px rgba(217, 180, 95, 0.04);
  }
  52% {
    box-shadow:
      inset 0 0 0 1px rgba(184, 132, 37, 0.5),
      inset 0 0 24px rgba(217, 180, 95, 0.16);
  }
}

@keyframes extra-information-pulse {
  0%,
  100% {
    text-shadow: 0 0 0 rgba(202, 153, 54, 0);
  }
  55% {
    text-shadow: 0 0 12px rgba(202, 153, 54, 0.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .extra-information-trigger,
  .extra-information-card {
    transition: none;
  }

  .extra-information-trigger.is-reminding::before,
  .extra-information-trigger.is-reminding::after,
  .extra-information-trigger.is-reminding .extra-information-signal {
    animation: none;
  }

  .extra-information-trigger.is-reminding::after {
    opacity: 0;
  }
}
</style>
