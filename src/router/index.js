import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/MiletSiteHome.vue'),
    },

    //父路由指定视图的话，默认会把子路由的组件渲染到父路由的默认插槽中，单独显示子路由页面的话，需要忽略父路由的视图
    {
      path: '/milet',
      component: () => import('@/views/LayoutApp.vue'),
      children: [
        { path: '', name: 'milet', component: () => import('@/views/milet/MiletHomeView.vue') },
        {
          path: 'picalbum',
          name: 'miletPicAlbum',
          component: () => import('@/views/milet/MiletPicList.vue'),
        },
        {
          path: 'timeline',
          name: 'miletTimeLine',
          component: () => import('@/views/milet/MiletTimeLineAll.vue'),
        },
      ],
    },
    // {
    //   path: '/milet/picalbum',
    //   name: 'miletPicAlbum',
    //   component: () => import('@/views/milet/MiletPicList.vue'),
    // },
  ],
})

export default router
