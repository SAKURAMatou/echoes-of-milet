import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/MiletSiteHome.vue'),
    },
    {
      path: '/milet',
      component: () => import('@/views/LayoutApp.vue'),
      children: [
        { path: '', name: 'milet', component: () => import('@/views/milet/MiletHomeView.vue') },
        {
          path: 'galleryList',
          name: 'miletPicAlbum',
          component: () => import('@/views/milet/MiletGalleryView.vue'),
        },
        {
          path: 'galleryDetail/:galleryId',
          name: 'galleryDetail',
          component: () => import('@/views/milet/MiletPicList.vue'),
        },
        {
          path: 'timeline',
          name: 'miletTimeLine',
          component: () => import('@/views/milet/MiletTimeLineAll.vue'),
        },
        {
          path: 'release',
          name: 'miletRelease',
          component: () => import('@/views/milet/ReleasesPage.vue'),
        },
        {
          path: 'about',
          name: 'aboutMe',
          component: () => import('@/views/AboutMeView.vue'),
        },
        { path: 'picalbum', name: 'picalbum', redirect: '/milet/galleryList' },
      ],
    },
  ],
})

export default router
