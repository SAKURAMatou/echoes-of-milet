<template>
  <div
    class="live-detail-shell min-h-svh text-[var(--live-detail-title)]"
    :class="themeClass"
    :style="themeStyle"
  >
    <header
      class="sticky top-0 z-40 border-b px-4 py-3 backdrop-blur-xl sm:px-7"
      :style="headerStyle"
    >
      <div class="mx-auto grid max-w-7xl gap-2">
        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <RouterLink
              :to="{ name: 'milet', params: { lang: routeLang } }"
              class="shrink-0 font-serif text-xl leading-none text-[var(--live-detail-title-soft)] transition hover:text-[var(--live-detail-accent)]"
            >
              Echoes of milet
            </RouterLink>
            <RouterLink
              :to="{ name: 'miletLiveArchive', params: { lang: routeLang } }"
              class="hidden items-center gap-2 text-xs font-semibold text-[var(--live-detail-muted)] transition hover:text-[var(--live-detail-title-soft)] sm:inline-flex"
            >
              <span aria-hidden="true">←</span>
              <span>{{ routeLang === 'ja' ? 'Back to Live Archive' : '返回 Live Archive' }}</span>
            </RouterLink>
          </div>

          <div class="flex shrink-0 items-center gap-3 font-['Montserrat','sans-serif'] text-xs font-semibold uppercase tracking-[0.16em] text-[var(--live-detail-accent)]">
            <RouterLink :to="zhRoute" class="transition hover:text-white">ZH</RouterLink>
            <span class="opacity-50">/</span>
            <RouterLink :to="jaRoute" class="transition hover:text-white">JA</RouterLink>
          </div>
        </div>

        <RouterLink
          :to="{ name: 'miletLiveArchive', params: { lang: routeLang } }"
          class="inline-flex w-fit items-center gap-2 text-xs font-semibold text-[var(--live-detail-muted)] transition hover:text-[var(--live-detail-title-soft)] sm:hidden"
        >
            <span aria-hidden="true">←</span>
            <span>{{ routeLang === 'ja' ? 'Back to Live Archive' : '返回 Live Archive' }}</span>
        </RouterLink>
      </div>
    </header>

    <main
      class="relative min-h-[calc(100svh-3.5rem)] overflow-hidden"
      :style="{ background: 'var(--live-detail-page-bg)' }"
    >
      <div
        class="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px]"
        aria-hidden="true"
      ></div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    themePreset?: string | null
  }>(),
  {
    themePreset: 'default',
  },
)
const route = useRoute()
const routeLang = computed(() => (String(route.params.lang) === 'ja' ? 'ja' : 'zh'))

const liveDetailThemes = {
  default: {
    shell: '#031322',
    headerBg: 'rgba(3, 19, 34, 0.88)',
    headerBorder: 'rgba(217, 183, 124, 0.18)',
    pageBg:
      'radial-gradient(circle at 50% 5%, rgba(87,140,176,0.35), transparent 34rem), radial-gradient(circle at 8% 38%, rgba(217,183,124,0.18), transparent 22rem), linear-gradient(180deg, #031322 0%, #061827 46%, #03111e 100%)',
    title: '#f3eadf',
    titleSoft: '#f5eadc',
    text: '#d8e8f3',
    muted: '#b8c8d5',
    subtle: '#91a9ba',
    accent: '#d9b77c',
    accentBorder: 'rgba(217, 183, 124, 0.42)',
    panelBg: 'rgba(6, 24, 39, 0.78)',
    surfaceBg: 'rgba(3, 19, 34, 0.42)',
    linkHover: '#9fd4ff',
  },
  'aurora-blue': {
    shell: '#02161d',
    headerBg: 'rgba(2, 22, 29, 0.9)',
    headerBorder: 'rgba(94, 234, 212, 0.2)',
    pageBg:
      'radial-gradient(circle at 50% 5%, rgba(56,189,248,0.34), transparent 34rem), radial-gradient(circle at 8% 38%, rgba(94,234,212,0.2), transparent 22rem), linear-gradient(180deg, #02161d 0%, #063040 48%, #02131d 100%)',
    title: '#ecfeff',
    titleSoft: '#cffafe',
    text: '#d7f7fb',
    muted: '#a8dce5',
    subtle: '#7db5c2',
    accent: '#5eead4',
    accentBorder: 'rgba(94, 234, 212, 0.42)',
    panelBg: 'rgba(5, 41, 54, 0.78)',
    surfaceBg: 'rgba(2, 22, 29, 0.44)',
    linkHover: '#bae6fd',
  },
  'velvet-rose': {
    shell: '#1a0f1d',
    headerBg: 'rgba(26, 15, 29, 0.9)',
    headerBorder: 'rgba(251, 191, 36, 0.22)',
    pageBg:
      'radial-gradient(circle at 50% 5%, rgba(190,24,93,0.28), transparent 34rem), radial-gradient(circle at 8% 38%, rgba(251,191,36,0.2), transparent 22rem), linear-gradient(180deg, #1a0f1d 0%, #2a1627 48%, #140c18 100%)',
    title: '#fff1f2',
    titleSoft: '#ffe4e6',
    text: '#fee2e2',
    muted: '#f0b8c7',
    subtle: '#cf8da1',
    accent: '#f6c56f',
    accentBorder: 'rgba(246, 197, 111, 0.42)',
    panelBg: 'rgba(46, 22, 39, 0.78)',
    surfaceBg: 'rgba(26, 15, 29, 0.44)',
    linkHover: '#fecdd3',
  },
} as const
type LiveDetailThemePreset = keyof typeof liveDetailThemes

function isThemePreset(value: string): value is LiveDetailThemePreset {
  return Object.prototype.hasOwnProperty.call(liveDetailThemes, value)
}

const normalizedThemePreset = computed<LiveDetailThemePreset>(() => {
  const value = String(props.themePreset || 'default')
  return isThemePreset(value) ? value : 'default'
})
const theme = computed(() => liveDetailThemes[normalizedThemePreset.value])
const themeClass = computed(() => `live-detail-shell--${normalizedThemePreset.value}`)
const themeStyle = computed<Record<string, string>>(() => ({
  backgroundColor: theme.value.shell,
  '--live-detail-page-bg': theme.value.pageBg,
  '--live-detail-title': theme.value.title,
  '--live-detail-title-soft': theme.value.titleSoft,
  '--live-detail-text': theme.value.text,
  '--live-detail-muted': theme.value.muted,
  '--live-detail-subtle': theme.value.subtle,
  '--live-detail-accent': theme.value.accent,
  '--live-detail-accent-border': theme.value.accentBorder,
  '--live-detail-panel-bg': theme.value.panelBg,
  '--live-detail-surface-bg': theme.value.surfaceBg,
  '--live-detail-link-hover': theme.value.linkHover,
}))
const headerStyle = computed<Record<string, string>>(() => ({
  backgroundColor: theme.value.headerBg,
  borderColor: theme.value.headerBorder,
}))

const zhRoute = computed(() => ({
  name: route.name || 'miletLiveArchive',
  params: {
    ...route.params,
    lang: 'zh',
  },
  query: route.query,
}))

const jaRoute = computed(() => ({
  name: route.name || 'miletLiveArchive',
  params: {
    ...route.params,
    lang: 'ja',
  },
  query: route.query,
}))
</script>

<style scoped>
.live-detail-shell :deep([class*="text-[#f3eadf]"]),
.live-detail-shell :deep([class*="text-[#f5eadc]"]) {
  color: var(--live-detail-title) !important;
}

.live-detail-shell :deep([class*="text-[#d8e8f3]"]) {
  color: var(--live-detail-text) !important;
}

.live-detail-shell :deep([class*="text-[#b8c8d5]"]) {
  color: var(--live-detail-muted) !important;
}

.live-detail-shell :deep([class*="text-[#91a9ba]"]) {
  color: var(--live-detail-subtle) !important;
}

.live-detail-shell :deep([class*="text-[#d9b77c]"]) {
  color: var(--live-detail-accent) !important;
}

.live-detail-shell :deep([class*="border-[#d9b77c]"]) {
  border-color: var(--live-detail-accent-border) !important;
}

.live-detail-shell :deep([class*="bg-[#061827]"]) {
  background-color: var(--live-detail-panel-bg) !important;
}

.live-detail-shell :deep([class*="bg-[#031322]"]) {
  background-color: var(--live-detail-surface-bg) !important;
}

.live-detail-shell :deep([class*="hover:text-[#9fd4ff]"]:hover) {
  color: var(--live-detail-link-hover) !important;
}
</style>
