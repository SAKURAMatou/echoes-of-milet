<template>
  <section
    :id="`anniversary-chapter-${chapter.id}`"
    class="anniversary-slide anniversary-slide-photos"
    data-page-scroll-anchor="anniversary-chapter-photos"
    :inert="active ? undefined : true"
    :aria-hidden="active ? undefined : 'true'"
  >
    <div class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-5 px-5 sm:px-8 md:grid-cols-[0.82fr_1.18fr] md:gap-10">
      <div class="anniversary-copy">
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title anniversary-heading" data-anniversary-heading tabindex="-1">{{ chapter.title }}</h2>
        <p class="anniversary-body mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{ lang === 'ja' ? '毎月届く milet の日を、echo constellation として残します。' : '把每个月等来的 milet の日，连成一份 echo constellation 周年礼物。' }}
        </p>
        <div class="anniversary-actions mt-6 flex flex-wrap gap-3">
          <button class="primary-action" type="button" @click="$emit('replay')">
            {{ lang === 'ja' ? 'Replay memories' : '重播回忆' }}
          </button>
          <RouterLink class="secondary-action" :to="{ name: 'miletAnniversary', params: { lang: routeLang } }">
            {{ lang === 'ja' ? 'Back to archive' : '返回周年归档' }}
          </RouterLink>
        </div>
      </div>

      <div
        class="photo-stage mobile-scroll-region anniversary-body"
        :class="{ 'is-assembled': assembled, 'is-playing': !assembled, 'is-resetting': resetting }"
        @pointerenter="$emit('interactionPause')"
        @pointerleave="$emit('interactionResume')"
      >
        <svg class="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path pathLength="1" d="M10 38 C24 13 34 61 48 34 S71 60 90 29 M20 73 C36 50 43 85 59 62 S78 85 88 70" />
          <path pathLength="1" class="constellation-m" d="M32 65 L41 39 L50 61 L59 39 L68 65" />
        </svg>
        <div class="photo-center-copy" :class="assembled ? 'is-visible' : ''">
          <span>Happy Anniversary</span>
          <strong>milet {{ anniversaryNo }}</strong>
        </div>
        <figure
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="photo-frame"
          :class="photoFrameClass(index)"
          :style="photoStyle(photo)"
        >
          <img
            :src="anniversaryImageUrl(photo.image)"
            :alt="photo.alt"
            :loading="motionActive ? 'eager' : 'lazy'"
            decoding="async"
          />
          <figcaption><span>{{ photo.month }}</span>{{ assembled ? 'milet の日' : photo.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { initImgUrl } from '@/composables/ImgUrlUtil'
import type { AnniversaryChapter, AnniversaryLang, AnniversaryPhoto } from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  photos: AnniversaryPhoto[]
  currentPhotoIndex: number
  assembled: boolean
  resetting: boolean
  lang: AnniversaryLang
  routeLang: string
  anniversaryNo: number
  active: boolean
  motionActive: boolean
}>()

defineEmits<{
  (event: 'replay'): void
  (event: 'interactionPause'): void
  (event: 'interactionResume'): void
}>()

function photoFrameClass(index: number) {
  return {
    'is-visible': props.assembled || index <= props.currentPhotoIndex,
    'is-active': !props.assembled && index === props.currentPhotoIndex,
    'is-past': !props.assembled && index < props.currentPhotoIndex,
  }
}

function photoStyle(photo: AnniversaryPhoto) {
  return { '--x': photo.final.x, '--y': photo.final.y, '--w': photo.final.w, '--r': photo.final.r, '--mx': photo.final.mx, '--my': photo.final.my, '--mw': photo.final.mw, '--mr': photo.final.mr }
}

function anniversaryImageUrl(url: string) {
  return url === '/echoes-of-milet-OG.webp' ? url : initImgUrl(url)
}
</script>

<style scoped>
.section-eyebrow { font-size: .75rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #317f8d; }
.section-title { margin-top: 1rem; font-family: Cormorant Garamond, serif; font-size: 3rem; line-height: 1; color: #1d2b36; }
.primary-action, .secondary-action { display: inline-flex; min-height: 2.75rem; align-items: center; justify-content: center; border: 1px solid rgba(49,127,141,.18); background: rgba(255,255,255,.82); padding: 0 1.2rem; font-size: .82rem; font-weight: 800; color: #276d7b; transition: transform 180ms ease, background 180ms ease; }
.primary-action { clip-path: polygon(0 22%,84% 22%,100% 50%,84% 78%,0 78%,9% 50%); padding-inline: 1.55rem 1.9rem; }
.secondary-action { border-radius: 999px; }
.primary-action:hover, .secondary-action:hover { transform: translateY(-2px); background: white; }
.primary-action:focus-visible, .secondary-action:focus-visible { outline: 3px solid rgba(39,109,123,.48); outline-offset: 4px; }
.photo-stage { position: relative; min-height: 500px; overflow: hidden; border-radius: 2rem; border: 1px solid rgba(255,255,255,.72); background: linear-gradient(135deg,rgba(255,255,255,.8),rgba(224,244,246,.46)), repeating-linear-gradient(90deg,rgba(49,127,141,.08) 0,rgba(49,127,141,.08) 1px,transparent 1px,transparent 18px); box-shadow: 0 24px 80px -52px rgba(31,43,53,.92); }
.constellation-lines { position: absolute; inset: 8%; z-index: 1; width: 84%; height: 84%; overflow: visible; opacity: 0; transition: opacity 420ms ease 380ms; }
.constellation-lines path { fill: none; stroke: rgba(49,127,141,.22); stroke-width: .28; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; }
.constellation-lines .constellation-m { stroke: rgba(202,162,54,.28); stroke-width: .38; }
.photo-stage.is-assembled .constellation-lines { opacity: 1; }
.photo-stage.is-assembled .constellation-lines path { animation: draw-constellation 620ms var(--anniversary-ease-out, ease-out) 260ms 1 both; }
.photo-center-copy { position: absolute; left: 50%; top: 50%; z-index: 3; display: flex; width: 13rem; height: 13rem; flex-direction: column; align-items: center; justify-content: center; border-radius: 999px; background: rgba(255,255,255,.82); color: #276d7b; opacity: 0; text-align: center; transform: translate(-50%,-50%) scale(.9); transition: opacity 320ms ease 560ms, transform 420ms var(--anniversary-ease-out, ease-out) 560ms; }
.photo-center-copy.is-visible { opacity: 1; transform: translate(-50%,-50%) scale(1); }
.photo-center-copy span { font-size: .72rem; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.photo-center-copy strong { margin-top: .35rem; font-family: Cormorant Garamond, serif; font-size: 2.6rem; line-height: 1; }
.photo-frame { position: absolute; left: 50%; top: 52%; z-index: 2; width: 34%; max-width: 230px; aspect-ratio: 4/5; overflow: hidden; border-radius: 1.2rem; border: 1px solid rgba(255,255,255,.86); background: white; opacity: 0; transform: translate(-50%,-50%) scale(.78); box-shadow: 0 26px 70px -46px rgba(31,43,53,.92); transition: left 620ms var(--anniversary-ease-out, ease-out), top 620ms var(--anniversary-ease-out, ease-out), width 620ms var(--anniversary-ease-out, ease-out), opacity 220ms ease, transform 620ms var(--anniversary-ease-out, ease-out); }
.photo-frame img { width: 100%; height: 100%; object-fit: cover; }
.photo-frame figcaption { position: absolute; inset-x: 0; bottom: 0; background: linear-gradient(180deg,transparent,rgba(17,24,39,.78)); padding: 2.8rem .7rem .7rem; font-size: .68rem; line-height: 1.35; color: white; }
.photo-frame figcaption span { display: block; font-weight: 800; letter-spacing: .18em; }
.photo-frame.is-visible { opacity: 1; }
.photo-frame.is-active { z-index: 4; transform: translate(-50%,-50%) scale(1) rotate(-2deg); }
.photo-frame.is-active::after { content: ''; position: absolute; inset: -20%; border: 1px solid rgba(221,190,95,.65); border-radius: 50%; animation: placement-wave 420ms ease-out 1; }
.photo-frame.is-past { opacity: .42; transform: translate(-50%,-50%) scale(.62) rotate(8deg); }
.photo-stage.is-assembled .photo-frame { left: var(--x); top: var(--y); width: var(--w); transform: rotate(var(--r)); }
.photo-stage.is-resetting .constellation-lines,
.photo-stage.is-resetting .photo-center-copy,
.photo-stage.is-resetting .photo-frame { animation: none !important; transition: none !important; }
@keyframes draw-constellation { to { stroke-dashoffset: 0; } }
@keyframes placement-wave { from { opacity: .8; transform: scale(.55); } to { opacity: 0; transform: scale(1); } }

@media (max-width: 767px), (max-height: 640px) {
  .section-title { font-size: 2.45rem; }
  .photo-stage { min-height: 430px; height: min(72dvh,520px); border-radius: 1.3rem; }
  .photo-center-copy { width: 9.5rem; height: 9.5rem; }
  .photo-center-copy strong { font-size: 2rem; }
  .photo-frame { width: 40%; max-width: 165px; }
  .photo-stage.is-assembled .photo-frame { left: var(--mx); top: var(--my); width: var(--mw); transform: rotate(var(--mr)); }
}

@media (prefers-reduced-motion: reduce) {
  .constellation-lines, .constellation-lines path, .photo-center-copy, .photo-frame, .photo-frame.is-active::after { animation: none !important; transition: none !important; }
  .photo-stage.is-assembled .constellation-lines path { stroke-dashoffset: 0; }
}
</style>
