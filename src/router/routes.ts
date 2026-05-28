import type { RouteRecordRaw } from 'vue-router'
import { getConfiguredRenderMode } from '@/server/render-config'
import { resolvePreferredUrlLang } from '@/composables/useLangRoute'
import { buildShortLinkTarget, shortLinks } from '@/config/shortLinks'

declare module 'vue-router' {
  interface RouteMeta {
    renderMode?: 'ssg' | 'ssr' | 'csr'
    seoKey?: 'home' | 'milet' | 'about' | 'anniversary' | 'pilgrimage'
    widePage?: boolean
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: () => `/${resolvePreferredUrlLang()}` },
  ...shortLinks.map((link) => ({
    path: `/${link.slug}`,
    redirect: () => buildShortLinkTarget(`/${link.slug}`, resolvePreferredUrlLang()) || '/',
  })),
  {
    path: '/:lang(zh|ja)',
    children: [
      {
        path: '',
        name: 'home',
        meta: { renderMode: getConfiguredRenderMode('/'), seoKey: 'home' },
        component: () => import('@/views/MiletSiteHome.vue'),
      },
      {
        path: ':shortLink',
        redirect: (to) =>
          buildShortLinkTarget(`/${to.params.lang}/${to.params.shortLink}`, String(to.params.lang) === 'ja' ? 'ja' : 'zh') ||
          { name: 'home', params: { lang: to.params.lang } },
      },
      {
        path: 'milet/anniversary/:year(\\d{4})?',
        name: 'miletAnniversary',
        meta: { renderMode: getConfiguredRenderMode('/milet/anniversary'), seoKey: 'anniversary' },
        component: () => import('@/views/milet/MiletAnniversaryView.vue'),
      },
      {
        path: 'milet',
        component: () => import('@/views/LayoutApp.vue'),
        children: [
          {
            path: '',
            name: 'milet',
            meta: {
              renderMode: getConfiguredRenderMode('/milet'),
              seoKey: 'milet',
            },
            component: () => import('@/views/milet/MiletHomeView.vue'),
          },
          {
            path: 'galleryList',
            name: 'miletPicAlbum',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/MiletGalleryView.vue'),
          },
          {
            path: 'galleryDetail/:galleryId',
            name: 'galleryDetail',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/MiletPicList.vue'),
          },
          {
            path: 'timeline',
            name: 'miletTimeLine',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/MiletTimeLineAll.vue'),
          },
          {
            path: 'news',
            name: 'miletNews',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/MiletNewsCollectionView.vue'),
          },
          {
            path: 'release',
            name: 'miletRelease',
            meta: { renderMode: 'csr', widePage: true },
            component: () => import('@/views/milet/ReleasesPage.vue'),
          },
          {
            path: 'interactive/song-guess',
            name: 'miletSongGuess',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/interactive/SongGuessIntroView.vue'),
          },
          {
            path: 'interactive/song-guess/play/:challengeId',
            name: 'miletSongGuessPlay',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/interactive/SongGuessPlayView.vue'),
          },
          {
            path: 'interactive/song-guess/result/:challengeId',
            name: 'miletSongGuessResult',
            meta: { renderMode: 'csr' },
            component: () => import('@/views/milet/interactive/SongGuessResultView.vue'),
          },
          {
            path: 'pilgrimage',
            name: 'miletPilgrimage',
            meta: { renderMode: getConfiguredRenderMode('/milet/pilgrimage'), seoKey: 'pilgrimage', widePage: true },
            component: () => import('@/views/milet/MiletPilgrimageView.vue'),
          },
          {
            path: 'about',
            name: 'aboutMe',
            meta: { renderMode: getConfiguredRenderMode('/milet/about'), seoKey: 'about' },
            component: () => import('@/views/AboutMeView.vue'),
          },
          {
            path: 'picalbum',
            name: 'picalbum',
            redirect: (to) => ({ name: 'miletPicAlbum', params: { lang: to.params.lang } }),
          },
        ],
      },
    ],
  },
]
