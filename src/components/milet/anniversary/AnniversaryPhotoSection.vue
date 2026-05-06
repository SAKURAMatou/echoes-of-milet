<template>
  <section class="anniversary-slide">
    <div
      class="mobile-slide-shell mx-auto grid w-full max-w-6xl items-center gap-5 px-5 pt-10 sm:px-8 md:grid-cols-[0.82fr_1.18fr] md:gap-10"
    >
      <div>
        <p class="section-eyebrow">{{ chapter.eyebrow }}</p>
        <h2 class="section-title">{{ chapter.title }}</h2>
        <p class="mt-5 max-w-md text-sm leading-7 text-[#60717b] sm:text-base">
          {{
            lang === 'ja'
              ? '毎月届く milet の日を、echo constellation として残します。'
              : '把每个月等来的 milet の日，拼成一个不规则的 echo constellation。'
          }}
        </p>
        <div class="mt-6 flex gap-3">
          <button class="primary-action" type="button" @click="$emit('replay')">replay</button>
        </div>
      </div>

      <div
        class="photo-stage mobile-scroll-region"
        :class="assembled ? 'is-assembled' : 'is-playing'"
      >
        <div class="photo-center-copy" :class="assembled ? 'is-visible' : ''">
          <span>Happy Anniversary</span>
          <strong>milet</strong>
        </div>
        <figure
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="photo-frame"
          :class="photoFrameClass(index)"
          :style="photoStyle(photo)"
        >
          <img :src="initImgUrl(photo.image)" :alt="photo.alt" />
          <figcaption>
            <span>{{ photo.month }}</span>
            {{ assembled ? 'milet の日' : photo.caption }}
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { initImgUrl } from '@/composables/ImgUrlUtil'
import type {
  AnniversaryChapter,
  AnniversaryLang,
  AnniversaryPhoto,
} from '@/composables/miletAnniversary'

const props = defineProps<{
  chapter: AnniversaryChapter
  photos: AnniversaryPhoto[]
  currentPhotoIndex: number
  assembled: boolean
  lang: AnniversaryLang
}>()

defineEmits<{
  (event: 'replay'): void
}>()

function photoFrameClass(index: number) {
  return {
    'is-visible': props.assembled || index <= props.currentPhotoIndex,
    'is-active': !props.assembled && index === props.currentPhotoIndex,
    'is-past': !props.assembled && index < props.currentPhotoIndex,
  }
}

function photoStyle(photo: AnniversaryPhoto) {
  return {
    '--x': photo.final.x,
    '--y': photo.final.y,
    '--w': photo.final.w,
    '--r': photo.final.r,
    '--mx': photo.final.mx,
    '--my': photo.final.my,
    '--mw': photo.final.mw,
    '--mr': photo.final.mr,
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

.primary-action {
  min-height: 2.75rem;
  border: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(235, 247, 249, 0.82)),
    linear-gradient(90deg, rgba(49, 127, 141, 0.08), rgba(221, 190, 95, 0.1));
  clip-path: polygon(0 22%, 84% 22%, 100% 50%, 84% 78%, 0 78%, 9% 50%);
  padding: 0 1.9rem 0 1.55rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #276d7b;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 18px 48px -36px rgba(31, 43, 53, 0.9);
  transition:
    transform 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.primary-action:hover {
  transform: translateY(-2px);
  background:
    linear-gradient(135deg, rgba(39, 109, 123, 0.96), rgba(49, 127, 141, 0.9)),
    linear-gradient(90deg, rgba(221, 190, 95, 0.24), rgba(255, 255, 255, 0));
  color: white;
}

.photo-stage {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border-radius: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(224, 244, 246, 0.42)),
    repeating-linear-gradient(
      90deg,
      rgba(49, 127, 141, 0.08) 0,
      rgba(49, 127, 141, 0.08) 1px,
      transparent 1px,
      transparent 18px
    );
  box-shadow: 0 24px 80px -52px rgba(31, 43, 53, 0.92);
}

.photo-stage::before {
  content: '';
  position: absolute;
  inset: 18% 12%;
  border: 1px solid rgba(49, 127, 141, 0.16);
  border-radius: 48% 52% 46% 54%;
  transform: rotate(-8deg);
}

.photo-center-copy {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  display: flex;
  width: 13rem;
  height: 13rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #276d7b;
  opacity: 0;
  text-align: center;
  transform: translate(-50%, -50%) scale(0.88);
  transition:
    opacity 520ms ease,
    transform 520ms ease;
}

.photo-center-copy.is-visible {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.photo-center-copy span {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.photo-center-copy strong {
  margin-top: 0.35rem;
  font-family:
    Cormorant Garamond,
    serif;
  font-size: 3rem;
  line-height: 1;
}

.photo-frame {
  position: absolute;
  left: 50%;
  top: 52%;
  z-index: 2;
  width: 34%;
  max-width: 230px;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.86);
  background: white;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78) rotate(0deg);
  box-shadow: 0 26px 70px -46px rgba(31, 43, 53, 0.92);
  transition:
    left 740ms cubic-bezier(0.22, 1, 0.36, 1),
    top 740ms cubic-bezier(0.22, 1, 0.36, 1),
    width 740ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease,
    transform 740ms cubic-bezier(0.22, 1, 0.36, 1);
}

.photo-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-frame figcaption {
  position: absolute;
  inset-x: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent, rgba(17, 24, 39, 0.78));
  padding: 2.8rem 0.7rem 0.7rem;
  font-size: 0.68rem;
  line-height: 1.35;
  color: white;
}

.photo-frame figcaption span {
  display: block;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.photo-frame.is-visible {
  opacity: 1;
}

.photo-frame.is-active {
  z-index: 4;
  transform: translate(-50%, -50%) scale(1) rotate(-2deg);
}

.photo-frame.is-past {
  opacity: 0.42;
  transform: translate(-50%, -50%) scale(0.62) rotate(8deg);
}

.photo-stage.is-assembled .photo-frame {
  left: var(--x);
  top: var(--y);
  width: var(--w);
  transform: rotate(var(--r));
}

@media (max-width: 767px) {
  .section-title {
    font-size: 2.45rem;
  }

  .primary-action {
    min-height: 3rem;
    padding: 0 1.65rem 0 1.35rem;
  }

  .photo-stage {
    min-height: 0;
    height: min(56dvh, 430px);
    border-radius: 1.3rem;
  }

  .photo-center-copy {
    width: 9.5rem;
    height: 9.5rem;
  }

  .photo-center-copy strong {
    font-size: 2.2rem;
  }

  .photo-frame {
    width: 40%;
    max-width: 165px;
  }

  .photo-stage.is-assembled .photo-frame {
    left: var(--mx);
    top: var(--my);
    width: var(--mw);
    transform: rotate(var(--mr));
  }
}

@media (max-width: 767px) and (max-height: 760px) {
  .section-title {
    font-size: 2.08rem;
  }

  .photo-stage {
    height: min(52dvh, 360px);
  }
}
</style>
