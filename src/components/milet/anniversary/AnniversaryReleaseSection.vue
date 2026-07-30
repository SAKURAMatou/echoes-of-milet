<template>
  <section
    :id="`anniversary-chapter-${chapter.id}`"
    class="anniversary-slide anniversary-slide-songs"
    :class="compact ? 'is-compact-layout' : 'is-stage-layout'"
    data-page-scroll-anchor="anniversary-chapter-songs"
    :inert="active ? undefined : true"
    :aria-hidden="active ? undefined : 'true'"
  >
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12"
      :style="activePalette"
    >
      <div class="anniversary-copy">
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title anniversary-heading" data-anniversary-heading tabindex="-1">{{ chapter.title }}</h2>
        <p class="anniversary-body mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{
            lang === 'ja'
              ? '作品ごとの光を、ひとつずつ spotlight に。'
              : '让每一张封面带着自己的光，被 spotlight 依次点亮。'
          }}
        </p>
        <p class="mt-4 text-xs leading-6 text-[#6b7c86]">
          {{ lang === 'ja' ? '表紙を選んで、記憶をひらく。' : '选择封面，手动打开一段作品记忆。' }}
        </p>
      </div>

      <div class="release-stage mobile-scroll-region anniversary-body">
        <div class="release-glow" aria-hidden="true"></div>
        <span
          v-if="motionActive"
          :key="`release-light-${motionCycle}`"
          class="release-light-cycle"
          aria-hidden="true"
        ></span>
        <button
          v-for="(release, index) in releases"
          :key="release.id"
          type="button"
          class="release-cover"
          :class="releaseClass(index)"
          :aria-label="`${release.title}, ${release.type}, ${release.date}`"
          :aria-current="index === activeReleaseIndex ? 'true' : undefined"
          @click="$emit('selectRelease', index)"
        >
          <img
            :src="anniversaryImageUrl(release.cover)"
            :alt="release.title"
            :loading="Math.abs(index - activeReleaseIndex) <= 1 ? 'eager' : 'lazy'"
            decoding="async"
          />
        </button>
        <Transition v-if="activeRelease" name="release-copy" mode="out-in">
          <div :key="activeRelease.id" class="release-copy">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
              {{ activeRelease.type }} / {{ activeRelease.date }}
            </p>
            <h3 class="release-title mt-2 font-serif text-4xl leading-tight text-[#1f2b35]">
              {{ activeRelease.title }}
            </h3>
            <p class="release-note mt-3 text-sm leading-7 text-[#60717b]">{{ activeRelease.note }}</p>
          </div>
        </Transition>
        <p v-else class="release-empty" role="status">
          {{ lang === 'ja' ? 'この年の作品記録は準備中です。' : '这一年的发布物记录仍在整理中。' }}
        </p>
      </div>
    </div>

    <div class="release-stage-fit-shell" aria-hidden="true">
      <span></span>
      <div ref="releaseStageProbe" class="release-stage-fit-probe">
        <div ref="releaseMeasurements" class="release-copy-measurements">
          <div v-for="release in releases" :key="`measure-${release.id}`" class="release-copy-measure">
            <p class="text-xs font-semibold uppercase tracking-[0.22em]">
              {{ release.type }} / {{ release.date }}
            </p>
            <h3 class="release-title mt-2 font-serif text-4xl leading-tight">{{ release.title }}</h3>
            <p class="release-note mt-3 text-sm leading-7">{{ release.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { initImgUrl } from '@/composables/ImgUrlUtil'
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryRelease,
} from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  releases: AnniversaryRelease[]
  activeRelease: AnniversaryRelease | null
  activeReleaseIndex: number
  lang: AnniversaryLang
  active: boolean
  compact: boolean
  motionActive: boolean
  motionCycle: number
}>()

defineEmits<{
  (event: 'selectRelease', index: number): void
}>()

const palettes = [
  { accent: '#317f8d', glow: 'rgba(49, 127, 141, 0.25)' },
  { accent: '#aa8740', glow: 'rgba(221, 190, 95, 0.28)' },
  { accent: '#8c4855', glow: 'rgba(140, 72, 85, 0.2)' },
]

const releaseStageProbe = ref<HTMLElement | null>(null)
const releaseMeasurements = ref<HTMLElement | null>(null)

const activePalette = computed(() => {
  const palette = palettes[Math.max(0, props.activeReleaseIndex) % palettes.length] ?? palettes[0]
  return { '--release-accent': palette.accent, '--release-glow': palette.glow }
})

function releaseClass(index: number) {
  if (index === props.activeReleaseIndex) return 'is-current'
  if (!props.releases.length) return 'is-prev'
  if (index === (props.activeReleaseIndex + 1) % props.releases.length) return 'is-next'
  return 'is-prev'
}

function anniversaryImageUrl(url: string) {
  return url === '/echoes-of-milet-OG.webp' ? url : initImgUrl(url)
}

function measureStageOverflow() {
  const stageProbe = releaseStageProbe.value
  const measurements = releaseMeasurements.value
  if (typeof window === 'undefined' || !stageProbe || !measurements) return null

  const stageRect = stageProbe.getBoundingClientRect()
  const measurementRect = measurements.getBoundingClientRect()
  return measurementRect.bottom > stageRect.bottom + 1
}

defineExpose({ measureStageOverflow })
</script>

<style scoped>
.section-eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #317f8d; }
.section-title { margin-top: 1rem; font-family: Cormorant Garamond, serif; font-size: 3rem; line-height: 1; color: #1d2b36; }
.release-stage { position: relative; min-height: min(680px, calc(100dvh - 8.5rem)); }
.release-glow { position: absolute; inset: 2rem 12% 6.5rem; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.96), var(--release-glow) 54%, transparent 72%); transition: background 260ms ease; }
.release-light-cycle { position: absolute; inset: 1rem 7% 7.5rem; z-index: 2; border-radius: 50%; background: radial-gradient(circle at 24% 44%,rgba(255,255,255,.72),transparent 18%),linear-gradient(112deg,transparent 28%,color-mix(in srgb,var(--release-accent),transparent 66%) 48%,transparent 65%); opacity: 0; pointer-events: none; transform: translate3d(-7%,2%,0); animation: release-light-arrival 1500ms var(--anniversary-ease-out,ease-out) 1 both; }
.release-cover { position: absolute; top: 1.25rem; left: 50%; width: 46%; max-width: 250px; aspect-ratio: 1; overflow: hidden; border-radius: 1.25rem; border: 1px solid rgba(255,255,255,.84); background: white; box-shadow: 0 30px 80px -44px rgba(31,43,53,.92); transition: transform 520ms var(--anniversary-ease-out, ease-out), opacity 320ms ease, filter 320ms ease; transform-origin: center; }
.release-cover img { width: 100%; height: 100%; object-fit: cover; }
.release-cover.is-current { z-index: 3; opacity: 1; transform: translateX(-50%) scale(1.05); box-shadow: 0 28px 74px -36px var(--release-accent); }
.release-cover.is-prev { z-index: 1; opacity: .42; filter: saturate(.72); transform: translateX(-112%) translateY(2.8rem) scale(.72) rotate(-8deg); }
.release-cover.is-next { z-index: 1; opacity: .42; filter: saturate(.72); transform: translateX(12%) translateY(2.8rem) scale(.72) rotate(8deg); }
.release-cover:focus-visible { outline: 3px solid var(--release-accent); outline-offset: 5px; }
.release-cover.is-current:hover, .release-cover.is-current:focus-visible { transform: translateX(-50%) scale(1.05) rotate(1.5deg); }
.release-cover::after { content: ''; position: absolute; inset: -25%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.42), transparent 28%); opacity: 0; transform: translate3d(-8%, 8%, 0); transition: opacity 180ms ease, transform 260ms ease; }
.release-cover:hover::after, .release-cover:focus-visible::after { opacity: 1; transform: translate3d(4%, -3%, 0); }
.release-copy { position: absolute; right: 4%; top: 21rem; left: 4%; z-index: 4; border-top: 1px solid color-mix(in srgb, var(--release-accent), transparent 82%); padding-top: 1.1rem; }
.release-empty { position: absolute; inset: 0; display: grid; place-items: center; color: #60717b; text-align: center; }
.release-title, .release-note { overflow-wrap: anywhere; }
.release-stage-fit-shell { position: fixed; top: 0; left: 50%; z-index: -1; display: grid; box-sizing: border-box; width: 100vw; max-width: 72rem; grid-template-columns: .9fr 1.1fr; gap: 3rem; padding-inline: 2rem; visibility: hidden; pointer-events: none; transform: translateX(-50%); }
.release-stage-fit-probe { position: relative; min-width: 0; height: min(680px, calc(100dvh - 8.5rem)); }
.release-copy-measurements { position: absolute; top: 21rem; right: 4%; left: 4%; display: grid; border-top: 1px solid transparent; padding-top: 1.1rem; }
.release-copy-measure { grid-area: 1 / 1; min-width: 0; }
.release-copy-enter-active, .release-copy-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.release-copy-enter-from, .release-copy-leave-to { opacity: 0; transform: translateY(8px); }
@keyframes release-light-arrival { 0% { opacity: 0; transform: translate3d(-7%,2%,0); } 24%,68% { opacity: .72; } 100% { opacity: 0; transform: translate3d(7%,-2%,0); } }

.anniversary-slide-songs.is-compact-layout .section-title { font-size: 2.45rem; }
.anniversary-slide-songs.is-compact-layout .release-stage { min-height: 0; margin-top: .5rem; }
.anniversary-slide-songs.is-compact-layout .release-glow { inset: .85rem 8% 10.2rem; }
.anniversary-slide-songs.is-compact-layout .release-cover { top: 0; width: 38%; max-width: 170px; }
.anniversary-slide-songs.is-compact-layout .release-cover.is-current { transform: translateX(-50%) scale(.96); }
.anniversary-slide-songs.is-compact-layout .release-cover.is-current:hover,
.anniversary-slide-songs.is-compact-layout .release-cover.is-current:focus-visible { transform: translateX(-50%) scale(.96) rotate(1.5deg); }
.anniversary-slide-songs.is-compact-layout .release-cover.is-prev { transform: translateX(-106%) translateY(2.45rem) scale(.7) rotate(-8deg); }
.anniversary-slide-songs.is-compact-layout .release-cover.is-next { transform: translateX(6%) translateY(2.45rem) scale(.7) rotate(8deg); }
.anniversary-slide-songs.is-compact-layout .release-copy { position: relative; right: auto; top: auto; left: auto; margin-top: 12.6rem; }

@media (min-width: 768px) and (min-height: 641px) and (max-height: 800px) {
  .anniversary-slide-songs.is-stage-layout .release-stage { min-height: min(640px, calc(100dvh - 8.5rem)); }
  .anniversary-slide-songs.is-stage-layout .release-glow { inset: 1.25rem 12% 6rem; }
  .anniversary-slide-songs.is-stage-layout .release-light-cycle { inset: .5rem 7% 7rem; }
  .anniversary-slide-songs.is-stage-layout .release-cover { top: .75rem; max-width: 220px; }
  .anniversary-slide-songs.is-stage-layout .release-copy { top: 18rem; }
  .release-stage-fit-probe { height: min(640px, calc(100dvh - 8.5rem)); }
  .release-copy-measurements { top: 18rem; }
  .anniversary-slide-songs.is-stage-layout .release-title,
  .release-stage-fit-probe .release-title { font-size: clamp(2rem, 4.7dvh, 2.25rem); line-height: 1.1; }
  .anniversary-slide-songs.is-stage-layout .release-note,
  .release-stage-fit-probe .release-note { line-height: 1.55rem; }
}

@media (max-width: 767px), (max-height: 640px) {
  .section-title { font-size: 2.45rem; }
  .release-stage { min-height: 0; margin-top: .5rem; }
  .release-glow { inset: .85rem 8% 10.2rem; }
  .release-cover { top: 0; width: 38%; max-width: 170px; }
  .release-cover.is-current { transform: translateX(-50%) scale(.96); }
  .release-cover.is-current:hover, .release-cover.is-current:focus-visible { transform: translateX(-50%) scale(.96) rotate(1.5deg); }
  .release-cover.is-prev { transform: translateX(-106%) translateY(2.45rem) scale(.7) rotate(-8deg); }
  .release-cover.is-next { transform: translateX(6%) translateY(2.45rem) scale(.7) rotate(8deg); }
  .release-copy { position: relative; right: auto; top: auto; left: auto; margin-top: 12.6rem; }
}

@media (prefers-reduced-motion: reduce) {
  .release-cover, .release-cover::after, .release-glow, .release-light-cycle, .release-copy-enter-active, .release-copy-leave-active { animation: none; transition: none; }
}
</style>
