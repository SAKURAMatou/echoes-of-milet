import type { PetQuickMenuKey } from '@/config/pet'
import type { PetSpeechKey } from '@/composables/pet/petTypes'

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
  speech: Record<PetSpeechKey, string>
}

export const PET_TEXT = {
  zh: {
    petButtonLabel: 'Jean 互动宠物',
    menuLabel: 'Jean 快捷入口',
    menuOpenHint: '已打开快捷入口',
    menuCloseHint: '已关闭快捷入口',
    speech: {
      gentleTouch: '轻轻碰一下，也许会有小路从身边展开。',
      doubleWag: '尾巴摇两下的时候，常会有新发现。',
      stayClose: '多停一会儿吧，我会把耳朵借给你。',
      cozySpot: '这里风有点大，带我换个舒服的位置吧。',
      nearbyPresence: '你靠近时，我的耳朵总会先知道。',
    },
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
    speech: {
      gentleTouch: 'そっと触れたら、小さな道がひらくかも。',
      doubleWag: 'しっぽが二度ゆれると、何か見つかるかも。',
      stayClose: 'もう少しそばにいて。耳を澄ませるから。',
      cozySpot: '風が強いね。居心地のいい場所へ連れていって。',
      nearbyPresence: '近づく気配は、耳が先に気づくよ。',
    },
    items: {
      timeline: { label: 'タイムライン', hint: 'milet の活動年表' },
      release: { label: '音楽作品', hint: '音楽作品と試聴' },
      live: { label: 'ライブ', hint: 'ライブ記録' },
      pilgrimage: { label: '巡礼の旅', hint: 'milet 巡礼の旅' },
    },
  },
} as const satisfies Record<'zh' | 'jp', PetLocalizedText>
