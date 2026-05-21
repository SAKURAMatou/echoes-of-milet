<template>
  <Header :showHanbor="false" />
  <main
    class="min-h-screen overflow-x-hidden bg-[#f7fcff] font-montserrat text-[#20314a] md:flex md:h-[100svh] md:min-h-[760px] md:flex-col"
  >
    <section
      class="relative isolate min-h-[92svh] overflow-hidden pt-20 md:min-h-0 md:flex-1 md:pt-0"
    >
      <img
        src="/echoes-of-milet-OG.webp"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 -z-30 h-full w-full object-cover object-[71%_50%] md:origin-right md:scale-[1.18] md:object-[78%_58%]"
      />
      <div
        class="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(248,252,255,0.52)_0%,rgba(248,252,255,0.18)_34%,rgba(248,252,255,0.96)_78%,#f7fcff_100%)] md:bg-[linear-gradient(90deg,#f7fcff_0%,rgba(247,252,255,0.98)_30%,rgba(247,252,255,0.88)_46%,rgba(247,252,255,0.24)_70%,rgba(247,252,255,0)_100%)]"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-t from-[#f7fcff] via-[#f7fcff]/82 to-transparent"
      ></div>

      <div
        class="hero-content-frame mx-auto flex min-h-[calc(92svh-5rem)] w-full max-w-[1180px] items-start px-3 pb-8 pt-[34vh] sm:px-7 md:h-full md:min-h-0 md:items-center md:px-10 md:pb-0 md:pt-20 lg:px-8"
      >
        <div class="hero-copy-wash animate-fadein relative isolate w-full max-w-[640px]">
          <p
            class="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#5a8eb1] md:text-sm"
          >
            {{ homeCopy.eyebrow }}
          </p>
          <h1
            class="hero-title font-serif text-[clamp(3.1rem,7.8vw,6.4rem)] leading-[0.94] text-[#172b48] md:max-w-[720px]"
          >
            Where echoes
            <span class="block italic text-[#4e9ac5]">remain</span>
          </h1>
          <div
            class="hero-paragraphs mt-6 max-w-[590px] space-y-4 text-[0.95rem] leading-7 text-[#344b63] md:mt-5 md:space-y-3 md:text-base md:leading-8"
          >
            <p v-for="paragraph in homeCopy.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>

          <div class="hero-actions mt-7 flex flex-wrap items-center gap-3 md:mt-6">
            <router-link
              :to="miletLink"
              class="inline-flex min-h-12 items-center justify-center rounded-full bg-[#182c4a] px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_-22px_rgba(24,44,74,0.95)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#3f8fbd] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#3f8fbd]"
            >
              {{ homeCopy.primaryCta }}
            </router-link>
            <router-link
              :to="aboutLink"
              class="inline-flex min-h-12 items-center justify-center rounded-full border border-[#8fc5df]/80 bg-white/68 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-[#1e4569] shadow-[0_16px_36px_-28px_rgba(31,69,105,0.8)] transition duration-300 hover:-translate-y-0.5 hover:border-[#4e9ac5] hover:bg-white focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#4e9ac5]"
            >
              {{ homeCopy.secondaryCta }}
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="relative px-5 pb-14 sm:px-7 md:px-10 md:pb-8 lg:px-8">
      <div
        class="mx-auto grid max-w-[1180px] gap-5 border-t border-[#c8e5f2] pt-7 md:grid-cols-4 md:gap-0 md:pt-5"
      >
        <router-link
          v-for="item in homeCopy.highlights"
          :key="item.title"
          :to="item.to"
          class="group border-t border-[#d7edf6] pt-5 first:border-t-0 first:pt-0 md:border-l md:border-t-0 md:px-7 md:pt-0 md:first:border-l-0 md:first:px-0 md:last:pr-0"
        >
          <span class="text-xs font-semibold uppercase tracking-[0.26em] text-[#6d99b4]">
            {{ item.label }}
          </span>
          <span
            class="mt-2 block font-serif text-2xl leading-tight text-[#172b48] transition-colors duration-300 group-hover:text-[#3f8fbd]"
          >
            {{ item.title }}
          </span>
          <span class="mt-2 block text-sm leading-6 text-[#64758a]">
            {{ item.description }}
          </span>
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

import Header from '@/components/TWHeader.vue'
import { withLangParam } from '@/composables/useLangRoute'

const internalInstance = getCurrentInstance()
const global = internalInstance?.appContext.config.globalProperties
const route = useRoute()

const currentLang = computed(() => String(route.params.lang || global?.$lang?.lang || 'zh'))
const miletLink = computed(() => withLangParam({ name: 'milet' }, currentLang.value))
const releaseLink = computed(() => withLangParam({ name: 'miletRelease' }, currentLang.value))
const aboutLink = computed(() => withLangParam({ name: 'aboutMe' }, currentLang.value))
const pilgrimageLink = computed(() => withLangParam({ name: 'miletPilgrimage' }, currentLang.value))
const timelineLink = computed(() => withLangParam({ name: 'miletTimeLine' }, currentLang.value))
const newsCollectionLink = computed(() => withLangParam({ name: 'miletNews' }, currentLang.value))

const copy = computed(() => ({
  zh: {
    eyebrow: 'UNOFFICIAL FAN ARCHIVE',
    paragraphs: [
      '这里，是一位 miles 留下的小小记录。关于音乐、现场，以及当下感受到的一切，被一点点拾起、整理。那些本该消散的声音，也许仍在某处回响。而这些余韵，被留在这里。',
      '这里记录的，不只是发生过的事情本身。也包括那些尚未成形的情绪，以及沿着时间延伸的声音。即使是微弱的回声，也会不断向前延续。而这个地方，只是那段流动中的一部分。',
    ],
    primaryCta: '进入',
    secondaryCta: '解释网站',
    highlights: [
      {
        label: 'MUSIC',
        title: '作品脉络',
        description: '整理专辑、单曲、版本与聆听入口，让回顾更轻松。',
        to: releaseLink.value,
      },
      {
        label: 'LIVE',
        title: '活动轨迹',
        description: '记录 live、活动与重要节点，保留每一次余韵。',
        to: timelineLink.value,
      },
      // {
      //   label: 'GALLERY',
      //   title: '影像收藏',
      //   description: '按主题整理公开图像资料，尽量避开受限素材。',
      //   // to: galleryLink.value,
      // },
      {
        label: 'NEWS-COLLECTION',
        title: '访谈收藏',
        description: '收集杂志、访谈，记录那些藏在话语里的情绪与想法。',
        to: newsCollectionLink.value,
      },
      {
        label: 'PILGRIMAGE',
        title: '巡礼地图',
        description: '按城市整理 MV 拍摄地、街景 spot 和路线，进入地图查看照片、坐标与导航。',
        to: pilgrimageLink.value,
      },
    ],
  },
  jp: {
    eyebrow: 'UNOFFICIAL FAN ARCHIVE',
    paragraphs: [
      'ここは、ひとりのmilesが残していく小さな記録です。音楽やライブ、そのとき感じたものを、少しずつすくい上げています。消えたはずの音も、どこかでまだ響いている。そんな余韻を、ここに置いていきます。',
      '記録しているのは、出来事そのものだけではありません。言葉になりきらない感情や、時間の中を伝っていく響きも含まれています。かすかな声でも、途切れることなく続いていく。その流れの一部として、この場所があります。',
    ],
    primaryCta: '音のほうへ',
    secondaryCta: 'この場所について',
    highlights: [
      {
        label: 'MUSIC',
        title: '作品の流れ',
        description: 'アルバム、シングル、エディション、聴ける場所をまとめています。',
        to: releaseLink.value,
      },
      {
        label: 'LIVE',
        title: '活動の軌跡',
        description: 'ライブやイベント、大切な節目を記録しています。',
        to: timelineLink.value,
      },
      // {
      //   label: 'GALLERY',
      //   title: '写真の記録',
      //   description: '公開されている画像を中心に、テーマごとに整理しています。',
      //   // to: galleryLink.value,
      // },
      {
        label: 'NEWS-COLLECTION',
        title: 'インタビュー記録',
        description:
          '雑誌やインタビュー、公開コメントを集めながら、言葉の奥に残る想いや空気も記録しています。',
        to: newsCollectionLink.value,
      },
      {
        label: 'PILGRIMAGE',
        title: '巡礼マップ',
        description: '都市ごとに MV ロケ地、街並みの spot、ルートを整理し、写真、座標、ナビを確認できます。',
        to: pilgrimageLink.value,
      },
    ],
  },
}))

const homeCopy = computed(() => (global?.$lang?.lang === 'jp' ? copy.value.jp : copy.value.zh))

watchEffect(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.title =
    global?.$lang?.lang === 'jp'
      ? 'Echoes of milet | milet 日本語ファンサイト'
      : 'Echoes of milet | milet 中文站'
})
</script>

<style>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadein {
  animation: fadein 1.1s ease-out both;
}

@media (max-width: 767px) {
  .hero-copy-wash::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: -1.25rem -0.5rem -1.35rem -1rem;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 30% 34%,
        rgba(247, 252, 255, 0.98) 0%,
        rgba(247, 252, 255, 0.92) 42%,
        rgba(247, 252, 255, 0.62) 66%,
        rgba(247, 252, 255, 0) 86%
      ),
      linear-gradient(
        90deg,
        rgba(247, 252, 255, 0.94) 0%,
        rgba(247, 252, 255, 0.82) 58%,
        rgba(247, 252, 255, 0.28) 78%,
        rgba(247, 252, 255, 0) 100%
      );
    backdrop-filter: blur(1px);
    mask-image: linear-gradient(90deg, #000 0%, #000 76%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 76%, transparent 100%);
  }
}

@media (max-width: 767px) and (max-height: 740px) {
  .hero-content-frame {
    padding-top: 28vh;
    padding-bottom: 1.75rem;
  }

  .hero-title {
    font-size: clamp(2.75rem, 13vw, 3.35rem);
  }

  .hero-paragraphs {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.65;
  }

  .hero-paragraphs > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.75rem;
  }

  .hero-actions {
    margin-top: 1.25rem;
  }
}

@media (max-width: 767px) and (max-height: 650px) {
  .hero-content-frame {
    padding-top: 24vh;
  }
}

@media (min-width: 768px) {
  .hero-copy-wash::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: -2.75rem -4.5rem -2.5rem -3.25rem;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse at 26% 42%,
        rgba(247, 252, 255, 0.99) 0%,
        rgba(247, 252, 255, 0.96) 36%,
        rgba(247, 252, 255, 0.78) 58%,
        rgba(247, 252, 255, 0.42) 72%,
        rgba(247, 252, 255, 0) 88%
      ),
      linear-gradient(
        90deg,
        rgba(247, 252, 255, 0.78) 0%,
        rgba(247, 252, 255, 0.44) 54%,
        rgba(247, 252, 255, 0) 100%
      );
    backdrop-filter: blur(1.5px);
  }
}
</style>
