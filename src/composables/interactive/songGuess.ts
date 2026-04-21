import axiosInstance from '@/AxiosUtil'
import { apiRoutes } from '@/config/api'

export type SongGuessDifficulty = 'easy' | 'normal' | 'hard'

export interface SongGuessBank {
  id: string
  label: string
}

export interface SongGuessDifficultyConfig {
  id: SongGuessDifficulty
  label: string
  clipDurationSec: number
  timeLimitSec: number
  optionCount: number
  questionCount: number
}

export interface SongGuessOption {
  optionId: string
  title: string
}

export interface SongGuessQuestion {
  questionId: string
  no: number
  audioUrl: string
  durationSec: number
  timeLimitSec: number
  options: SongGuessOption[]
}

export interface SongGuessAnswer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  elapsedMs: number
  answeredAt: string
}

export interface SongGuessChallenge {
  challengeId: string
  bankId: string
  difficulty: SongGuessDifficulty
  questionCount: number
  timeLimitSec: number
  optionCount: number
  status: 'active' | 'finished'
  startedAt: string
  finishedAt?: string
  questions: SongGuessQuestion[]
  answers: SongGuessAnswer[]
}

export interface SongGuessAnswerResult {
  questionId: string
  selectedOptionId: string
  selectedTitle: string
  correctOptionId: string
  correctTitle: string
  isCorrect: boolean
  elapsedMs: number
}

export interface SongGuessResultItem {
  no: number
  questionId: string
  correctTitle: string
  selectedTitle: string
  isCorrect: boolean
  answered: boolean
}

export interface SongGuessResult {
  challengeId: string
  bankId: string
  difficulty: SongGuessDifficulty
  score: number
  total: number
  status: 'active' | 'finished'
  startedAt: string
  finishedAt?: string
  items: SongGuessResultItem[]
  shareText: string
}

export interface SongGuessConfig {
  difficulties: SongGuessDifficultyConfig[]
}

const baseUrl = apiRoutes.miletSongGuess

export function getSongGuessConfig() {
  return axiosInstance.get<SongGuessConfig>(`${baseUrl}/config`)
}

export function createSongGuessChallenge(payload: {
  difficulty: SongGuessDifficulty
  lang: string
}) {
  return axiosInstance.post<SongGuessChallenge>(`${baseUrl}/challenges`, payload)
}

export function getSongGuessChallenge(challengeId: string) {
  return axiosInstance.get<SongGuessChallenge>(`${baseUrl}/challenges/${challengeId}`)
}

export function submitSongGuessAnswer(
  challengeId: string,
  payload: { questionId: string; optionId: string; elapsedMs: number },
) {
  return axiosInstance.post<SongGuessAnswerResult>(`${baseUrl}/challenges/${challengeId}/answers`, payload)
}

export function getSongGuessResult(challengeId: string) {
  return axiosInstance.get<SongGuessResult>(`${baseUrl}/challenges/${challengeId}/result`)
}
