import type { RouteRecordRaw } from 'vue-router'
import { getConfiguredRenderMode } from '@/server/render-config'

declare module 'vue-router' {
  interface RouteMeta {
    renderMode?: 'ssg' | 'ssr' | 'csr'
    seoKey?: 'home' | 'milet' | 'about'
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    meta: { renderMode: getConfiguredRenderMode('/'), seoKey: 'home' },
    component: () => import('@/views/MiletSiteHome.vue'),
  },
  {
    path: '/milet',
    component: () => import('@/views/LayoutApp.vue'),
    children: [
      {
        path: '',
        name: 'milet',
        meta: { renderMode: getConfiguredRenderMode('/milet'), seoKey: 'milet' },
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
        path: 'release',
        name: 'miletRelease',
        meta: { renderMode: 'csr' },
        component: () => import('@/views/milet/ReleasesPage.vue'),
      },
      {
        path: 'about',
        name: 'aboutMe',
        meta: { renderMode: getConfiguredRenderMode('/milet/about'), seoKey: 'about' },
        component: () => import('@/views/AboutMeView.vue'),
      },
      { path: 'picalbum', name: 'picalbum', redirect: '/milet/galleryList' },
    ],
  },
]
