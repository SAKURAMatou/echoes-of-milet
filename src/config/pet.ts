import type {
  PetAction,
  PetDirectReaction,
  PetEvent,
  PetLookDirection,
  PetModuleKey,
  PetRouteMode,
} from '@/composables/pet/petTypes'

export const PET_MENU_DELAY_MS = 24
export const PET_DOUBLE_CLICK_MS = 240
export const PET_DOUBLE_CLICK_DISTANCE_PX = 18
export const PET_LONG_PRESS_MS = 550
export const PET_ATTENTION_RESUME_SUPPRESS_MS = 800
export const PET_ATTENTION_REENTRY_COOLDOWN_MS = 600
export const PET_SPEECH_DURATION_MS = 5200
export const PET_PHOTO_LOOK_WINDOW_MS = 30000
export const PET_DEFAULT_BOTTOM_PX = 88
export const PET_DEFAULT_RIGHT_DESKTOP_PX = 32
export const PET_DEFAULT_RIGHT_MOBILE_PX = 16
export const PET_DEFAULT_EDGE_PX = 8
export const PET_HOST_SIZE_DESKTOP_PX = 160
export const PET_HOST_SIZE_MOBILE_PX = 120
export const PET_MOBILE_MAX_WIDTH_PX = 767
export const PET_LOOK_SENSOR = {
  enterRadiusX: 220,
  enterRadiusY: 180,
  exitRadiusX: 248,
  exitRadiusY: 204,
  centerOffsetY: -24,
  centerDeadZone: 28,
  directionStableMs: 110,
  angleHysteresisDeg: 12,
  preloadRadius: 340,
  referenceSize: 160,
} as const

export interface PetWeightedAction {
  action: PetAction
  weight: number
}

export const PET_ACTION_POOLS = {
  idleRandom: ['sit', 'happy', 'curious', 'excited', 'sniff', 'look', 'sleep'],
  single: [{ action: 'happy', weight: 1 }],
  double: [
    { action: 'happy', weight: 0.5 },
    { action: 'curious', weight: 0.3 },
    { action: 'excited', weight: 0.2 },
  ],
  longPress: [
    { action: 'curious', weight: 0.45 },
    { action: 'happy', weight: 0.4 },
    { action: 'sit', weight: 0.15 },
  ],
  attention: ['lookLeft', 'lookLeftUp', 'lookUp', 'lookRightUp', 'lookRight'],
} as const satisfies {
  idleRandom: readonly PetAction[]
  single: readonly PetWeightedAction[]
  double: readonly PetWeightedAction[]
  longPress: readonly PetWeightedAction[]
  attention: readonly PetAction[]
}

export const PET_DIRECT_REACTION_POOLS = {
  single: PET_ACTION_POOLS.single,
  double: PET_ACTION_POOLS.double,
  longPress: PET_ACTION_POOLS.longPress,
} as const satisfies Record<PetDirectReaction, readonly PetWeightedAction[]>

export const PET_LOOK_ACTION_BY_DIRECTION = {
  left: 'lookLeft',
  leftUp: 'lookLeftUp',
  up: 'lookUp',
  rightUp: 'lookRightUp',
  right: 'lookRight',
} as const satisfies Record<PetLookDirection, PetAction>
export const PET_ROUTE_MODULE_ANIMATION = {
  timeline: 'curious',
  release: 'sniff',
  live: 'excited',
  pilgrimage: 'sniff',
  news: 'sit',
  album: 'curious',
} as const satisfies Record<PetModuleKey, PetAction>
export const PET_MODULE_ROUTES = {
  miletTimeLine: 'timeline',
  miletRelease: 'release',
  miletLiveArchive: 'live',
  miletPilgrimage: 'pilgrimage',
  miletNews: 'news',
  miletPicAlbum: 'album',
  galleryDetail: 'album',
} as const satisfies Record<string, PetModuleKey>

export type PetModuleRouteName = keyof typeof PET_MODULE_ROUTES
export const PET_QUIET_ROUTES = new Set<string>([
  'home',
  'milet',
  'miletArticle',
  'miletLiveDetail',
  'miletAnniversary',
  'miletAnniversaryYear',
  'aboutMe',
  'miletSongGuess',
  'miletSongGuessResult',
])
export const PET_HIDDEN_ROUTES = new Set<string>(['miletSongGuessPlay', 'miletLivePreview'])

export function resolvePetRouteMode(name: string | null | undefined): PetRouteMode {
  const routeName = typeof name === 'string' ? name : ''
  if (resolvePetRouteModule(routeName)) return 'reactive'
  if (PET_QUIET_ROUTES.has(routeName)) return 'quiet'
  if (PET_HIDDEN_ROUTES.has(routeName)) return 'hidden'
  return 'hidden'
}

export function resolvePetRouteModule(name: string | null | undefined): PetModuleKey | null {
  const routeName = typeof name === 'string' ? name : ''
  return PET_MODULE_ROUTES[routeName as PetModuleRouteName] ?? null
}

export function resolvePetPageEvent(moduleKey: PetModuleKey): PetEvent {
  switch (moduleKey) {
    case 'timeline':
      return 'timeline.enter'
    case 'release':
      return 'release.enter'
    case 'live':
      return 'live.enter'
    case 'pilgrimage':
      return 'pilgrimage.enter'
    case 'news':
      return 'news.enter'
    case 'album':
      return 'album.enter'
  }
}

export function resolvePetEventAction(event: PetEvent): PetAction | null {
  switch (event) {
    case 'timeline.enter':
    case 'album.enter':
      return 'curious'
    case 'release.enter':
    case 'pilgrimage.enter':
      return 'sniff'
    case 'live.open':
      return 'happy'
    case 'live.enter':
      return 'excited'
    case 'news.enter':
      return 'sit'
    case 'photo.open':
      return 'look'
    case 'location.open':
      return 'sniff'
    case 'news.favorite':
      return null
  }
}

export interface PetQuickMenuRouteMeta {
  key: PetModuleKey
  routeName: PetModuleRouteName
  color: 'amber' | 'violet' | 'sky'
}

export const PET_QUICK_MENU_ROUTES = [
  { key: 'timeline', routeName: 'miletTimeLine', color: 'amber' },
  { key: 'release', routeName: 'miletRelease', color: 'violet' },
  { key: 'live', routeName: 'miletLiveArchive', color: 'sky' },
  { key: 'pilgrimage', routeName: 'miletPilgrimage', color: 'amber' },
] as const satisfies readonly PetQuickMenuRouteMeta[]

/** Stable copy key used by every locale when a quick-menu entry is added. */
export type PetQuickMenuKey = (typeof PET_QUICK_MENU_ROUTES)[number]['key']

export const PET_CORE_PRELOAD_ACTIONS: PetAction[] = ['idle', 'drag', 'happy']
