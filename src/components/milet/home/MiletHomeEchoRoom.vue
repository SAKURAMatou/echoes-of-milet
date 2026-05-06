<template>
  <section
    :id="sectionId || undefined"
    class="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(230px,0.54fr)] items-stretch gap-5 border-t border-[#317f8d]/15 pt-[30px] max-md:grid-cols-1"
  >
    <div>
      <div class="text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[#317f8d]">echo room</div>
      <h2 class="mt-2 font-serif text-[clamp(2.2rem,5vw,3.35rem)] leading-none text-[#26313a]">
        {{ text.homeTitle }}
      </h2>
      <p class="mt-3.5 max-w-[560px] text-[0.95rem] leading-[1.8] text-[#60707a]">
        {{ text.homeDescription }}
      </p>
    </div>
    <RouterLink
      :to="to"
      class="relative grid min-h-[168px] content-end overflow-hidden rounded-[18px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(238,248,250,0.68)),repeating-linear-gradient(90deg,rgba(49,127,141,0.1)_0,rgba(49,127,141,0.1)_1px,transparent_1px,transparent_16px)] p-[18px] text-[#26313a] no-underline transition hover:-translate-y-0.5 hover:border-[#317f8d]/30 hover:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.42)] max-md:min-h-32 before:absolute before:inset-x-[-20px] before:top-7 before:h-[58px] before:rounded-[50%] before:border-t-[3px] before:border-[#317f8d]/20"
    >
      <span class="relative font-black">{{ text.homeCta }}</span>
      <small class="relative mt-1.5 text-[0.72rem] font-extrabold uppercase text-[#317f8d]">
        {{ text.homeMeta }}
      </small>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useSongGuessText } from '@/composables/interactive/songGuessText'

withDefaults(
  defineProps<{
    sectionId?: string | null
  }>(),
  {
    sectionId: 'echo-room',
  },
)

const route = useRoute()
const text = useSongGuessText()
const to = computed(() => ({
  name: 'miletSongGuess',
  params: { lang: route.params.lang || 'zh' },
}))
</script>
