<template>
  <aside class="max-md:hidden w-[310px] pl-5 lg:pl-6 h-full overflow-hidden">
    <div
      class="relative h-full overflow-hidden rounded-xl border border-white/40 bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)]"
    >
      <div
        ref="desktopScrollRef"
        class="scrollbar-none h-full overflow-y-auto"
        @scroll="updateDesktopHint"
      >
        <SideMenuItems class="pl-6 pr-6 py-6" />
      </div>

      <transition name="scroll-hint">
        <div v-if="showDesktopScrollHint" class="scroll-more-hint" aria-hidden="true">
          <span class="scroll-more-hint__line"></span>
          <span class="scroll-more-hint__pill">
            <span>MORE</span>
            <svg
              class="scroll-more-hint__arrow h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 9l6 6 6-6"
              />
            </svg>
          </span>
        </div>
      </transition>
    </div>
  </aside>

  <teleport v-if="isClient && menuOpen" to="body">
    <button
      type="button"
      class="fixed inset-x-0 bottom-0 top-16 z-40 cursor-default md:hidden"
      aria-label="Close menu"
      tabindex="-1"
      @click="requestClose"
    >
      <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"></div>
    </button>

    <aside
      id="mobile-site-menu"
      ref="mobileDialogRef"
      class="fixed left-0 top-16 z-50 h-[calc(100dvh-4rem)] w-[min(310px,100vw)] max-w-[100vw] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
      tabindex="-1"
      @click.stop
      @keydown="onDialogKeydown"
    >
      <div
        class="relative h-full overflow-hidden border-r border-white/30 bg-[linear-gradient(to_bottom_right,white,#ebf8ff,#bee3f8)]"
      >
        <div
          ref="mobileScrollRef"
          class="scrollbar-none h-full touch-pan-y overflow-y-auto overscroll-contain"
          @scroll="updateMobileHint"
        >
          <SideMenuItems class="pl-6 pr-6 py-6" @closeMenuItem="requestClose" />
        </div>

        <transition name="scroll-hint">
          <div v-if="showMobileScrollHint" class="scroll-more-hint" aria-hidden="true">
            <span class="scroll-more-hint__line"></span>
            <span class="scroll-more-hint__pill">
              <span>MORE</span>
              <svg
                class="scroll-more-hint__arrow h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 9l6 6 6-6"
                />
              </svg>
            </span>
          </div>
        </transition>
      </div>
    </aside>
  </teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import SideMenuItems from './SideMenuItems.vue'
import { usePageScroll } from '@/composables/page-scroll'

const props = defineProps({
  menuOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['closeMenu'])
const isClient = ref(false)
const desktopScrollRef = ref<HTMLElement | null>(null)
const mobileScrollRef = ref<HTMLElement | null>(null)
const mobileDialogRef = ref<HTMLElement | null>(null)
const showDesktopScrollHint = ref(false)
const showMobileScrollHint = ref(false)
let resizeObserver: ResizeObserver | null = null
const pageScroll = usePageScroll()
const route = useRoute()
let releasePageLock: (() => void) | null = null
let backgroundElements: HTMLElement[] = []

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),select,input,textarea'

function requestClose() {
  emit('closeMenu')
}

function setBackgroundInert(inert: boolean) {
  if (typeof document === 'undefined') return
  if (inert) {
    backgroundElements = Array.from(document.querySelectorAll<HTMLElement>('[data-menu-inert]'))
    backgroundElements.forEach((element) => {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    })
    return
  }
  backgroundElements.forEach((element) => {
    element.inert = false
    element.removeAttribute('aria-hidden')
  })
  backgroundElements = []
}

function focusInitialControl() {
  const first = mobileDialogRef.value?.querySelector<HTMLElement>(FOCUSABLE)
  ;(first || mobileDialogRef.value)?.focus({ preventScroll: true })
}

function onDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    requestClose()
    return
  }
  if (event.key !== 'Tab' || !mobileDialogRef.value) return
  const controls = Array.from(mobileDialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.hasAttribute('disabled') && element.offsetParent !== null,
  )
  if (!controls.length) {
    event.preventDefault()
    mobileDialogRef.value.focus()
    return
  }
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function hasHiddenContent(scrollEl: HTMLElement | null) {
  if (!scrollEl) {
    return false
  }

  return scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight > 8
}

function updateDesktopHint() {
  showDesktopScrollHint.value = hasHiddenContent(desktopScrollRef.value)
}

function updateMobileHint() {
  showMobileScrollHint.value = props.menuOpen && hasHiddenContent(mobileScrollRef.value)
}

function updateScrollHints() {
  updateDesktopHint()
  updateMobileHint()
}

function observeScrollContainers() {
  if (!resizeObserver) {
    return
  }

  if (desktopScrollRef.value) {
    resizeObserver.observe(desktopScrollRef.value)
  }

  if (mobileScrollRef.value) {
    resizeObserver.observe(mobileScrollRef.value)
  }
}

onMounted(() => {
  isClient.value = true
  resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollHints)
  window.addEventListener('resize', updateScrollHints)
  nextTick(() => {
    observeScrollContainers()
    updateScrollHints()
  })
})

watch(
  () => props.menuOpen,
  async (isOpen) => {
    await nextTick()
    if (isOpen) {
      releasePageLock?.()
      releasePageLock = pageScroll.lockPageScroll('mobile-menu')
      setBackgroundInert(true)
      focusInitialControl()
    } else {
      releasePageLock?.()
      releasePageLock = null
      setBackgroundInert(false)
    }
    observeScrollContainers()
    updateScrollHints()
  },
)

watch(
  () => route.fullPath,
  () => {
    if (props.menuOpen) requestClose()
  },
)

onBeforeUnmount(() => {
  releasePageLock?.()
  releasePageLock = null
  setBackgroundInert(false)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateScrollHints)
})
</script>

<style scoped>
.scroll-more-hint {
  pointer-events: none;
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2.75rem 1rem 0.9rem;
  color: rgb(71 85 105 / 0.82);
  background: linear-gradient(to top, rgb(240 249 255 / 0.96), rgb(240 249 255 / 0));
}

.scroll-more-hint__line {
  width: min(8rem, 58%);
  height: 1px;
  background: linear-gradient(to right, transparent, rgb(14 165 233 / 0.42), transparent);
}

.scroll-more-hint__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  border-radius: 9999px;
  border: 1px solid rgb(255 255 255 / 0.72);
  background: rgb(255 255 255 / 0.82);
  padding: 0.22rem 0.55rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  box-shadow:
    0 10px 26px -18px rgb(15 23 42 / 0.7),
    inset 0 1px 0 rgb(255 255 255 / 0.9);
}

.scroll-more-hint__arrow {
  animation: menu-more-cue 700ms var(--echo-ease-out) 2;
}

@keyframes menu-more-cue {
  50% { transform: translateY(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-more-hint__arrow { animation: none; }
}

.scroll-hint-enter-active,
.scroll-hint-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.scroll-hint-enter-from,
.scroll-hint-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
