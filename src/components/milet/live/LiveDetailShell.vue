<template>
  <div
    id="main-content"
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
            <RouterLink :to="zhRoute" class="transition hover:text-[var(--live-detail-link-hover)]">ZH</RouterLink>
            <span class="opacity-50">/</span>
            <RouterLink :to="jaRoute" class="transition hover:text-[var(--live-detail-link-hover)]">JA</RouterLink>
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

import { liveDetailThemes, normalizeLiveDetailTheme } from '@/config/liveDisplay'

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

const normalizedThemePreset = computed(() => normalizeLiveDetailTheme(props.themePreset))
const theme = computed(() => liveDetailThemes[normalizedThemePreset.value].tokens)
const themeClass = computed(() => `live-detail-shell--${normalizedThemePreset.value}`)
const themeStyle = computed<Record<string, string>>(() => ({
  colorScheme: theme.value.colorScheme,
  backgroundColor: theme.value.shell,
  '--live-detail-page-bg': theme.value.pageBg,
  '--live-detail-title': theme.value.title,
  '--live-detail-title-soft': theme.value.titleSoft,
  '--live-detail-text': theme.value.text,
  '--live-detail-muted': theme.value.muted,
  '--live-detail-subtle': theme.value.subtle,
  '--live-detail-accent': theme.value.accent,
  '--live-detail-accent-strong': theme.value.accentStrong,
  '--live-detail-accent-border': theme.value.accentBorder,
  '--live-detail-panel-bg': theme.value.panelBg,
  '--live-detail-surface-bg': theme.value.surfaceBg,
  '--live-detail-link-hover': theme.value.linkHover,
  '--live-detail-line': theme.value.line,
  '--live-detail-glow': theme.value.glow,
  '--live-detail-route': theme.value.route,
  '--live-detail-venue-line-art-bg': theme.value.venueLineArtBg,
  '--live-detail-venue-line-art-border': theme.value.venueLineArtBorder,
  '--live-detail-venue-line-art-filter': theme.value.venueLineArtFilter,
  '--live-detail-venue-line-art-opacity': theme.value.venueLineArtOpacity,
  '--live-detail-venue-line-art-shadow': theme.value.venueLineArtShadow,
  '--live-detail-venue-line-art-blend-mode': theme.value.venueLineArtBlendMode,
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

.live-detail-shell :deep([class*="text-[#f4d397]"]) {
  color: var(--live-detail-accent-strong) !important;
}

.live-detail-shell :deep([class*="text-[#9fd4ff]"]) {
  color: var(--live-detail-link-hover) !important;
}

.live-detail-shell :deep([class*="border-[#d9b77c]"]) {
  border-color: var(--live-detail-accent-border) !important;
}

.live-detail-shell :deep([class*="border-[#86bde6]"]) {
  border-color: var(--live-detail-line) !important;
}

.live-detail-shell :deep([class*="border-white/10"]),
.live-detail-shell :deep([class*="border-white/16"]),
.live-detail-shell :deep([class*="border-white/[0.08]"]) {
  border-color: var(--live-detail-line) !important;
}

.live-detail-shell :deep([class*="bg-[#061827]"]) {
  background-color: var(--live-detail-panel-bg) !important;
}

.live-detail-shell :deep([class*="bg-[#031322]"]) {
  background-color: var(--live-detail-surface-bg) !important;
}

.live-detail-shell :deep([class*="bg-[#041827]"]),
.live-detail-shell :deep([class*="bg-[#061a2a]"]),
.live-detail-shell :deep([class*="bg-[#09243a]"]) {
  background-color: var(--live-detail-surface-bg) !important;
}

.live-detail-shell :deep([class*="hover:text-[#9fd4ff]"]:hover) {
  color: var(--live-detail-link-hover) !important;
}

.live-detail-shell :deep(.live-venue-line-art-frame) {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid var(--live-detail-venue-line-art-border);
  border-radius: 0.75rem;
  background: var(--live-detail-venue-line-art-bg);
  box-shadow: var(--live-detail-venue-line-art-shadow);
}

.live-detail-shell :deep(.live-venue-line-art-frame)::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--live-detail-accent-strong) 18%, transparent), transparent 36%),
    linear-gradient(135deg, color-mix(in srgb, var(--live-detail-title) 8%, transparent), transparent 44%);
  opacity: 0.72;
}

.live-detail-shell :deep(.live-venue-line-art-img) {
  display: block;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
  opacity: var(--live-detail-venue-line-art-opacity);
  filter: var(--live-detail-venue-line-art-filter);
  mix-blend-mode: var(--live-detail-venue-line-art-blend-mode);
}

.live-detail-shell :deep(.live-venue-line-art-frame--bare) {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.live-detail-shell :deep(.live-venue-line-art-frame--bare)::before {
  display: none;
}

.live-detail-shell--miles301 {
  font-family:
    ui-monospace, 'SFMono-Regular', 'Cascadia Mono', 'Yu Gothic UI', 'PingFang SC',
    'Noto Sans CJK SC', monospace;
}

.live-detail-shell--miles301 header {
  position: sticky;
  box-shadow:
    inset 0 -1px 0 rgba(243, 107, 43, 0.26),
    0 4px 0 rgba(33, 169, 223, 0.72);
}

.live-detail-shell--miles301 main::before,
.live-detail-shell--miles301 main::after {
  content: '';
  position: absolute;
  z-index: 1;
  pointer-events: none;
}

.live-detail-shell--miles301 main::before {
  inset: 1rem;
  border: 2px solid rgba(243, 107, 43, 0.78);
}

.live-detail-shell--miles301 main::after {
  inset: 1.45rem;
  border: 2px solid rgba(33, 169, 223, 0.78);
}

.live-detail-shell--miles301 main > [aria-hidden='true'] {
  background-image:
    radial-gradient(circle, rgba(23, 27, 30, 0.085) 0.7px, transparent 0.8px),
    linear-gradient(115deg, transparent 0 73%, rgba(33, 169, 223, 0.035) 73% 73.15%, transparent 73.15%),
    linear-gradient(65deg, transparent 0 21%, rgba(243, 107, 43, 0.03) 21% 21.15%, transparent 21.15%) !important;
  background-size: 6px 6px, 100% 100%, 100% 100% !important;
  opacity: 0.38 !important;
  -webkit-mask-image: linear-gradient(90deg, #000, transparent 28%, transparent 72%, #000);
  mask-image: linear-gradient(90deg, #000, transparent 28%, transparent 72%, #000);
}

.live-detail-shell--miles301 :deep([class*='font-serif']) {
  font-family:
    ui-monospace, 'SFMono-Regular', 'Cascadia Mono', 'Yu Gothic UI', 'PingFang SC',
    'Noto Sans CJK SC', monospace !important;
}

.live-detail-shell--miles301 :deep(h1) {
  letter-spacing: -0.055em;
  text-shadow:
    2px 1px 0 rgba(243, 107, 43, 0.72),
    -2px -1px 0 rgba(33, 169, 223, 0.72);
}

.live-detail-shell--miles301 :deep(section[class*='rounded-lg']),
.live-detail-shell--miles301 :deep(div[class*='rounded-lg']) {
  border-radius: 0.125rem !important;
}

.live-detail-shell--miles301 :deep(section[class*='border'][class*='rounded-lg']) {
  box-shadow:
    3px 3px 0 rgba(33, 169, 223, 0.14),
    -2px -2px 0 rgba(243, 107, 43, 0.08) !important;
}

.live-detail-shell--miles301 :deep([class*='rounded-md']) {
  border-radius: 0.125rem !important;
}

.live-detail-shell--miles301 :deep([class*='rounded-full'][class*='px-3']) {
  border-radius: 0 !important;
  background: rgba(255, 254, 250, 0.82);
  box-shadow: 2px 2px 0 rgba(33, 169, 223, 0.16);
}

.live-detail-shell--miles301 :deep(img[class*='rounded']) {
  border-radius: 0.125rem !important;
}

.live-detail-shell--miles301 :deep([class~='text-white']) {
  color: var(--live-detail-title) !important;
}

.live-detail-shell--miles301 :deep(.live-venue-line-art-frame) {
  border-radius: 0.125rem;
}

.live-detail-shell--miles301 :deep(a),
.live-detail-shell--miles301 :deep(button) {
  transition-duration: 160ms;
}

.live-detail-shell--miles301 :deep(a:focus-visible),
.live-detail-shell--miles301 :deep(button:focus-visible) {
  outline: 2px solid var(--live-detail-accent-strong);
  outline-offset: 3px;
  box-shadow: 3px 3px 0 rgba(243, 107, 43, 0.46);
}

.live-detail-shell--5am2023 {
  font-family:
    'Iowan Old Style', 'Palatino Linotype', 'Yu Mincho', 'Hiragino Mincho ProN',
    'Songti SC', serif;
}

.live-detail-shell--5am2023 header {
  box-shadow:
    inset 0 -1px 0 rgba(247, 248, 239, 0.72),
    0 8px 24px -22px rgba(29, 41, 39, 0.72);
}

.live-detail-shell--5am2023 main::before {
  content: '';
  position: absolute;
  inset: 1rem;
  z-index: 1;
  pointer-events: none;
  border: 6px double rgba(62, 82, 77, 0.5);
}

.live-detail-shell--5am2023 main > [aria-hidden='true'] {
  background-image:
    repeating-radial-gradient(ellipse at 72% 14%, transparent 0 3.6rem, rgba(70, 91, 87, 0.11) 3.66rem 3.72rem, transparent 3.78rem 7.4rem),
    radial-gradient(circle at 72% 14%, rgba(255, 250, 219, 0.74), transparent 13rem),
    linear-gradient(98deg, transparent 0 68%, rgba(178, 153, 103, 0.12) 68.1% 68.2%, transparent 68.3%) !important;
  background-size: 100% 100% !important;
  opacity: 0.74 !important;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 42%, #000);
  mask-image: linear-gradient(90deg, transparent, #000 42%, #000);
}

.live-detail-shell--5am2023 :deep([class*='font-serif']) {
  font-family:
    'Iowan Old Style', 'Palatino Linotype', 'Yu Mincho', 'Hiragino Mincho ProN',
    'Songti SC', serif !important;
}

.live-detail-shell--5am2023 :deep(h1) {
  font-weight: 400;
  letter-spacing: -0.045em;
  text-shadow: 0 1px 0 rgba(255, 255, 246, 0.92);
}

.live-detail-shell--5am2023 :deep(section[class*='rounded-lg']),
.live-detail-shell--5am2023 :deep(div[class*='rounded-lg']) {
  border-radius: 0.2rem !important;
}

.live-detail-shell--5am2023 :deep(section[class*='border'][class*='rounded-lg']) {
  box-shadow:
    inset 0 0 0 4px rgba(249, 248, 237, 0.46),
    0 16px 34px -30px rgba(35, 53, 49, 0.62) !important;
}

.live-detail-shell--5am2023 :deep([class*='rounded-md']),
.live-detail-shell--5am2023 :deep([class*='rounded-full'][class*='px-3']),
.live-detail-shell--5am2023 :deep(img[class*='rounded']),
.live-detail-shell--5am2023 :deep(.live-venue-line-art-frame) {
  border-radius: 0.2rem !important;
}

.live-detail-shell--5am2023 :deep([class*='rounded-full'][class*='px-3']) {
  border: 1px solid rgba(62, 82, 77, 0.36);
  background: rgba(239, 243, 234, 0.84);
}

.live-detail-shell--5am2023 :deep([class~='text-white']) {
  color: var(--live-detail-title) !important;
}

.live-detail-shell--5am2023 :deep(a:focus-visible),
.live-detail-shell--5am2023 :deep(button:focus-visible) {
  outline: 2px solid var(--live-detail-accent-strong);
  outline-offset: 3px;
}

.live-detail-shell--unzepp2022 {
  font-family:
    'Arial Narrow', 'Avenir Next Condensed', 'Yu Gothic UI', 'Hiragino Kaku Gothic ProN',
    'PingFang SC', sans-serif;
}

.live-detail-shell--unzepp2022 header {
  box-shadow:
    inset 0 -2px 0 rgba(255, 248, 244, 0.72),
    0 7px 0 rgba(137, 0, 39, 0.32);
}

.live-detail-shell--unzepp2022 header :deep(a),
.live-detail-shell--unzepp2022 header :deep(span) {
  color: #fff8f4 !important;
}

.live-detail-shell--unzepp2022 main::before {
  content: '';
  position: absolute;
  inset: 1rem;
  z-index: 1;
  pointer-events: none;
  border: 2px solid rgba(255, 248, 244, 0.72);
  box-shadow: 6px 6px 0 rgba(134, 0, 42, 0.2);
}

.live-detail-shell--unzepp2022 main > [aria-hidden='true'] {
  background-image:
    repeating-radial-gradient(ellipse at 38% 18%, transparent 0 2.1rem, rgba(255, 248, 244, 0.26) 2.16rem 2.22rem, transparent 2.28rem 4.4rem),
    repeating-radial-gradient(ellipse at 82% 70%, transparent 0 2.7rem, rgba(255, 248, 244, 0.2) 2.76rem 2.82rem, transparent 2.88rem 5.6rem) !important;
  background-size: 100% 100% !important;
  opacity: 0.72 !important;
}

.live-detail-shell--unzepp2022 :deep([class*='font-serif']) {
  font-family:
    'Arial Narrow', 'Avenir Next Condensed', 'Yu Gothic UI', 'Hiragino Kaku Gothic ProN',
    'PingFang SC', sans-serif !important;
}

.live-detail-shell--unzepp2022 :deep(h1) {
  font-family:
    Impact, Haettenschweiler, 'Arial Narrow Bold', 'Yu Gothic UI', 'PingFang SC',
    sans-serif;
  font-weight: 700;
  letter-spacing: -0.025em;
  text-transform: uppercase;
  text-shadow: 2px 2px 0 rgba(255, 248, 244, 0.58);
}

.live-detail-shell--unzepp2022 :deep(section[class*='rounded-lg']),
.live-detail-shell--unzepp2022 :deep(div[class*='rounded-lg']),
.live-detail-shell--unzepp2022 :deep([class*='rounded-md']),
.live-detail-shell--unzepp2022 :deep(img[class*='rounded']),
.live-detail-shell--unzepp2022 :deep(.live-venue-line-art-frame) {
  border-radius: 0 !important;
}

.live-detail-shell--unzepp2022 :deep(section[class*='border'][class*='rounded-lg']) {
  border-color: rgba(73, 29, 40, 0.48) !important;
  box-shadow: 6px 6px 0 rgba(139, 0, 42, 0.16) !important;
}

.live-detail-shell--unzepp2022 :deep([class*='rounded-full'][class*='px-3']) {
  border-radius: 0 !important;
  border: 1px solid rgba(73, 29, 40, 0.54);
  background: rgba(255, 244, 238, 0.86);
  box-shadow: 3px 3px 0 rgba(139, 0, 42, 0.18);
}

.live-detail-shell--unzepp2022 :deep([class~='text-white']) {
  color: var(--live-detail-title) !important;
}

.live-detail-shell--unzepp2022 :deep(a),
.live-detail-shell--unzepp2022 :deep(button) {
  transition-duration: 140ms;
}

.live-detail-shell--unzepp2022 :deep(a:focus-visible),
.live-detail-shell--unzepp2022 :deep(button:focus-visible) {
  outline: 2px solid #fff8f4;
  outline-offset: 3px;
  box-shadow: 4px 4px 0 rgba(139, 0, 42, 0.48);
}

.live-detail-shell--green-lights header {
  box-shadow:
    inset 0 -1px 0 rgba(230, 255, 114, 0.035),
    0 14px 42px -34px rgba(199, 244, 58, 0.42);
}

.live-detail-shell--green-lights main::before,
.live-detail-shell--green-lights main::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.live-detail-shell--green-lights main::before {
  background:
    repeating-linear-gradient(118deg, transparent 0 3.25rem, rgba(154, 194, 69, 0.075) 3.3rem 3.38rem, transparent 3.43rem 7.5rem),
    repeating-linear-gradient(62deg, transparent 0 4.4rem, rgba(45, 103, 55, 0.09) 4.45rem 4.58rem, transparent 4.63rem 9rem);
  opacity: 0.78;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, transparent 23%, transparent 77%, #000 100%);
  mask-image: linear-gradient(90deg, #000 0%, transparent 23%, transparent 77%, #000 100%);
}

.live-detail-shell--green-lights main::after {
  background:
    linear-gradient(90deg, rgba(194, 239, 55, 0.055), transparent 12%, transparent 88%, rgba(194, 239, 55, 0.045)),
    linear-gradient(180deg, rgba(230, 255, 114, 0.025), transparent 18%);
}

.live-detail-shell--green-lights main > [aria-hidden='true'] {
  display: none;
}

.live-detail-shell--green-lights :deep(.live-venue-line-art-frame) {
  box-shadow:
    inset 0 0 0 1px rgba(230, 255, 114, 0.03),
    inset 0 -24px 48px -42px rgba(199, 244, 58, 0.42),
    0 18px 48px -36px rgba(199, 244, 58, 0.72);
}

.live-detail-shell--green-lights :deep(.live-venue-line-art-frame)::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, rgba(230, 255, 114, 0.075), transparent 34%);
}

.live-detail-shell--green-lights :deep(h1) {
  text-shadow:
    0 1px 0 rgba(230, 255, 114, 0.14),
    0 0 28px rgba(199, 244, 58, 0.09);
}

.live-detail-shell--green-lights :deep(a),
.live-detail-shell--green-lights :deep(button) {
  transition-duration: 200ms;
}

.live-detail-shell--green-lights :deep(a:focus-visible),
.live-detail-shell--green-lights :deep(button:focus-visible) {
  outline: 2px solid var(--live-detail-accent-strong);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .live-detail-shell--miles301 :deep(*),
  .live-detail-shell--miles301 :deep(*::before),
  .live-detail-shell--miles301 :deep(*::after),
  .live-detail-shell--5am2023 :deep(*),
  .live-detail-shell--5am2023 :deep(*::before),
  .live-detail-shell--5am2023 :deep(*::after),
  .live-detail-shell--unzepp2022 :deep(*),
  .live-detail-shell--unzepp2022 :deep(*::before),
  .live-detail-shell--unzepp2022 :deep(*::after),
  .live-detail-shell--green-lights :deep(*),
  .live-detail-shell--green-lights :deep(*::before),
  .live-detail-shell--green-lights :deep(*::after) {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 639px) {
  .live-detail-shell--miles301 main::before {
    inset: 0.4rem;
  }

  .live-detail-shell--miles301 main::after {
    inset: 0.75rem;
  }

  .live-detail-shell--miles301 :deep(h1) {
    text-shadow:
      1.5px 1px 0 rgba(243, 107, 43, 0.68),
      -1.5px -1px 0 rgba(33, 169, 223, 0.68);
  }

  .live-detail-shell--5am2023 main::before,
  .live-detail-shell--unzepp2022 main::before {
    inset: 0.45rem;
  }

  .live-detail-shell--unzepp2022 :deep(h1) {
    text-shadow: 1.5px 1.5px 0 rgba(255, 248, 244, 0.52);
  }
}
</style>
