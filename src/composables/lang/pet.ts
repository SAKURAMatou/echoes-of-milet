import type { PetQuickMenuKey } from '@/config/pet'

export interface PetQuickMenuItemText {
  label: string
  hint: string
}

export interface PetQuickMenuText {
  menuLabel: string
  items: Record<PetQuickMenuKey, PetQuickMenuItemText>
}

interface PetLocalizedText extends PetQuickMenuText {
  petButtonLabel: string
  menuOpenHint: string
  menuCloseHint: string
}

export const PET_TEXT = {
  zh: {
    petButtonLabel: 'Jean 互动宠物',
    menuLabel: 'Jean 快捷入口',
    menuOpenHint: '已打开快捷入口',
    menuCloseHint: '已关闭快捷入口',
    items: {
      timeline: { label: '时间线', hint: 'milet 活动时间线' },
      release: { label: '音乐作品', hint: '音乐作品与试听' },
      live: { label: '演出记录', hint: 'Live 演出记录' },
      pilgrimage: { label: '朝圣之旅', hint: 'milet 朝圣之旅' },
    },
  },
  jp: {
    petButtonLabel: 'Jean インタラクティブペット',
    menuLabel: 'Jean クイックメニュー',
    menuOpenHint: 'クイックメニューを開きました',
    menuCloseHint: 'クイックメニューを閉じました',
    items: {
      timeline: { label: 'タイムライン', hint: 'milet の活動年表' },
      release: { label: '音楽作品', hint: '音楽作品と試聴' },
      live: { label: 'ライブ', hint: 'ライブ記録' },
      pilgrimage: { label: '巡礼の旅', hint: 'milet 巡礼の旅' },
    },
  },
} as const satisfies Record<'zh' | 'jp', PetLocalizedText>
