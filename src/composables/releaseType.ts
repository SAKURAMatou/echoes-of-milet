// src/types/release.ts
export type ReleaseType = 'ALBUM' | 'EP' | 'SINGLE' | 'LIVE_BD' | 'LIVE_DVD'

export interface Track {
  id: string
  no: number
  title: string
  durationSec?: number
  lyric: string
  singer: string
  lyricists: string
  composers: string
  arrangers: string
  recorded_at: string
  performers: string
  language: string
}

export interface Disc {
  id: string
  no: number
  title?: string
  tracks: Track[]
}

export interface ReleaseEdition {
  id: string // release_id
  editionName: string // 通常盤 / 初回限定盤 など
  releaseDate: string
  coverUrl: string
  discs: Disc[]
}

export interface Work {
  id: string // work_id
  title: string
  artist: string
  coverUrl?: string // 共通（版ごとに違うなら edition 側に持ってもOK）
  releaseType: ReleaseType
  releaseDate: string
  editions: ReleaseEdition[]
}
