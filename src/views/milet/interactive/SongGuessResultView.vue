<template>
  <article class="result-page">
    <div v-if="loading" class="center-state">Loading result...</div>
    <div v-else-if="error" class="center-state error">{{ error }}</div>

    <section v-else-if="result" class="result-shell">
      <header class="result-hero">
        <div>
          <div class="section-kicker">song guess result</div>
          <h1>{{ result.score }} / {{ result.total }}</h1>
          <p>{{ resultLabel }}</p>
        </div>
        <div class="score-mark">
          <span>{{ result.difficulty }}</span>
          <strong>{{ Math.round((result.score / result.total) * 100) }}%</strong>
        </div>
      </header>

      <ol class="result-list">
        <li v-for="item in result.items" :key="item.questionId" :class="{ wrong: !item.isCorrect }">
          <span class="result-no">{{ String(item.no).padStart(2, '0') }}</span>
          <div>
            <strong>{{ item.correctTitle }}</strong>
            <p v-if="item.isCorrect">Correct</p>
            <p v-else>你的选择：{{ item.selectedTitle || 'Time up' }}</p>
          </div>
          <span class="result-status">{{ item.isCorrect ? 'OK' : 'MISS' }}</span>
        </li>
      </ol>

      <footer class="result-actions">
        <button type="button" @click="shareResult">{{ copied ? '已复制' : '分享结果' }}</button>
        <RouterLink :to="{ name: 'miletSongGuess', params: { lang: route.params.lang } }">再次挑战</RouterLink>
        <RouterLink :to="{ name: 'milet', params: { lang: route.params.lang } }">回到 Home</RouterLink>
      </footer>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getSongGuessResult, type SongGuessResult } from '@/composables/interactive/songGuess'

const route = useRoute()
const result = ref<SongGuessResult | null>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)

const resultLabel = computed(() => {
  if (!result.value) return ''
  const ratio = result.value.score / result.value.total
  if (ratio === 1) return 'Perfect echo'
  if (ratio >= 0.8) return 'Clear memory'
  if (ratio >= 0.6) return 'Almost there'
  if (ratio > 0) return 'Keep listening'
  return 'Replay the echoes'
})

onMounted(async () => {
  try {
    result.value = await getSongGuessResult(String(route.params.challengeId || ''))
  } catch {
    error.value = '结果不存在或已过期。'
  } finally {
    loading.value = false
  }
})

async function shareResult() {
  if (!result.value) return
  copied.value = false
  const text = `${result.value.shareText}\nhttps://miles-dml.org/${route.params.lang || 'zh'}/milet/interactive/song-guess`

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
  } catch {
    window.prompt('复制分享结果', text)
  }
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  padding: 38px 24px 44px;
  color: #26313a;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(246, 250, 249, 0.86)),
    radial-gradient(circle at 90% 10%, rgba(155, 216, 210, 0.28), transparent 34%);
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

.result-shell {
  display: grid;
  gap: 24px;
}

.result-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid rgba(49, 127, 141, 0.16);
  padding-bottom: 24px;
}

.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(4rem, 12vw, 7.4rem);
  line-height: 0.86;
  color: #1e2a35;
}

.result-hero p {
  margin: 18px 0 0;
  color: #60707a;
  font-size: 1rem;
  font-weight: 800;
}

.score-mark {
  display: grid;
  min-width: 132px;
  gap: 8px;
  border: 1px solid rgba(49, 127, 141, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  padding: 18px;
  text-align: right;
}

.score-mark span {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.score-mark strong {
  font-size: 2rem;
}

.result-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.result-list li {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 58px;
  gap: 14px;
  align-items: center;
  border: 1px solid rgba(49, 127, 141, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.68);
  padding: 14px;
}

.result-list li.wrong {
  border-color: rgba(140, 72, 85, 0.24);
  background: rgba(252, 232, 236, 0.62);
}

.result-no {
  color: #317f8d;
  font-weight: 900;
}

.result-list strong {
  display: block;
  color: #26313a;
  line-height: 1.35;
}

.result-list p {
  margin: 4px 0 0;
  color: #60707a;
  font-size: 0.86rem;
}

.result-status {
  color: #317f8d;
  font-size: 0.76rem;
  font-weight: 900;
  text-align: right;
}

.wrong .result-status {
  color: #8c4855;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-actions button,
.result-actions a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(35, 49, 61, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  padding: 0 20px;
  color: #26313a;
  font-weight: 800;
  text-decoration: none;
}

.result-actions button:first-child {
  background: #26313a;
  color: #fff;
}

.result-actions button:hover,
.result-actions a:hover {
  border-color: rgba(49, 127, 141, 0.42);
  background: #317f8d;
  color: #fff;
}

@media (max-width: 680px) {
  .result-page {
    padding: 30px 18px 34px;
  }

  .result-hero {
    display: grid;
  }

  .score-mark {
    min-width: 0;
    text-align: left;
  }

  .result-list li {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .result-status {
    grid-column: 2;
    text-align: left;
  }

  .result-actions {
    display: grid;
  }
}
</style>
