import { getAnniversaryMenuMeta } from '@/composables/miletAnniversary'

export type MenuItem = {
  key: string
  label: string
  sub?: string
  shown: boolean
  color: 'pink' | 'green' | 'teal' | 'amber' | 'sky' | 'violet'
  routerName?: string
  activeRouteNames?: string[]
  routeParams?: Record<string, string | number>
  children?: { key: string; label: string; href?: string }[]
}

export function getMenu(now = new Date()): MenuItem[] {
  const anniversaryMeta = getAnniversaryMenuMeta(undefined, now)

  return [
    {
      key: 'home',
      label: 'HOME',
      sub: '- Welcome page',
      color: 'sky',
      routerName: 'home',
      shown: true,
    },
    {
      key: 'milet',
      label: 'MILET',
      sub: '- About milet',
      color: 'pink',
      routerName: 'milet',
      children: [
        { key: 'hero', label: 'top', href: '#hero' },
        { key: 'why', label: 'why milet', href: '#why' },
        { key: 'highlight', label: 'highlight', href: '#highlight' },
        { key: 'timeline-preview', label: 'timeline', href: '#timeline' },
        { key: 'gallery-preview', label: 'gallery', href: '#gallery' },
        { key: 'official-links', label: 'official', href: '#links' },
      ],
      shown: true,
    },

    {
      key: 'timeline',
      label: 'TIMELINE',
      sub: '- Activity of milet',
      color: 'amber',
      routerName: 'miletTimeLine',
      shown: true,
    },

    {
      key: 'release',
      label: 'DISCOGRAPHY',
      sub: '- The milet anthology',
      color: 'violet',
      routerName: 'miletRelease',
      children: [
        { key: 'albums', label: 'albums', href: '#chapter-albums' },
        { key: 'eps', label: 'EP / Single', href: '#chapter-ep-single' },
        { key: 'live', label: 'Live BD / DVD', href: '#chapter-live' },
      ],
      shown: true,
    },

    {
      key: 'live-archive',
      label: 'LIVE ARCHIVE',
      sub: '- Live records',
      color: 'sky',
      routerName: 'miletLiveArchive',
      shown: true,
    },
    {
      key: 'news',
      label: 'NEWS',
      sub: '- Curated news links',
      color: 'green',
      routerName: 'miletNews',
      shown: true,
    },
    {
      key: 'pilgrimage',
      label: 'PILGRIMAGE',
      sub: '- Places on the map',
      color: 'teal',
      routerName: 'miletPilgrimage',
      children: [
        { key: 'pilgrimage-map', label: 'map', href: '#pilgrimage-map' },
        { key: 'pilgrimage-detail', label: 'detail', href: '#pilgrimage-detail' },
      ],
      shown: true,
    },
    {
      key: 'echo-room',
      label: 'ECHO ROOM',
      sub: '- Interactive challenge',
      color: 'sky',
      routerName: 'miletSongGuess',
      shown: true,
    },

    {
      key: 'gallery',
      label: 'GALLERY',
      sub: '- Visual journey',
      color: 'teal',
      routerName: 'miletPicAlbum',
      children: [
        { key: 'pickup-gallery', label: 'pickup gallery', href: '#pick-gallery' },
        { key: 'all-gallery', label: 'all gallery', href: '#all-gallery' },
      ],
      shown: false,
    },
    {
      key: 'anniversary',
      label: anniversaryMeta.label,
      sub: anniversaryMeta.sub,
      color: 'violet',
      routerName: anniversaryMeta.routeParams?.year ? 'miletAnniversaryYear' : 'miletAnniversary',
      activeRouteNames: ['miletAnniversary', 'miletAnniversaryYear'],
      routeParams: anniversaryMeta.routeParams,
      shown: true,
    },
    {
      key: 'about',
      label: 'ABOUT ME',
      sub: '- Site story & feedback',
      color: 'green',
      routerName: 'aboutMe',
      children: [
        { key: 'intro', label: 'intro', href: '#about-intro' },
        { key: 'feedback', label: 'feedback', href: '#about-feedback' },
      ],
      shown: true,
    },
    {
      key: 'gallery-detail',
      label: 'GALLERY DETAIL',
      sub: '- Gallery detail page',
      color: 'pink',
      routerName: 'galleryDetail',
      shown: false,
    },
  ]
}

const colorMap = {
  pink: {
    stroke: 'border-pink-300',
    wash: 'bg-pink-50',
    dot: 'bg-pink-300',
    underline: 'bg-pink-300',
    chip: 'border-pink-200 hover:bg-pink-50',
    focus: 'focus-visible:ring-pink-200',
  },
  green: {
    stroke: 'border-green-300',
    wash: 'bg-green-50',
    dot: 'bg-green-300',
    underline: 'bg-green-300',
    chip: 'border-green-200 hover:bg-green-50',
    focus: 'focus-visible:ring-green-200',
  },
  teal: {
    stroke: 'border-teal-300',
    wash: 'bg-teal-50',
    dot: 'bg-teal-300',
    underline: 'bg-teal-300',
    chip: 'border-teal-200 hover:bg-teal-50',
    focus: 'focus-visible:ring-teal-200',
  },
  amber: {
    stroke: 'border-amber-300',
    wash: 'bg-amber-50',
    dot: 'bg-amber-300',
    underline: 'bg-amber-300',
    chip: 'border-amber-200 hover:bg-amber-50',
    focus: 'focus-visible:ring-amber-200',
  },
  sky: {
    stroke: 'border-sky-300',
    wash: 'bg-sky-50',
    dot: 'bg-sky-300',
    underline: 'bg-sky-300',
    chip: 'border-sky-200 hover:bg-sky-50',
    focus: 'focus-visible:ring-sky-200',
  },
  violet: {
    stroke: 'border-violet-300',
    wash: 'bg-violet-50',
    dot: 'bg-violet-300',
    underline: 'bg-violet-300',
    chip: 'border-violet-200 hover:bg-violet-50',
    focus: 'focus-visible:ring-violet-200',
  },
} as const

export { colorMap }
