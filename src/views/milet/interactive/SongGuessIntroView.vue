<template>
  <article class="song-guess-page">
    <section class="song-guess-hero">
      <div>
        <div class="section-kicker">echo room</div>
        <h1>Song Guess Challenge</h1>
        <p class="hero-lead">听一段 milet 的歌曲片段，在倒计时结束前选择正确曲目。</p>
        <p class="hero-note">每个难度 10 题，提交后立即反馈结果。题库可切换，后续管理端会支持上传音频和配置题目。</p>
      </div>
      <div class="hero-surface">
        <SongGuessWaveform :playing="true" />
        <div class="hero-meta">
          <span>10 questions</span>
          <span>instant feedback</span>
          <span>share result</span>
        </div>
      </div>
    </section>

    <section class="setup-section">
      <div class="setup-heading">
        <div>
          <div class="section-kicker">challenge setup</div>
          <h2>选择题库与难度</h2>
        </div>
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div class="bank-row" aria-label="Question bank">
        <button
          v-for="bank in config?.banks || []"
          :key="bank.id"
          type="button"
          class="bank-button"
          :class="{ active: selectedBankId === bank.id }"
          @click="selectedBankId = bank.id"
        >
          {{ bank.label }}
        </button>
      </div>

      <div class="difficulty-grid">
        <button
          v-for="difficulty in config?.difficulties || []"
          :key="difficulty.id"
          type="button"
          class="difficulty-card"
          :class="[difficulty.id, { active: selectedDifficulty === difficulty.id }]"
          @click="selectedDifficulty = difficulty.id"
        >
          <span class="difficulty-label">{{ difficulty.label }}</span>
          <strong>{{ difficulty.clipDurationSec }}s audio</strong>
          <span>{{ difficulty.timeLimitSec }} 秒答题 / {{ difficulty.optionCount }} 个选项</span>
        </button>
      </div>

      <button type="button" class="start-button" :disabled="loading || !selectedBankId" @click="startChallenge">
        {{ loading ? 'Preparing...' : '开始挑战' }}
      </button>
    </section>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SongGuessWaveform from '@/components/milet/interactive/SongGuessWaveform.vue'
import {
  createSongGuessChallenge,
  getSongGuessConfig,
  type SongGuessConfig,
  type SongGuessDifficulty,
} from '@/composables/interactive/songGuess'

const route = useRoute()
const router = useRouter()
const config = ref<SongGuessConfig | null>(null)
const selectedBankId = ref('')
const selectedDifficulty = ref<SongGuessDifficulty>('easy')
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    config.value = await getSongGuessConfig()
    selectedBankId.value = config.value.defaultBankId
  } catch {
    error.value = '互动题库暂时无法加载，请稍后再试。'
  }
})

async function startChallenge() {
  if (!selectedBankId.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const challenge = await createSongGuessChallenge({
      difficulty: selectedDifficulty.value,
      bankId: selectedBankId.value,
      lang: String(route.params.lang || 'zh'),
    })
    await router.push({
      name: 'miletSongGuessPlay',
      params: { lang: route.params.lang, challengeId: challenge.challengeId },
    })
  } catch {
    error.value = '挑战创建失败，请稍后再试。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.song-guess-page {
  min-height: 100vh;
  padding: 42px 24px 48px;
  color: #26313a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.48), rgba(246, 250, 249, 0.82)),
    radial-gradient(circle at 80% 0%, rgba(155, 216, 210, 0.24), transparent 34%);
}

.song-guess-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1fr);
  gap: 28px;
  align-items: end;
}

.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  line-height: 0.96;
  color: #1e2a35;
}

h1 {
  margin-top: 12px;
  font-size: clamp(3rem, 8vw, 5rem);
}

h2 {
  margin-top: 8px;
  font-size: clamp(2.2rem, 5vw, 3.35rem);
}

.hero-lead {
  margin-top: 22px;
  max-width: 520px;
  font-size: 1.05rem;
  line-height: 1.9;
  color: #3f4f5a;
}

.hero-note {
  max-width: 560px;
  color: #60707a;
  font-size: 0.92rem;
  line-height: 1.85;
}

.hero-surface {
  display: grid;
  gap: 14px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #60707a;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
}

.hero-meta span {
  border: 1px solid rgba(49, 127, 141, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  padding: 7px 10px;
}

.setup-section {
  margin-top: 42px;
  border-top: 1px solid rgba(49, 127, 141, 0.16);
  padding-top: 28px;
}

.setup-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.error-text {
  margin: 0;
  color: #8c4855;
  font-size: 0.9rem;
  font-weight: 700;
}

.bank-row,
.difficulty-grid {
  margin-top: 22px;
}

.bank-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bank-button,
.difficulty-card,
.start-button {
  border: 1px solid rgba(49, 127, 141, 0.18);
  background: rgba(255, 255, 255, 0.66);
  color: #26313a;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.bank-button {
  min-height: 40px;
  border-radius: 999px;
  padding: 0 16px;
  font-size: 0.85rem;
  font-weight: 700;
}

.bank-button.active,
.bank-button:hover {
  border-color: rgba(49, 127, 141, 0.62);
  background: #317f8d;
  color: #fff;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.difficulty-card {
  display: grid;
  gap: 10px;
  min-height: 150px;
  border-radius: 18px;
  padding: 18px;
  text-align: left;
}

.difficulty-card:hover,
.difficulty-card.active {
  transform: translateY(-2px);
  border-color: rgba(49, 127, 141, 0.54);
  background: rgba(255, 255, 255, 0.9);
}

.difficulty-card.hard.active {
  border-color: rgba(140, 72, 85, 0.52);
}

.difficulty-label {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.difficulty-card.hard .difficulty-label {
  color: #8c4855;
}

.difficulty-card strong {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  line-height: 1;
}

.difficulty-card span:last-child {
  color: #60707a;
  font-size: 0.88rem;
}

.start-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin-top: 24px;
  border-radius: 999px;
  background: #26313a;
  padding: 0 28px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
}

.start-button:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #317f8d;
}

.start-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 760px) {
  .song-guess-page {
    padding: 30px 18px 34px;
  }

  .song-guess-hero,
  .difficulty-grid {
    grid-template-columns: 1fr;
  }

  .setup-heading {
    display: block;
  }

  .difficulty-card {
    min-height: 116px;
  }

  .start-button {
    width: 100%;
  }
}
</style>
