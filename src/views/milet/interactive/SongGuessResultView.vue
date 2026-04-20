<template>
  <article
    class="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(246,250,249,0.86)),radial-gradient(circle_at_90%_10%,rgba(155,216,210,0.28),transparent_34%)] px-6 py-9 text-[#26313a] max-md:px-[18px] max-md:py-[30px]"
  >
    <div v-if="loading" class="grid min-h-[360px] place-items-center font-bold text-[#60707a]">{{ text.loadingResult }}</div>
    <div v-else-if="error" class="grid min-h-[360px] place-items-center font-bold text-[#8c4855]">{{ error }}</div>

    <section v-else-if="result" class="grid gap-6">
      <header class="flex items-end justify-between gap-6 border-b border-[#317f8d]/15 pb-6 max-md:grid">
        <div>
          <div class="text-[0.78rem] font-extrabold uppercase tracking-[0.16em] text-[#317f8d]">
            {{ text.resultEyebrow }}
          </div>
          <h1 class="mt-2.5 font-serif text-[clamp(4rem,12vw,7.4rem)] leading-[0.86] text-[#1e2a35]">
            {{ result.score }} / {{ result.total }}
          </h1>
          <p class="mt-[18px] text-base font-extrabold text-[#60707a]">{{ resultLabel }}</p>
        </div>
        <div class="grid min-w-[132px] gap-2 rounded-[18px] border border-[#317f8d]/20 bg-white/75 p-[18px] text-right max-md:text-left">
          <span class="text-[0.78rem] font-black uppercase text-[#317f8d]">{{ result.difficulty }}</span>
          <strong class="text-[2rem]">{{ Math.round((result.score / result.total) * 100) }}%</strong>
        </div>
      </header>

      <footer class="flex flex-wrap gap-2.5 max-md:grid">
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#23313d]/20 bg-[#26313a] px-5 font-extrabold text-white hover:bg-[#317f8d]"
          @click="shareResult"
        >
          {{ copied ? text.copied : text.share }}
        </button>
        <RouterLink
          class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#23313d]/20 bg-white/75 px-5 font-extrabold text-[#26313a] no-underline hover:bg-[#317f8d] hover:text-white"
          :to="{ name: 'miletSongGuess', params: { lang: route.params.lang } }"
        >
          {{ text.retry }}
        </RouterLink>
        <RouterLink
          class="inline-flex min-h-11 items-center justify-center rounded-full border border-[#23313d]/20 bg-white/75 px-5 font-extrabold text-[#26313a] no-underline hover:bg-[#317f8d] hover:text-white"
          :to="{ name: 'milet', params: { lang: route.params.lang } }"
        >
          {{ text.home }}
        </RouterLink>
      </footer>

      <ol class="grid gap-2.5 p-0">
        <li
          v-for="item in result.items"
          :key="item.questionId"
          class="grid grid-cols-[46px_minmax(0,1fr)_58px] items-center gap-3.5 rounded-2xl border p-3.5 max-md:grid-cols-[38px_minmax(0,1fr)]"
          :class="item.isCorrect ? 'border-[#317f8d]/15 bg-white/70' : 'border-[#8c4855]/25 bg-[rgba(252,232,236,0.62)]'"
        >
          <span class="font-black text-[#317f8d]">{{ String(item.no).padStart(2, '0') }}</span>
          <div>
            <strong class="block leading-snug text-[#26313a]">{{ item.correctTitle }}</strong>
            <p class="m-0 mt-1 text-[0.86rem] text-[#60707a]">
              {{ item.isCorrect ? text.correct : `${text.yourChoice}${item.selectedTitle || text.timeUp}` }}
            </p>
          </div>
          <span
            class="text-right text-[0.76rem] font-black max-md:col-start-2 max-md:text-left"
            :class="item.isCorrect ? 'text-[#317f8d]' : 'text-[#8c4855]'"
          >
            {{ item.isCorrect ? 'OK' : 'MISS' }}
          </span>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { getSongGuessResult, type SongGuessResult } from '@/composables/interactive/songGuess'
import { useSongGuessText } from '@/composables/interactive/songGuessText'

const PNG_QUALITY = 0.92

const route = useRoute()
const text = useSongGuessText()
const result = ref<SongGuessResult | null>(null)
const loading = ref(true)
const error = ref('')
const copied = ref(false)

const resultLabel = computed(() => {
  if (!result.value) return ''
  const ratio = result.value.score / result.value.total
  if (ratio === 1) return text.value.perfect
  if (ratio >= 0.8) return text.value.clear
  if (ratio >= 0.6) return text.value.almost
  if (ratio > 0) return text.value.keep
  return text.value.replay
})

onMounted(async () => {
  try {
    result.value = await getSongGuessResult(String(route.params.challengeId || ''))
  } catch {
    error.value = text.value.resultError
  } finally {
    loading.value = false
  }
})

async function createShareImageBlob() {
  if (!result.value) return null
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#f8fcfd')
  gradient.addColorStop(1, '#dceff0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  ctx.fillStyle = 'rgba(49,127,141,0.12)'
  for (let i = 0; i < 34; i += 1) {
    const x = 90 + i * 30
    const h = 60 + ((i * 37) % 160)
    ctx.fillRect(x, 380 - h / 2, 12, h)
  }

  ctx.fillStyle = '#317f8d'
  ctx.font = '700 30px Montserrat, sans-serif'
  ctx.fillText('ECHOES OF MILET / SONG GUESS', 90, 105)

  ctx.fillStyle = '#1e2a35'
  ctx.font = '700 132px Georgia, serif'
  ctx.fillText(`${result.value.score} / ${result.value.total}`, 90, 270)

  ctx.fillStyle = '#60707a'
  ctx.font = '700 42px Montserrat, sans-serif'
  ctx.fillText(`${result.value.difficulty.toUpperCase()} - ${resultLabel.value}`, 96, 335)

  ctx.fillStyle = '#26313a'
  ctx.font = '600 30px Montserrat, sans-serif'
  ctx.fillText('Challenge link:', 90, 515)
  ctx.font = '600 26px Montserrat, sans-serif'
  ctx.fillText(shareUrl(), 90, 558)

  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', PNG_QUALITY))
}

function shareUrl() {
  return `https://miles-dml.org/${route.params.lang || 'zh'}/milet/interactive/song-guess`
}

async function copyImageAndLink(blob: Blob, shareText: string) {
  const clipboard = navigator.clipboard as Clipboard & {
    write?: (data: ClipboardItem[]) => Promise<void>
  }
  if (!clipboard.write || typeof ClipboardItem === 'undefined') {
    await navigator.clipboard.writeText(shareText)
    return
  }

  await clipboard.write([
    new ClipboardItem({
      'image/png': blob,
      'text/plain': new Blob([shareText], { type: 'text/plain' }),
    }),
  ])
}

async function shareResult() {
  if (!result.value) return
  copied.value = false
  const url = shareUrl()
  const shareText = `${result.value.shareText}\n${url}`
  const blob = await createShareImageBlob()

  try {
    if (blob) {
      await copyImageAndLink(blob, shareText)
    } else {
      await navigator.clipboard.writeText(shareText)
    }
    copied.value = true
  } catch {
    await navigator.clipboard.writeText(shareText)
    copied.value = true
  }
}
</script>
