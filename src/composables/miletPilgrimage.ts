export type PilgrimageLang = 'zh' | 'jp'

export interface PilgrimageDistrict {
  id: string
  cityId: string
  name: string
  centerLat: number
  centerLng: number
  defaultZoom: number
  spotCount: number
}

export interface PilgrimageCity {
  id: string
  name: string
  countryCode: string
  centerLat: number
  centerLng: number
  defaultZoom: number
  districts: PilgrimageDistrict[]
}

export interface PilgrimagePhoto {
  id: string
  thumbUrl: string
  fullUrl: string
  width?: number
  height?: number
  alt: string
  caption: string
  downloadUrl?: string
  sortOrder: number
}

export interface PilgrimageSpotSummary {
  id: string
  title: string
  workTitle: string
  displayLat: number
  displayLng: number
  coverImageUrl: string
  category: string
  tags: string[]
}

export interface PilgrimageSpotDetail extends PilgrimageSpotSummary {
  description: string
  address: string
  countryCode: string
  navLat: number
  navLng: number
  navigationProvider: 'auto' | 'amap' | 'google'
  navigationMode: 'walking' | 'driving' | 'transit'
  photos: PilgrimagePhoto[]
}

export interface LocalizedRegionTree {
  cities: PilgrimageCity[]
}

export interface LocalizedSpotList {
  spots: PilgrimageSpotSummary[]
}

export interface LocalizedSpotDetail {
  spot: PilgrimageSpotDetail | null
}

export interface PilgrimageRegionTreeResponse {
  jp: LocalizedRegionTree
  zh: LocalizedRegionTree
}

export interface PilgrimageSpotListResponse {
  jp: LocalizedSpotList
  zh: LocalizedSpotList
}

export interface PilgrimageSpotDetailResponse {
  jp: LocalizedSpotDetail
  zh: LocalizedSpotDetail
}

export interface PilgrimagePageText {
  title: string
  subtitle: string
  cityLabel: string
  districtLabel: string
  allCities: string
  mapLabel: string
  detailLabel: string
  loading: string
  emptyDistrict: string
  emptySpot: string
  photoLabel: string
  navigation: string
  currentArea: string
  address: string
  works: string
}

export const PILGRIMAGE_TEXT: Record<PilgrimageLang, PilgrimagePageText> = {
  zh: {
    title: '圣地巡礼',
    subtitle: '把作品里留下的街角、车站和光线，整理成可以慢慢走近的地图。',
    cityLabel: '城市',
    districtLabel: '区划',
    allCities: '全部城市',
    mapLabel: '地图',
    detailLabel: '地点详情',
    loading: '加载中...',
    emptyDistrict: '请选择一个区划查看点位。',
    emptySpot: '选择地图上的标记，查看照片和地点说明。',
    photoLabel: '照片',
    navigation: '导航',
    currentArea: '当前区域',
    address: '地址',
    works: '作品',
  },
  jp: {
    title: '聖地巡礼',
    subtitle: '作品に残った街角、駅、光を、少しずつ辿れる地図に整える。',
    cityLabel: '都市',
    districtLabel: 'エリア',
    allCities: 'すべての都市',
    mapLabel: '地図',
    detailLabel: 'スポット詳細',
    loading: '読み込み中...',
    emptyDistrict: 'エリアを選んでスポットを表示します。',
    emptySpot: '地図上のマーカーを選ぶと、写真と説明を表示します。',
    photoLabel: '写真',
    navigation: 'ナビ',
    currentArea: '現在のエリア',
    address: '住所',
    works: '作品',
  },
}

const fallbackPhotos = {
  omotesando: [
    {
      id: 'photo-omotesando-1',
      thumbUrl: '/milet-img/milet-site-og-img.jpg',
      fullUrl: '/milet-img/milet-site-og-img.jpg',
      width: 1600,
      height: 1067,
      alt: '表参道街景照片',
      caption: '傍晚的街道与橱窗光线。',
      sortOrder: 1,
    },
    {
      id: 'photo-omotesando-2',
      thumbUrl: '/milet-img/milet-fc-og-img.png',
      fullUrl: '/milet-img/milet-fc-og-img.png',
      width: 1600,
      height: 1067,
      alt: '东京街道路口照片',
      caption: '路口、人行道和湿润的路面。',
      sortOrder: 2,
    },
  ],
  shibuya: [
    {
      id: 'photo-shibuya-1',
      thumbUrl: '/background/bg-milet-home-pre.webp',
      fullUrl: '/background/bg-milet-home-pre.webp',
      width: 1600,
      height: 1067,
      alt: '涩谷夜景照片',
      caption: '霓虹、天桥和人流。',
      sortOrder: 1,
    },
  ],
}

export const fallbackRegionTree: PilgrimageRegionTreeResponse = {
  zh: {
    cities: [
      {
        id: 'tokyo',
        name: '东京',
        countryCode: 'JP',
        centerLat: 35.6762,
        centerLng: 139.6503,
        defaultZoom: 12,
        districts: [
          {
            id: 'shibuya',
            cityId: 'tokyo',
            name: '涩谷区',
            centerLat: 35.6618,
            centerLng: 139.7041,
            defaultZoom: 14,
            spotCount: 2,
          },
          {
            id: 'minato',
            cityId: 'tokyo',
            name: '港区',
            centerLat: 35.6581,
            centerLng: 139.7516,
            defaultZoom: 13,
            spotCount: 1,
          },
        ],
      },
      {
        id: 'shanghai',
        name: '上海',
        countryCode: 'CN',
        centerLat: 31.2304,
        centerLng: 121.4737,
        defaultZoom: 12,
        districts: [
          {
            id: 'huangpu',
            cityId: 'shanghai',
            name: '黄浦区',
            centerLat: 31.2305,
            centerLng: 121.4845,
            defaultZoom: 14,
            spotCount: 1,
          },
        ],
      },
    ],
  },
  jp: {
    cities: [
      {
        id: 'tokyo',
        name: '東京',
        countryCode: 'JP',
        centerLat: 35.6762,
        centerLng: 139.6503,
        defaultZoom: 12,
        districts: [
          {
            id: 'shibuya',
            cityId: 'tokyo',
            name: '渋谷区',
            centerLat: 35.6618,
            centerLng: 139.7041,
            defaultZoom: 14,
            spotCount: 2,
          },
          {
            id: 'minato',
            cityId: 'tokyo',
            name: '港区',
            centerLat: 35.6581,
            centerLng: 139.7516,
            defaultZoom: 13,
            spotCount: 1,
          },
        ],
      },
      {
        id: 'shanghai',
        name: '上海',
        countryCode: 'CN',
        centerLat: 31.2304,
        centerLng: 121.4737,
        defaultZoom: 12,
        districts: [
          {
            id: 'huangpu',
            cityId: 'shanghai',
            name: '黄浦区',
            centerLat: 31.2305,
            centerLng: 121.4845,
            defaultZoom: 14,
            spotCount: 1,
          },
        ],
      },
    ],
  },
}

export const fallbackSpotLists: Record<string, PilgrimageSpotListResponse> = {
  shibuya: {
    zh: {
      spots: [
        {
          id: 'omotesando-street',
          title: '表参道街景',
          workTitle: 'inside you',
          displayLat: 35.6652,
          displayLng: 139.7124,
          coverImageUrl: fallbackPhotos.omotesando[0].thumbUrl,
          category: '街景',
          tags: ['MV', '街角', '夜景'],
        },
        {
          id: 'shibuya-crossing',
          title: '涩谷路口',
          workTitle: 'us',
          displayLat: 35.6595,
          displayLng: 139.7005,
          coverImageUrl: fallbackPhotos.shibuya[0].thumbUrl,
          category: '路口',
          tags: ['城市', '行人'],
        },
      ],
    },
    jp: {
      spots: [
        {
          id: 'omotesando-street',
          title: '表参道の街角',
          workTitle: 'inside you',
          displayLat: 35.6652,
          displayLng: 139.7124,
          coverImageUrl: fallbackPhotos.omotesando[0].thumbUrl,
          category: '街角',
          tags: ['MV', '街', '夜景'],
        },
        {
          id: 'shibuya-crossing',
          title: '渋谷の交差点',
          workTitle: 'us',
          displayLat: 35.6595,
          displayLng: 139.7005,
          coverImageUrl: fallbackPhotos.shibuya[0].thumbUrl,
          category: '交差点',
          tags: ['都市', '歩道'],
        },
      ],
    },
  },
  minato: {
    zh: {
      spots: [
        {
          id: 'tokyo-tower-view',
          title: '东京塔远景',
          workTitle: 'Ordinary days',
          displayLat: 35.6586,
          displayLng: 139.7454,
          coverImageUrl: fallbackPhotos.omotesando[1].thumbUrl,
          category: '街景',
          tags: ['地标', '夜色'],
        },
      ],
    },
    jp: {
      spots: [
        {
          id: 'tokyo-tower-view',
          title: '東京タワーの見える道',
          workTitle: 'Ordinary days',
          displayLat: 35.6586,
          displayLng: 139.7454,
          coverImageUrl: fallbackPhotos.omotesando[1].thumbUrl,
          category: '街角',
          tags: ['ランドマーク', '夜'],
        },
      ],
    },
  },
  huangpu: {
    zh: {
      spots: [
        {
          id: 'huangpu-riverside',
          title: '黄浦江边',
          workTitle: 'Anytime Anywhere',
          displayLat: 31.2397,
          displayLng: 121.4998,
          coverImageUrl: fallbackPhotos.shibuya[0].thumbUrl,
          category: '江边',
          tags: ['中国', '步行'],
        },
      ],
    },
    jp: {
      spots: [
        {
          id: 'huangpu-riverside',
          title: '黄浦江沿い',
          workTitle: 'Anytime Anywhere',
          displayLat: 31.2397,
          displayLng: 121.4998,
          coverImageUrl: fallbackPhotos.shibuya[0].thumbUrl,
          category: '川沿い',
          tags: ['中国', '散歩'],
        },
      ],
    },
  },
}

export const fallbackSpotDetails: Record<string, PilgrimageSpotDetailResponse> = {
  'omotesando-street': {
    zh: {
      spot: {
        ...fallbackSpotLists.shibuya.zh.spots[0],
        description:
          '街灯亮起之后，橱窗和路面的反光会把画面压得很安静，适合慢慢对照作品里的镜头位置。',
        address: '东京都涩谷区神宫前一带',
        countryCode: 'JP',
        navLat: 35.6652,
        navLng: 139.7124,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.omotesando,
      },
    },
    jp: {
      spot: {
        ...fallbackSpotLists.shibuya.jp.spots[0],
        description:
          '街灯が灯る頃、ショーウィンドウと路面の反射が静かな画面をつくる。作品のカットと照らし合わせて歩きたい場所。',
        address: '東京都渋谷区神宮前付近',
        countryCode: 'JP',
        navLat: 35.6652,
        navLng: 139.7124,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.omotesando.map((photo) => ({
          ...photo,
          alt: photo.alt.replace('表参道街景照片', '表参道の街角写真'),
          caption:
            photo.id === 'photo-omotesando-1'
              ? '夕方の街並みとショーウィンドウの光。'
              : '交差点、歩道、濡れた路面。',
        })),
      },
    },
  },
  'shibuya-crossing': {
    zh: {
      spot: {
        ...fallbackSpotLists.shibuya.zh.spots[1],
        description: '人流和大屏幕不断变化，适合作为城市段落的巡礼补充点。',
        address: '东京都涩谷区道玄坂附近',
        countryCode: 'JP',
        navLat: 35.6595,
        navLng: 139.7005,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.shibuya,
      },
    },
    jp: {
      spot: {
        ...fallbackSpotLists.shibuya.jp.spots[1],
        description: '人の流れと大型ビジョンが絶えず変わる、都市の記憶を補う巡礼スポット。',
        address: '東京都渋谷区道玄坂付近',
        countryCode: 'JP',
        navLat: 35.6595,
        navLng: 139.7005,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.shibuya,
      },
    },
  },
  'tokyo-tower-view': {
    zh: {
      spot: {
        ...fallbackSpotLists.minato.zh.spots[0],
        description: '城市地标作为远景出现时，可以给作品的空间感留下一个明确参照。',
        address: '东京都港区芝公园附近',
        countryCode: 'JP',
        navLat: 35.6586,
        navLng: 139.7454,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.omotesando,
      },
    },
    jp: {
      spot: {
        ...fallbackSpotLists.minato.jp.spots[0],
        description: '街のランドマークが遠景に入ることで、作品の空間に小さな基準点が生まれる。',
        address: '東京都港区芝公園付近',
        countryCode: 'JP',
        navLat: 35.6586,
        navLng: 139.7454,
        navigationProvider: 'google',
        navigationMode: 'walking',
        photos: fallbackPhotos.omotesando,
      },
    },
  },
  'huangpu-riverside': {
    zh: {
      spot: {
        ...fallbackSpotLists.huangpu.zh.spots[0],
        description: '中国地区点位用于验证高德导航分流和独立导航坐标。',
        address: '上海市黄浦区外滩附近',
        countryCode: 'CN',
        navLat: 31.2397,
        navLng: 121.4998,
        navigationProvider: 'amap',
        navigationMode: 'walking',
        photos: fallbackPhotos.shibuya,
      },
    },
    jp: {
      spot: {
        ...fallbackSpotLists.huangpu.jp.spots[0],
        description: '中国エリアのスポットとして、高徳地図へのナビ分岐を確認するための地点。',
        address: '上海市黄浦区外灘付近',
        countryCode: 'CN',
        navLat: 31.2397,
        navLng: 121.4998,
        navigationProvider: 'amap',
        navigationMode: 'walking',
        photos: fallbackPhotos.shibuya,
      },
    },
  },
}

export function normalizePilgrimageLang(value?: string | null): PilgrimageLang {
  return value === 'jp' || value === 'ja' ? 'jp' : 'zh'
}

export function getLocalizedBranch<T extends Record<PilgrimageLang, any>>(
  payload: T | null | undefined,
  lang: PilgrimageLang,
) {
  return payload?.[lang] || payload?.zh || payload?.jp
}

export function findInitialDistrict(tree: PilgrimageRegionTreeResponse, lang: PilgrimageLang) {
  const branch = getLocalizedBranch(tree, lang)
  return branch?.cities?.find((city) => city.districts.length > 0)?.districts[0] || null
}

export function buildNavigationUrl(spot: PilgrimageSpotDetail) {
  const provider =
    spot.navigationProvider === 'auto'
      ? spot.countryCode === 'CN'
        ? 'amap'
        : 'google'
      : spot.navigationProvider

  if (provider === 'amap') {
    const name = encodeURIComponent(spot.title)
    return `https://uri.amap.com/marker?position=${spot.navLng},${spot.navLat}&name=${name}`
  }

  const query = encodeURIComponent(`${spot.navLat},${spot.navLng}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
