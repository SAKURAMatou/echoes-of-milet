<template>
  <section
    :id="`anniversary-chapter-${chapter.id}`"
    class="anniversary-slide anniversary-slide-songs"
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
        <Transition name="release-copy" mode="out-in">
          <div :key="activeRelease.id" class="release-copy">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
              {{ activeRelease.type }} / {{ activeRelease.date }}
            </p>
            <h3 class="mt-2 font-serif text-4xl leading-tight text-[#1f2b35]">
              {{ activeRelease.title }}
            </h3>
            <p class="mt-3 text-sm leading-7 text-[#60717b]">{{ activeRelease.note }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { initImgUrl } from '@/composables/ImgUrlUtil'
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryRelease,
} from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  releases: AnniversaryRelease[]
  activeRelease: AnniversaryRelease
  activeReleaseIndex: number
  lang: AnniversaryLang
  active: boolean
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

const activePalette = computed(() => {
  const palette = palettes[props.activeReleaseIndex % palettes.length]
  return { '--release-accent': palette.accent, '--release-glow': palette.glow }
})

function releaseClass(index: number) {
  if (index === props.activeReleaseIndex) return 'is-current'
  if (index === (props.activeReleaseIndex + 1) % props.releases.length) return 'is-next'
  return 'is-prev'
}

function anniversaryImageUrl(url: string) {
  return url === '/echoes-of-milet-OG.webp' ? url : initImgUrl(url)
}
</script>

<style scoped>
.section-eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #317f8d; }
.section-title { margin-top: 1rem; font-family: Cormorant Garamond, serif; font-size: 3rem; line-height: 1; color: #1d2b36; }
.release-stage { position: relative; min-height: 560px; }
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
.release-copy-enter-active, .release-copy-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.release-copy-enter-from, .release-copy-leave-to { opacity: 0; transform: translateY(8px); }
@keyframes release-light-arrival { 0% { opacity: 0; transform: translate3d(-7%,2%,0); } 24%,68% { opacity: .72; } 100% { opacity: 0; transform: translate3d(7%,-2%,0); } }

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
