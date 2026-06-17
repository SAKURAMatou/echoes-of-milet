<template>
  <div ref="root" class="relative inline-flex">
    <button
      type="button"
      class="inline-flex h-9 items-center gap-2 rounded-lg border border-[rgba(171,209,223,0.78)] bg-white/72 px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#143d63] shadow-[0_14px_34px_-28px_rgba(20,61,99,0.72)] backdrop-blur-xl transition hover:border-[#7fc7d6] hover:bg-white/90 active:translate-y-px"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span aria-hidden="true">↗</span>
      <span>{{ text.share }}</span>
    </button>

    <div
      v-if="open"
      class="fixed z-50 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-[rgba(171,209,223,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] p-2 shadow-[0_26px_72px_-38px_rgba(20,61,99,0.78)] backdrop-blur-xl"
      :style="panelStyle"
      role="menu"
    >
      <button
        v-if="canUseNativeShare"
        type="button"
        class="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold text-[#143d63] transition hover:bg-[#eaf7fb]"
        role="menuitem"
        @click="shareNative"
      >
        <span>{{ text.system }}</span>
        <span class="text-xs text-[#317f8d]">native</span>
      </button>

      <button
        v-for="option in platformOptions"
        :key="option.key"
        type="button"
        class="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold text-[#143d63] transition hover:bg-[#eaf7fb]"
        role="menuitem"
        @click="openPlatform(option.href)"
      >
        <span>{{ option.label }}</span>
        <span class="text-xs text-[#317f8d]">open</span>
      </button>

      <button
        type="button"
        class="mt-1 flex w-full items-center justify-between rounded-md border border-[rgba(171,209,223,0.55)] bg-white/62 px-3 py-2.5 text-left text-sm font-semibold text-[#143d63] transition hover:bg-white"
        role="menuitem"
        @click="copyLink"
      >
        <span>{{ copied ? text.copied : text.copy }}</span>
        <span class="text-xs text-[#317f8d]">{{ copied ? 'ok' : 'link' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  title: string
  summary?: string
  url: string
  lang: 'zh' | 'ja'
  coverImageUrl?: string
}>()

const open = ref(false)
const copied = ref(false)
const canUseNativeShare = ref(false)
const root = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const text = computed(() =>
  props.lang === 'ja'
    ? {
        share: 'Share',
        system: 'System share',
        copy: 'Copy link',
        copied: 'Copied',
      }
    : {
        share: '分享',
        system: '系统分享',
        copy: '复制链接',
        copied: '已复制',
      },
)

const encodedUrl = computed(() => encodeURIComponent(props.url))
const encodedTitle = computed(() => encodeURIComponent(props.title || 'Echoes of milet'))
const encodedSummary = computed(() => encodeURIComponent(props.summary || props.title || 'Echoes of milet'))
const encodedCover = computed(() => encodeURIComponent(props.coverImageUrl || ''))

const platformOptions = computed(() => [
  {
    key: 'x',
    label: 'X / Twitter',
    href: `https://twitter.com/intent/tweet?text=${encodedTitle.value}&url=${encodedUrl.value}`,
  },
  {
    key: 'line',
    label: 'LINE',
    href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl.value}`,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}`,
  },
  {
    key: 'weibo',
    label: '微博',
    href: `https://service.weibo.com/share/share.php?url=${encodedUrl.value}&title=${encodedSummary.value}${
      props.coverImageUrl ? `&pic=${encodedCover.value}` : ''
    }`,
  },
])

function updatePanelPosition() {
  if (typeof window === 'undefined' || !root.value) return
  const rect = root.value.getBoundingClientRect()
  const top = Math.min(rect.bottom + 8, window.innerHeight - 16)
  if (window.innerWidth < 640) {
    panelStyle.value = {
      top: `${top}px`,
      left: '1rem',
      right: '1rem',
      width: 'calc(100vw - 2rem)',
    }
    return
  }
  panelStyle.value = {
    top: `${top}px`,
    right: `${Math.max(16, window.innerWidth - rect.right)}px`,
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    copied.value = false
    await nextTick()
    updatePanelPosition()
  }
}

function close() {
  open.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!root.value || !(event.target instanceof Node)) return
  if (!root.value.contains(event.target)) close()
}

function openPlatform(href: string) {
  if (typeof window === 'undefined') return
  window.open(href, '_blank', 'noopener,noreferrer')
  close()
}

async function shareNative() {
  if (typeof navigator === 'undefined' || !navigator.share) return
  try {
    await navigator.share({
      title: props.title,
      text: props.summary || props.title,
      url: props.url,
    })
    close()
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      await copyLink()
    }
  }
}

async function copyLink() {
  if (typeof navigator === 'undefined') return
  try {
    await navigator.clipboard?.writeText(props.url)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
      close()
    }, 1100)
  } catch {
    copied.value = false
  }
}

onMounted(() => {
  canUseNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', updatePanelPosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', updatePanelPosition)
})
</script>
