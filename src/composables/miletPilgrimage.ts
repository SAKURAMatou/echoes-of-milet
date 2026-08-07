import { LinkedTextLink } from '@/components/LinkedText.vue'
import type { RelatedArticleGroup } from '@/composables/articleType'
import type { ExtraInformationGroup } from '@/composables/extraInformation'

export type PilgrimageLang = 'zh' | 'jp'
export type PilgrimageDisplayMode = 'map' | 'collection'

export interface PilgrimageDistrict {
  id: string
  cityId: string
  name: string
  centerLat: number
  centerLng: number
  defaultZoom: number
  spotCount: number
  spots?: PilgrimageSpotSummary[]
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
  markerSkinId?: string
  category: string
  tags: string[]
}

export interface PilgrimageRoute {
  id: string
  districtId: string
  title: string
  description: string
  color: string
  sortOrder: number
  spots: Array<{
    spotId: string
    sortOrder: number
  }>
}

export interface PilgrimageCollectionSpot extends PilgrimageSpotSummary {
  cityId: string
  cityName: string
  districtId: string
  districtName: string
  collectionNote?: string
  collectionSortOrder: number
}

export interface PilgrimageCollection {
  id: string
  slug: string
  title: string
  description: string
  coverImageUrl: string
  sortOrder: number
  extraInfo?: ExtraInformationGroup
  articles?: RelatedArticleGroup
  spots: PilgrimageCollectionSpot[]
}

export interface PilgrimageSpotDetail extends PilgrimageSpotSummary {
  description: string
  address: string
  countryCode: string
  navLat: number
  navLng: number
  navigationProvider: 'auto' | 'amap' | 'google'
  navigationMode: 'walking' | 'driving' | 'transit'
  linkUrl: string
  extraInfo?: ExtraInformationGroup
  articles?: RelatedArticleGroup
  photos: PilgrimagePhoto[]
}

export interface LocalizedRegionTree {
  cities: PilgrimageCity[]
}

export interface LocalizedSpotList {
  spots: PilgrimageSpotSummary[]
  routes?: PilgrimageRoute[]
}

export interface LocalizedSpotDetail {
  spot: PilgrimageSpotDetail | null
}

export interface LocalizedCollectionList {
  collections: PilgrimageCollection[]
}

export interface PilgrimageMarkerSkin {
  id: string
  label?: string
  imageUrl: string
  size: [number, number]
  anchor: [number, number]
  status?: 'draft' | 'published' | 'archived'
  sortOrder?: number
}

export interface PilgrimageRegionTreeResponse {
  jp: LocalizedRegionTree
  zh: LocalizedRegionTree
  markerSkins?: PilgrimageMarkerSkin[]
}

export interface PilgrimageSpotListResponse {
  jp: LocalizedSpotList
  zh: LocalizedSpotList
}

export interface PilgrimageSpotDetailResponse {
  jp: LocalizedSpotDetail
  zh: LocalizedSpotDetail
}

export interface PilgrimageCollectionListResponse {
  jp: LocalizedCollectionList
  zh: LocalizedCollectionList
}

export interface PilgrimageSsrPayload {
  regionTree: PilgrimageRegionTreeResponse | null
  markerSkins: PilgrimageMarkerSkin[]
  collections?: PilgrimageCollectionListResponse | null
  spotsByDistrictId: Record<string, PilgrimageSpotListResponse>
  spotDetailsBySpotId: Record<string, PilgrimageSpotDetailResponse>
  selectedCityId: string
  selectedDistrictId: string
  selectedSpotId: string
  selectedDisplayMode?: PilgrimageDisplayMode
  selectedCollectionId?: string
  usingFallbackData: boolean
}

export interface PilgrimagePageText {
  title: string
  subtitle: string
  cityLabel: string
  districtLabel: string
  routeLabel: string
  allRoutes: string
  allCities: string
  mapLabel: string
  detailLabel: string
  loading: string
  spotDetailError: string
  emptyDistrict: string
  emptySpot: string
  photoLabel: string
  navigation: string
  extraInformation: string
  currentArea: string
  address: string
  works: string
  dataCreditLabel: string
  dataCredit: string
  subtitleLink?: LinkedTextLink[]
}
export interface PilgrimagePageSeoListText {
  summary: string
  intro: string
  workLabel: string
  coordinateLabel: string
  cityLabel: string
}

export const PILGRIMAGE_SEO_LIST_TEXT: Record<PilgrimageLang, PilgrimagePageSeoListText> = {
  zh: {
    summary: 'milet 聖地巡礼地点一覧',
    intro:
      '这里列出全部已经公开的 milet 圣地巡礼 spot，和地图上的标记保持一致。每个地点会尽量关联作品或事件线索、分类、封面照片和坐标信息，方便检索 milet 圣地巡礼、milet MV 拍摄地、街景地点、活动相关地点和可实际导航的巡礼路线。',
    workLabel: '相关作品',
    coordinateLabel: '坐标',
    cityLabel: '所在城市地区',
  },
  jp: {
    summary: 'milet 聖地巡礼 spot 一覧',
    intro:
      '公開されている milet 聖地巡礼 spot を都市、エリア、作品やカテゴリごとに確認できる一覧です。地図上のマーカーと同じ地点を収録し、写真、座標、ナビ、場所の説明へつながる巡礼データとして整理しています。',
    workLabel: '関連作品',
    coordinateLabel: '座標',
    cityLabel: '所在都市エリア',
  },
}

export const PILGRIMAGE_TEXT: Record<PilgrimageLang, PilgrimagePageText> = {
  zh: {
    title: 'milet 圣地巡礼地图',
    subtitle:
      '由本站整理的 milet 圣地巡礼地图，记录着散落在不同城市里的作品场景、MV 拍摄地、公开影像与活动相关地点。以区域与路线的方式重新串联这些 地点，可跟随不同城市中的巡礼动线，查看照片、坐标、导航与地点记录，把原本零散存在于画面中的街道、车站与现场余韵，整理成能够一步步实际走访的 milet 圣地巡礼地图；\n除了线路以外还提供了根据不同原则分类的地点合集,也可以在合集中查看不同作品，不同活动的巡礼地点，自行规划自己的巡礼行程。如果存在信息错误或者想要补充更多信息可以通过反馈功能告诉我们！也可以通过邮箱dml4015@miles-dml.org邮箱联系我们，感谢！',
    subtitleLink: [
      {
        text: '反馈功能',
        to: { name: 'aboutMe' },
      },
      {
        text: 'dml4015@miles-dml.org',
        href: 'mailto:dml4015@miles-dml.org',
      },
    ],
    cityLabel: '巡礼区域',
    districtLabel: '线路区域',
    routeLabel: '路线',
    allRoutes: '全部',
    allCities: '全部城市',
    mapLabel: '地图',
    detailLabel: '地点详情',
    loading: '加载中...',
    spotDetailError: '地点详情暂时加载失败，请稍后再试或重新选择地图上的标记。',
    emptyDistrict: '请选择一个区划查看点位。',
    emptySpot: '选择地图上的标记，查看照片和地点说明。',
    photoLabel: '照片',
    navigation: '导航',
    extraInformation: '查看额外信息',
    currentArea: '当前区域',
    address: '地址',
    works: '作品',
    dataCreditLabel: 'Special thanks',
    dataCredit: '感谢提供巡礼数据的 miles 的支持(Affogato)，让这些地点可以被整理、确认并继续补完。',
  },
  jp: {
    title: 'milet 聖地巡礼マップ',
    subtitle:
      '本サイトによって整理・記録されている milet 聖地巡礼マップ。作品の舞台、MV 撮影地、公開映像、街並みや活動にまつわる場所など、さまざまな都市に点在する spot を収録しています。マップはエリアと巡礼ルートを軸に構成されており、都市ごとの空気を辿りながら、写真・座標・ナビゲーション・地点メモをたどることができます。\n映像の中に散りばめられていた街角や駅、ライブの余韻までも、実際に歩いて巡れるひとつの巡礼体験として繋ぎ直しています。それ以外にも、作品やカテゴリごとに整理された地点コレクションを通して、さまざまな切り口で巡礼スポットを眺めることができ、自分なりの巡礼ルートを計画することもできます。情報に誤りがあったり、さらに多くの情報を追加したい場合は、フィードバック機能を通じてお知らせください！ または、メールアドレス dml4015@miles-dml.org でお問い合わせください。ありがとうございます！',
    subtitleLink: [
      {
        text: 'フィードバック機能',
        to: { name: 'aboutMe' },
      },
      {
        text: 'dml4015@miles-dml.org',
        href: 'mailto:dml4015@miles-dml.org',
      },
    ],
    cityLabel: '巡礼エリア',
    districtLabel: 'ルートエリア',
    routeLabel: 'ルート',
    allRoutes: 'すべて',
    allCities: 'すべて',
    mapLabel: '地図',
    detailLabel: 'スポット詳細',
    loading: '読み込み中...',
    spotDetailError:
      'スポット詳細を読み込めませんでした。少し時間をおいて、もう一度マーカーを選択してください。',
    emptyDistrict: 'エリアを選んでスポットを表示します。',
    emptySpot: '地図上のマーカーを選ぶと、写真と説明を表示します。',
    photoLabel: '写真',
    navigation: 'ナビ',
    extraInformation: '関連情報を見る',
    currentArea: '現在のエリア',
    address: '住所',
    works: '作品',
    dataCreditLabel: 'Special thanks',
    dataCredit:
      '巡礼データを提供してくれた miles の皆さん(Affogato)に感謝します。地点の整理と確認を続ける支えになっています。',
  },
}

const fallbackPhotos = {
  omotesando: [
    {
      id: 'photo-omotesando-1',
      thumbUrl: '/milet-img/milet-site-og-img.webp',
      fullUrl: '/milet-img/milet-site-og-img.webp',
      width: 1600,
      height: 1067,
      alt: '表参道街景照片',
      caption: '傍晚的街道与橱窗光线。',
      sortOrder: 1,
    },
    {
      id: 'photo-omotesando-2',
      thumbUrl: '/milet-img/milet-fc-og-img.webp',
      fullUrl: '/milet-img/milet-fc-og-img.webp',
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
            spotCount: 3,
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
            spotCount: 3,
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
        {
          id: 'jingumae-crosswalk',
          title: '神宫前人行道',
          workTitle: 'Wake Me Up',
          displayLat: 35.667,
          displayLng: 139.7072,
          coverImageUrl: fallbackPhotos.omotesando[1].thumbUrl,
          category: '街角',
          tags: ['步行', '白天', '转角'],
        },
      ],
      routes: [
        {
          id: 'shibuya-route-1',
          districtId: 'shibuya',
          title: '表参道到涩谷路线',
          description: '从神宫前走到表参道，再慢慢转向涩谷路口，适合预览路线连线和 spot 顺序。',
          color: '#2f8f83',
          sortOrder: 0,
          spots: [
            { spotId: 'jingumae-crosswalk', sortOrder: 0 },
            { spotId: 'omotesando-street', sortOrder: 1 },
            { spotId: 'shibuya-crossing', sortOrder: 2 },
          ],
        },
        {
          id: 'shibuya-route-2',
          districtId: 'shibuya',
          title: '涩谷回游路线',
          description: '从涩谷路口回到表参道，再延伸到神宫前，用于验证多路线横向滚动。',
          color: '#c98791',
          sortOrder: 1,
          spots: [
            { spotId: 'shibuya-crossing', sortOrder: 0 },
            { spotId: 'omotesando-street', sortOrder: 1 },
            { spotId: 'jingumae-crosswalk', sortOrder: 2 },
          ],
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
        {
          id: 'jingumae-crosswalk',
          title: '神宮前の歩道',
          workTitle: 'Wake Me Up',
          displayLat: 35.667,
          displayLng: 139.7072,
          coverImageUrl: fallbackPhotos.omotesando[1].thumbUrl,
          category: '街角',
          tags: ['散歩', '昼', '曲がり角'],
        },
      ],
      routes: [
        {
          id: 'shibuya-route-1',
          districtId: 'shibuya',
          title: '表参道から渋谷へ',
          description:
            '神宮前から表参道を通り、渋谷の交差点へ向かう、ルート表示確認用の巡礼ルート。',
          color: '#2f8f83',
          sortOrder: 0,
          spots: [
            { spotId: 'jingumae-crosswalk', sortOrder: 0 },
            { spotId: 'omotesando-street', sortOrder: 1 },
            { spotId: 'shibuya-crossing', sortOrder: 2 },
          ],
        },
        {
          id: 'shibuya-route-2',
          districtId: 'shibuya',
          title: '渋谷回遊ルート',
          description:
            '渋谷の交差点から表参道へ戻り、神宮前まで歩く、複数ルート確認用の巡礼ルート。',
          color: '#c98791',
          sortOrder: 1,
          spots: [
            { spotId: 'shibuya-crossing', sortOrder: 0 },
            { spotId: 'omotesando-street', sortOrder: 1 },
            { spotId: 'jingumae-crosswalk', sortOrder: 2 },
          ],
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
        linkUrl: 'https://www.youtube.com/@miletOfficialYouTube',
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
        linkUrl: 'https://www.youtube.com/@miletOfficialYouTube',
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
        linkUrl: '',
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
        linkUrl: '',
        photos: fallbackPhotos.shibuya,
      },
    },
  },
  'jingumae-crosswalk': {
    zh: {
      spot: {
        ...fallbackSpotLists.shibuya.zh.spots[2],
        description: '靠近神宫前的人行道适合验证三点路线和箭头方向，在地图上会形成更明显的折线。',
        address: '东京都涩谷区神宫前附近',
        countryCode: 'JP',
        navLat: 35.667,
        navLng: 139.7072,
        navigationProvider: 'google',
        navigationMode: 'walking',
        linkUrl: '',
        photos: fallbackPhotos.omotesando,
      },
    },
    jp: {
      spot: {
        ...fallbackSpotLists.shibuya.jp.spots[2],
        description:
          '神宮前に近い歩道。三点ルートと矢印の向きを確認しやすいよう、地図上で折れ線になる位置に置いている。',
        address: '東京都渋谷区神宮前付近',
        countryCode: 'JP',
        navLat: 35.667,
        navLng: 139.7072,
        navigationProvider: 'google',
        navigationMode: 'walking',
        linkUrl: '',
        photos: fallbackPhotos.omotesando.map((photo) => ({
          ...photo,
          alt: photo.alt.replace('表参道街景照片', '神宮前の歩道写真'),
          caption:
            photo.id === 'photo-omotesando-1'
              ? '昼の街並みと歩道の光。'
              : '曲がり角、横断歩道、街路樹。',
        })),
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
        linkUrl: '',
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
        linkUrl: '',
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
        linkUrl: '',
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
        linkUrl: '',
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
