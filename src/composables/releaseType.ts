export type ReleaseType = 'ALBUM' | 'EP' | 'SINGLE' | 'LIVE' | 'LIVE_BD' | 'LIVE_DVD'
export type DistributionType = 'PHYSICAL' | 'STREAMING'

export type TrackListenEntry = {
  platformCode: string
  platformLabel: string
  platformIcon: string
  language: string
  url: string
  sourceType: string
  title: string
  artist: string
  album: string
  isValid: boolean
}

export type TrackListenData = {
  jp: TrackListenEntry[]
  zh: TrackListenEntry[]
}

export interface Track {
  showId: string
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
  listenData?: TrackListenData
}

export interface Disc {
  id: string
  no?: number
  discNo?: number
  title?: string
  isVirtual?: boolean
  tracks: Track[]
}

export interface ReleaseEdition {
  id: string
  editionName: string
  releaseDate?: string
  coverUrl: string
  discs: Disc[]
}

export interface Work {
  id: string
  title: string
  artist: string
  coverUrl?: string
  releaseType: ReleaseType
  isPhysical: boolean
  distributionType: DistributionType
  releaseDate: string
  editions: ReleaseEdition[]
}
