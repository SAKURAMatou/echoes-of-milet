import type { LiveEventType } from '@/composables/liveArchive'

export type LiveDetailBlueprintGroup = 'one-man' | 'tour'

export type LiveDetailBlueprintId =
  | 'one-man-compact-related'
  | 'one-man-visual-cards'
  | 'tour-balanced-stops'
  | 'tour-serpentine-route'

export type LiveDetailThemePreset = 'default' | 'echo-blue'

export type LiveDetailThemeTokens = {
  shell: string
  headerBg: string
  headerBorder: string
  pageBg: string
  title: string
  titleSoft: string
  text: string
  muted: string
  subtle: string
  accent: string
  accentStrong: string
  accentBorder: string
  panelBg: string
  surfaceBg: string
  linkHover: string
  line: string
  glow: string
  route: string
}

export const liveDetailBlueprints: Array<{
  value: LiveDetailBlueprintId
  label: string
  group: LiveDetailBlueprintGroup
  supportedTypes: LiveEventType[]
  description: string
}> = [
  {
    value: 'one-man-compact-related',
    label: 'One Man Compact Related',
    group: 'one-man',
    supportedTypes: ['one_man', 'special_live', 'festival'],
    description: '紧凑档案布局，适合单场或少量场次，强调日期切换、演出信息、setlist 与关联入口。',
  },
  {
    value: 'one-man-visual-cards',
    label: 'One Man Visual Cards',
    group: 'one-man',
    supportedTypes: ['one_man', 'special_live', 'festival'],
    description: '大主视觉和卡片式内容布局，适合有主视觉、场馆线稿图和相册内容的单场演出。',
  },
  {
    value: 'tour-balanced-stops',
    label: 'Tour Balanced Stops',
    group: 'tour',
    supportedTypes: ['tour'],
    description: '主视觉居中、左右分布场次列表的巡演布局，适合 12 场以内的清晰巡演导航。',
  },
  {
    value: 'tour-serpentine-route',
    label: 'Tour Serpentine Route',
    group: 'tour',
    supportedTypes: ['tour'],
    description: '纵向蛇形路线巡演布局，适合 20 场以内的场次路线和当前站点联动展示。',
  },
]

export const liveDetailThemes: Record<LiveDetailThemePreset, {
  label: string
  description: string
  tokens: LiveDetailThemeTokens
}> = {
  default: {
    label: 'Midnight Gold',
    description: '深海夜色、舞台金色和细腻蓝光，作为 Live Archive 默认主题。',
    tokens: {
      shell: '#020b15',
      headerBg: 'rgba(2, 11, 21, 0.9)',
      headerBorder: 'rgba(214, 179, 106, 0.28)',
      pageBg:
        'radial-gradient(circle at 50% 4%, rgba(88, 140, 178, 0.3), transparent 32rem), radial-gradient(circle at 10% 38%, rgba(214, 179, 106, 0.18), transparent 26rem), radial-gradient(circle at 88% 54%, rgba(125, 211, 252, 0.11), transparent 28rem), linear-gradient(180deg, #020b15 0%, #061927 46%, #03111d 100%)',
      title: '#f6ecdf',
      titleSoft: '#fff8ec',
      text: '#deebf4',
      muted: '#bfd0dc',
      subtle: '#95abbc',
      accent: '#d6b36a',
      accentStrong: '#f5d59a',
      accentBorder: 'rgba(214, 179, 106, 0.46)',
      panelBg: 'rgba(5, 22, 36, 0.86)',
      surfaceBg: 'rgba(6, 25, 40, 0.56)',
      linkHover: '#9fd4ff',
      line: 'rgba(214, 179, 106, 0.3)',
      glow: 'rgba(245, 213, 154, 0.82)',
      route: '#9fd4ff',
    },
  },
  'echo-blue': {
    label: 'Echo Blue',
    description: '沿用当前网站的清透蓝色调，配合柔和金色强调和更冷静的舞台光感。',
    tokens: {
      shell: '#051629',
      headerBg: 'rgba(5, 22, 41, 0.92)',
      headerBorder: 'rgba(125, 211, 252, 0.28)',
      pageBg:
        'radial-gradient(circle at 46% 7%, rgba(14, 165, 233, 0.28), transparent 34rem), radial-gradient(circle at 9% 38%, rgba(191, 219, 254, 0.14), transparent 24rem), radial-gradient(circle at 86% 46%, rgba(214, 179, 106, 0.12), transparent 24rem), linear-gradient(180deg, #051629 0%, #08263d 48%, #061321 100%)',
      title: '#f8fafc',
      titleSoft: '#e0f2fe',
      text: '#ddecff',
      muted: '#b4c8da',
      subtle: '#86a2b8',
      accent: '#7dd3fc',
      accentStrong: '#bae6fd',
      accentBorder: 'rgba(125, 211, 252, 0.46)',
      panelBg: 'rgba(7, 35, 56, 0.86)',
      surfaceBg: 'rgba(6, 24, 43, 0.58)',
      linkHover: '#f4d397',
      line: 'rgba(125, 211, 252, 0.3)',
      glow: 'rgba(125, 211, 252, 0.78)',
      route: '#f4d397',
    },
  },
}

export function isTourEventType(type?: string | null) {
  return type === 'tour'
}

export function defaultLiveDetailBlueprintForType(type?: string | null): LiveDetailBlueprintId {
  return isTourEventType(type) ? 'tour-balanced-stops' : 'one-man-compact-related'
}

export function normalizeLiveDetailBlueprint(
  blueprint?: string | null,
  eventType?: string | null,
): LiveDetailBlueprintId {
  const value = blueprint === 'one-man-magazine' ? 'one-man-compact-related' : blueprint
  const option = liveDetailBlueprints.find((item) => item.value === value)
  if (!option || !option.supportedTypes.includes(eventType || 'one_man')) {
    return defaultLiveDetailBlueprintForType(eventType)
  }
  return option.value
}

export function normalizeLiveDetailTheme(themePreset?: string | null): LiveDetailThemePreset {
  return themePreset === 'echo-blue' ? 'echo-blue' : 'default'
}

export function liveDetailBlueprintGroup(blueprint: LiveDetailBlueprintId): LiveDetailBlueprintGroup {
  return blueprint.startsWith('tour-') ? 'tour' : 'one-man'
}
