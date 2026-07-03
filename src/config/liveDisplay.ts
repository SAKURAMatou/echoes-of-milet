import type { LiveEventType } from '@/composables/liveArchive'

export type LiveDetailBlueprintGroup = 'one-man' | 'tour'

export type LiveDetailBlueprintId =
  | 'one-man-compact-related'
  | 'one-man-visual-cards'
  | 'tour-balanced-stops'
  | 'tour-serpentine-route'

export type LiveDetailThemePreset = 'default' | 'echo-blue' | 'stairs-colors'

export type LiveDetailThemeTokens = {
  colorScheme: 'dark' | 'light'
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
  venueLineArtBg: string
  venueLineArtBorder: string
  venueLineArtFilter: string
  venueLineArtOpacity: string
  venueLineArtShadow: string
  venueLineArtBlendMode: string
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
      colorScheme: 'dark',
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
      venueLineArtBg:
        'linear-gradient(135deg, rgba(255, 248, 232, 0.075), rgba(159, 212, 255, 0.035))',
      venueLineArtBorder: 'rgba(245, 213, 154, 0.2)',
      venueLineArtFilter:
        'brightness(0) saturate(100%) invert(89%) sepia(24%) saturate(642%) hue-rotate(351deg) brightness(104%) contrast(93%) drop-shadow(0 0 14px rgba(245, 213, 154, 0.28))',
      venueLineArtOpacity: '0.9',
      venueLineArtShadow: 'inset 0 0 0 1px rgba(255,255,255,0.035), 0 18px 50px -38px rgba(245, 213, 154, 0.86)',
      venueLineArtBlendMode: 'screen',
    },
  },
  'echo-blue': {
    label: 'Echo Blue',
    description: '沿用当前网站的天空蓝和白色玻璃感，适合更轻盈、清透的 Live Archive 详情页。',
    tokens: {
      colorScheme: 'light',
      shell: '#f0f9ff',
      headerBg: 'rgba(255, 255, 255, 0.86)',
      headerBorder: 'rgba(14, 165, 233, 0.28)',
      pageBg:
        'radial-gradient(circle at 12% 10%, rgba(186, 230, 253, 0.9), transparent 28rem), radial-gradient(circle at 88% 18%, rgba(224, 242, 254, 0.88), transparent 30rem), radial-gradient(circle at 50% 82%, rgba(14, 165, 233, 0.12), transparent 28rem), linear-gradient(135deg, #ffffff 0%, #f0f9ff 44%, #e0f2fe 100%)',
      title: '#143d63',
      titleSoft: '#317f8d',
      text: '#24323a',
      muted: '#546e7a',
      subtle: '#7c98a8',
      accent: '#0284c7',
      accentStrong: '#0ea5e9',
      accentBorder: 'rgba(14, 165, 233, 0.34)',
      panelBg: 'rgba(255, 255, 255, 0.84)',
      surfaceBg: 'rgba(240, 249, 255, 0.72)',
      linkHover: '#0369a1',
      line: 'rgba(49, 127, 141, 0.24)',
      glow: 'rgba(125, 211, 252, 0.46)',
      route: '#0ea5e9',
      venueLineArtBg:
        'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(224,242,254,0.52))',
      venueLineArtBorder: 'rgba(14, 165, 233, 0.24)',
      venueLineArtFilter:
        'brightness(0) saturate(100%) invert(33%) sepia(42%) saturate(1098%) hue-rotate(158deg) brightness(92%) contrast(92%) drop-shadow(0 12px 18px rgba(14, 116, 144, 0.16))',
      venueLineArtOpacity: '0.78',
      venueLineArtShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), 0 18px 42px -34px rgba(14, 116, 144, 0.46)',
      venueLineArtBlendMode: 'multiply',
    },
  },
  'stairs-colors': {
    label: 'stairs colors',
    description: '参考 stairs 2024 官方周边图的粉橙晚霞和奶油纸感，适合更柔和的纪念册式页面。',
    tokens: {
      colorScheme: 'light',
      shell: '#fff0e8',
      headerBg: 'rgba(255, 242, 232, 0.88)',
      headerBorder: 'rgba(224, 112, 112, 0.36)',
      pageBg:
        'radial-gradient(circle at 14% 4%, rgba(229, 96, 132, 0.38), transparent 26rem), radial-gradient(circle at 88% 10%, rgba(245, 158, 11, 0.34), transparent 28rem), radial-gradient(circle at 20% 92%, rgba(160, 96, 144, 0.24), transparent 24rem), linear-gradient(145deg, #fff4ea 0%, #ffe2df 48%, #f7c8b8 100%)',
      title: '#3f2531',
      titleSoft: '#7d365e',
      text: '#463238',
      muted: '#765961',
      subtle: '#9b777d',
      accent: '#df6475',
      accentStrong: '#f59e0b',
      accentBorder: 'rgba(224, 112, 112, 0.42)',
      panelBg: 'rgba(255, 248, 242, 0.86)',
      surfaceBg: 'rgba(255, 237, 228, 0.72)',
      linkHover: '#b83280',
      line: 'rgba(224, 112, 112, 0.3)',
      glow: 'rgba(240, 144, 96, 0.56)',
      route: '#df6475',
      venueLineArtBg:
        'linear-gradient(135deg, rgba(255,248,242,0.78), rgba(255,225,214,0.48))',
      venueLineArtBorder: 'rgba(224, 112, 112, 0.28)',
      venueLineArtFilter:
        'brightness(0) saturate(100%) invert(35%) sepia(30%) saturate(1040%) hue-rotate(298deg) brightness(93%) contrast(90%) drop-shadow(0 12px 18px rgba(223, 100, 117, 0.18))',
      venueLineArtOpacity: '0.82',
      venueLineArtShadow: 'inset 0 1px 0 rgba(255,255,255,0.72), 0 18px 46px -34px rgba(160, 96, 144, 0.48)',
      venueLineArtBlendMode: 'multiply',
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
  if (themePreset === 'echo-blue' || themePreset === 'stairs-colors') return themePreset
  return 'default'
}

export function liveDetailBlueprintGroup(blueprint: LiveDetailBlueprintId): LiveDetailBlueprintGroup {
  return blueprint.startsWith('tour-') ? 'tour' : 'one-man'
}
