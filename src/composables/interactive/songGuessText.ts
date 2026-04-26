import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { SONG_GUESS_TEXT } from '@/composables/lang/songGuess'

type SongGuessText = {
  homeTitle: string
  homeDescription: string
  homeCta: string
  homeMeta: string
  introEyebrow: string
  introTitle: string
  introLead: string
  introSub: string
  setupEyebrow: string
  setupTitle: string
  loadConfigError: string
  createError: string
  start: string
  preparing: string
  questionsBadge: string
  randomBankBadge: string
  feedbackBadge: string
  audioSuffix: string
  difficultyDetail: string
  loadingChallenge: string
  challengeSuffix: string
  question: string
  pause: string
  play: string
  correct: string
  answerPrefix: string
  timeUp: string
  playHint: string
  checking: string
  submit: string
  viewResult: string
  nextQuestion: string
  challengeError: string
  audioError: string
  answerError: string
  loadingResult: string
  resultEyebrow: string
  copied: string
  share: string
  retry: string
  home: string
  resultError: string
  yourChoice: string
  perfect: string
  clear: string
  almost: string
  keep: string
  replay: string
}

function songGuessText(lang: SupportedLang): SongGuessText {
  return SONG_GUESS_TEXT[lang] as SongGuessText
}

function resolveLang(value: unknown): SupportedLang {
  return value === 'ja' || value === 'jp' ? 'jp' : 'zh'
}

export function useSongGuessText() {
  const route = useRoute()
  return computed<SongGuessText>(
    () => songGuessText(resolveLang(route.params.lang)) || songGuessText('zh'),
  )
}
