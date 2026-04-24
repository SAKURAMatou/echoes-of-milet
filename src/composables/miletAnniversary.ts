export type AnniversaryLang = 'zh' | 'ja'

export type AnniversaryText = Record<AnniversaryLang, string>

export interface AnniversaryTimelineMoment {
  id: string
  date: string
  label: AnniversaryText
  title: AnniversaryText
  body: AnniversaryText
}

export interface AnniversaryRelease {
  id: string
  date: string
  type: string
  title: string
  cover: string
  note: AnniversaryText
}

export interface AnniversaryPhoto {
  id: string
  month: string
  image: string
  alt: AnniversaryText
  caption: AnniversaryText
  final: {
    x: string
    y: string
    w: string
    r: string
    mx: string
    my: string
    mw: string
    mr: string
  }
}

export interface AnniversaryRecord {
  year: number
  anniversaryNo: number
  title: AnniversaryText
  lead: AnniversaryText
  giftNote: AnniversaryText
  archiveTitle: AnniversaryText
  archiveLead: AnniversaryText
  chapters: Array<{
    id: string
    eyebrow: string
    title: AnniversaryText
  }>
  timeline: AnniversaryTimelineMoment[]
  releases: AnniversaryRelease[]
  photos: AnniversaryPhoto[]
}

export interface AnniversaryArchiveConfig {
  debutDate: string
  debutMonth: number
  records: Record<string, AnniversaryRecord>
}

const record2026: AnniversaryRecord = {
  year: 2026,
  anniversaryNo: 7,
  title: {
    zh: 'Happy Anniversary, milet',
    ja: 'Happy Anniversary, milet',
  },
  lead: {
    zh: '今年也有很多新的回声抵达。新的歌，舞台上的光，还有每个月等来的 milet の日。',
    ja: '今年もたくさんの新しい響きが届きました。新しい歌、ステージの光、そして毎月待っていた milet の日。',
  },
  giftNote: {
    zh: '这一页，是一个 miles 小小的祝福。',
    ja: 'このページは、ひとりの miles からの小さなお祝いです。',
  },
  archiveTitle: {
    zh: 'Anniversary Archive',
    ja: 'Anniversary Archive',
  },
  archiveLead: {
    zh: '按年份回看每一次周年记录，把祝福、活动、发布物和 milet の日 的照片慢慢存下来。',
    ja: '年ごとに記念ページを振り返りながら、お祝い、活動、作品、milet の日の写真を少しずつ残していく archive です。',
  },
  chapters: [
    {
      id: 'greeting',
      eyebrow: 'greeting',
      title: { zh: '先把祝福放在最前面', ja: 'まずは、お祝いの言葉から' },
    },
    {
      id: 'year',
      eyebrow: 'year notes',
      title: { zh: '这一年也很热闹', ja: 'この一年もにぎやかでした' },
    },
    {
      id: 'songs',
      eyebrow: 'songs',
      title: { zh: '抵达的作品', ja: '届いた作品たち' },
    },
    {
      id: 'photos',
      eyebrow: 'milet day',
      title: { zh: '十二次 milet の日', ja: '12回の milet の日' },
    },
  ],
  timeline: [
    {
      id: 'live',
      date: '2025 spring',
      label: { zh: 'stage light', ja: 'stage light' },
      title: { zh: '舞台上的光又被记住了一次', ja: 'ステージの光が、またひとつ記憶になった' },
      body: {
        zh: '不是为了数清发生了多少事，只是想再看一遍那些让人心动的瞬间。',
        ja: '出来事を数えるためではなく、心が動いた瞬間をもう一度見つめるために。',
      },
    },
    {
      id: 'voice',
      date: '2025 summer',
      label: { zh: 'voice', ja: 'voice' },
      title: { zh: '新的声音，慢慢变成这一年的颜色', ja: '新しい声が、この一年の色になっていく' },
      body: {
        zh: '有些歌第一次听见时很近，过了一段时间以后，反而更像留在心里的季节。',
        ja: '初めて聴いた時は近くにあって、時間が経つほど心に残る季節のようになっていく歌があります。',
      },
    },
    {
      id: 'miles',
      date: '2025 winter',
      label: { zh: 'with miles', ja: 'with miles' },
      title: { zh: '很多等待，也变成了庆祝的一部分', ja: '待つ時間も、お祝いの一部になりました' },
      body: {
        zh: '每一次公开、每一张照片、每一个 live 后的余韵，都让这个 fan site 多了一点新的回声。',
        ja: '告知も、写真も、ライブの余韻も、この fan site に新しい echo を少しずつ増やしてくれました。',
      },
    },
  ],
  releases: [
    {
      id: 'hanataba',
      date: '2025.04',
      type: 'single',
      title: 'hanataba',
      cover: '/echoes-of-milet-OG.webp',
      note: {
        zh: '像把某个明亮的季节轻轻留了下来。',
        ja: '明るい季節をそっと残してくれたような一曲。',
      },
    },
    {
      id: 'inside-you',
      date: '2025.07',
      type: 'digital',
      title: 'inside you',
      cover: '/milet-img/milet-site-og-img.jpg',
      note: {
        zh: '回到最初的声音，也像重新确认为什么会喜欢。',
        ja: '最初の響きに戻るようで、好きになった理由をもう一度確かめるようでした。',
      },
    },
    {
      id: 'live-film',
      date: '2025.11',
      type: 'live',
      title: 'live archive',
      cover: '/milet-img/milet-fc-og-img.png',
      note: {
        zh: '舞台被留在影像里，余韵也有了可以回去的地方。',
        ja: 'ステージが映像に残って、余韻にも帰れる場所ができました。',
      },
    },
  ],
  photos: [
    {
      id: 'jan',
      month: 'JAN',
      image: '/echoes-of-milet-OG.webp',
      alt: { zh: '一月 milet の日 精选照片', ja: '1月 milet の日 selected photo' },
      caption: { zh: '新一年开始的第一封信。', ja: '新しい一年の最初の手紙。' },
      final: { x: '9%', y: '29%', w: '15%', r: '-7deg', mx: '7%', my: '23%', mw: '26%', mr: '-7deg' },
    },
    {
      id: 'feb',
      month: 'FEB',
      image: '/milet-img/milet-site-og-img.jpg',
      alt: { zh: '二月 milet の日 精选照片', ja: '2月 milet の日 selected photo' },
      caption: { zh: '冷空气里也有温柔的光。', ja: '冷たい空気の中にもやさしい光。' },
      final: { x: '24%', y: '15%', w: '13%', r: '5deg', mx: '39%', my: '15%', mw: '24%', mr: '5deg' },
    },
    {
      id: 'mar',
      month: 'MAR',
      image: '/milet-img/milet-fc-og-img.png',
      alt: { zh: '三月 milet の日 精选照片', ja: '3月 milet の日 selected photo' },
      caption: { zh: '周年附近的照片，总会多一点特别。', ja: '記念日の近くの写真は、少し特別に見えます。' },
      final: { x: '40%', y: '23%', w: '16%', r: '-2deg', mx: '66%', my: '26%', mw: '25%', mr: '-2deg' },
    },
    {
      id: 'apr',
      month: 'APR',
      image: '/background/bg-milet-home-pre.webp',
      alt: { zh: '四月 milet の日 精选照片', ja: '4月 milet の日 selected photo' },
      caption: { zh: '像春天一样轻轻展开。', ja: '春のように、そっと広がっていく。' },
      final: { x: '58%', y: '12%', w: '14%', r: '8deg', mx: '14%', my: '43%', mw: '24%', mr: '8deg' },
    },
    {
      id: 'may',
      month: 'MAY',
      image: '/echoes-of-milet-OG.webp',
      alt: { zh: '五月 milet の日 精选照片', ja: '5月 milet の日 selected photo' },
      caption: { zh: '等来的这一天，本身就像一个小节日。', ja: '待っていたこの日そのものが、小さなお祭りのようです。' },
      final: { x: '74%', y: '27%', w: '15%', r: '-5deg', mx: '44%', my: '38%', mw: '25%', mr: '-5deg' },
    },
    {
      id: 'jun',
      month: 'JUN',
      image: '/milet-img/milet-site-og-img.jpg',
      alt: { zh: '六月 milet の日 精选照片', ja: '6月 milet の日 selected photo' },
      caption: { zh: '夏天开始变得明亮。', ja: '夏が少しずつ明るくなる。' },
      final: { x: '18%', y: '48%', w: '13%', r: '9deg', mx: '70%', my: '48%', mw: '23%', mr: '9deg' },
    },
    {
      id: 'jul',
      month: 'JUL',
      image: '/milet-img/milet-fc-og-img.png',
      alt: { zh: '七月 milet の日 精选照片', ja: '7月 milet の日 selected photo' },
      caption: { zh: '热闹的季节，留下安静的一帧。', ja: 'にぎやかな季節に、静かな一枚を残して。' },
      final: { x: '34%', y: '43%', w: '15%', r: '-10deg', mx: '7%', my: '64%', mw: '25%', mr: '-10deg' },
    },
    {
      id: 'aug',
      month: 'AUG',
      image: '/background/bg-milet-home-pre.webp',
      alt: { zh: '八月 milet の日 精选照片', ja: '8月 milet の日 selected photo' },
      caption: { zh: '像演出前的一束光。', ja: 'ライブ前の一筋の光のように。' },
      final: { x: '50%', y: '49%', w: '14%', r: '4deg', mx: '38%', my: '61%', mw: '24%', mr: '4deg' },
    },
    {
      id: 'sep',
      month: 'SEP',
      image: '/echoes-of-milet-OG.webp',
      alt: { zh: '九月 milet の日 精选照片', ja: '9月 milet の日 selected photo' },
      caption: { zh: '回声变得更清澈。', ja: '響きが少し澄んでいく。' },
      final: { x: '66%', y: '45%', w: '16%', r: '-1deg', mx: '66%', my: '66%', mw: '25%', mr: '-1deg' },
    },
    {
      id: 'oct',
      month: 'OCT',
      image: '/milet-img/milet-site-og-img.jpg',
      alt: { zh: '十月 milet の日 精选照片', ja: '10月 milet の日 selected photo' },
      caption: { zh: '有些照片会让人记得当天的心情。', ja: 'その日の気持ちまで思い出させてくれる写真があります。' },
      final: { x: '28%', y: '67%', w: '14%', r: '6deg', mx: '14%', my: '82%', mw: '22%', mr: '6deg' },
    },
    {
      id: 'nov',
      month: 'NOV',
      image: '/milet-img/milet-fc-og-img.png',
      alt: { zh: '十一月 milet の日 精选照片', ja: '11月 milet の日 selected photo' },
      caption: { zh: '一年快结束时，仍然收到新的画面。', ja: '一年が終わりに近づいても、新しい景色が届く。' },
      final: { x: '46%', y: '70%', w: '13%', r: '-6deg', mx: '43%', my: '80%', mw: '22%', mr: '-6deg' },
    },
    {
      id: 'dec',
      month: 'DEC',
      image: '/background/bg-milet-home-pre.webp',
      alt: { zh: '十二月 milet の日 精选照片', ja: '12月 milet の日 selected photo' },
      caption: { zh: '最后一张，像把这一年温柔地合上。', ja: '最後の一枚が、この一年をやさしく閉じてくれる。' },
      final: { x: '63%', y: '68%', w: '15%', r: '7deg', mx: '67%', my: '83%', mw: '23%', mr: '7deg' },
    },
  ],
}

export const anniversaryArchiveConfig: AnniversaryArchiveConfig = {
  debutDate: '2019-03-06',
  debutMonth: 3,
  records: {
    '2026': record2026,
  },
}

export function anniversaryLang(value: unknown): AnniversaryLang {
  return value === 'ja' ? 'ja' : 'zh'
}

export function anniversaryText(text: AnniversaryText, lang: AnniversaryLang) {
  return text[lang] || text.zh
}

export function anniversaryYear(debutDate: string, now = new Date()) {
  const debut = new Date(`${debutDate}T00:00:00`)
  let year = now.getFullYear() - debut.getFullYear()
  const anniversaryThisYear = new Date(now.getFullYear(), debut.getMonth(), debut.getDate())
  if (now < anniversaryThisYear) {
    year -= 1
  }
  return Math.max(year, 0)
}

export function latestAnniversaryRecordYear(
  config = anniversaryArchiveConfig,
  now = new Date(),
) {
  const currentYear = now.getFullYear()
  const beforeAnniversaryMonth = now.getMonth() + 1 < config.debutMonth
  return beforeAnniversaryMonth ? currentYear - 1 : currentYear
}

export function isAnniversaryMonth(config = anniversaryArchiveConfig, now = new Date()) {
  return now.getMonth() + 1 === config.debutMonth
}

export function getAvailableAnniversaryYears(config = anniversaryArchiveConfig) {
  return Object.keys(config.records)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)
}

export function getAnniversaryRecord(year?: number | string, config = anniversaryArchiveConfig) {
  const keys = getAvailableAnniversaryYears(config)

  const resolvedYear = Number(year)
  if (Number.isFinite(resolvedYear) && config.records[String(resolvedYear)]) {
    return config.records[String(resolvedYear)]
  }

  return config.records[String(keys[0])] ?? null
}

export function getAnniversaryMenuMeta(config = anniversaryArchiveConfig, now = new Date()) {
  const currentMonth = isAnniversaryMonth(config, now)
  const year = latestAnniversaryRecordYear(config, now)

  return {
    year,
    label: 'ANNIVERSARY',
    sub: currentMonth ? `- ${year} celebration` : `- Open anniversary archive`,
    routeParams: currentMonth ? { year } : undefined,
  }
}
