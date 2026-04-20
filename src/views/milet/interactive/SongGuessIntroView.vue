<template>
  <article
    class="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(246,250,249,0.82)),radial-gradient(circle_at_80%_0%,rgba(155,216,210,0.24),transparent_34%)] px-6 py-10 text-[#26313a] max-sm:px-[18px] max-sm:py-[30px]"
  >
    <section class="grid grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)] items-end gap-7 max-md:grid-cols-1">
      <div>
        <div class="text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[#317f8d]">{{ text.introEyebrow }}</div>
        <h1 class="mt-3 font-serif text-[clamp(3rem,8vw,5rem)] leading-none text-[#1e2a35]">
          {{ text.introTitle }}
        </h1>
        <p class="mt-[22px] max-w-[520px] text-[1.05rem] leading-[1.9] text-[#3f4f5a]">
          {{ text.introLead }}
        </p>
        <p class="max-w-[560px] text-[0.92rem] leading-[1.85] text-[#60707a]">
          {{ text.introSub }}
        </p>
      </div>
      <div class="grid gap-3.5">
        <SongGuessWaveform :playing="true" />
        <div class="flex flex-wrap gap-2 text-[0.76rem] font-bold uppercase text-[#60707a]">
          <span class="rounded-full border border-[#317f8d]/20 bg-white/60 px-2.5 py-[7px]">{{ text.questionsBadge }}</span>
          <span class="rounded-full border border-[#317f8d]/20 bg-white/60 px-2.5 py-[7px]">{{ text.randomBankBadge }}</span>
          <span class="rounded-full border border-[#317f8d]/20 bg-white/60 px-2.5 py-[7px]">{{ text.feedbackBadge }}</span>
        </div>
      </div>
    </section>

    <section class="mt-10 border-t border-[#317f8d]/15 pt-7">
      <div class="flex items-end justify-between gap-5 max-md:block">
        <div>
          <div class="text-[0.78rem] font-bold uppercase tracking-[0.16em] text-[#317f8d]">
            {{ text.setupEyebrow }}
          </div>
          <h2 class="mt-2 font-serif text-[clamp(2.2rem,5vw,3.35rem)] leading-none text-[#1e2a35]">
            {{ text.setupTitle }}
          </h2>
        </div>
        <p v-if="error" class="m-0 text-[0.9rem] font-bold text-[#8c4855]">{{ error }}</p>
      </div>

      <div class="mt-[22px] grid grid-cols-3 gap-3.5 max-md:grid-cols-1">
        <button
          v-for="difficulty in config?.difficulties || []"
          :key="difficulty.id"
          type="button"
          class="relative grid min-h-[158px] gap-2.5 overflow-hidden rounded-[18px] border p-[18px] text-left transition hover:-translate-y-0.5 hover:bg-white/95 max-md:min-h-[116px]"
          :class="difficultyCardClass(difficulty.id)"
          @click="selectedDifficulty = difficulty.id"
        >
          <span
            v-if="selectedDifficulty === difficulty.id"
            class="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#26313a] text-xs font-black text-white"
          >
            OK
          </span>
          <span
            class="text-[0.78rem] font-extrabold uppercase"
            :class="difficulty.id === 'hard' ? 'text-[#8c4855]' : 'text-[#317f8d]'"
          >
            {{ difficulty.label }}
          </span>
          <strong class="font-serif text-[2rem] leading-none">{{ difficulty.clipDurationSec }}{{ text.audioSuffix }}</strong>
          <span class="text-[0.88rem] text-[#60707a]">
            {{ difficultyDetail(difficulty.timeLimitSec, difficulty.optionCount) }}
          </span>
        </button>
      </div>

      <button
        type="button"
        class="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full border border-[#317f8d]/20 bg-[#26313a] px-7 text-[0.95rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#317f8d] disabled:cursor-not-allowed disabled:opacity-55 max-md:w-full"
        :disabled="loading"
        @click="startChallenge"
      >
        {{ loading ? text.preparing : text.start }}
      </button>
    </section>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SongGuessWaveform from '@/components/milet/interactive/SongGuessWaveform.vue'
import { useSongGuessText } from '@/composables/interactive/songGuessText'
import {
  createSongGuessChallenge,
  getSongGuessConfig,
  type SongGuessConfig,
  type SongGuessDifficulty,
} from '@/composables/interactive/songGuess'

const route = useRoute()
const router = useRouter()
const text = useSongGuessText()
const config = ref<SongGuessConfig | null>(null)
const selectedDifficulty = ref<SongGuessDifficulty>('easy')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    config.value = await getSongGuessConfig()
  } catch {
    error.value = text.value.loadConfigError
  }
})

function difficultyDetail(timeLimit: number, optionCount: number) {
  return text.value.difficultyDetail
    .replace('{timeLimit}', String(timeLimit))
    .replace('{optionCount}', String(optionCount))
}

function difficultyCardClass(difficulty: SongGuessDifficulty) {
  if (selectedDifficulty.value !== difficulty) {
    return 'border-[#317f8d]/20 bg-white/70 shadow-none'
  }

  if (difficulty === 'hard') {
    return 'border-[#8c4855] bg-white shadow-[0_24px_70px_-38px_rgba(140,72,85,0.75)] ring-4 ring-[#8c4855]/18'
  }

  return 'border-[#317f8d] bg-white shadow-[0_24px_70px_-38px_rgba(49,127,141,0.8)] ring-4 ring-[#317f8d]/20'
}

async function startChallenge() {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    const challenge = await createSongGuessChallenge({
      difficulty: selectedDifficulty.value,
      lang: String(route.params.lang || 'zh'),
    })
    await router.push({
      name: 'miletSongGuessPlay',
      params: { lang: route.params.lang, challengeId: challenge.challengeId },
    })
  } catch {
    error.value = text.value.createError
  } finally {
    loading.value = false
  }
}
</script>
