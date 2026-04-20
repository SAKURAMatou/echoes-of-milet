<template>
  <article class="play-page">
    <div v-if="loading" class="center-state">Loading challenge...</div>
    <div v-else-if="error" class="center-state error">{{ error }}</div>

    <section v-else-if="challenge && currentQuestion" class="play-shell">
      <header class="play-header">
        <div>
          <div class="section-kicker">{{ challenge.difficulty }} challenge</div>
          <h1>Question {{ currentQuestion.no }} / {{ challenge.questionCount }}</h1>
        </div>
        <div class="timer" :class="{ urgent: remainingSec <= 5 }">{{ remainingSecText }}</div>
      </header>

      <div class="player-zone">
        <button type="button" class="play-button" :class="{ active: isPlaying }" @click="togglePlay">
          <span v-if="isPlaying">Pause</span>
          <span v-else>Play</span>
        </button>
        <SongGuessWaveform :playing="isPlaying" :urgent="remainingSec <= 5" />
      </div>

      <div class="option-grid">
        <button
          v-for="option in currentQuestion.options"
          :key="option.optionId"
          type="button"
          class="option-button"
          :class="optionClass(option.optionId)"
          :disabled="locked"
          @click="selectedOptionId = option.optionId"
        >
          <span>{{ option.optionId.toUpperCase() }}</span>
          <strong>{{ option.title }}</strong>
        </button>
      </div>

      <div class="feedback-row">
        <p v-if="answerResult" class="feedback-text" :class="{ wrong: !answerResult.isCorrect }">
          {{ answerResult.isCorrect ? 'Correct' : `Answer: ${answerResult.correctTitle}` }}
        </p>
        <p v-else-if="timedOut" class="feedback-text wrong">Time up</p>
        <p v-else class="hint-text">播放后倒计时开始，提交后会立即反馈。</p>

        <div class="action-row">
          <button
            v-if="!answerResult"
            type="button"
            class="submit-button"
            :disabled="submitting || !selectedOptionId"
            @click="() => submitAnswer()"
          >
            {{ submitting ? 'Checking...' : '提交答案' }}
          </button>
          <button v-else type="button" class="submit-button" @click="goNext">
            {{ isLastQuestion ? '查看结果' : '下一题' }}
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
import {
  getSongGuessChallenge,
  submitSongGuessAnswer,
  type SongGuessAnswerResult,
  type SongGuessChallenge,
  type SongGuessOption,
} from '@/composables/interactive/songGuess'

const route = useRoute()
const router = useRouter()
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
let audio: HTMLAudioElement | null = null
let timerId: number | null = null

const currentQuestion = computed(() => challenge.value?.questions[currentIndex.value] || null)
const locked = computed(() => Boolean(answerResult.value || timedOut.value || submitting.value))
const isLastQuestion = computed(() => currentIndex.value >= (challenge.value?.questionCount || 1) - 1)
const remainingSecText = computed(() => `00:${String(Math.max(0, remainingSec.value)).padStart(2, '0')}`)

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
    error.value = '挑战不存在或已过期。'
  } finally {
    loading.value = false
  }
}

async function togglePlay() {
  if (!audio || !currentQuestion.value) return

  if (!startedAtMs.value) {
    startedAtMs.value = Date.now()
    startTimer()
  }

  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
    return
  }

  try {
    await audio.play()
    isPlaying.value = true
  } catch {
    error.value = '音频播放失败，请重试。'
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
  } catch {
    error.value = '答案提交失败，请重试。'
  } finally {
    submitting.value = false
  }
}

function goNext() {
  if (!challenge.value) return

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

function optionClass(optionId: string) {
  if (!answerResult.value) {
    return { selected: selectedOptionId.value === optionId }
  }

  return {
    correct: answerResult.value.correctOptionId === optionId,
    wrong: answerResult.value.selectedOptionId === optionId && !answerResult.value.isCorrect,
  }
}

onBeforeUnmount(resetQuestion)
</script>

<style scoped>
.play-page {
  min-height: 100vh;
  padding: 36px 24px 44px;
  color: #26313a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(246, 250, 249, 0.86)),
    radial-gradient(circle at 12% 10%, rgba(125, 183, 224, 0.2), transparent 34%);
}

.center-state {
  display: grid;
  min-height: 360px;
  place-items: center;
  color: #60707a;
  font-weight: 700;
}

.center-state.error {
  color: #8c4855;
}

.play-shell {
  display: grid;
  gap: 26px;
}

.play-header,
.feedback-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 8px 0 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.45rem, 6vw, 4.4rem);
  line-height: 0.98;
  color: #1e2a35;
}

.timer {
  min-width: 92px;
  border: 1px solid rgba(49, 127, 141, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  padding: 10px 16px;
  color: #317f8d;
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
}

.timer.urgent {
  border-color: rgba(140, 72, 85, 0.34);
  color: #8c4855;
}

.player-zone {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.play-button {
  display: grid;
  width: 104px;
  height: 104px;
  place-items: center;
  border: 1px solid rgba(49, 127, 141, 0.28);
  border-radius: 999px;
  background: #26313a;
  color: #fff;
  font-weight: 800;
  transition:
    transform 180ms ease,
    background 180ms ease;
}

.play-button:hover,
.play-button.active {
  transform: translateY(-2px);
  background: #317f8d;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.option-button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 74px;
  border: 1px solid rgba(49, 127, 141, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  padding: 14px;
  color: #26313a;
  text-align: left;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.option-button:not(:disabled):hover,
.option-button.selected {
  transform: translateY(-1px);
  border-color: rgba(49, 127, 141, 0.56);
  background: rgba(238, 248, 250, 0.9);
}

.option-button.correct {
  border-color: rgba(49, 127, 141, 0.65);
  background: rgba(219, 245, 239, 0.9);
}

.option-button.wrong {
  border-color: rgba(140, 72, 85, 0.56);
  background: rgba(252, 232, 236, 0.9);
}

.option-button span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 999px;
  background: rgba(49, 127, 141, 0.1);
  color: #317f8d;
  font-size: 0.8rem;
  font-weight: 900;
}

.option-button strong {
  min-width: 0;
  font-size: 1rem;
  line-height: 1.35;
}

.feedback-text,
.hint-text {
  margin: 0;
  color: #317f8d;
  font-weight: 800;
}

.feedback-text.wrong {
  color: #8c4855;
}

.hint-text {
  color: #60707a;
  font-size: 0.9rem;
  font-weight: 600;
}

.submit-button {
  min-height: 44px;
  border: 1px solid rgba(35, 49, 61, 0.24);
  border-radius: 999px;
  background: #26313a;
  padding: 0 24px;
  color: #fff;
  font-weight: 800;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.submit-button:hover:not(:disabled) {
  background: #317f8d;
}

@media (max-width: 720px) {
  .play-page {
    padding: 28px 18px 34px;
  }

  .play-header,
  .feedback-row {
    align-items: flex-start;
  }

  .player-zone,
  .option-grid {
    grid-template-columns: 1fr;
  }

  .play-button {
    width: 88px;
    height: 88px;
    justify-self: center;
  }

  .option-button {
    min-height: 64px;
  }

  .feedback-row {
    display: grid;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
