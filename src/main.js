import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueLazyLoad from 'vue3-lazyload'
import langPlugin from './plugins/LangPlugin'
import loadingImg from './assets/loading.gif'

const app = createApp(App)

app.use(router)
app.use(VueLazyLoad, {
  loading: loadingImg,
  error: './assets/default_images_list.svg',
})
app.use(langPlugin)

app.mount('#app')

//1,vue渲染子组件的时间在生命周期的beforemounted之前，onMounted中获取数据再传递给子组件的时候，需要确保数据结构正确
//2，vue 路由的嵌套路由父路由不需要写component属性，在子路由中添加空路由则能够跳转父路由
