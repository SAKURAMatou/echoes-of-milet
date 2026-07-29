<template>
  <section
    :id="`anniversary-chapter-${chapter.id}`"
    class="anniversary-slide anniversary-slide-year"
    data-page-scroll-anchor="anniversary-chapter-year"
    :inert="active ? undefined : true"
    :aria-hidden="active ? undefined : 'true'"
    @pointerenter="$emit('interactionPause')"
    @pointerleave="$emit('interactionResume')"
    @focusin="$emit('interactionPause')"
    @focusout="handleFocusOut"
  >
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-7 px-5 sm:px-8 md:grid-cols-[0.86fr_1.14fr] md:gap-12"
    >
      <div class="anniversary-copy">
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title anniversary-heading" data-anniversary-heading tabindex="-1">{{ chapter.title }}</h2>
        <p class="anniversary-body mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{
            lang === 'ja'
              ? '数えるためではなく、もう一度うれしかった瞬間に会うための year notes。'
              : '不是为了数清发生了多少事，而是再见一遍那些让人心动的时刻。'
          }}
        </p>
      </div>

      <div class="year-panel mobile-scroll-region anniversary-body">
        <Transition name="moment-echo" mode="out-in">
          <div
            :key="`${activeMoment.id}-${momentEchoKey}`"
            class="moment-content"
            :class="{ 'manual-echo': manualEchoActive }"
          >
            <div class="moment-heading">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
                {{ activeMoment.date }}
              </p>
              <div class="moment-title-row">
                <h3 class="font-serif text-3xl leading-tight text-[#263542] sm:text-4xl">
                  {{ activeMoment.title }}
                </h3>
                <div class="moment-actions">
                  <span class="moment-label rounded-full border border-[#d9c27b] px-3 py-1 text-xs font-semibold uppercase text-[#8a6e1b]">
                    {{ activeMoment.label }}
                  </span>
                  <button
                    class="moment-toggle"
                    type="button"
                    :aria-pressed="paused"
                    :aria-label="paused ? pauseText.resumeLabel : pauseText.pauseLabel"
                    @click="$emit('togglePause')"
                  >
                    {{ paused ? pauseText.resume : pauseText.pause }}
                  </button>
                </div>
              </div>
            </div>
            <p class="mt-5 text-sm leading-7 text-[#586872] sm:text-base">
              {{ activeMoment.body }}
            </p>
          </div>
        </Transition>

        <div class="moment-progress-list" aria-label="Year moments">
          <button
            v-for="(moment, index) in timeline"
            :key="moment.id"
            type="button"
            class="moment-progress"
            :class="index === activeMomentIndex ? 'is-active' : ''"
            :aria-current="index === activeMomentIndex ? 'step' : undefined"
            :aria-label="`${moment.date}: ${moment.title}`"
            @click="$emit('selectMoment', index)"
          >
            <span>{{ moment.date.replace(/^\d{4}[-\s]?/, '') }}</span>
            <i :style="index === activeMomentIndex ? progressStyle(progress) : undefined"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryTimelineMoment,
} from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  timeline: AnniversaryTimelineMoment[]
  activeMoment: AnniversaryTimelineMoment
  activeMomentIndex: number
  progress: number
  paused: boolean
  lang: AnniversaryLang
  active: boolean
  momentEchoKey: number
  manualEchoActive: boolean
}>()

const emit = defineEmits<{
  (event: 'selectMoment', index: number): void
  (event: 'togglePause'): void
  (event: 'interactionPause'): void
  (event: 'interactionResume'): void
}>()

const pauseText = computed(() =>
  props.lang === 'ja'
    ? { pause: 'pause', resume: 'resume', pauseLabel: '自動再生を一時停止', resumeLabel: '自動再生を再開' }
    : { pause: '暂停', resume: '继续', pauseLabel: '暂停自动播放', resumeLabel: '继续自动播放' },
)

function progressStyle(value: number) {
  return { '--progress': `${Math.max(0, Math.min(100, value))}%` }
}

function handleFocusOut(event: FocusEvent) {
  const current = event.currentTarget as HTMLElement
  const next = event.relatedTarget
  if (!(next instanceof Node) || !current.contains(next)) emit('interactionResume')
}
</script>

<style scoped>
.section-eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #317f8d; }
.section-title { margin-top: 1rem; font-family: Cormorant Garamond, serif; font-size: 3rem; line-height: 1; color: #1d2b36; }
.year-panel { border-radius: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.78); background: rgba(255, 255, 255, 0.68); padding: 1.5rem; box-shadow: 0 24px 70px -48px rgba(31, 43, 53, 0.85); backdrop-filter: blur(12px); }
.moment-title-row { display: flex; min-width: 0; align-items: flex-start; justify-content: space-between; gap: 1.25rem; margin-top: 0.75rem; }
.moment-title-row h3 { min-width: 0; }
.moment-actions { display: flex; flex: 0 0 auto; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 0.5rem; }
.moment-label { flex: 0 0 auto; white-space: nowrap; }
.moment-toggle { min-height: 2.75rem; border: 1px solid rgba(49, 127, 141, 0.22); border-radius: 999px; background: rgba(255, 255, 255, 0.78); padding: 0 1rem; color: #276d7b; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; transition: background 160ms ease, color 160ms ease; }
.moment-toggle:hover { background: rgba(39, 109, 123, 0.92); color: white; }
.moment-toggle:focus-visible, .moment-progress:focus-visible { outline: 3px solid rgba(49, 127, 141, 0.38); outline-offset: 3px; }
.moment-progress-list { position: relative; margin-top: 1.2rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
.moment-progress-list::before { content: ''; position: absolute; top: 2.72rem; right: 5%; left: 5%; height: 1px; background: linear-gradient(90deg, rgba(49,127,141,.18), rgba(221,190,95,.45)); }
.moment-progress { position: relative; min-width: 0; min-height: 2.75rem; border: none; background: transparent; padding: 0; text-align: left; }
.moment-progress span { display: block; margin-bottom: 0.45rem; overflow: hidden; color: #7a8a94; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.moment-progress i { position: relative; z-index: 1; display: block; height: 0.42rem; overflow: hidden; border-radius: 999px; background: rgba(39, 109, 123, 0.12); }
.moment-progress i::before { content: ''; display: block; width: var(--progress, 0%); height: 100%; border-radius: inherit; background: linear-gradient(90deg, #276d7b, rgba(221, 190, 95, 0.82)); transition: width 80ms linear; }
.moment-progress.is-active span { color: #276d7b; }
.moment-progress.is-active i { box-shadow: 0 0 0 4px rgba(221, 190, 95, 0.12); }
.moment-content { position: relative; }
.moment-content.manual-echo::before, .moment-content.manual-echo::after { content: ''; position: absolute; inset: -.6rem; pointer-events: none; border: 1px solid rgba(49,127,141,.28); border-radius: 1.1rem; animation: manual-moment-echo 460ms ease-out 1 both; }
.moment-content.manual-echo::after { border-color: rgba(221,190,95,.35); animation-delay: 70ms; }
.moment-echo-enter-active, .moment-echo-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.moment-echo-enter-from, .moment-echo-leave-to { opacity: 0; transform: translateY(8px); }
@keyframes manual-moment-echo { from { opacity: .72; transform: scale(.97); } to { opacity: 0; transform: scale(1.025); } }

@media (max-width: 767px), (max-height: 640px) {
  .section-title { font-size: 2.45rem; }
  .year-panel { min-height: 0; margin-top: 0.8rem; padding: 1.1rem; }
  .moment-title-row { flex-direction: column; gap: 0.85rem; }
  .moment-actions { justify-content: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  .moment-echo-enter-active, .moment-echo-leave-active, .moment-progress i::before { transition: none; }
  .moment-content.manual-echo::before, .moment-content.manual-echo::after { animation: none; }
}
</style>
