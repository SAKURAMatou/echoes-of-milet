<template>
  <section id="echo-room" class="echo-room-section">
    <div>
      <div class="section-kicker">echo room</div>
      <h2>Song Guess Challenge</h2>
      <p>新增的互动回声室。选择题库和难度，听一段音频，在倒计时结束前猜出是哪首歌。</p>
    </div>
    <RouterLink :to="to" class="echo-room-link">
      <span>开始听歌识曲</span>
      <small>10 questions / instant feedback</small>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const to = computed(() => ({
  name: 'miletSongGuess',
  params: { lang: route.params.lang || 'zh' },
}))
</script>

<style scoped>
.echo-room-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(230px, 0.54fr);
  gap: 20px;
  align-items: stretch;
  margin-top: 16px;
  border-top: 1px solid rgba(49, 127, 141, 0.16);
  padding-top: 30px;
}

.section-kicker {
  color: #317f8d;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h2 {
  margin: 8px 0 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 5vw, 3.35rem);
  line-height: 1;
  color: #26313a;
}

p {
  max-width: 560px;
  margin: 14px 0 0;
  color: #60707a;
  font-size: 0.95rem;
  line-height: 1.8;
}

.echo-room-link {
  position: relative;
  display: grid;
  align-content: end;
  min-height: 168px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(238, 248, 250, 0.68)),
    repeating-linear-gradient(90deg, rgba(49, 127, 141, 0.1) 0, rgba(49, 127, 141, 0.1) 1px, transparent 1px, transparent 16px);
  padding: 18px;
  color: #26313a;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.echo-room-link::before {
  content: '';
  position: absolute;
  inset: 28px -20px auto;
  height: 58px;
  border-top: 3px solid rgba(49, 127, 141, 0.22);
  border-radius: 50%;
}

.echo-room-link:hover {
  transform: translateY(-2px);
  border-color: rgba(49, 127, 141, 0.3);
  box-shadow: 0 24px 60px -42px rgba(15, 23, 42, 0.42);
}

.echo-room-link span {
  position: relative;
  font-weight: 900;
}

.echo-room-link small {
  position: relative;
  margin-top: 6px;
  color: #317f8d;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .echo-room-section {
    grid-template-columns: 1fr;
  }

  .echo-room-link {
    min-height: 132px;
  }
}
</style>
