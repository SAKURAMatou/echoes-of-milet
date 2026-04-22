<template>
  <article
    class="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(246,250,249,0.86)),radial-gradient(circle_at_12%_10%,rgba(125,183,224,0.2),transparent_34%)] px-6 py-9 text-[#26313a] max-md:px-[18px] max-md:py-7"
  >
    <div v-if="loading" class="grid min-h-[360px] place-items-center font-bold text-[#60707a]">
      {{ text.loadingChallenge }}
    </div>
    <div v-else-if="error" class="grid min-h-[360px] place-items-center font-bold text-[#8c4855]">
      {{ error }}
    </div>

    <section v-else-if="challenge && currentQuestion" class="grid gap-6">
      <header class="flex items-center justify-between gap-4 max-md:items-start">
        <div>
          <div class="text-[0.78rem] font-extrabold uppercase tracking-[0.16em] text-[#317f8d]">
            {{ challenge.difficulty }} {{ text.challengeSuffix }}
          </div>
          <h1 class="mt-2 font-serif text-[clamp(2.45rem,6vw,4.4rem)] leading-none text-[#1e2a35]">
            {{ text.question }} {{ currentQuestion.no }} / {{ challenge.questionCount }}
          </h1>
        </div>
        <div
          class="min-w-[92px] rounded-full border bg-white/75 px-4 py-2.5 text-center text-[1.3rem] font-extrabold"
          :class="remainingSec <= 5 ? 'border-[#8c4855]/35 text-[#8c4855]' : 'border-[#317f8d]/20 text-[#317f8d]'"
        >
          {{ remainingSecText }}
        </div>
      </header>

      <div class="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-4 max-md:grid-cols-1">
        <button
          type="button"
          class="grid h-[104px] w-[104px] place-items-center rounded-full border border-[#317f8d]/30 bg-[#26313a] font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#317f8d] max-md:mx-auto max-md:h-[88px] max-md:w-[88px]"
          :class="{ 'bg-[#317f8d]': isPlaying }"
          @click="togglePlay"
        >
          <span v-if="isPlaying">{{ text.pause }}</span>
          <span v-else>{{ text.play }}</span>
        </button>
        <SongGuessWaveform :playing="isPlaying" :urgent="remainingSec <= 5" />
      </div>

      <div class="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <button
          v-for="option in currentQuestion.options"
          :key="option.optionId"
          type="button"
          class="grid min-h-[74px] grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3.5 text-left transition disabled:cursor-default max-md:min-h-16"
          :class="optionClass(option.optionId)"
          :disabled="locked"
          @click="chooseOption(option.optionId)"
        >
          <span class="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#317f8d]/10 text-[0.8rem] font-black text-[#317f8d]">
            {{ option.optionId.toUpperCase() }}
          </span>
          <strong class="min-w-0 text-base leading-snug">{{ option.title }}</strong>
        </button>
      </div>

      <div class="flex items-center justify-between gap-4 max-md:grid max-md:items-start">
        <p
          v-if="answerResult"
          class="m-0 font-extrabold"
          :class="answerResult.isCorrect ? 'text-[#317f8d]' : 'text-[#8c4855]'"
        >
          {{ answerResult.isCorrect ? text.correct : `${text.answerPrefix} ${answerResult.correctTitle}` }}
        </p>
        <p v-else-if="timedOut" class="m-0 font-extrabold text-[#8c4855]">{{ text.timeUp }}</p>
        <p v-else class="m-0 text-[0.9rem] font-semibold text-[#60707a]">
          {{ text.playHint }}
        </p>
        <div class="flex min-w-[180px] justify-end max-md:w-full">
          <button
            type="button"
            class="min-h-11 w-[180px] rounded-full border border-[#23313d]/25 bg-[#26313a] px-6 font-extrabold text-white hover:bg-[#317f8d] disabled:cursor-not-allowed disabled:opacity-45 max-md:w-full"
            :disabled="submitting || (!answerResult && !selectedOptionId)"
            @click="answerResult ? goNext(true) : submitAnswer()"
          >
            {{ actionButtonText }}
          </button>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SongGuessWaveform from '@/components/milet/interactive/SongGuessWaveform.vue'
import { useSongGuessText } from '@/composables/interactive/songGuessText'
import {
  getSongGuessChallenge,
  submitSongGuessAnswer,
  type SongGuessAnswerResult,
  type SongGuessChallenge,
} from '@/composables/interactive/songGuess'

const route = useRoute()
const router = useRouter()
const text = useSongGuessText()
const challenge = ref<SongGuessChallenge | null>(null)
const currentIndex = ref(0)
const selectedOptionId = ref('')
const answerResult = ref<SongGuessAnswerResult | null>(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const isPlaying = ref(false)
const remainingSec = ref(0)
const startedAtMs = ref(0)
const timedOut = ref(false)
const autoPlayNext = ref(false)
let audio: HTMLAudioElement | null = null
let timerId: number | null = null
let autoNextTimerId: number | null = null

const currentQuestion = computed(() => challenge.value?.questions[currentIndex.value] || null)
const locked = computed(() => Boolean(answerResult.value || timedOut.value || submitting.value))
const isLastQuestion = computed(() => currentIndex.value >= (challenge.value?.questionCount || 1) - 1)
const remainingSecText = computed(() => `00:${String(Math.max(0, remainingSec.value)).padStart(2, '0')}`)
const actionButtonText = computed(() => {
  if (submitting.value) return text.value.checking
  if (answerResult.value) return isLastQuestion.value ? text.value.viewResult : text.value.nextQuestion
  return text.value.submit
})

watch(
  currentQuestion,
  (question) => {
    resetQuestion()
    if (question) {
      remainingSec.value = question.timeLimitSec
      audio = new Audio(question.audioUrl)
      audio.addEventListener('ended', () => {
        isPlaying.value = false
      })
      if (autoPlayNext.value) {
        window.setTimeout(() => {
          void playCurrentAudio(true)
        }, 120)
      }
    }
  },
  { immediate: true },
)

loadChallenge()

async function loadChallenge() {
  loading.value = true
  error.value = ''

  try {
    const challengeId = String(route.params.challengeId || '')
    challenge.value = await getSongGuessChallenge(challengeId)
    currentIndex.value = Math.max(0, challenge.value.answers.length)
  } catch {
    error.value = text.value.challengeError
  } finally {
    loading.value = false
  }
}

async function togglePlay() {
  if (!audio || !currentQuestion.value) return

  if (isPlaying.value) {
    autoPlayNext.value = false
    audio.pause()
    isPlaying.value = false
    return
  }

  const played = await playCurrentAudio(false)
  if (played) {
    autoPlayNext.value = true
  }
}

async function playCurrentAudio(silent = false) {
  if (!audio || !currentQuestion.value) return false

  if (!startedAtMs.value) {
    startedAtMs.value = Date.now()
    startTimer()
  }

  try {
    await audio.play()
    isPlaying.value = true
    return true
  } catch {
    if (silent) {
      return false
    }
    error.value = text.value.audioError
    return false
  }
}

function startTimer() {
  stopTimer()
  timerId = window.setInterval(() => {
    if (!currentQuestion.value || answerResult.value) return
    const elapsedSec = Math.floor((Date.now() - startedAtMs.value) / 1000)
    remainingSec.value = Math.max(0, currentQuestion.value.timeLimitSec - elapsedSec)

    if (remainingSec.value <= 0) {
      timedOut.value = true
      stopTimer()
      pauseAudio()
      submitAnswer(true)
    }
  }, 250)
}

function chooseOption(optionId: string) {
  if (locked.value) return
  selectedOptionId.value = optionId
  void submitAnswer()
}

async function submitAnswer(forceTimeout = false) {
  if (!challenge.value || !currentQuestion.value || submitting.value || answerResult.value) return
  if (!selectedOptionId.value && !forceTimeout) return

  submitting.value = true
  stopTimer()
  pauseAudio()

  try {
    answerResult.value = await submitSongGuessAnswer(challenge.value.challengeId, {
      questionId: currentQuestion.value.questionId,
      optionId: forceTimeout ? '' : selectedOptionId.value,
      elapsedMs: startedAtMs.value ? Date.now() - startedAtMs.value : currentQuestion.value.timeLimitSec * 1000 + 1,
    })
    scheduleAutoNext()
  } catch {
    error.value = text.value.answerError
  } finally {
    submitting.value = false
  }
}

function scheduleAutoNext() {
  stopAutoNext()
  autoNextTimerId = window.setTimeout(() => {
    goNext()
  }, isLastQuestion.value ? 1400 : 950)
}

function goNext(manual = false) {
  if (!challenge.value) return
  if (manual) {
    stopAutoNext()
  }

  if (isLastQuestion.value) {
    router.push({
      name: 'miletSongGuessResult',
      params: { lang: route.params.lang, challengeId: challenge.value.challengeId },
    })
    return
  }

  currentIndex.value += 1
}

function resetQuestion() {
  stopTimer()
  stopAutoNext()
  pauseAudio()
  if (audio) {
    audio.src = ''
    audio = null
  }
  selectedOptionId.value = ''
  answerResult.value = null
  timedOut.value = false
  startedAtMs.value = 0
  isPlaying.value = false
}

function pauseAudio() {
  if (!audio) return
  audio.pause()
  isPlaying.value = false
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function stopAutoNext() {
  if (autoNextTimerId !== null) {
    window.clearTimeout(autoNextTimerId)
    autoNextTimerId = null
  }
}

function optionClass(optionId: string) {
  if (!answerResult.value) {
    return selectedOptionId.value === optionId
      ? 'border-[#317f8d]/60 bg-[rgba(238,248,250,0.9)] -translate-y-px'
      : 'border-[#317f8d]/20 bg-white/70 hover:-translate-y-px hover:border-[#317f8d]/60 hover:bg-[rgba(238,248,250,0.9)]'
  }

  if (answerResult.value.correctOptionId === optionId) {
    return 'border-[#317f8d]/70 bg-[rgba(219,245,239,0.9)]'
  }
  if (answerResult.value.selectedOptionId === optionId && !answerResult.value.isCorrect) {
    return 'border-[#8c4855]/60 bg-[rgba(252,232,236,0.9)]'
  }
  return 'border-[#317f8d]/20 bg-white/70'
}

onBeforeUnmount(resetQuestion)
</script>
