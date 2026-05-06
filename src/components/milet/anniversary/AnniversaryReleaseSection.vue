<template>
  <section class="anniversary-slide anniversary-slide-songs">
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-10 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12"
    >
      <div>
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title">{{ chapter.title }}</h2>
        <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{
            lang === 'ja'
              ? '写真のように並べるのではなく、作品のステージをひとつずつ spotlight に。'
              : '不把发布物做成照片拼贴，而是让每一张封面被 spotlight 依次点亮。'
          }}
        </p>
        <div class="release-progress-list" aria-hidden="true">
          <span
            v-for="(release, index) in releases"
            :key="release.id"
            :class="index === activeReleaseIndex ? 'is-active' : ''"
          >
            <i :style="index === activeReleaseIndex ? progressStyle(progress) : undefined"></i>
          </span>
        </div>
      </div>

      <div class="release-stage mobile-scroll-region">
        <div
          v-for="(release, index) in releases"
          :key="release.id"
          class="release-cover"
          :class="releaseClass(index)"
          @click="$emit('selectRelease', index)"
        >
          <img :src="initImgUrl(release.cover)" :alt="release.title" />
        </div>
        <div class="release-copy">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#317f8d]">
            {{ activeRelease.type }} / {{ activeRelease.date }}
          </p>
          <h3 class="mt-2 font-serif text-4xl leading-tight text-[#1f2b35]">
            {{ activeRelease.title }}
          </h3>
          <p class="mt-3 text-sm leading-7 text-[#60717b]">{{ activeRelease.note }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
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
  progress: number
  lang: AnniversaryLang
}>()

defineEmits<{
  (event: 'selectRelease', index: number): void
}>()

function releaseClass(index: number) {
  if (index === props.activeReleaseIndex) return 'is-current'
  if (index === (props.activeReleaseIndex + 1) % props.releases.length) return 'is-next'
  return 'is-prev'
}

function progressStyle(value: number) {
  return {
    '--progress': `${Math.max(0, Math.min(100, value))}%`,
  }
}
</script>

<style scoped>
.section-eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #317f8d;
}

.section-title {
  margin-top: 1rem;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 3rem;
  line-height: 1;
  color: #1d2b36;
}

.release-stage {
  position: relative;
  min-height: 560px;
}

.release-stage::before {
  content: '';
  position: absolute;
  inset: 2rem 12% 6.5rem;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.92),
    rgba(49, 127, 141, 0.12) 58%,
    transparent 70%
  );
  filter: blur(1px);
}

.release-cover {
  position: absolute;
  top: 1.25rem;
  left: 50%;
  width: 46%;
  max-width: 250px;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.84);
  background: white;
  box-shadow: 0 30px 80px -44px rgba(31, 43, 53, 0.92);
  transition:
    transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 520ms ease,
    filter 520ms ease;
}

.release-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.release-cover.is-current {
  z-index: 3;
  opacity: 1;
  transform: translateX(-50%) scale(1.05) rotate(0deg);
}

.release-cover.is-prev {
  z-index: 1;
  opacity: 0.42;
  filter: saturate(0.72);
  transform: translateX(-112%) translateY(2.8rem) scale(0.72) rotate(-8deg);
}

.release-cover.is-next {
  z-index: 1;
  opacity: 0.42;
  filter: saturate(0.72);
  transform: translateX(12%) translateY(2.8rem) scale(0.72) rotate(8deg);
}

.release-copy {
  position: absolute;
  right: 4%;
  top: 21rem;
  bottom: auto;
  left: 4%;
  z-index: 4;
  border-top: 1px solid rgba(49, 127, 141, 0.16);
  padding-top: 1.1rem;
}

.release-progress-list {
  margin-top: 1.6rem;
  display: flex;
  width: min(20rem, 100%);
  gap: 0.55rem;
}

.release-progress-list span {
  height: 0.38rem;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(39, 109, 123, 0.14);
}

.release-progress-list i {
  display: block;
  width: var(--progress, 0%);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(49, 127, 141, 0.92), rgba(221, 190, 95, 0.82));
}

.release-progress-list span:not(.is-active) i {
  width: 0;
}

@media (max-width: 767px) {
  .section-title {
    font-size: 2.45rem;
  }

  .release-stage {
    min-height: 0;
    margin-top: 0.5rem;
  }

  .release-stage::before {
    inset: 0.85rem 8% 10.2rem;
  }

  .release-cover {
    top: 0;
    width: 38%;
    max-width: 170px;
  }

  .release-cover.is-current {
    transform: translateX(-50%) scale(0.96) rotate(0deg);
  }

  .release-cover.is-prev {
    transform: translateX(-106%) translateY(2.45rem) scale(0.7) rotate(-8deg);
  }

  .release-cover.is-next {
    transform: translateX(6%) translateY(2.45rem) scale(0.7) rotate(8deg);
  }

  .release-copy {
    position: relative;
    right: auto;
    top: auto;
    bottom: auto;
    left: auto;
    margin-top: 12.6rem;
    padding-right: 0.25rem;
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .section-title {
    font-size: 2.08rem;
  }

  .release-cover {
    width: 34%;
    max-width: 145px;
  }

  .release-cover.is-prev {
    transform: translateX(-105%) translateY(2rem) scale(0.68) rotate(-8deg);
  }

  .release-cover.is-next {
    transform: translateX(5%) translateY(2rem) scale(0.68) rotate(8deg);
  }

  .release-copy {
    margin-top: 10.7rem;
  }
}
</style>
